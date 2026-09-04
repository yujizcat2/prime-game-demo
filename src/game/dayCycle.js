import { getBoardCount } from "./boardRules";
import { getNonDrinkBoardSum } from "./scoreValue";

export const ACTIONS_PER_DAY = 20;
export const OPENING_HOUR = 10;
export const MINUTES_PER_ACTION = 30;

const DAY_SCORE_TARGETS = [500, 1200, 2200, 3600, 5200, 7000, 9000];

export function getDayScoreTarget(day = 1){
  const normalizedDay = Math.max(1, Math.floor(day));
  return DAY_SCORE_TARGETS[normalizedDay - 1]
    ?? DAY_SCORE_TARGETS.at(-1) + (normalizedDay - DAY_SCORE_TARGETS.length) * 2200;
}

export function getDayStep(state){
  return Math.min(ACTIONS_PER_DAY, Math.max(0, (state?.steps ?? 0) - (state?.dayStartStep ?? 0)));
}

export function getDayTime(state){
  const totalMinutes = OPENING_HOUR * 60 + getDayStep(state) * MINUTES_PER_ACTION;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getDayPeriod(state){
  const dayStep = getDayStep(state);
  if(dayStep >= ACTIONS_PER_DAY) return "打烊";
  const hour = OPENING_HOUR + Math.floor(dayStep * MINUTES_PER_ACTION / 60);
  if(hour < 12) return "上午";
  if(hour < 14) return "午间";
  if(hour < 17) return "下午";
  return "傍晚";
}

export function createDaySettlement(state){
  const collectionCount = state?.collectionCards?.length ?? state?.collection?.length ?? 0;
  const targetScore = getDayScoreTarget(state.day);
  const finalScore = state.score ?? 0;
  return {
    day: state.day,
    targetScore,
    finalScore,
    scoreGainToday: finalScore - (state.dayStartScore ?? 0),
    collectionGainToday: collectionCount - (state.dayStartCollectionCount ?? 0),
    money: state.money ?? 0,
    boardCount: getBoardCount(state.board),
    boardSum: getNonDrinkBoardSum(state.board),
    passed: finalScore >= targetScore
  };
}

export function settleDayIfNeeded(state){
  if(!state?.dayCycleEnabled || state.daySettlement || getDayStep(state) < ACTIONS_PER_DAY) return state;
  const daySettlement = createDaySettlement(state);
  return {
    ...state,
    daySettlement,
    dayHistory: [...(state.dayHistory ?? []), daySettlement],
    gameOver: !daySettlement.passed,
    gameOverReason: daySettlement.passed ? null : "day_target_failed"
  };
}

export function advanceToNextDay(state){
  if(!state?.dayCycleEnabled || !state.daySettlement?.passed) return state;
  return {
    ...state,
    day: state.day + 1,
    dayStartStep: state.steps,
    dayStartScore: state.score ?? 0,
    dayStartCollectionCount: state.collectionCards?.length ?? state.collection?.length ?? 0,
    daySettlement: null,
    gameOver: false,
    gameOverReason: null
  };
}
