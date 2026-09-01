import { getLegalCombineActions, getLegalReduceActions } from "./gameActions";

export const BASE_HEATER_PRICE_STEP = 10;

export function getNormalLegalActionCount(state){
  if(!state) return 0;
  const activeState = {...state, gameOver: false, gameOverReason: null};
  return getLegalCombineActions(activeState).length
    + getLegalReduceActions(activeState).length;
}

export function getHeaterBoardAdjustment(normalLegalActionCount){
  if(normalLegalActionCount >= 6) return 10;
  if(normalLegalActionCount >= 3) return 5;
  return 0;
}

export function getCurrentHeaterPrice(state){
  const heaterUseCount = state?.heaterUseCount ?? 0;
  if(heaterUseCount === 0) return BASE_HEATER_PRICE_STEP;
  return (heaterUseCount + 1) * BASE_HEATER_PRICE_STEP
    + getHeaterBoardAdjustment(getNormalLegalActionCount(state));
}

export function isHeaterTarget(piece){
  return Number.isInteger(piece?.value) && piece.value >= 2 && piece.value <= 100;
}

export function hasHeaterTarget(state){
  return Boolean(state?.board?.some(isHeaterTarget));
}

export function getHeaterAvailability(state){
  const price = getCurrentHeaterPrice(state);
  const hasTarget = hasHeaterTarget(state);
  return {
    price,
    hasTarget,
    canEnter: Boolean(state && hasTarget && (state.money ?? 0) >= price)
  };
}
