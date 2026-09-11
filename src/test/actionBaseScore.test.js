import assert from "node:assert/strict";
import {
  applyAction,
  createGameState,
  doesReduceCreateEffectiveSale,
  getReduceSalePreviewRewards,
  hasEffectiveSaleReward
} from "../game/gameEngine";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getReduceButtonLabel } from "../components/actionButtonLabel";

const createState = (cards, overrides = {}) => ({
  ...createGameState(cards, {dayCycleEnabled: true}),
  heaterCount: 0,
  superHeaterCount: 0,
  ...overrides
});
const dailyCollections = Array.from({length: 8}, (_, index) => ({value: index + 2, foodType: BASE_FOOD_TYPES[index % 2]}));

const combineState = createState([
  {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 3, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
]);
const combined = applyAction(combineState, {type: "combine", indexes: [0, 1]});
assert.equal(combined.score, 0, "combine does not create revenue");
assert.equal(combined.score - combined.dayStartScore, 0);
assert.equal(combined.latestActionBaseScore, null);
assert.equal(combined.comboCount, 0);
assert.equal(combined.comboBonusTotal, 0);

const reduceState = createState([
  {value: 6, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 9, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
]);
const reduced = applyAction(reduceState, {type: "reduce", indexes: [0, 1]});
assert.equal(reduced.score, 0, "ordinary reduce without a collection does not create revenue");
assert.equal(reduced.score - reduced.dayStartScore, 0);
assert.equal(reduced.collectionCards.length, 0);
assert.equal(reduced.latestActionBaseScore, null);
assert.equal(reduced.comboCount, 0);
assert.equal(reduced.comboBonusTotal, 0);
assert.equal(getReduceButtonLabel([], null), "处理");
assert.equal(getReduceButtonLabel([0], null), "处理");
assert.equal(doesReduceCreateEffectiveSale(reduceState, [0, 1]), false);
assert.equal(
  getReduceButtonLabel([0, 1], {reduce: {createsEffectiveSale: false}}),
  "处理",
  "ordinary reduction keeps the processing label"
);

const collectionState = createState([
  {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1}
], {comboCount: 1});
const collected = applyAction(collectionState, {type: "reduce", indexes: [0, 1]});
assert.equal(collected.collectionCards.length, 0);
assert.equal(collected.board[0].value,1);
assert.equal(collected.latestActionBaseScore, null, "a reduce-to-finished action does not receive sale points");
assert.equal(doesReduceCreateEffectiveSale(collectionState, [0, 1]), false);
assert.deepEqual(getReduceSalePreviewRewards(collectionState, [0, 1]),[]);
assert.equal(
  getReduceButtonLabel([0, 1], {reduce: {createsEffectiveSale: true}}),
  "处理",
  "processing remains separate from selling"
);

const duplicateSaleState = {
  ...collectionState,
  collectionCards: [{value: 2, foodType: BASE_FOOD_TYPES[0]}]
};
assert.equal(
  doesReduceCreateEffectiveSale(duplicateSaleState, [0, 1]),
  false,
  "a reduce-to-one duplicate with zero formal sale value stays processing"
);

const equalEliminateState = createState([
  {value: 8, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 8, foodType: BASE_FOOD_TYPES[0], boardIndex: 1}
]);
assert.equal(doesReduceCreateEffectiveSale(equalEliminateState, [0, 1]), false, "equal-value processing is not presented as a sale");

const bonusCollections = Array.from({length: 10}, (_, index) => ({
  value: index + 20,
  foodType: BASE_FOOD_TYPES[index % 2]
}));
const bonusPreviewState = {...collectionState, collectionCards: bonusCollections};
assert.deepEqual(getReduceSalePreviewRewards(bonusPreviewState, [0, 1]),[]);

assert.equal(hasEffectiveSaleReward([
  {duplicate: true, saleScore: 0},
  {duplicate: false, saleScore: 100}
]), true, "one positive formal result is enough for a multi-result sale label");
assert.equal(hasEffectiveSaleReward([
  {duplicate: true, saleScore: 0},
  {duplicate: false, saleScore: 0}
]), false, "all zero formal results keep the processing label");

assert.equal(applyAction(combineState, {type: "combine", indexes: [0, 8]}), combineState);
assert.equal(applyAction(reduceState, {type: "reduce", indexes: [0, 8]}), reduceState);

const closingCombine = applyAction({...combineState, score: 990, steps: 23, dayMinutesElapsed: 1410, collectionCards: dailyCollections}, {type: "combine", indexes: [0, 1]});
assert.equal(closingCombine.score, 990);
assert.equal(closingCombine.daySettlement.dailyRevenue, 0);
assert.equal(closingCombine.daySettlement.passed, false);

const closingReduce = applyAction({...reduceState, score: 980, steps: 23, dayMinutesElapsed: 1395, collectionCards: dailyCollections}, {type: "reduce", indexes: [0, 1]});
assert.equal(closingReduce.score, 980);
assert.equal(closingReduce.daySettlement.dailyRevenue, 0);
assert.equal(closingReduce.daySettlement.passed, false);

console.log("action base score tests passed");
