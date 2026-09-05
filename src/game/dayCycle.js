import { getBoardCount } from "./boardRules";
import { getNonDrinkBoardSum } from "./scoreValue";
import { getScoreEfficiency } from "./scoreEfficiency";
import { scaleScore } from "./scoreScale";

export const DAY_DURATION_MINUTES = 1440;
export const DAILY_COLLECTION_TARGET = 8;
export const MAX_DAYS = 7;
export const OPENING_HOUR = 0;
export const WEEKDAYS = Object.freeze(["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]);

export function getDayTargetScore(day = 1){
  return scaleScore(Math.max(1, Math.floor(day)) * 100);
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
  const todayCollections = (state?.collectionCards ?? state?.collection ?? [])
    .slice(state?.dayStartCollectionCount ?? 0)
    .map(card => ({value: card.value, foodType: card.foodType}));
  const finalScore = state.score ?? 0;
  const todayActions = getDayStep(state);
  const scoreGainToday = finalScore - (state.dayStartScore ?? 0);
  const targetScore = getDayTargetScore(state.day);
  const scoreTargetMet = finalScore >= targetScore;
  const collectionTargetMet = todayCollections.length >= DAILY_COLLECTION_TARGET;
  const passed = scoreTargetMet && collectionTargetMet;
  return {
    day: state.day,
    weekday: getWeekday(state.day),
    finalScore,
    targetScore,
    scoreGainToday,
    collectionGainToday: todayCollections.length,
    collectionTarget: DAILY_COLLECTION_TARGET,
    collectionTargetMet,
    scoreTargetMet,
    maxComboToday: state.dayMaxCombo ?? 0,
    comboBonusToday: state.dayComboBonusTotal ?? 0,
    todayActions,
    minutesToday: state.dayMinutesElapsed ?? 0,
    efficiency: getScoreEfficiency(scoreGainToday, state.dayMinutesElapsed ?? 0),
    boardCount: getBoardCount(state.board),
    boardSum: getNonDrinkBoardSum(state.board),
    passed
  };
}

export function settleDayIfNeeded(state){
  if(!state?.dayCycleEnabled || state.daySettlement || (state.dayMinutesElapsed ?? 0) < DAY_DURATION_MINUTES) return state;
  const daySettlement = createDaySettlement(state);
  return {
    ...state,
    daySettlement,
    dayHistory: [...(state.dayHistory ?? []), daySettlement],
    gameOver: !daySettlement.passed || state.day >= MAX_DAYS,
    gameOverReason: !daySettlement.passed
      ? "daily_targets_not_met"
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
    dayStartCollectionCount: state.collectionCards?.length ?? state.collection?.length ?? 0,
    comboCount: 0,
    dayMaxCombo: 0,
    dayComboBonusTotal: 0,
    latestComboEvent: null,
    heaterCount: 1,
    restoreCount: 1,
    superHeaterCount: 1,
    daySettlement: null,
    gameOver: false,
    gameOverReason: null
  };
}
