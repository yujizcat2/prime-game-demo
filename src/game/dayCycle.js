import { getBoardCount } from "./boardRules";
import { getNonDrinkBoardSum } from "./scoreValue";
import { getScoreEfficiency } from "./scoreEfficiency";
import { getActivityStatus } from "./activityStatus";
import { getPrimeDensity } from "./primeStatus";
import {
  createNextTimeSalePeriods,
  createTimeSaleMarketRows,
  getTimeSalePriceTotal,
  TIME_SALE_PERIODS
} from "./timeSaleMultiplier";

export const DAY_DURATION_MINUTES = 1440;
export const MAX_DAYS = 7;
export const OPENING_HOUR = 0;
export const DAY_REVENUE_TARGET = 1000;
export const WEEKDAYS = Object.freeze(["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]);

export function getDayTargetScore(_day = 1){
  return DAY_REVENUE_TARGET;
}

function clamp01(value){
  return Math.min(1, Math.max(0, value));
}

export function getPerformanceBonusBreakdown(state, dayBaseScore){
  const passed = (state?.dayRevenue ?? 0) >= DAY_REVENUE_TARGET;
  if(!passed) return {
    efficiencyRate: 0, overflowRate: 0, qualityRate: 0, boardRate: 0,
    performanceBonusRate: 0, performanceBonusScore: 0
  };

  const totalBusinessTime = Math.max(0, state?.dayMinutesElapsed ?? 0);
  const targetReachedAt = state?.dayTargetReachedAtMinutes;
  const efficiencyIndex = targetReachedAt == null || totalBusinessTime <= 0
    ? 0
    : clamp01(1 - targetReachedAt / totalBusinessTime);
  const overflowIndex = clamp01(((state?.dayRevenue ?? 0) - DAY_REVENUE_TARGET) / 500);
  const todaySales = (state?.collectionCards ?? state?.collection ?? [])
    .slice(state?.dayStartCollectionCount ?? 0);
  const averageQualityMultiplier = todaySales.length
    ? todaySales.reduce((sum, sale) => sum + (sale.collectionMultiplierRate ?? 1), 0) / todaySales.length
    : 1;
  const qualityIndex = clamp01((averageQualityMultiplier - 1) / .5);
  const boardValueSum = getNonDrinkBoardSum(state?.board);
  const growthIndex = clamp01(boardValueSum / 200);
  const activity = getActivityStatus(
    (state?.board ?? []).filter(Boolean),
    getPrimeDensity((state?.board ?? []).filter(Boolean)),
    state?.steps ?? 0,
    state?.combineHistoryKeys ?? {}
  ).activity;
  const activityIndex = clamp01(activity / 100);
  const boardIndex = growthIndex * .5 + activityIndex * .5;
  const efficiencyRate = efficiencyIndex * .08;
  const overflowRate = overflowIndex * .05;
  const qualityRate = qualityIndex * .06;
  const boardRate = clamp01(boardIndex) * .06;
  const performanceBonusRate = Math.min(.25, Math.max(0,
    efficiencyRate + overflowRate + qualityRate + boardRate
  ));
  return {
    efficiencyIndex, overflowIndex, averageQualityMultiplier, qualityIndex,
    growthIndex, activityIndex, boardIndex,
    efficiencyRate, overflowRate, qualityRate, boardRate,
    performanceBonusRate,
    performanceBonusScore: Number(((dayBaseScore ?? 0) * performanceBonusRate).toFixed(2))
  };
}

export function getTodayNewCollectionCount(state){
  return Math.max(
    0,
    (state?.collectionCards ?? state?.collection ?? []).length - (state?.dayStartCollectionCount ?? 0)
  );
}

export function getDailyCollectionBonus(todayNewCollectionCountAfterCollection){
  const saleNumber = Math.max(0, Math.floor(todayNewCollectionCountAfterCollection ?? 0));
  return saleNumber <= 5 ? 0 : (saleNumber - 5) * 10;
}

export function getDailyCollectionBonusTotal(todayNewCollectionCount){
  let total = 0;
  for(let count = 1; count <= Math.max(0, todayNewCollectionCount ?? 0); count++){
    total += getDailyCollectionBonus(count);
  }
  return total;
}

export function getWeekday(day = 1){
  return WEEKDAYS[Math.min(MAX_DAYS, Math.max(1, Math.floor(day))) - 1];
}

export function getDayStep(state){
  return Math.max(0, (state?.steps ?? 0) - (state?.dayStartStep ?? 0));
}

export function getDayTime(state){
  const totalMinutes = OPENING_HOUR * 60 + Math.max(0, state?.dayMinutesElapsed ?? 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatClosingTimeRemaining(minutesRemaining){
  const totalMinutes = Math.max(0, Math.floor(minutesRemaining ?? 0));
  if(totalMinutes === 0) return "已到打烊时间";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if(hours === 0) return `距离打烊还有 ${minutes}分钟`;
  return `距离打烊还有 ${hours}小时${minutes ? `${minutes}分钟` : ""}`;
}

export function getDayPeriod(state){
  const dayMinutes = Math.max(0, state?.dayMinutesElapsed ?? 0);
  if(dayMinutes >= DAY_DURATION_MINUTES) return "打烊";
  const hour = OPENING_HOUR + Math.floor(dayMinutes / 60);
  if(hour < 6) return "凌晨";
  if(hour < 12) return "上午";
  if(hour < 14) return "午间";
  if(hour < 18) return "下午";
  return "晚上";
}

export function createDaySettlement(state){
  const todayNewCollectionCount = getTodayNewCollectionCount(state);
  const finalScore = state.score ?? 0;
  const dailyRevenue = state.dayRevenue ?? 0;
  const todayActions = getDayStep(state);
  const scoreGainToday = Number((finalScore - (state.dayStartScore ?? 0)).toFixed(2));
  const targetScore = getDayTargetScore(state.day);
  const scoreTargetMet = dailyRevenue >= targetScore;
  const dailyCollectionBonusTotal = getDailyCollectionBonusTotal(todayNewCollectionCount);
  const passed = scoreTargetMet;
  const timeSalePeriods = state.timeSalePeriods ?? TIME_SALE_PERIODS;
  const timeSaleScores = state.timeSaleScores ?? {};
  const nextTimeSalePeriods = createNextTimeSalePeriods(timeSalePeriods, timeSaleScores);
  const boardSum = getNonDrinkBoardSum(state.board);
  const performance = getPerformanceBonusBreakdown(state, scoreGainToday);
  const dayFinalScore = Number((scoreGainToday + performance.performanceBonusScore).toFixed(2));
  return {
    day: state.day,
    weekday: getWeekday(state.day),
    finalScore,
    dailyRevenue,
    targetScore,
    scoreGainToday,
    dailyScore: scoreGainToday,
    ...performance,
    dayBaseScore: scoreGainToday,
    dayFinalScore,
    cumulativeScore: Number((finalScore + performance.performanceBonusScore).toFixed(2)),
    collectionGainToday: todayNewCollectionCount,
    dailyCollectionBonusTotal,
    scoreTargetMet,
    maxComboToday: state.dayMaxCombo ?? 0,
    comboBonusToday: state.dayComboBonusTotal ?? 0,
    todayActions,
    minutesToday: state.dayMinutesElapsed ?? 0,
    efficiency: getScoreEfficiency(scoreGainToday, state.dayMinutesElapsed ?? 0),
    boardCount: getBoardCount(state.board),
    boardSum,
    timeSalePeriods,
    timeSaleScores,
    nextTimeSalePeriods,
    timeSaleMarketRows: createTimeSaleMarketRows(timeSalePeriods, timeSaleScores, nextTimeSalePeriods),
    timeSalePriceTotal: getTimeSalePriceTotal(timeSalePeriods),
    nextTimeSalePriceTotal: getTimeSalePriceTotal(nextTimeSalePeriods),
    passed
  };
}

export function settleDayIfNeeded(state){
  if(!state?.dayCycleEnabled || state.daySettlement || (state.dayMinutesElapsed ?? 0) < DAY_DURATION_MINUTES) return state;
  const daySettlement = createDaySettlement(state);
  return {
    ...state,
    score: daySettlement.cumulativeScore,
    daySettlement,
    dayHistory: [...(state.dayHistory ?? []), daySettlement],
    gameOver: !daySettlement.passed || state.day >= MAX_DAYS,
    gameOverReason: !daySettlement.passed
      ? "daily_score_target_not_met"
      : state.day >= MAX_DAYS ? "week_complete" : null
  };
}

export function advanceToNextDay(state){
  if(!state?.dayCycleEnabled || !state.daySettlement?.passed || state.day >= MAX_DAYS) return state;
  return {
    ...state,
    day: state.day + 1,
    dayMinutesElapsed: 0,
    dayStartStep: state.steps,
    dayStartScore: state.score ?? 0,
    dayRevenue: 0,
    dayTargetReachedAtMinutes: null,
    dayStartCollectionCount: state.collectionCards?.length ?? state.collection?.length ?? 0,
    comboCount: 0,
    dayMaxCombo: 0,
    dayComboBonusTotal: 0,
    latestComboEvent: null,
    heaterCount: 1,
    superHeaterCount: 1,
    timeSalePeriods: state.daySettlement.nextTimeSalePeriods,
    timeSaleScores: {},
    daySettlement: null,
    gameOver: false,
    gameOverReason: null
  };
}
