// Dynamic checkpoints V2. All runtime requirements are generated from the
// player's actual performance at the checkpoint they just reached.
export const FIRST_CHECKPOINT_STEP = 10;
export const FIRST_PASS_REFERENCE = 160;
export const PASS_GROWTH_PER_16_STEPS = 0.30;
export const CHECKPOINT_DISTANCE_MIN = 10;
export const CHECKPOINT_DISTANCE_MAX = 24;

export function getPassValue(score, step){
  if(step <= 0) return 0;
  return Math.round((score ?? 0) / Math.sqrt(step));
}

function clamp(value, minimum, maximum){
  return Math.min(maximum, Math.max(minimum, value));
}

export function getNextCheckpointDistance(performanceRatio){
  if(!Number.isFinite(performanceRatio) || performanceRatio <= 0){
    return CHECKPOINT_DISTANCE_MAX;
  }
  return clamp(
    Math.round(16 / Math.sqrt(performanceRatio)),
    CHECKPOINT_DISTANCE_MIN,
    CHECKPOINT_DISTANCE_MAX
  );
}

export function getNextRequiredPassValue(currentPassValue, distance){
  return Math.round(
    currentPassValue * (1 + PASS_GROWTH_PER_16_STEPS * distance / 16)
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
  const currentCheckpoint = state.checkpoint;
  const referencePassValue = currentCheckpoint?.type === "collection"
    ? FIRST_PASS_REFERENCE
    : currentCheckpoint?.requiredPassValue;
  const performanceRatio = currentPassValue / referencePassValue;
  const distance = getNextCheckpointDistance(performanceRatio);
  const step = state.steps + distance;
  return {
    index: (state.checkpoint?.index ?? 0) + 1,
    step,
    type: "passValue",
    requiredPassValue: getNextRequiredPassValue(currentPassValue, distance),
    generatedFromPassValue: currentPassValue,
    generatedDistance: distance,
    performanceRatio
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
    excessRatio: checkpoint.requiredPassValue
      ? currentPassValue / checkpoint.requiredPassValue
      : null,
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
