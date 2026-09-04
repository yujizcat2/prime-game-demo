import assert from "node:assert/strict";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { resolveGameOver } from "../game/gameEngine";
import {
  ACTIONS_PER_DAY,
  advanceToNextDay,
  getDayScoreTarget,
  getDayTime
} from "../game/dayCycle";

function createDayState(){
  return createGameState(createEightPalaceInitialValues(), {dayCycleEnabled: true});
}

const initial = createDayState();
assert.equal(initial.day, 1);
assert.equal(getDayTime(initial), "10:00");
assert.equal(getDayScoreTarget(initial.day), 500);
assert.equal(initial.checkpoint, null, "human day-cycle state does not expose a legacy checkpoint");

const at19 = resolveGameOver({...initial, steps: 19, score: 499});
assert.equal(at19.daySettlement, null, "19 actions do not close the day");
assert.equal(at19.gameOver, false);

const passed = resolveGameOver({...initial, steps: ACTIONS_PER_DAY, score: 500});
assert.equal(passed.daySettlement.passed, true);
assert.equal(passed.daySettlement.targetScore, 500);
assert.equal(passed.daySettlement.finalScore, 500);
assert.equal(passed.dayHistory.length, 1);
assert.equal(passed.day, 1, "passing does not automatically advance the day");
assert.equal(getDayTime(passed), "20:00");

const failed = resolveGameOver({...initial, steps: ACTIONS_PER_DAY, score: 499});
assert.equal(failed.daySettlement.passed, false);
assert.equal(failed.gameOver, true);
assert.equal(failed.gameOverReason, "day_target_failed");

const persistentBoard = passed.board;
const persistentCollection = [{value: 17, foodType: "land"}];
const dayTwo = advanceToNextDay({...passed, collectionCards: persistentCollection});
assert.equal(dayTwo.day, 2);
assert.equal(dayTwo.dayStartStep, ACTIONS_PER_DAY);
assert.equal(getDayTime(dayTwo), "10:00");
assert.equal(getDayScoreTarget(dayTwo.day), 1200);
assert.equal(dayTwo.board, persistentBoard, "the board is preserved exactly across days");
assert.equal(dayTwo.score, 500);
assert.equal(dayTwo.collectionCards, persistentCollection);
assert.equal(dayTwo.daySettlement, null);

const dayTwoPassed = resolveGameOver({...dayTwo, steps: ACTIONS_PER_DAY * 2, score: 1200});
assert.equal(dayTwoPassed.daySettlement.day, 2);
assert.equal(dayTwoPassed.daySettlement.passed, true);
assert.equal(dayTwoPassed.dayHistory.length, 2);

const beyondLegacyLimit = resolveGameOver({...initial, steps: 99, dayStartStep: 80, score: 10000});
assert.equal(beyondLegacyLimit.gameOver, false, "day cycle ignores the old 100-step limit");
assert.equal(beyondLegacyLimit.daySettlement, null);

const ignoredLegacyFailure = resolveGameOver({
  ...initial,
  steps: 10,
  score: 0,
  checkpoint: {index: 1, step: 10, type: "score", requiredScore: 999999}
});
assert.equal(ignoredLegacyFailure.gameOver, false, "day cycle ignores legacy checkpoint failure");
assert.notEqual(ignoredLegacyFailure.gameOverReason, "checkpoint_failed");

const legacy = createGameState(createEightPalaceInitialValues());
assert.equal(legacy.dayCycleEnabled, false);
assert.ok(legacy.checkpoint);
const legacyFailure = resolveGameOver({...legacy, steps: 10, score: 0});
assert.equal(legacyFailure.gameOverReason, "checkpoint_failed");

console.log("dayCycle.test.js passed");
