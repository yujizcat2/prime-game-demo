import assert from "node:assert/strict";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { resolveGameOver } from "../game/gameEngine";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import {
  DAY_DURATION_MINUTES,
  DAILY_COLLECTION_TARGET,
  MAX_DAYS,
  WEEKDAYS,
  advanceToNextDay,
  getDayTargetScore,
  formatClosingTimeRemaining,
  getDayTime,
  getWeekday
} from "../game/dayCycle";

const createDayState = () => createGameState(createEightPalaceInitialValues(), {dayCycleEnabled: true});
const makeCollections = (count, offset = 0) => Array.from({length: count}, (_, index) => ({
  value: 2 + (index + offset) % 100,
  foodType: index % 2 ? "land" : "aquatic"
}));

const initial = createDayState();
assert.equal(DAY_DURATION_MINUTES, 1440);
assert.equal(DAILY_COLLECTION_TARGET, 8);
assert.equal(formatClosingTimeRemaining(300), "距离打烊还有 5小时");
assert.equal(formatClosingTimeRemaining(270), "距离打烊还有 4小时30分钟");
assert.equal(formatClosingTimeRemaining(30), "距离打烊还有 30分钟");
assert.equal(formatClosingTimeRemaining(0), "已到打烊时间");
assert.deepEqual(
  Array.from({length: MAX_DAYS}, (_, index) => getDayTargetScore(index + 1)),
  [1000, 2000, 3000, 4000, 5000, 6000, 7000]
);
assert.equal(initial.day, 1);
assert.equal(getWeekday(initial.day), "星期一");
assert.equal(getDayTime(initial), "00:00");
assert.equal(getDayTime({...initial, dayMinutesElapsed: 65}), "01:05");

const at23 = resolveGameOver({...initial, steps: 23, dayMinutesElapsed: 1439, score: 0, collectionCards: makeCollections(10)});
assert.equal(at23.daySettlement, null, "time before 24:00 does not settle the day");
assert.equal(at23.gameOver, false);

const tenCollections = makeCollections(10);
const failedAt99 = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 999, collectionCards: tenCollections});
assert.equal(failedAt99.daySettlement.passed, false);
assert.equal(failedAt99.gameOverReason, "daily_targets_not_met");

const closingBoard = initial.board.map((piece, index) => piece && index === 0 ? {
  ...piece,
  parents: [{value: 2, foodType: "aquatic"}],
  origin: {kind: "test-origin", sourceId: 77}
} : piece);
const passed = resolveGameOver({...initial, board: closingBoard, steps: 24, dayMinutesElapsed: 1440, score: 1000, collectionCards: tenCollections});
assert.equal(passed.daySettlement.passed, true);
assert.equal(passed.daySettlement.scoreTargetMet, true);
assert.equal(passed.daySettlement.targetScore, 1000);
assert.equal(passed.daySettlement.collectionGainToday, 10);
assert.equal(passed.daySettlement.weekday, "星期一");
assert.equal(passed.daySettlement.scoreGainToday, 1000);
assert.equal(passed.daySettlement.efficiency, 1000 / 1440 * 60);
assert.equal(passed.daySettlement.boardCount, passed.board.filter(Boolean).length);
assert.equal(Object.hasOwn(passed.daySettlement, "nextDayCards"), false);
assert.equal(passed.dayHistory.length, 1);
assert.equal(getDayTime(passed), "24:00");

const overTarget = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 1010, collectionCards: tenCollections});
assert.equal(overTarget.daySettlement.passed, true);

const fewCollections = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 1000, collectionCards: makeCollections(7)});
assert.equal(fewCollections.daySettlement.scoreTargetMet, true);
assert.equal(fewCollections.daySettlement.collectionTargetMet, false);
assert.equal(fewCollections.daySettlement.passed, false, "revenue alone cannot pass without eight new collections");

const manyCollectionsLowScore = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 999, collectionCards: makeCollections(20)});
assert.equal(manyCollectionsLowScore.daySettlement.passed, false, "many collections cannot replace the score target");
assert.equal(manyCollectionsLowScore.daySettlement.collectionTargetMet, true);

assert.equal(getScoreEfficiency(100, 600), 10, "live efficiency is hourly score from actual minutes");
assert.equal(getScoreEfficiency(60, 600), 6);
assert.ok(getScoreEfficiency(100, 300) > getScoreEfficiency(100, 600));
assert.notEqual(
  getScoreEfficiency(100, 300),
  getScoreEfficiency(100, 600),
  "equal scores and Step counts can have different efficiency when action minutes differ"
);
const efficiencyState = resolveGameOver({
  ...initial, steps: 24, dayMinutesElapsed: 1440, score: 1480, dayStartScore: 0, collectionCards: tenCollections
});
assert.equal(efficiencyState.daySettlement.efficiency, 1480 / 1440 * 60, "daily efficiency uses the day's complete action minutes");

