import { getFoodDisplayName, getFoodName, getFoodTypeShortName } from "../data/food/foodRegistry";
import { getSpecialOneDisplayName } from "../data/specialOneRegistry";

export function getFoodCardDisplayName(piece){
  if(piece?.value === 1 && piece?.specialOne) return getSpecialOneDisplayName(piece);
  return getFoodDisplayName(piece);
}

export function getFoodCardTypeLabel(piece){
  return piece?.foodType ? getFoodTypeShortName(piece.foodType) : "";
}

export function getFoodOriginDescription(piece, displayName = getFoodCardDisplayName(piece)){
  if(!piece || !displayName) return "";

  if(piece.origin?.type === "heater" && piece.origin.from){
    return `加热器 ← ${piece.origin.from.value}`;
  }

  const reduceParent = piece.origin?.type === "reduce" ? piece.origin.parent : null;
  if(reduceParent?.value != null){
    const parentName = getFoodName(
      reduceParent.value,
      reduceParent.foodType ?? piece.foodType ?? null
    );
    return `一种由${parentName}处理而来的${displayName}`;
  }

  if(Array.isArray(piece.parentFoods) && piece.parentFoods.length >= 2){
    const parentNames = piece.parentFoods.slice(0, 2).map(parent =>
      getFoodName(parent.value, parent.foodType)
    );
    if(parentNames[0] && parentNames[1]){
      return `一种由${parentNames[0]}与${parentNames[1]}制成的${displayName}`;
    }
  }

  return `一种原生的${displayName}`;
}
