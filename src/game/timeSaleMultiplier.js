export const TIME_SALE_PERIODS = Object.freeze([
  {startMinutes: 0, endMinutes: 4 * 60, range: "00:00–03:59", multiplier: 0.8, label: "凌晨", displayName: "凌晨低谷"},
  {startMinutes: 4 * 60, endMinutes: 11 * 60, range: "04:00–10:59", multiplier: 1, label: "正常", displayName: "正常价格"},
  {startMinutes: 11 * 60, endMinutes: 12 * 60, range: "11:00–11:59", multiplier: 1.1, label: "午间", displayName: "午间高价"},
  {startMinutes: 12 * 60, endMinutes: 16 * 60, range: "12:00–15:59", multiplier: 1, label: "正常", displayName: "正常价格"},
  {startMinutes: 16 * 60, endMinutes: 18 * 60, range: "16:00–17:59", multiplier: 1.15, label: "晚餐", displayName: "晚餐时段"},
  {startMinutes: 18 * 60, endMinutes: 20 * 60, range: "18:00–19:59", multiplier: 1.2, label: "黄金", displayName: "黄金时段"},
  {startMinutes: 20 * 60, endMinutes: 24 * 60, range: "20:00–23:59", multiplier: 1, label: "正常", displayName: "正常价格"}
]);

export const MIN_TIME_SALE_MULTIPLIER = 0.75;
export const MAX_TIME_SALE_MULTIPLIER = 1.25;

function getClockMinutes(gameTime){
  const match = /^(\d+):(\d{2})$/.exec(String(gameTime ?? ""));
  if(!match) return 4 * 60;
  return ((Number(match[1]) % 24) * 60 + Number(match[2])) % (24 * 60);
}

export function getTimeSalePeriodHours(period){
  return (period.endMinutes - period.startMinutes) / 60;
}

export function getTimeSalePeriod(gameTime, periods = TIME_SALE_PERIODS){
  const clockMinutes = getClockMinutes(gameTime);
  return periods.findLast(period => clockMinutes >= period.startMinutes) ?? periods[0];
}

export function getTimeSaleMultiplier(gameTime, periods = TIME_SALE_PERIODS){
  return getTimeSalePeriod(gameTime, periods).multiplier;
}

export function getTimeSalePriceTotal(periods = TIME_SALE_PERIODS){
  return periods.reduce((total, period) =>
    total + getTimeSalePeriodHours(period) * period.multiplier
  , 0);
}

export function getTimeSaleChange(ratio){
  if(ratio <= 0.5) return 0.1;
  if(ratio < 0.8) return 0.05;
  if(ratio <= 1.2) return 0;
  if(ratio < 1.5) return -0.05;
  return -0.1;
}

function conserveDailyPriceTotal(periods){
  const adjusted = periods.map(period => ({...period}));
  for(let pass = 0; pass < adjusted.length + 1; pass++){
    const difference = 24 - getTimeSalePriceTotal(adjusted);
    if(Math.abs(difference) < 1e-10) break;
    const direction = Math.sign(difference);
    const adjustable = adjusted.filter(period => direction > 0
      ? period.multiplier < MAX_TIME_SALE_MULTIPLIER
      : period.multiplier > MIN_TIME_SALE_MULTIPLIER
    );
    if(adjustable.length === 0) break;
    const adjustableHours = adjustable.reduce((hours, period) => hours + getTimeSalePeriodHours(period), 0);
    const sharedChange = difference / adjustableHours;
    for(const period of adjustable){
      period.multiplier = Math.min(
        MAX_TIME_SALE_MULTIPLIER,
        Math.max(MIN_TIME_SALE_MULTIPLIER, period.multiplier + sharedChange)
      );
    }
  }
  return adjusted;
}

export function createNextTimeSalePeriods(previousPeriods = TIME_SALE_PERIODS, saleScores = {}){
  const totalCollectionSaleScore = previousPeriods.reduce((total, period) =>
    total + (saleScores[period.startMinutes] ?? 0)
  , 0);
  if(totalCollectionSaleScore <= 0) return conserveDailyPriceTotal(previousPeriods);

  const averageIntensity = totalCollectionSaleScore / 24;
  const changed = previousPeriods.map(period => {
    const saleScore = saleScores[period.startMinutes] ?? 0;
    const saleIntensity = saleScore / getTimeSalePeriodHours(period);
    return {
      ...period,
      multiplier: Math.min(
        MAX_TIME_SALE_MULTIPLIER,
        Math.max(MIN_TIME_SALE_MULTIPLIER, period.multiplier + getTimeSaleChange(saleIntensity / averageIntensity))
      )
    };
  });
  return conserveDailyPriceTotal(changed);
}

export function createTimeSaleMarketRows(periods = TIME_SALE_PERIODS, saleScores = {}, nextPeriods = periods){
  return periods.map((period, index) => {
    const saleScore = saleScores[period.startMinutes] ?? 0;
    return {
      ...period,
      saleScore,
      saleIntensity: saleScore / getTimeSalePeriodHours(period),
      nextMultiplier: nextPeriods[index]?.multiplier ?? period.multiplier
    };
  });
}
