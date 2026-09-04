import { isCompoundPiece } from "./compound";

export const BASE_HEATER_PRICE_STEP = 10;

export function getCurrentHeaterPrice(state){
  return ((state?.heaterUseCount ?? 0) + 1) * BASE_HEATER_PRICE_STEP;
}

export function isHeaterTarget(piece){
  return !isCompoundPiece(piece) && Number.isInteger(piece?.value) && piece.value >= 2 && piece.value <= 100;
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
