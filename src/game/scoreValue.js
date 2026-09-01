export const BASE_SCORE_BANDS = Object.freeze({
  10: Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]),
  20: Object.freeze([11, 14, 15, 16, 18, 20, 21, 22, 24, 25, 27, 28, 30]),
  30: Object.freeze([13, 17, 19, 23, 26, 32, 33, 34, 35, 36, 39, 40, 42]),
  40: Object.freeze([29, 31, 37, 38, 41, 44, 45, 46, 48, 49, 50, 51, 52, 54, 55, 56]),
  50: Object.freeze([43, 47, 53, 57, 58, 60, 62, 63, 64, 65, 66, 68, 69, 70, 72]),
  60: Object.freeze([59, 61, 67, 71, 73, 74, 75, 76, 77, 78, 80, 81, 82, 84, 85]),
  70: Object.freeze([79, 83, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100]),
  80: Object.freeze([101])
});

const BASE_SCORE_BY_NUMBER = new Map(
  Object.entries(BASE_SCORE_BANDS).flatMap(([score, values]) =>
    values.map(value => [value, Number(score)])
  )
);

export function getBaseScore(value){
  return BASE_SCORE_BY_NUMBER.get(value) ?? 0;
}

export function getCollectionScoreGain(collectionCards, value, foodType){
  const cards = collectionCards ?? [];
  const sameNumberCards = cards.filter(card => card.value === value);
  if(sameNumberCards.some(card => (card.foodType ?? null) === (foodType ?? null))) return 0;

  const baseScore = getBaseScore(value);
  return sameNumberCards.length === 0 ? baseScore : baseScore / 2;
}

// Compatibility helpers for piece creation. A number's score is now fixed,
// regardless of its parents or creation path.
export function getOriginMultiplier(){
  return 1;
}

export function getCreatedScoreValue(value){
  return getBaseScore(value);
}
