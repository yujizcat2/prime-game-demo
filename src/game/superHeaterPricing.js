export const SUPER_HEATER_PRICE_STEP = 100;

export function getCurrentSuperHeaterPrice(state){
  return ((state?.superHeaterUseCount ?? 0) + 1) * SUPER_HEATER_PRICE_STEP;
}
