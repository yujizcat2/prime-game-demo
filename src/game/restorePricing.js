export const BASE_RESTORE_PRICE_STEP = 40;

export function getCurrentRestorePrice(state){
  return ((state?.restoreUseCount ?? 0) + 1) * BASE_RESTORE_PRICE_STEP;
}
