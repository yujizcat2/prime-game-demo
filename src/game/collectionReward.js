import { getBaseScore, getCollectionScoreBreakdown } from "./scoreValue";
import { getTimeSalePeriod } from "./timeSaleMultiplier";
import { getCollectionMultiplier } from "./collectionMultiplier";

export function getBoardAverageValue(board = []){
  const values = board.filter(piece => Number.isFinite(piece?.value)).map(piece => piece.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function getCollectionBaseSalePrice(collectionCards, value, foodType){
  return getCollectionScoreBreakdown(collectionCards, value, foodType).collectionScore;
}

function getBreakdownResult(value){
  return Number(value.toFixed(2));
}

function roundSaleScore(value){
  return Math.round(value + Number.EPSILON * Math.abs(value));
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, nonDrinkBoardSum = 0, cuisineSequenceIndex = 1,
  gameTime = "04:00", timeSalePeriods, collectionRecord = null
}){
  const score = getCollectionScoreBreakdown(collectionCards, value, foodType);
  const collectionMultiplier = getCollectionMultiplier(collectionRecord);
  if(score.duplicate || score.baseScore <= 0){
    const baseScore = getBaseScore(value);
    return {
      collected: false, duplicate: score.duplicate, value, foodType, name,
      baseScore, collectionScore: 0, nonDrinkBoardSum,
      ...collectionMultiplier,
      existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
      saleBreakdown: [
        {label: "基础售价", operation: null, result: baseScore},
        {label: "重复销售调整", operation: "→", result: 0},
        {label: "最终结算", operation: "四舍五入", result: 0}
      ],
      bonuses: [], bonusScore: 0, totalScore: 0, rewardLevel: "none"
    };
  }

  const hasCrossFamilyDiscount = score.existingFoodTypeCountForSameNumber > 0;
  const cuisineScoreMultiplier = 1;
  const collectionScore = score.collectionScore;
  const timeSalePeriod = getTimeSalePeriod(gameTime, timeSalePeriods);
  const timeAdjustedScore = collectionScore * timeSalePeriod.multiplier;
  const routeAdjustedScore = timeAdjustedScore * collectionMultiplier.collectionMultiplierRate;
  const totalScore = roundSaleScore(routeAdjustedScore);
  const saleBreakdown = [{label: "基础售价", operation: null, result: score.baseScore}];
  if(hasCrossFamilyDiscount){
    saleBreakdown.push({
      label: "同款半价",
      operation: `×${Math.round(score.collectionScore / score.baseScore * 100)}%`,
      result: score.collectionScore
    });
  }
  saleBreakdown.push(
    {label: "当前时段", operation: `×${Math.round(timeSalePeriod.multiplier * 100)}%`, result: getBreakdownResult(timeAdjustedScore)},
    {label: `×${collectionMultiplier.collectionMultiplier}路线奖励`, operation: `×${Math.round(collectionMultiplier.collectionMultiplierRate * 100)}%`, result: getBreakdownResult(routeAdjustedScore)},
    {label: "最终结算", operation: "四舍五入", result: totalScore}
  );
  return {
    collected: true, duplicate: false, value, foodType, name,
    baseScore: score.baseScore, collectionScore,
    cuisineSequenceIndex,
    cuisineScoreMultiplier,
    preMultiplierScore: score.collectionScore,
    baseSaleScore: score.baseScore,
    preCuisineSaleScore: score.collectionScore,
    timeSaleMultiplier: timeSalePeriod.multiplier,
    timeSaleLabel: timeSalePeriod.label,
    ...collectionMultiplier,
    gameTime,
    nonDrinkBoardSum,
    isFirstNumber: score.isFirstNumber,
    existingFoodTypeCountForSameNumber: score.existingFoodTypeCountForSameNumber,
    hasCrossFamilyDiscount,
    saleBreakdown,
    bonuses: [], bonusScore: 0, totalScore,
    rewardLevel: "minor"
  };
}
