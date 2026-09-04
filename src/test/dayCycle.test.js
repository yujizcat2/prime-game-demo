import assert from "node:assert/strict";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { resolveGameOver } from "../game/gameEngine";
import { applyHeater } from "../game/heater";
import { applyRestore } from "../game/restore";
import { applySuperHeater } from "../game/superHeater";
import { FOOD_TYPES } from "../game/rules";
import {
  ACTIONS_PER_DAY,
  advanceToNextDay,
  createNextDayCards,
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
assert.deepEqual(
  [initial.heaterCount, initial.restoreCount, initial.superHeaterCount],
  [1, 1, 1],
  "a new game starts with one use of every item"
);

const at19 = resolveGameOver({...initial, steps: 19, score: 499});
assert.equal(at19.daySettlement, null, "19 actions do not close the day");
assert.equal(at19.gameOver, false);

const fourCollections = [
  {value: 5, foodType: "aquatic"},
  {value: 8, foodType: "aquatic"},
  {value: 3, foodType: "aquatic"},
  {value: 12, foodType: "grainBean"}
];
assert.deepEqual(createNextDayCards(fourCollections), [
  {value: 5, foodType: "aquatic", source: "round_crystal", round: "A"},
  {value: 8, foodType: "aquatic", source: "round_crystal", round: "B"},
  {value: 3, foodType: "aquatic", source: "round_crystal", round: "C"},
  {value: 12, foodType: "grainBean", source: "round_crystal", round: "D"},
  {value: 12, foodType: "grainBean", source: "daily_maximum"}
], "four collections create one card in every round");

const exampleCollections = [
  {value: 5, foodType: "aquatic"}, {value: 8, foodType: "aquatic"},
  {value: 3, foodType: "aquatic"}, {value: 12, foodType: "grainBean"},
  {value: 7, foodType: "aquatic"}, {value: 14, foodType: "grainBean"},
  {value: 11, foodType: "aquatic"}, {value: 20, foodType: "grainBean"},
  {value: 17, foodType: "spice"}
];
const compressed = createNextDayCards(exampleCollections);
assert.deepEqual(compressed.map(card => [card.value, card.foodType]), [
  [10, "spice"], [11, "grainBean"], [7, "aquatic"], [16, "grainBean"], [20, "grainBean"]
], "5–10 collections are assigned by index modulo four, rounded, and use each round's last food type");
assert.deepEqual(createNextDayCards(exampleCollections), compressed, "compression is deterministic");
assert.deepEqual(createNextDayCards([
  {value: 20, foodType: "aquatic"}, {value: 4, foodType: "land"},
  {value: 6, foodType: "spice"}, {value: 8, foodType: "fruit"},
  {value: 20, foodType: "grainBean"}
]).at(-1), {value: 20, foodType: "grainBean", source: "daily_maximum"}, "a tied maximum uses the later collection");

const passed = resolveGameOver({...initial, steps: ACTIONS_PER_DAY, score: 500, collectionCards: fourCollections});
assert.equal(passed.daySettlement.passed, true);
assert.equal(passed.daySettlement.targetScore, 500);
assert.equal(passed.daySettlement.finalScore, 500);
assert.equal(passed.daySettlement.collectionTargetMet, true);
assert.equal(passed.daySettlement.nextDayCards.length, 5);
assert.equal(passed.dayHistory.length, 1);
assert.equal(passed.day, 1, "passing does not automatically advance the day");
assert.equal(getDayTime(passed), "20:00");

const failed = resolveGameOver({...initial, steps: ACTIONS_PER_DAY, score: 499});
assert.equal(failed.daySettlement.passed, false);
assert.equal(failed.gameOver, true);
assert.equal(failed.gameOverReason, "day_target_failed");

const collectionFailed = resolveGameOver({...initial, steps: ACTIONS_PER_DAY, score: 500, collectionCards: fourCollections.slice(0, 3)});
assert.equal(collectionFailed.daySettlement.collectionTargetMet, false);
assert.equal(collectionFailed.daySettlement.nextDayCards.length, 0);
assert.equal(collectionFailed.gameOverReason, "day_collection_failed");
assert.equal(advanceToNextDay(collectionFailed), collectionFailed, "fewer than four collections cannot advance");

const dayTwo = advanceToNextDay(passed);
assert.equal(dayTwo.day, 2);
assert.equal(dayTwo.dayStartStep, ACTIONS_PER_DAY);
assert.equal(getDayTime(dayTwo), "10:00");
assert.equal(getDayScoreTarget(dayTwo.day), 1200);
assert.equal(dayTwo.board.filter(Boolean).length, 5, "the next-day board contains exactly five cards");
assert.deepEqual(dayTwo.board.filter(Boolean).map(card => [card.value, card.foodType]), passed.daySettlement.nextDayCards.map(card => [card.value, card.foodType]));
assert.equal(dayTwo.score, 500);
assert.equal(dayTwo.collectionCards, passed.collectionCards);
assert.equal(dayTwo.daySettlement, null);
assert.deepEqual(
  [dayTwo.heaterCount, dayTwo.restoreCount, dayTwo.superHeaterCount],
  [1, 1, 1],
  "unused items reset to one instead of accumulating"
);

const itemDay = structuredClone(initial);
itemDay.board[0].foodType = FOOD_TYPES.DRINK;
const afterHeater = applyHeater(itemDay, 0);
const afterRestore = applyRestore(afterHeater, 0);
const afterAllItems = applySuperHeater(afterRestore);
assert.deepEqual(
  [afterAllItems.heaterCount, afterAllItems.restoreCount, afterAllItems.superHeaterCount],
  [0, 0, 0],
  "using every item exhausts the daily 1/1/1 allowance"
);
assert.equal(afterAllItems.steps, initial.steps, "items do not consume normal operating actions");
const resetAfterUse = advanceToNextDay({...afterAllItems, daySettlement: passed.daySettlement});
assert.deepEqual(
  [resetAfterUse.heaterCount, resetAfterUse.restoreCount, resetAfterUse.superHeaterCount],
  [1, 1, 1],
  "all exhausted items reset at the next day boundary"
);

for(const previousCounts of [[0, 0, 0], [1, 0, 1]]){
  const reset = advanceToNextDay({
    ...passed,
    heaterCount: previousCounts[0],
    restoreCount: previousCounts[1],
    superHeaterCount: previousCounts[2]
  });
  assert.deepEqual(
    [reset.heaterCount, reset.restoreCount, reset.superHeaterCount],
    [1, 1, 1],
    `next day resets ${previousCounts.join("/")} to 1/1/1`
  );
}

const dayTwoCollections = [...fourCollections, ...exampleCollections.slice(0, 4)];
const dayTwoPassed = resolveGameOver({...dayTwo, steps: ACTIONS_PER_DAY * 2, score: 1200, collectionCards: dayTwoCollections});
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
