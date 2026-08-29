import {
  BASE_FOOD_TYPES
} from "./rules";


export const GAME_MODES = Object.freeze({
  CLASSIC: "classic",
  EIGHT_PALACE: "eightPalace",
  SIMPLE_EIGHT_PALACE: "simpleEightPalace"
});


export function createEmptyEightPalaceKeys(){
  return Object.fromEntries(
    BASE_FOOD_TYPES.map(foodType => [foodType, null])
  );
}


export function getEightPalaceKeyCount(keys, targetFoodTypes = BASE_FOOD_TYPES){
  return targetFoodTypes.filter(foodType => Boolean(keys?.[foodType])).length;
}


export function getMissingEightPalaceKeyTypes(keys){
  return BASE_FOOD_TYPES.filter(foodType => !keys?.[foodType]);
}


function createKeyRecord(piece){
  return {
    foodType: piece.foodType,
    value: 1,
    triggerValue: piece.value,
    parents: Array.isArray(piece.parents) ? [...piece.parents] : null,
    parentFoods: Array.isArray(piece.parentFoods)
      ? piece.parentFoods.map(parent => ({...parent}))
      : null
  };
}


export function applyEightPalaceKeyFromReduction(
  state,
  first,
  second,
  firstResult,
  secondResult
){
  if(
    ![GAME_MODES.EIGHT_PALACE,GAME_MODES.SIMPLE_EIGHT_PALACE].includes(state?.gameMode)
    || first?.foodType !== second?.foodType
    || !BASE_FOOD_TYPES.includes(first.foodType)
  ){
    return state;
  }

  const reducedToOne = firstResult === 1
    ? first
    : secondResult === 1
      ? second
      : null;

  if(!reducedToOne || state.eightPalaceKeys?.[reducedToOne.foodType]){
    return state;
  }

  if((state.usedKeyTriggerValues??[]).includes(reducedToOne.value))return state;

  return {
    ...state,
    usedKeyTriggerValues:[...(state.usedKeyTriggerValues??[]),reducedToOne.value],
    eightPalaceKeys: {
      ...state.eightPalaceKeys,
      [reducedToOne.foodType]: createKeyRecord(reducedToOne)
    },
    latestEightPalaceKey: createKeyRecord(reducedToOne)
  };
}
