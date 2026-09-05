import assert from "node:assert/strict";
import { applyAction, createGameState } from "../game/gameEngine";
import { BASE_FOOD_TYPES } from "../game/rules";

const createState = (cards, overrides = {}) => ({
  ...createGameState(cards, {dayCycleEnabled: true}),
  heaterCount: 0,
  restoreCount: 0,
  superHeaterCount: 0,
  ...overrides
});

const combineState = createState([
  {value: 20, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 30, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
]);
const combined = applyAction(combineState, {type: "combine", indexes: [0, 1]});
assert.equal(combined.score, 1);
assert.equal(combined.score - combined.dayStartScore, 1, "combine score enters today's revenue immediately");
assert.equal(combined.latestActionBaseScore.score, 1);
assert.equal(combined.comboCount, 0);
assert.equal(combined.comboBonusTotal, 0);

const reduceState = createState([
  {value: 60, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 90, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
]);
const reduced = applyAction(reduceState, {type: "reduce", indexes: [0, 1]});
assert.equal(reduced.score, 2);
assert.equal(reduced.score - reduced.dayStartScore, 2, "ordinary reduce score enters today's revenue immediately");
assert.equal(reduced.collectionCards.length, 0);
assert.equal(reduced.latestActionBaseScore.score, 2);
assert.equal(reduced.comboCount, 0);
assert.equal(reduced.comboBonusTotal, 0);

const collectionState = createState([
  {value: 20, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 40, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
], {comboCount: 1});
const collected = applyAction(collectionState, {type: "reduce", indexes: [0, 1]});
assert.equal(collected.collectionCards.length, 1);
assert.equal(collected.latestActionBaseScore, null, "a collecting reduce does not also receive +2");
assert.equal(collected.comboCount, 2, "collection scoring keeps the existing combo behavior");
assert.equal(collected.latestComboEvent.comboBonus, 1);
assert.equal(collected.score, collected.collectionCards[0].scoreGain);

assert.equal(applyAction(combineState, {type: "combine", indexes: [0, 8]}), combineState);
assert.equal(applyAction(reduceState, {type: "reduce", indexes: [0, 8]}), reduceState);

const closingCombine = applyAction({...combineState, score: 99, steps: 23, dayMinutesElapsed: 1410}, {type: "combine", indexes: [0, 1]});
assert.equal(closingCombine.score, 100);
assert.equal(closingCombine.daySettlement.scoreGainToday, 100);
assert.equal(closingCombine.daySettlement.passed, true);

const closingReduce = applyAction({...reduceState, score: 98, steps: 23, dayMinutesElapsed: 1395}, {type: "reduce", indexes: [0, 1]});
assert.equal(closingReduce.score, 100);
assert.equal(closingReduce.daySettlement.scoreGainToday, 100);
assert.equal(closingReduce.daySettlement.passed, true);

console.log("action base score tests passed");
