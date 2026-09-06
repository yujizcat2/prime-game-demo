export const TIME_SALE_PERIODS = Object.freeze([
  {startMinutes: 0, range: "00:00–03:59", multiplier: 0.5, label: "凌晨", displayName: "深夜半价"},
  {startMinutes: 4 * 60, range: "04:00–10:59", multiplier: 1, label: "正常", displayName: "正常价格"},
  {startMinutes: 11 * 60, range: "11:00–12:59", multiplier: 1.1, label: "午市", displayName: "午市加价"},
  {startMinutes: 13 * 60, range: "13:00–16:59", multiplier: 1, label: "正常", displayName: "正常价格"},
  {startMinutes: 17 * 60, range: "17:00–18:59", multiplier: 1.15, label: "晚餐前段", displayName: "晚餐前段"},
  {startMinutes: 19 * 60, range: "19:00–21:29", multiplier: 1.2, label: "晚市高峰", displayName: "晚市高峰"},
  {startMinutes: 21 * 60 + 30, range: "21:30–打烊", multiplier: 1, label: "正常", displayName: "正常价格"}
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
