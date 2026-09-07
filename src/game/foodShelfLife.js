export const FOOD_SHELF_LIFE_MINUTES = 10 * 60;
export const FOOD_EXPIRY_WARNING_MINUTES = 2 * 60;

export function getGameElapsedMinutes(state){
  return Math.max(0, state?.totalActionMinutes ?? 0);
}

export function getFoodAgeMinutes(piece, stateOrMinutes){
  const now = typeof stateOrMinutes === "number"
    ? stateOrMinutes
    : getGameElapsedMinutes(stateOrMinutes);
  const bornAt = typeof piece?.bornAt === "number" && Number.isFinite(piece.bornAt)
    ? piece.bornAt
    : now;
  return Math.max(0, now - bornAt);
}

export function getRemainingShelfLife(piece, stateOrMinutes){
  return Math.max(0, FOOD_SHELF_LIFE_MINUTES - getFoodAgeMinutes(piece, stateOrMinutes));
}

export function isFoodExpired(piece, stateOrMinutes){
  return getFoodAgeMinutes(piece, stateOrMinutes) >= FOOD_SHELF_LIFE_MINUTES;
}

export function getFoodExpiryState(piece, stateOrMinutes){
  const remainingMinutes = getRemainingShelfLife(piece, stateOrMinutes);
  const expired = isFoodExpired(piece, stateOrMinutes);
  return {
    ageMinutes: getFoodAgeMinutes(piece, stateOrMinutes),
    remainingMinutes,
    expired,
    warning: !expired && remainingMinutes <= FOOD_EXPIRY_WARNING_MINUTES
  };
}

export function formatShelfLife(minutes){
  const totalMinutes = Math.max(0, Math.ceil(minutes ?? 0));
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  if(hours === 0) return `剩余 ${remainder}分`;
  return remainder === 0
    ? `剩余 ${hours}小时`
    : `剩余 ${hours}小时${remainder}分`;
}
