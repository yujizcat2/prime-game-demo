export function getPrimeFactors(value) {
  const factors = new Map();
  let remaining = value;

  for(let factor = 2; factor * factor <= remaining; factor += 1){
    while(remaining % factor === 0){
      factors.set(factor, (factors.get(factor) ?? 0) + 1);
      remaining /= factor;
    }
  }

  if(remaining > 1){
    factors.set(remaining, (factors.get(remaining) ?? 0) + 1);
  }

  return factors;
}


export function getBasePrime(prime) {
  return Math.round(10 + 0.4 * prime);
}


export function getBasePrice(value) {
  if(!Number.isInteger(value) || value <= 1){
    return 0;
  }

  const total = [...getPrimeFactors(value)].reduce(
    (sum, [prime, exponent]) =>
      sum + getBasePrime(prime) * (1 + 0.25 * (exponent - 1)),
    0
  );

  return Math.round(total);
}


export function getLiquidity(value, board = []) {
  const primes = [...getPrimeFactors(value).keys()];

  if(primes.length === 0){
    return 0;
  }

  const multipliers = primes.map(prime => {
    const count = board.filter(
      piece => piece && piece.value > 1 && piece.value % prime === 0
    ).length;
    const pairs = count * (count - 1) / 2;
    return 1 / (1 + 0.15 * pairs);
  });

  return multipliers.reduce((sum, multiplier) => sum + multiplier, 0)
    / multipliers.length;
}


export function getTrend(previous, next) {
  if(previous == null || next >= previous){
    return 1;
  }

  return Math.max(0.7, 1 - 0.5 * (previous - next) / 100);
}


export function getCurrentPrice(value, board, trend = 1) {
  if(value <= 1){
    return 0;
  }

  return Math.round(getBasePrice(value) * getLiquidity(value, board) * trend);
}


export function getRepeatPenalty(currentPrice) {
  return Math.round(currentPrice * 0.5);
}


export function getBoardPrices(board = [], trend = 1, collectionPaths = {}) {
  return board.map(piece => {
    if(!piece){
      return 0;
    }

    const collected = Boolean(
      collectionPaths?.[piece.value]?.[piece.foodType]
    );

    const currentPrice = getCurrentPrice(piece.value, board, trend);
    return collected ? -getRepeatPenalty(currentPrice) : currentPrice;
  });
}
