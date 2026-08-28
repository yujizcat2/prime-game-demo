import {
  BASE_FOOD_TYPES
} from "./rules";


export const GAME_MODES = Object.freeze({
  CLASSIC: "classic",
  EIGHT_PALACE: "eightPalace"
});


export function createEmptyEightPalaceKeys(){
  return Object.fromEntries(
    BASE_FOOD_TYPES.map(foodType => [foodType, null])
  );
}


export function getEightPalaceKeyCount(keys){
  return BASE_FOOD_TYPES.filter(foodType => Boolean(keys?.[foodType])).length;
}


export function getMissingEightPalaceKeyTypes(keys){
  return BASE_FOOD_TYPES.filter(foodType => !keys?.[foodType]);
}


function createKeyRecord(piece){
  return {
    foodType: piece.foodType,
    value: piece.value,
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
    state?.gameMode !== GAME_MODES.EIGHT_PALACE
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

  return {
    ...state,
    eightPalaceKeys: {
      ...state.eightPalaceKeys,
      [reducedToOne.foodType]: createKeyRecord(reducedToOne)
    },
    latestEightPalaceKey: createKeyRecord(reducedToOne)
  };
}
