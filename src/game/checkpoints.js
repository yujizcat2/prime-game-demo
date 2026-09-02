// Dynamic checkpoints V1. Keep all tuning values here so later test results
// can replace the curve without touching game, AI, or UI code.
export const FIRST_CHECKPOINT_STEP = 10;
export const CHECKPOINT_DIFFICULTY_MULTIPLIER = 1.0;
export const CHECKPOINT_DISTANCE_MIN = 10;
export const CHECKPOINT_DISTANCE_MAX = 24;

export const EXPECTED_PASS_VALUE_POINTS = Object.freeze([
  {step: 10, passValue: 178},
  {step: 20, passValue: 240},
  {step: 30, passValue: 323},
  {step: 40, passValue: 426},
  {step: 50, passValue: 490},
  {step: 60, passValue: 555},
  {step: 70, passValue: 595},
  {step: 80, passValue: 625},
  {step: 90, passValue: 650},
  {step: 100, passValue: 676}
]);

export function getPassValue(score, step){
  if(step <= 0) return 0;
  return Math.round((score ?? 0) / Math.sqrt(step));
}

export function getExpectedPassValue(step){
  const points = EXPECTED_PASS_VALUE_POINTS;
  if(step <= points[0].step) return points[0].passValue;

  for(let index = 1; index < points.length; index++){
    const right = points[index];
    if(step <= right.step){
      const left = points[index - 1];
      const ratio = (step - left.step) / (right.step - left.step);
      return left.passValue + (right.passValue - left.passValue) * ratio;
    }
  }

  // Continue the final positive trend after Step 100; never plateau.
  const last = points.at(-1);
  const previous = points.at(-2);
  const slope = (last.passValue - previous.passValue) / (last.step - previous.step);
  return last.passValue + (step - last.step) * Math.max(slope, Number.EPSILON);
}

function clamp(value, minimum, maximum){
  return Math.min(maximum, Math.max(minimum, value));
}

export function getNextCheckpointDistance(currentPassValue, expectedPassValue){
  const performanceRatio = currentPassValue / expectedPassValue;
  if(!Number.isFinite(performanceRatio) || performanceRatio <= 0){
    return CHECKPOINT_DISTANCE_MAX;
  }
  return clamp(
    Math.round(16 / Math.sqrt(performanceRatio)),
    CHECKPOINT_DISTANCE_MIN,
    CHECKPOINT_DISTANCE_MAX
  );
}

export function createFirstCheckpoint(){
  return {
    index: 1,
    step: FIRST_CHECKPOINT_STEP,
    type: "collection",
    requiredCollectionCount: 1
  };
}

export function createNextCheckpoint(state){
  const currentPassValue = getPassValue(state.score, state.steps);
  const expectedPassValue = getExpectedPassValue(state.steps);
  const distance = getNextCheckpointDistance(currentPassValue, expectedPassValue);
  const step = state.steps + distance;
  return {
    index: (state.checkpoint?.index ?? 0) + 1,
    step,
    type: "passValue",
    requiredPassValue: Math.round(
      getExpectedPassValue(step) * CHECKPOINT_DIFFICULTY_MULTIPLIER
    )
  };
}

export function resolveCheckpoint(state){
  const checkpoint = state?.checkpoint;
  if(!checkpoint || state.steps < checkpoint.step) return state;

  const currentPassValue = getPassValue(state.score, state.steps);
  const collectionCount = state.collectionCards?.length ?? state.collection?.length ?? 0;
  const passed = checkpoint.type === "collection"
    ? collectionCount >= checkpoint.requiredCollectionCount
    : currentPassValue >= checkpoint.requiredPassValue;
  const result = {
    index: checkpoint.index,
    step: checkpoint.step,
    type: checkpoint.type,
    requiredCollectionCount: checkpoint.requiredCollectionCount ?? null,
    requiredPassValue: checkpoint.requiredPassValue ?? null,
    currentPassValue,
    passed
  };

  if(!passed){
    return {
      ...state,
      gameOver: true,
      gameOverReason: "checkpoint_failed",
      latestCheckpointResult: result,
      checkpointHistory: [...(state.checkpointHistory ?? []), result]
    };
  }

  const passedState = {
    ...state,
    passedCheckpointCount: (state.passedCheckpointCount ?? 0) + 1,
    latestCheckpointResult: result,
    checkpointHistory: [...(state.checkpointHistory ?? []), result]
  };
  return {...passedState, checkpoint: createNextCheckpoint(passedState)};
}
