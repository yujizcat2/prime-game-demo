export const FOOD_SHELF_LIFE_MINUTES = 24 * 60;
export const FOOD_EXPIRY_WARNING_MINUTES = 2 * 60;

export function getShelfLifeStatus(piece, stateOrMinutes){
  const ageMinutes = getFoodAgeMinutes(piece, stateOrMinutes);
  if(ageMinutes >= 24 * 60) return "过期";
  if(ageMinutes >= 20 * 60) return "临期";
  if(ageMinutes >= 16 * 60) return "老化";
  if(ageMinutes >= 12 * 60) return "欠鲜";
  return "新鲜";
}

export function getShelfLifeMultiplier(piece, stateOrMinutes){
  const ageMinutes = getFoodAgeMinutes(piece, stateOrMinutes);
  if(ageMinutes >= 24 * 60) return 0;
  if(ageMinutes >= 20 * 60) return .6;
  if(ageMinutes >= 16 * 60) return .7;
  if(ageMinutes >= 12 * 60) return .8;
  return 1;
}

export function getGameElapsedMinutes(state){
  return Math.max(0, state?.totalActionMinutes ?? 0);
}

export function getFoodAgeMinutes(piece, stateOrMinutes){
  if(Number.isFinite(piece?.processedAgeMinutes)){
    return Math.max(0, piece.processedAgeMinutes);
  }
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
    status: getShelfLifeStatus(piece, stateOrMinutes),
    multiplier: getShelfLifeMultiplier(piece, stateOrMinutes),
    warning: !expired && remainingMinutes <= FOOD_EXPIRY_WARNING_MINUTES
  };
}

export function formatShelfLife(minutes){
  const totalMinutes = Math.max(0, Math.ceil(minutes ?? 0));
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;
  if(hours === 0) return `保质期 ${remainder}分`;
  return remainder === 0
    ? `保质期 ${hours}小时`
    : `保质期 ${hours}小时${remainder}分`;
}
