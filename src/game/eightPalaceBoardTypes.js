import { FOOD_TYPES } from "./rules";

export const EIGHT_PALACE_POSITION_FOOD_TYPES=Object.freeze([
  FOOD_TYPES.LAND,
  FOOD_TYPES.AQUATIC,
  FOOD_TYPES.VEGETABLE,
  FOOD_TYPES.GRAIN_BEAN,
  null,
  FOOD_TYPES.DAIRY_EGG,
  FOOD_TYPES.FRUIT,
  FOOD_TYPES.SEASONING,
  FOOD_TYPES.SPICE
]);

export function getEightPalacePositionFoodType(boardIndex){
  return EIGHT_PALACE_POSITION_FOOD_TYPES[boardIndex]??null;
}
