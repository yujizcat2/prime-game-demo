import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";
import {
  getAbundanceBonusRate,
  getAbundanceBonusScore
} from "./boardAbundance";
import { BASE_FOOD_TYPES } from "./rules";

export const FIRST_NUMBER_BONUS = 2;

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

export function getBoardPowerBonus(value, baseScore, boardAverageValue){
  if(value < 50 || baseScore <= 0) return 0;
  const rate = Math.min(0.1, Math.max(0, Math.floor(boardAverageValue / 10) * 0.02));
  return Math.min(100, Math.floor(baseScore * rate));
}

function hasSameCollection(cards, value, foodType){
  return cards.some(card =>
    card.value === value &&
    (card.foodType ?? null) === (foodType ?? null)
  );
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, baseScore, abundance = 0, boardAverageValue = 0
}){
  const cards = collectionCards ?? [];
  const duplicate = hasSameCollection(cards, value, foodType);

  if(duplicate || baseScore <= 0){
    return {
      collected: false, duplicate, value, foodType, name, baseScore: 0,
      abundance, abundanceBonusRate: getAbundanceBonusRate(abundance),
      abundanceBonusScore: 0, boardAverageValue, newFoodTypeBonus: 0, boardPowerBonus: 0,
      bonuses: [], bonusScore: 0, totalScore: 0, rewardLevel: "none"
    };
  }

  const bonuses = [];
  const isNormalFoodType = BASE_FOOD_TYPES.includes(foodType);
  const isFirstFoodType = isNormalFoodType && !cards.some(card =>
    (card.foodType ?? null) === (foodType ?? null)
  );
  const isFirstNumber = !cards.some(card => card.value === value);
  const collectedNormalFoodTypeCount = new Set(
    cards.map(card => card.foodType).filter(type => BASE_FOOD_TYPES.includes(type))
  ).size;
  const newFoodTypeBonus = isFirstFoodType
    ? getNewFoodTypeBonus(collectedNormalFoodTypeCount + 1, boardAverageValue)
    : 0;
  const boardPowerBonus = getBoardPowerBonus(value, baseScore, boardAverageValue);

  if(isFirstFoodType){
    bonuses.push({
      type: "first_food_type",
      label: `首次获得${FOOD_TYPE_LABELS[foodType] ?? (foodType === "drink" ? "饮品" : foodType)}系`,
      score: newFoodTypeBonus
    });
  }

  if(isFirstNumber){
    bonuses.push({
      type: "first_number",
      label: `首次收藏数字${value}`,
      score: FIRST_NUMBER_BONUS
    });
  }

  if(boardPowerBonus > 0){
    bonuses.push({
      type: "board_power",
      label: `盘面强度奖励 +${boardPowerBonus}`,
      score: boardPowerBonus
    });
  }

  const abundanceBonusRate = getAbundanceBonusRate(abundance);
  const abundanceBonusScore = getAbundanceBonusScore(baseScore, abundance);
  if(abundanceBonusScore > 0){
    bonuses.push({
      type: "abundance",
      label: `丰盛度奖励 +${Math.round(abundanceBonusRate * 100)}%`,
      score: abundanceBonusScore
    });
  }

  const bonusScore = bonuses.reduce((sum, bonus) => sum + bonus.score, 0);
  const rewardLevel = bonuses.length > 0
    ? "major"
    : baseScore === 50 || cards.some(card => card.value === value)
      ? "minor"
      : "normal";

  return {
    collected: true, duplicate: false, value, foodType, name, baseScore,
    abundance, abundanceBonusRate, abundanceBonusScore, boardAverageValue,
    newFoodTypeBonus, boardPowerBonus, bonuses, bonusScore, totalScore: baseScore + bonusScore, rewardLevel
  };
}
