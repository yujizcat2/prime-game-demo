export function calcStepReward(gainedCount) {
  return gainedCount * GAME_CONFIG.REMOVE_STEP_REWARD;
}