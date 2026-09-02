// Dynamic checkpoints V2. All runtime requirements are generated from the
// player's actual performance at the checkpoint they just reached.
export const FIRST_CHECKPOINT_STEP = 10;
export const FIRST_SCORE_REFERENCE = Math.round(160 * Math.sqrt(FIRST_CHECKPOINT_STEP));
export const CHECKPOINT_DISTANCE_MIN = 10;
export const CHECKPOINT_DISTANCE_MAX = 24;

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

export function getPassGrowthRate(nextCheckpointStep){
  if(nextCheckpointStep < 40) return 0.12;
  if(nextCheckpointStep < 70) return 0.12;
  if(nextCheckpointStep < 100) return 0.14;
  if(nextCheckpointStep < 150) return 0.25;
  return 0.30;
}

export function getNextRequiredScore(currentScore, currentStep, distance, nextCheckpointStep){
  const growthRate = getPassGrowthRate(nextCheckpointStep);
  return Math.round(
    currentScore
      * (1 + growthRate * distance / 16)
      * Math.sqrt(nextCheckpointStep / currentStep)
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
  const currentScore = state.score ?? 0;
  const currentCheckpoint = state.checkpoint;
  const referenceScore = currentCheckpoint?.type === "collection"
    ? FIRST_SCORE_REFERENCE
    : currentCheckpoint?.requiredScore;
  const performanceRatio = currentScore / referenceScore;
  const distance = getNextCheckpointDistance(performanceRatio);
  const step = state.steps + distance;
  const growthRate = getPassGrowthRate(step);
  return {
    index: (state.checkpoint?.index ?? 0) + 1,
    step,
    type: "score",
    requiredScore: getNextRequiredScore(currentScore, state.steps, distance, step),
    generatedFromScore: currentScore,
    generatedDistance: distance,
    performanceRatio,
    growthRate
  };
}

export function resolveCheckpoint(state){
  const checkpoint = state?.checkpoint;
  if(!checkpoint || state.steps < checkpoint.step) return state;

  const currentScore = state.score ?? 0;
  const collectionCount = state.collectionCards?.length ?? state.collection?.length ?? 0;
  const passed = checkpoint.type === "collection"
    ? collectionCount >= checkpoint.requiredCollectionCount
    : currentScore >= checkpoint.requiredScore;
  const result = {
    index: checkpoint.index,
    step: checkpoint.step,
    type: checkpoint.type,
    requiredCollectionCount: checkpoint.requiredCollectionCount ?? null,
    requiredScore: checkpoint.requiredScore ?? null,
    generatedFromScore: checkpoint.generatedFromScore ?? null,
    generatedProgressRatio: checkpoint.requiredScore
      ? checkpoint.generatedFromScore / checkpoint.requiredScore
      : null,
    growthRate: checkpoint.growthRate ?? null,
    currentScore,
    excessRatio: checkpoint.requiredScore
      ? currentScore / checkpoint.requiredScore
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
