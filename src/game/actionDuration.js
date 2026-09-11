import { getBoardCount } from "./boardRules";
import { gcd } from "../utils/math";

export const TOOL_DURATION_MINUTES = 30;
export const SWAP_DURATION_MINUTES = 15;
export const REDUCE_DURATION_MINUTES = 45;
export const REDUCE_WITH_REMOVAL_DURATION_MINUTES = 60;
export const REDUCE_TO_FINISHED_DURATION_MINUTES = 60;

export function getSellDurationMinutes(count = 0){
  return Math.max(0,Math.floor(count))*60;
}

export function getCombineDurationMinutes(a, b){
  const sum = (a ?? 0) + (b ?? 0);
  if(sum <= 20) return 30;
  if(sum <= 35) return 35;
  if(sum <= 50) return 40;
  if(sum <= 65) return 45;
  if(sum <= 80) return 50;
  if(sum <= 100) return 55;
  return 60;
}

export function getReduceDurationMinutes(removedCardCount = 0, createsFinishedDish = false){
  if(createsFinishedDish) return REDUCE_TO_FINISHED_DURATION_MINUTES;
  return removedCardCount > 0 ? REDUCE_WITH_REMOVAL_DURATION_MINUTES : REDUCE_DURATION_MINUTES;
}

export function getActionDurationMinutes(previousState, action, actionState){
  if(!previousState || !action || !actionState || actionState === previousState) return 0;
  if(action.type === "combine"){
    const [leftIndex, rightIndex] = action.indexes ?? [];
    return getCombineDurationMinutes(
      previousState.board?.[leftIndex]?.value,
      previousState.board?.[rightIndex]?.value
    );
  }
  if(action.type === "reduce"){
    const [leftIndex, rightIndex] = action.indexes ?? [];
    const left = previousState.board?.[leftIndex];
    const right = previousState.board?.[rightIndex];
    const divisor = left && right ? gcd(left.value, right.value) : 1;
    const createsFinishedDish = Boolean(
      left && right && left.value !== right.value
      && divisor > 1
      && (left.value / divisor === 1 || right.value / divisor === 1)
    );
    return getReduceDurationMinutes(
      Math.max(0, getBoardCount(previousState.board) - getBoardCount(actionState.board)),
      createsFinishedDish
    );
  }
  if(action.type === "swap") return SWAP_DURATION_MINUTES;
  if(action.type === "sell") return getSellDurationMinutes(action.indexes?.length ?? 0);
  return TOOL_DURATION_MINUTES;
}

export function applyActionDuration(previousState, action, actionState, scoredState){
  const durationMinutes = getActionDurationMinutes(previousState, action, actionState);
  if(durationMinutes <= 0) return scoredState;
  const actionAlreadyCounted = (actionState.steps ?? 0) > (previousState.steps ?? 0);
  return {
    ...scoredState,
    steps: (scoredState.steps ?? previousState.steps ?? 0) + (actionAlreadyCounted ? 0 : 1),
    dayMinutesElapsed: previousState.dayCycleEnabled
      ? (previousState.dayMinutesElapsed ?? 0) + durationMinutes
      : (previousState.dayMinutesElapsed ?? 0),
    totalActionMinutes: (previousState.totalActionMinutes ?? 0) + durationMinutes,
    latestActionDurationMinutes: durationMinutes
  };
}
