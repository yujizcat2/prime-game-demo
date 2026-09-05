const TIME_SALE_PERIODS = Object.freeze([
  {startMinutes: 0, multiplier: 0.9, label: "凌晨"},
  {startMinutes: 4 * 60, multiplier: 1, label: "正常"},
  {startMinutes: 11 * 60, multiplier: 1.1, label: "午市"},
  {startMinutes: 13 * 60, multiplier: 1, label: "正常"},
  {startMinutes: 17 * 60, multiplier: 1.15, label: "晚餐前段"},
  {startMinutes: 19 * 60, multiplier: 1.2, label: "晚市高峰"},
  {startMinutes: 21 * 60 + 30, multiplier: 1, label: "正常"}
]);

function getClockMinutes(gameTime){
  const match = /^(\d+):(\d{2})$/.exec(String(gameTime ?? ""));
  if(!match) return 4 * 60;
  return ((Number(match[1]) % 24) * 60 + Number(match[2])) % (24 * 60);
}

export function getTimeSalePeriod(gameTime){
  const clockMinutes = getClockMinutes(gameTime);
  return TIME_SALE_PERIODS.findLast(period => clockMinutes >= period.startMinutes);
}

export function getTimeSaleMultiplier(gameTime){
  return getTimeSalePeriod(gameTime).multiplier;
}