let state = passed;
const dayTwoOpening = advanceToNextDay(state);
assert.equal(dayTwoOpening.board, state.board, "Day 2 keeps the exact closing board array");
assert.deepEqual(dayTwoOpening.board, closingBoard, "values, food types, positions, parents, and origin are unchanged");
assert.equal(dayTwoOpening.nextId, state.nextId, "day rollover creates no replacement cards");
assert.equal(dayTwoOpening.comboCount, 0);
assert.equal(dayTwoOpening.dayMinutesElapsed, 0);
assert.equal(dayTwoOpening.score - dayTwoOpening.dayStartScore, 0, "Day 2 daily revenue restarts at zero");
assert.equal(dayTwoOpening.score, 1000, "cumulative score is retained");
assert.equal(dayTwoOpening.collectionCards.length, tenCollections.length, "cumulative collections are retained");
assert.equal(dayTwoOpening.heaterCount, 1);
assert.equal(dayTwoOpening.restoreCount, 1);
assert.equal(dayTwoOpening.superHeaterCount, 1);
const dayTwoFailed = resolveGameOver({
  ...dayTwoOpening,
  steps: 48,
  dayMinutesElapsed: 1440,
  score: 1999,
  collectionCards: [...dayTwoOpening.collectionCards, ...makeCollections(10, 10)]
});
assert.equal(dayTwoFailed.daySettlement.scoreGainToday, 999, "Day 2 retains daily gain as a statistic");
assert.equal(dayTwoFailed.daySettlement.passed, false);
assert.equal(dayTwoFailed.daySettlement.efficiency, 999 / 1440 * 60, "Day 2 efficiency uses only Day 2 action minutes");

const bufferedDayOne = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 1550, collectionCards: tenCollections});
const bufferedDayTwo = advanceToNextDay(bufferedDayOne);
assert.equal(bufferedDayTwo.score, 1550, "Day 1 excess revenue carries into Day 2");
const alreadyAtDayTwoTarget = resolveGameOver({...bufferedDayTwo, score: 2050});
assert.equal(alreadyAtDayTwoTarget.daySettlement, null, "meeting Day 2's target before closing never settles the day early");
const bufferedDayTwoPassed = resolveGameOver({...bufferedDayTwo, steps: 48, dayMinutesElapsed: 1440, score: 2000, collectionCards: [...bufferedDayTwo.collectionCards, ...makeCollections(8, 10)]});
assert.equal(bufferedDayTwoPassed.daySettlement.scoreGainToday, 450);
assert.equal(bufferedDayTwoPassed.daySettlement.targetScore, 2000);
assert.equal(bufferedDayTwoPassed.daySettlement.passed, true, "Day 2 passes on cumulative revenue");

for(let day = 1; day <= MAX_DAYS; day++){
  assert.equal(state.day, day);
  assert.equal(state.daySettlement.weekday, WEEKDAYS[day - 1]);
  if(day === MAX_DAYS) break;
  const closingBoardForDay = state.board;
  const next = advanceToNextDay(state);
  assert.equal(next.board, closingBoardForDay, `Day ${day + 1} inherits Day ${day}'s closing board`);
  assert.equal(next.day, day + 1);
  assert.equal(next.dayStartStep, day * 24);
  assert.equal(getDayTime(next), "00:00");
  const collections = [...next.collectionCards, ...makeCollections(10, day * 10)];
  state = resolveGameOver({
    ...next,
    steps: (day + 1) * 24,
    dayMinutesElapsed: 1440,
    score: next.score + 1000,
    collectionCards: collections
  });
}

assert.equal(state.steps, 168);
assert.equal(state.day, 7);
assert.equal(state.daySettlement.passed, true);
assert.equal(state.daySettlement.weekday, "星期日");
assert.equal(Object.hasOwn(state.daySettlement, "nextDayCards"), false);
assert.equal(state.gameOver, true);
assert.equal(state.gameOverReason, "week_complete");
assert.equal(advanceToNextDay(state), state, "the eighth day is never created");
assert.equal(state.dayHistory.length, 7);

const daySevenFailed = resolveGameOver({...initial, day: 7, dayMinutesElapsed: 1440, score: 6999, collectionCards: tenCollections});
assert.equal(daySevenFailed.gameOverReason, "daily_targets_not_met");
const daySevenPassed = resolveGameOver({...initial, day: 7, dayMinutesElapsed: 1440, score: 7000, collectionCards: tenCollections});
assert.equal(daySevenPassed.gameOverReason, "week_complete");

console.log("dayCycle.test.js passed");
