import { BASE_FOOD_TYPES, FOOD_TYPES } from "./rules";

// Position-owned cuisine identities. Cards may change independently; these do not.
export const BOARD_NATIVE_FOOD_TYPES = Object.freeze([
  FOOD_TYPES.LAND,
  FOOD_TYPES.AQUATIC,
  FOOD_TYPES.VEGETABLE,
  FOOD_TYPES.GRAIN_BEAN,
  FOOD_TYPES.DRINK,
  FOOD_TYPES.DAIRY_EGG,
  FOOD_TYPES.FRUIT,
  FOOD_TYPES.SEASONING,
  FOOD_TYPES.SPICE
]);

if(
  BOARD_NATIVE_FOOD_TYPES.length !== 9
  || BOARD_NATIVE_FOOD_TYPES[4] !== FOOD_TYPES.DRINK
  || new Set(BOARD_NATIVE_FOOD_TYPES.filter((_, index) => index !== 4)).size !== BASE_FOOD_TYPES.length
  || !BASE_FOOD_TYPES.every(type => BOARD_NATIVE_FOOD_TYPES.includes(type))
){
  throw new Error("Invalid native food type board layout");
}

export function getNativeFoodType(index){
  return BOARD_NATIVE_FOOD_TYPES[index] ?? null;
}
