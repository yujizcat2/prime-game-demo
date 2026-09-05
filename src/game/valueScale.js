export const GAME_VALUE_SCALE = 10;
export const GAME_VALUE_MIN = 2 * GAME_VALUE_SCALE;
export const GAME_VALUE_MAX = 101 * GAME_VALUE_SCALE;
export const DRINK_WRAP_VALUE = 200 * GAME_VALUE_SCALE;
export const DRINK_THRESHOLD = 101 * GAME_VALUE_SCALE;

export function scaleGameValue(value){
  return value * GAME_VALUE_SCALE;
}

export function getCuisineSequenceIndex(collectionCards, foodType){
  return (collectionCards ?? []).filter(card => card.foodType === foodType).length + 1;
}

export function applyCuisineSequenceMultiplier(value, sequenceIndex){
  if(sequenceIndex === 1) return value;
  if(sequenceIndex === 8) return value * 5;
  if(sequenceIndex >= 2 && sequenceIndex <= 7) return value / 2;
  return value;
}

export function normalizeReducedValue(value){
  return value === GAME_VALUE_SCALE ? 1 : value;
}
