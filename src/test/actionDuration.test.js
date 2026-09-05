import assert from "node:assert/strict";
import { getCombineDurationMinutes, getReduceDurationMinutes } from "../game/actionDuration";
import { advanceToNextDay, getDayTime } from "../game/dayCycle";
import { applyAction, createGameState } from "../game/gameEngine";
import { BASE_FOOD_TYPES } from "../game/rules";

assert.deepEqual(
  [[2, 18], [10, 11], [18, 18], [25, 26], [33, 33], [40, 41], [50, 51]].map(pair => getCombineDurationMinutes(...pair)),
  [30, 35, 40, 45, 50, 55, 60]
);
assert.equal(getReduceDurationMinutes(0), 45);
assert.equal(getReduceDurationMinutes(1), 60);

const createState = (cards, overrides = {}) => ({
  ...createGameState(cards, {dayCycleEnabled: true}),
  ...overrides
});
const normalReduceCards = [
  {value: 6, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 9, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
];
const collectingReduceCards = [
  {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
];

const ordinary = applyAction(createState(normalReduceCards), {type: "reduce", indexes: [0, 1]});
assert.equal(ordinary.latestActionDurationMinutes, 45);
assert.equal(ordinary.dayMinutesElapsed, 45);
assert.equal(ordinary.totalActionMinutes, 45);

const collecting = applyAction(createState(collectingReduceCards), {type: "reduce", indexes: [0, 1]});
assert.equal(collecting.latestActionDurationMinutes, 60);

const repeatedBase = createState(collectingReduceCards, {
  collectionCards: [collecting.collectionCards[0]],
  collectionTimeline: [collecting.collectionTimeline[0]],
  collectionEventId: 1
});
const repeated = applyAction(repeatedBase, {type: "reduce", indexes: [0, 1]});
assert.equal(repeated.score, 0);
assert.equal(repeated.latestActionDurationMinutes, 60, "a zero-point repeated collection still uses removal time");

const heaterBase = createState([{value: 6, foodType: BASE_FOOD_TYPES[0], boardIndex: 0}], {comboCount: 2});
const heated = applyAction(heaterBase, {type: "heater", indexes: [0]});
assert.equal(heated.latestActionDurationMinutes, 30);
assert.equal(heated.dayMinutesElapsed, 30);
assert.equal(heated.totalActionMinutes, 30);
assert.equal(heated.steps, heaterBase.steps + 1, "a successful timed tool still counts as one Step");
assert.equal(heated.comboCount, 2, "tools keep combo behavior unchanged");

const illegal = applyAction(ordinary, {type: "reduce", indexes: [0, 8]});
assert.equal(illegal, ordinary);
assert.equal(illegal.totalActionMinutes, 45);

const overtime45Base = createState(normalReduceCards, {
  steps: 23,
  score: 98,
  dayMinutesElapsed: 1420,
  totalActionMinutes: 1420
});
const overtime45 = applyAction(overtime45Base, {type: "reduce", indexes: [0, 1]});
assert.equal(getDayTime(overtime45), "24:25");
assert.equal(overtime45.daySettlement.minutesToday, 1465);
assert.equal(overtime45.daySettlement.scoreGainToday, 100);
assert.equal(overtime45.daySettlement.efficiency, 100 / 1465 * 60);

const overtime60Base = createState(collectingReduceCards, {
  steps: 23,
  score: 100,
  comboCount: 1,
  dayMinutesElapsed: 1430,
  totalActionMinutes: 1430
});
const overtime60 = applyAction(overtime60Base, {type: "reduce", indexes: [0, 1]});
assert.equal(getDayTime(overtime60), "24:50");
assert.equal(overtime60.daySettlement.minutesToday, 1490);
assert.equal(overtime60.comboCount, 2);
assert.equal(overtime60.latestComboEvent.comboBonus, 1);
assert.ok(overtime60.daySettlement.scoreGainToday > 100);

const closed = {...overtime45Base, dayMinutesElapsed: 1440};
assert.equal(applyAction(closed, {type: "reduce", indexes: [0, 1]}), closed, "an action cannot start at 24:00");

const dayTwo = advanceToNextDay(overtime45);
assert.equal(dayTwo.dayMinutesElapsed, 0);
assert.equal(getDayTime(dayTwo), "00:00");
assert.equal(dayTwo.totalActionMinutes, 1465, "cross-day clock reset does not reset total action minutes");

const weekEnd = applyAction({...overtime60Base, day: 7, score: 700}, {type: "reduce", indexes: [0, 1]});
assert.equal(weekEnd.gameOverReason, "week_complete");
assert.equal(weekEnd.day, 7);
assert.equal(advanceToNextDay(weekEnd), weekEnd);

console.log("action duration tests passed");
