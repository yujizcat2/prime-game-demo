import { BASE_FOOD_TYPES } from "./rules";
import { SCORE_SCALE, scaleScore } from "./scoreScale";

export const COLLECTION_SCORE_TIERS = Object.freeze([
  [9, 10], [19, 15], [29, 20], [39, 25], [49, 30],
  [59, 35], [69, 40], [79, 45], [89, 50], [99, 55], [101, 60]
].map(([maximum, score]) => [maximum, scaleScore(score)]));

export function getBoardSum(board = []){
  if(!Array.isArray(board)) return 0;
  return board.reduce((sum, piece) =>
    Number.isFinite(piece?.value) ? sum + piece.value : sum
  , 0);
}

export function getNonDrinkBoardSum(board = []){
  if(!Array.isArray(board)) return 0;
  return board.reduce((sum, piece) =>
    (BASE_FOOD_TYPES.includes(piece?.foodType) || piece?.foodType === "meat") &&
      Number.isFinite(piece?.value)
      ? sum + piece.value
      : sum
  , 0);
}

export function getRawBaseScore(value){
  if(!Number.isFinite(value) || value < 2 || value > 101) return 0;
  return COLLECTION_SCORE_TIERS.find(([maximum]) => value <= maximum)?.[1] ?? 0;
}

export function getBaseScore(value){
  return getRawBaseScore(value);
}

export function getCollectionScoreBreakdown(collectionCards, value, foodType){
  const sameNumberCards = (collectionCards ?? []).filter(card => card.value === value);
  const duplicate = sameNumberCards.some(card =>
    (card.foodType ?? null) === (foodType ?? null)
  );
  const baseScore = getBaseScore(value);
  const existingFoodTypeCountForSameNumber = new Set(
    sameNumberCards.map(card => card.foodType ?? null)
  ).size;
  const collectionScore = duplicate
    ? 0
    : Math.max(0, baseScore - 5 * SCORE_SCALE * existingFoodTypeCountForSameNumber);

  return {
    duplicate,
    isFirstNumber: sameNumberCards.length === 0,
    existingFoodTypeCountForSameNumber,
    rawBaseScore: duplicate ? 0 : baseScore,
    baseScore: duplicate ? 0 : baseScore,
    collectionScore
  };
}

export function getCollectionScoreGain(collectionCards, value, foodType){
  return getCollectionScoreBreakdown(collectionCards, value, foodType).collectionScore;
}

export function getOriginMultiplier(){
  return 1;
}

export function getCreatedScoreValue(value){
  return getBaseScore(value);
}
