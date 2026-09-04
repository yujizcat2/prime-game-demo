import { getFoodName } from "../data/food/foodRegistry";

export function getCompoundDisplayName(piece){
  return piece?.compoundDishName ?? getFoodName(piece?.value, piece?.foodType);
}

export function getCompoundParentSignature(piece){
  const partner = piece?.compoundPartner;
  return partner?.value != null
    ? `${piece?.displayName ?? piece?.name ?? getFoodName(piece?.value, piece?.foodType)}${piece.value} × ${partner.name ?? getFoodName(partner.value, partner.foodType)}${partner.value}`
    : "";
}
