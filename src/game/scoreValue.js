import { BASE_FOOD_TYPES } from "./rules";

export const BOARD_SUM_NORMALIZER = 900;
export const MIN_SCORE_EXPONENT = 1.30;
export const SCORE_EXPONENT_RANGE = 0.10;
export const MIN_FIRST_DISCOVERY_RATE = 0.10;
export const FIRST_DISCOVERY_RATE_RANGE = 0.10;

export function getNonDrinkBoardSum(board = []){
  if(!Array.isArray(board)) return 0;
  return board.reduce((sum, piece) =>
    (BASE_FOOD_TYPES.includes(piece?.foodType) || piece?.foodType === "meat") &&
      Number.isFinite(piece?.value)
      ? sum + piece.value
      : sum
  , 0);
}

export function getBoardScoreStrength(nonDrinkBoardSum = 0){
  return Math.min(1, Math.max(0, nonDrinkBoardSum / BOARD_SUM_NORMALIZER));
}

export function getCollectionScoreParameters(nonDrinkBoardSum = 0){
  const strength = getBoardScoreStrength(nonDrinkBoardSum);
  return {
    strength,
    exponent: MIN_SCORE_EXPONENT + SCORE_EXPONENT_RANGE * strength,
    firstDiscoveryRate: MIN_FIRST_DISCOVERY_RATE + FIRST_DISCOVERY_RATE_RANGE * strength
  };
}

export function getRawBaseScore(value, nonDrinkBoardSum = 0){
  if(!Number.isFinite(value) || value < 0) return 0;
  const {exponent} = getCollectionScoreParameters(nonDrinkBoardSum);
  return Math.pow(value, exponent) + 100;
}

export function getBaseScore(value, nonDrinkBoardSum = 0){
  return Math.round(getRawBaseScore(value, nonDrinkBoardSum));
}

export function getCollectionScoreBreakdown(
  collectionCards,
  value,
  foodType,
  nonDrinkBoardSum = 0,
  singleFlavorPenalty = false
){
  const cards = collectionCards ?? [];
  const sameNumberCards = cards.filter(card => card.value === value);
  const duplicate = sameNumberCards.some(card =>
    (card.foodType ?? null) === (foodType ?? null)
  );
  const {strength, exponent, firstDiscoveryRate} = getCollectionScoreParameters(nonDrinkBoardSum);

  if(duplicate){
    return {
      duplicate: true, isFirstNumber: false, strength, exponent, firstDiscoveryRate,
      rawBaseScore: 0, baseScore: 0, collectionScore: 0
    };
  }

  const rawBaseScore = getRawBaseScore(value, nonDrinkBoardSum);
  const baseScore = Math.round(rawBaseScore);
  const isFirstNumber = sameNumberCards.length === 0;
  const collectionScore = isFirstNumber && !singleFlavorPenalty
    ? Math.round(rawBaseScore * (1 + firstDiscoveryRate))
    : Math.round(rawBaseScore * 0.5);

  return {
    duplicate: false, isFirstNumber, strength, exponent, firstDiscoveryRate,
    rawBaseScore, baseScore, collectionScore
  };
}

export function getCollectionScoreGain(
  collectionCards,
  value,
  foodType,
  nonDrinkBoardSum = 0,
  singleFlavorPenalty = false
){
  return getCollectionScoreBreakdown(
    collectionCards, value, foodType, nonDrinkBoardSum, singleFlavorPenalty
  ).collectionScore;
}

export function getOriginMultiplier(){
  return 1;
}

export function getCreatedScoreValue(value){
  return getBaseScore(value);
}
