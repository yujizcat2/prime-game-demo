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
  || new Set(BOARD_NATIVE_FOOD_TYPES).size !== BASE_FOOD_TYPES.length + 1
  || !BASE_FOOD_TYPES.every(type => BOARD_NATIVE_FOOD_TYPES.includes(type))
){
  throw new Error("Invalid native food type board layout");
}

export function getNativeFoodType(index){
  return BOARD_NATIVE_FOOD_TYPES[index] ?? null;
}

export function getFoodTypeForPosition(index){
  return getNativeFoodType(index);
}

export function getNativeBoardIndex(foodType){
  const index = BOARD_NATIVE_FOOD_TYPES.indexOf(foodType);
  return index === -1 ? null : index;
}

export function getReductionFoodTypes(first,second,firstResult,secondResult,indexA,indexB){
  const drinkIsFirst=first.foodType===FOOD_TYPES.DRINK;
  const drinkIsSecond=second.foodType===FOOD_TYPES.DRINK;
  if(drinkIsFirst===drinkIsSecond)return [first.foodType,second.foodType];
  const normal=drinkIsFirst?second:first;
  const normalResult=drinkIsFirst?secondResult:firstResult;
  const drinkIndex=drinkIsFirst?indexA:indexB;
  const nativeFoodType=getNativeFoodType(drinkIndex);
  const drinkFoodType=normalResult===1
    ? nativeFoodType===FOOD_TYPES.DRINK?normal.foodType:nativeFoodType??normal.foodType
    : normal.foodType;
  return drinkIsFirst
    ? [drinkFoodType,normal.foodType]
    : [normal.foodType,drinkFoodType];
}
