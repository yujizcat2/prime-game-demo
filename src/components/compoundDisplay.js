import { getFoodName } from "../data/food/foodRegistry";

export function getCompoundDisplayName(piece){
  return getFoodName(piece?.value, piece?.foodType);
}

export function getCompoundParentSignature(piece){
  return piece?.compoundPartner?.value != null
    ? `与${piece.compoundPartner.value}复合`
    : "";
}
