import { BASE_FOOD_TYPES } from "../game/rules";

export const SALE_FOOD_TYPES = BASE_FOOD_TYPES;

export function getSaleSummary(cards = []){
  const summary = Object.fromEntries(
    SALE_FOOD_TYPES.map(foodType => [foodType, {value: 0, score: 0}])
  );

  cards.forEach(card => {
    const totals = summary[card.foodType];
    if(!totals)return;
    totals.value += Number(card.value) || 0;
    totals.score += Number(card.salePointScore ?? card.totalScore ?? card.scoreGain ?? 0) || 0;
  });

  return summary;
}
