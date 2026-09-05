import { getCollectionScoreBreakdown } from "./scoreValue";
import { applyCuisineScoreMultiplier, getCuisineScoreMultiplier } from "./scoreScale";

export function getBoardAverageValue(board = []){
  const values = board.filter(piece => Number.isFinite(piece?.value)).map(piece => piece.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, nonDrinkBoardSum = 0, cuisineSequenceIndex = 1
}){
  const score = getCollectionScoreBreakdown(collectionCards, value, foodType);
  if(score.duplicate || score.baseScore <= 0){
    return {
      collected: false, duplicate: score.duplicate, value, foodType, name,
      baseScore: 0, collectionScore: 0, nonDrinkBoardSum,
      existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
      bonuses: [], bonusScore: 0, totalScore: 0, rewardLevel: "none"
    };
  }

  const collectionScore = applyCuisineScoreMultiplier(score.collectionScore, cuisineSequenceIndex);
  return {
    collected: true, duplicate: false, value, foodType, name,
    baseScore: score.baseScore, collectionScore,
    cuisineSequenceIndex,
    cuisineScoreMultiplier: getCuisineScoreMultiplier(cuisineSequenceIndex),
    preMultiplierScore: score.collectionScore,
    nonDrinkBoardSum,
    isFirstNumber: score.isFirstNumber,
    existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
    bonuses: [], bonusScore: 0, totalScore: collectionScore,
    rewardLevel: "minor"
  };
}
