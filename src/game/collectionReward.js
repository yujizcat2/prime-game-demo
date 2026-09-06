import { getCollectionScoreBreakdown } from "./scoreValue";
import { applyCuisineScoreMultiplier, getCuisineScoreMultiplier } from "./scoreScale";
import { getTimeSalePeriod } from "./timeSaleMultiplier";
import { getCollectionMultiplier } from "./collectionMultiplier";

export function getBoardAverageValue(board = []){
  const values = board.filter(piece => Number.isFinite(piece?.value)).map(piece => piece.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, nonDrinkBoardSum = 0, cuisineSequenceIndex = 1,
  gameTime = "04:00", timeSalePeriods, collectionRecord = null
}){
  const score = getCollectionScoreBreakdown(collectionCards, value, foodType);
  const collectionMultiplier = getCollectionMultiplier(collectionRecord);
  if(score.duplicate || score.baseScore <= 0){
    return {
      collected: false, duplicate: score.duplicate, value, foodType, name,
      baseScore: 0, collectionScore: 0, nonDrinkBoardSum,
      ...collectionMultiplier,
      existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
      bonuses: [], bonusScore: 0, totalScore: 0, rewardLevel: "none"
    };
  }

  const collectionScore = applyCuisineScoreMultiplier(score.collectionScore, cuisineSequenceIndex);
  const timeSalePeriod = getTimeSalePeriod(gameTime, timeSalePeriods);
  const totalScore = Math.round(
    collectionScore * timeSalePeriod.multiplier * collectionMultiplier.collectionMultiplierRate
  );
  return {
    collected: true, duplicate: false, value, foodType, name,
    baseScore: score.baseScore, collectionScore,
    cuisineSequenceIndex,
    cuisineScoreMultiplier: getCuisineScoreMultiplier(cuisineSequenceIndex),
    preMultiplierScore: score.collectionScore,
    baseSaleScore: collectionScore,
    timeSaleMultiplier: timeSalePeriod.multiplier,
    timeSaleLabel: timeSalePeriod.label,
    ...collectionMultiplier,
    gameTime,
    nonDrinkBoardSum,
    isFirstNumber: score.isFirstNumber,
    existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
    bonuses: [], bonusScore: 0, totalScore,
    rewardLevel: "minor"
  };
}
