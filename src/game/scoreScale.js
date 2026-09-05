export const SCORE_SCALE = 10;

export function scaleScore(score){
  return score * SCORE_SCALE;
}

export function unscaleScore(score){
  return score / SCORE_SCALE;
}

export function getCuisineSequenceIndex(collectionCards, foodType){
  return (collectionCards ?? []).filter(card => card.foodType === foodType).length + 1;
}

export function getCuisineScoreMultiplier(sequenceIndex){
  if(sequenceIndex === 1) return 1;
  if(sequenceIndex >= 2 && sequenceIndex <= 7) return 0.5;
  if(sequenceIndex === 8) return 5;
  return 1;
}

export function applyCuisineScoreMultiplier(score, sequenceIndex){
  return score * getCuisineScoreMultiplier(sequenceIndex);
}
