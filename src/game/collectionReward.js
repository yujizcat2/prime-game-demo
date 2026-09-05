import { getCollectionScoreBreakdown } from "./scoreValue";

export function getBoardAverageValue(board = []){
  const values = board.filter(piece => Number.isFinite(piece?.value)).map(piece => piece.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, nonDrinkBoardSum = 0
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

  return {
    collected: true, duplicate: false, value, foodType, name,
    baseScore: score.baseScore, collectionScore: score.collectionScore,
    nonDrinkBoardSum,
    isFirstNumber: score.isFirstNumber,
    existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
    bonuses: [], bonusScore: 0, totalScore: score.collectionScore,
    rewardLevel: "minor"
  };
}
