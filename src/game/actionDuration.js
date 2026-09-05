import { getBoardCount } from "./boardRules";

export const TOOL_DURATION_MINUTES = 30;
export const REDUCE_DURATION_MINUTES = 45;
export const REDUCE_WITH_REMOVAL_DURATION_MINUTES = 60;

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

export function getReduceDurationMinutes(removedCardCount = 0){
  return removedCardCount > 0 ? REDUCE_WITH_REMOVAL_DURATION_MINUTES : REDUCE_DURATION_MINUTES;
}

export function getActionDurationMinutes(previousState, action, actionState){
  if(!previousState || !action || !actionState || actionState === previousState) return 0;
  if(action.type === "combine" || action.type === "combine_ordered"){
    const [leftIndex, rightIndex] = action.indexes ?? [];
    return getCombineDurationMinutes(
      previousState.board?.[leftIndex]?.value,
      previousState.board?.[rightIndex]?.value
    );
  }
  if(action.type === "reduce"){
    return getReduceDurationMinutes(
      Math.max(0, getBoardCount(previousState.board) - getBoardCount(actionState.board))
    );
  }
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
