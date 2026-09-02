import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";
import {
  getAbundanceBonusRate,
  getAbundanceBonusScore
} from "./boardAbundance";

export const FIRST_FOOD_TYPE_BONUS = 5;
export const FIRST_NUMBER_BONUS = 2;

function hasSameCollection(cards, value, foodType){
  return cards.some(card =>
    card.value === value &&
    (card.foodType ?? null) === (foodType ?? null)
  );
}

export function createCollectionRewardSettlement({
  collectionCards = [], value, foodType, name, baseScore, abundance = 0
}){
  const cards = collectionCards ?? [];
  const duplicate = hasSameCollection(cards, value, foodType);

  if(duplicate || baseScore <= 0){
    return {
      collected: false, duplicate, value, foodType, name, baseScore: 0,
      abundance, abundanceBonusRate: getAbundanceBonusRate(abundance),
      abundanceBonusScore: 0,
      bonuses: [], bonusScore: 0, totalScore: 0, rewardLevel: "none"
    };
  }

  const bonuses = [];
  const isFirstFoodType = !cards.some(card =>
    (card.foodType ?? null) === (foodType ?? null)
  );
  const isFirstNumber = !cards.some(card => card.value === value);

  if(isFirstFoodType){
    bonuses.push({
      type: "first_food_type",
      label: `首次获得${FOOD_TYPE_LABELS[foodType] ?? (foodType === "drink" ? "饮品" : foodType)}系`,
      score: FIRST_FOOD_TYPE_BONUS
    });
  }

  if(isFirstNumber){
    bonuses.push({
      type: "first_number",
      label: `首次收藏数字${value}`,
      score: FIRST_NUMBER_BONUS
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
    abundance, abundanceBonusRate, abundanceBonusScore,
    bonuses, bonusScore, totalScore: baseScore + bonusScore, rewardLevel
  };
}
