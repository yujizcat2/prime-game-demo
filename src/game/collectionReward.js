import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";
import { BASE_FOOD_TYPES } from "./rules";
import { getCollectionScoreBreakdown } from "./scoreValue";

export function getBoardAverageValue(board = []){
  const values = board.filter(piece => Number.isFinite(piece?.value)).map(piece => piece.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function getNewFoodTypeBonus(discoveredTypeCount, boardAverageValue){
  return Math.min(50, Math.max(10,
    10
    + 3 * Math.max(0, discoveredTypeCount - 4)
    + 2 * Math.floor(boardAverageValue / 10)
  ));
}

function hasSameCollection(cards, value, foodType){
  return cards.some(card =>
    card.value === value &&
    (card.foodType ?? null) === (foodType ?? null)
  );
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, nonDrinkBoardSum = 0,
  boardAverageValue = 0, singleFlavorPenalty = false
}){
  const cards = collectionCards ?? [];
  const duplicate = hasSameCollection(cards, value, foodType);
  const score = getCollectionScoreBreakdown(
    cards, value, foodType, nonDrinkBoardSum, singleFlavorPenalty
  );

  if(duplicate || score.baseScore <= 0){
    return {
      collected: false, duplicate, value, foodType, name, baseScore: 0,
      collectionScore: 0, nonDrinkBoardSum, strength: score.strength,
      exponent: score.exponent, firstDiscoveryRate: score.firstDiscoveryRate,
      newFoodTypeBonus: 0, bonuses: [], bonusScore: 0, totalScore: 0,
      rewardLevel: "none"
    };
  }

  const bonuses = [];
  const isNormalFoodType = BASE_FOOD_TYPES.includes(foodType);
  const isFirstFoodType = isNormalFoodType && !cards.some(card =>
    (card.foodType ?? null) === (foodType ?? null)
  );
  const collectedNormalFoodTypeCount = new Set(
    cards.map(card => card.foodType).filter(type => BASE_FOOD_TYPES.includes(type))
  ).size;
  const newFoodTypeBonus = isFirstFoodType
    ? getNewFoodTypeBonus(collectedNormalFoodTypeCount + 1, boardAverageValue)
    : 0;

  if(isFirstFoodType){
    bonuses.push({
      type: "first_food_type",
      label: `首次获得${FOOD_TYPE_LABELS[foodType] ?? foodType}系`,
      score: newFoodTypeBonus
    });
  }

  if(score.isFirstNumber && !singleFlavorPenalty){
    bonuses.push({
      type: "first_discovery",
      label: `首次发现 +${Math.round(score.firstDiscoveryRate * 100)}%`,
      score: score.collectionScore - score.baseScore
    });
  }

  const bonusScore = bonuses.reduce((sum, bonus) => sum + bonus.score, 0);
  return {
    collected: true, duplicate: false, value, foodType, name,
    baseScore: score.baseScore, collectionScore: score.collectionScore,
    nonDrinkBoardSum, strength: score.strength, exponent: score.exponent,
    firstDiscoveryRate: score.firstDiscoveryRate,
    isFirstNumber: score.isFirstNumber, newFoodTypeBonus, bonuses, bonusScore,
    totalScore: score.collectionScore + newFoodTypeBonus,
    rewardLevel: bonuses.length > 0 ? "major" : "minor"
  };
}
