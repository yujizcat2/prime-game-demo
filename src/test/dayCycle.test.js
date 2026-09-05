import assert from "node:assert/strict";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { resolveGameOver } from "../game/gameEngine";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import {
  ACTIONS_PER_DAY,
  DAY_SCORE_TARGET,
  MAX_DAYS,
  MIN_COLLECTIONS_FOR_NEXT_DAY,
  WEEKDAYS,
  advanceToNextDay,
  createNextDayCards,
  getDayTime,
  getWeekday
} from "../game/dayCycle";

const createDayState = () => createGameState(createEightPalaceInitialValues(), {dayCycleEnabled: true});
const makeCollections = (count, offset = 0) => Array.from({length: count}, (_, index) => ({
  value: 2 + (index + offset) % 100,
  foodType: index % 2 ? "land" : "aquatic"
}));

const initial = createDayState();
assert.equal(ACTIONS_PER_DAY, 24);
assert.equal(DAY_SCORE_TARGET, 100);
assert.equal(MIN_COLLECTIONS_FOR_NEXT_DAY, 10);
assert.equal(initial.day, 1);
assert.equal(getWeekday(initial.day), "星期一");
assert.equal(getDayTime(initial), "00:00");
assert.equal(getDayTime({...initial, steps: 1}), "01:00");

const at23 = resolveGameOver({...initial, steps: 23, score: 0, collectionCards: makeCollections(10)});
assert.equal(at23.daySettlement, null, "23 steps do not settle the day");
assert.equal(at23.gameOver, false);

const tenCollections = makeCollections(10);
const failedAt99 = resolveGameOver({...initial, steps: 24, score: 99, collectionCards: tenCollections});
assert.equal(failedAt99.daySettlement.passed, false);
assert.equal(failedAt99.gameOverReason, "daily_score_target_not_met");

const passed = resolveGameOver({...initial, steps: 24, score: 100, collectionCards: tenCollections});
assert.equal(passed.daySettlement.passed, true);
assert.equal(passed.daySettlement.scoreTargetMet, true);
assert.equal(passed.daySettlement.targetScore, 100);
assert.equal(passed.daySettlement.collectionGainToday, 10);
assert.equal(passed.daySettlement.weekday, "星期一");
assert.equal(passed.daySettlement.scoreGainToday, 100);
assert.equal(passed.daySettlement.efficiency, 100 / 24);
assert.equal(passed.daySettlement.boardCount, passed.board.filter(Boolean).length);
assert.equal(passed.daySettlement.nextDayCards.length, 5);
assert.equal(passed.dayHistory.length, 1);
assert.equal(getDayTime(passed), "24:00");

const overTarget = resolveGameOver({...initial, steps: 24, score: 101, collectionCards: tenCollections});
assert.equal(overTarget.daySettlement.passed, true);

const fewCollections = resolveGameOver({...initial, steps: 24, score: 100, collectionCards: makeCollections(9)});
assert.equal(fewCollections.daySettlement.passed, true, "fewer than ten collections still pass at 100 points");

const manyCollectionsLowScore = resolveGameOver({...initial, steps: 24, score: 99, collectionCards: makeCollections(20)});
assert.equal(manyCollectionsLowScore.daySettlement.passed, false, "many collections cannot replace the score target");

assert.equal(getScoreEfficiency(125, 25), 5, "live efficiency remains score divided by steps");
const efficiencyState = resolveGameOver({
  ...initial, steps: 24, score: 148, dayStartScore: 0, collectionCards: tenCollections
});
assert.equal(efficiencyState.daySettlement.efficiency, 148 / 24, "daily efficiency is daily score gain divided by daily actions");

const compressed = createNextDayCards(tenCollections);
assert.equal(compressed.length, 5);
assert.deepEqual(createNextDayCards(tenCollections), compressed, "next-day compression stays deterministic");

let state = passed;
const dayTwoOpening = advanceToNextDay(state);
const dayTwoFailed = resolveGameOver({
  ...dayTwoOpening,
  steps: 48,
  score: 199,
  collectionCards: [...dayTwoOpening.collectionCards, ...makeCollections(10, 10)]
});
assert.equal(dayTwoFailed.daySettlement.scoreGainToday, 99, "Day 2 uses daily gain instead of cumulative score");
assert.equal(dayTwoFailed.daySettlement.passed, false);

for(let day = 1; day <= MAX_DAYS; day++){
  assert.equal(state.day, day);
  assert.equal(state.daySettlement.weekday, WEEKDAYS[day - 1]);
  if(day === MAX_DAYS) break;
  const next = advanceToNextDay(state);
  assert.equal(next.day, day + 1);
  assert.equal(next.dayStartStep, day * ACTIONS_PER_DAY);
  assert.equal(getDayTime(next), "00:00");
  const collections = [...next.collectionCards, ...makeCollections(10, day * 10)];
  state = resolveGameOver({
    ...next,
    steps: (day + 1) * ACTIONS_PER_DAY,
    score: next.score + 100,
    collectionCards: collections
  });
}

assert.equal(state.steps, 168);
assert.equal(state.day, 7);
assert.equal(state.daySettlement.passed, true);
assert.equal(state.daySettlement.weekday, "星期日");
assert.equal(state.daySettlement.nextDayCards.length, 0);
assert.equal(state.gameOver, true);
assert.equal(state.gameOverReason, "week_complete");
assert.equal(advanceToNextDay(state), state, "the eighth day is never created");
assert.equal(state.dayHistory.length, 7);

console.log("dayCycle.test.js passed");
