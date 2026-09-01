export const BASE_RESTORE_PRICE = 50;

export function getCurrentRestorePrice(state){
  return BASE_RESTORE_PRICE * (2 ** (state?.restoreUseCount ?? 0));
}
