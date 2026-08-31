import { getFoodCardDisplayName, getFoodOriginDescription } from "./foodCardDisplay";

export function getCollectionSourceText(card){
  const displayCard = {...card, parentFoods: card?.parentFoods ?? card?.parents ?? null};
  return getFoodOriginDescription(displayCard, getFoodCardDisplayName(displayCard) ?? card?.name);
}
