import assert from "node:assert/strict";

import {
  getBasePrice,
  getBoardPrices,
  getCurrentPrice,
  getLiquidity,
  getRepeatPenalty,
  getTrend
} from "../game/price";

import {
  applyCollection,
  applyCollections
} from "../game/collectionRules";

import {
  ACTION_FATIGUE_WINDOW,
  appendRecentActionSignature,
  createCombineActionSignature,
  createReduceActionSignature,
  getActionFatigue,
  getFatiguedFirstReward,
  getFatiguedRepeatPenalty
} from "../game/actionFatigue";

import {
  createGameState
} from "../game/gameState";

import {
  reduceCells
} from "../game/gameActions";

import {
  applySimulationAction,
  createSimulationState
} from "./simulationEngine";


function boardOf(...values){
  return values.map(value => value == null ? null : {value});
}


function collectionPiece(value, foodType = "meat"){
  return {
    value: 1,
    foodType,
    purity: "pure",
    origin: {
      type: "reduce",
      parent: {
        value,
        foodType,
        purity: "pure",
        parents: null,
        parentFoods: null,
        origin: null
      }
    }
  };
}


function gameState(board){
  return {
    board,
    collection: [],
    collectionFoodTypeHistory: [],
    collectionOrigins: {},
    collectionPaths: {},
    collectionParents: {},
    latestCollection: null,
    score: 0,
    money: 0,
    previousCollection: null,
    trend: 1
  };
}


assert.equal(getBasePrice(2), 11, "prime base price");
assert.equal(getBasePrice(101), 50, "upper prime base price");
assert.equal(getBasePrice(12), 25, "composite exponent pricing");

const busyBoard = boardOf(2, 4, 3);
const thinBoard = boardOf(2, 3);
assert.ok(getLiquidity(6, busyBoard) < getLiquidity(6, thinBoard));
assert.ok(getCurrentPrice(6, busyBoard) < getCurrentPrice(6, thinBoard));

assert.equal(getTrend(null, 47), 1);
assert.equal(getTrend(47, 26), 0.895);
assert.equal(getTrend(26, 47), 1);
assert.equal(getTrend(101, 2), 0.7);

const combineSignature = createCombineActionSignature(3, 6, 9);
assert.equal(combineSignature, "C:3|6>9");
assert.equal(createCombineActionSignature(6, 3, 9), combineSignature, "combine parents are normalized");
assert.notEqual(createCombineActionSignature(4, 5, 9), combineSignature, "different math routes do not share fatigue");
assert.equal(createReduceActionSignature(9, 3, 3, 1), "R:3|9>1|3");
assert.deepEqual(getActionFatigue([], combineSignature), {
  signature: combineSignature,
  fatigueCount: 0,
  fatigueRate: 0
});
assert.equal(getActionFatigue([combineSignature], combineSignature).fatigueRate, 0.1);
assert.equal(getActionFatigue(Array(8).fill(combineSignature), combineSignature).fatigueRate, 0.5);

let fatigueWindow = [];
fatigueWindow = appendRecentActionSignature(fatigueWindow, combineSignature);
for(let index = 0; index < ACTION_FATIGUE_WINDOW; index++){
  fatigueWindow = appendRecentActionSignature(fatigueWindow, `C:${index}|${index + 1}>${index * 2 + 1}`);
}
assert.equal(fatigueWindow.includes(combineSignature), false, "fatigue recovers after the old action leaves 20 Steps");

const initialBoard = boardOf(10, 20, 3);
let state = gameState(initialBoard);
const firstPrice = getCurrentPrice(10, initialBoard, 1);
state = applyCollection(state, collectionPiece(10, "meat"));
assert.equal(state.money, firstPrice, "first collection earns current price");
assert.equal(state.latestCollection.reward, firstPrice);

state = applyCollection(state, collectionPiece(10, "vegetable"));
assert.equal(state.money, firstPrice * 2, "same number in a new food slot earns its price");
assert.equal(state.latestCollection.reward, firstPrice);
assert.equal(state.previousCollection, 10, "repeat does not change trend history");

state = applyCollection(state, collectionPiece(10, "vegetable"));
const repeatPenalty = getRepeatPenalty(firstPrice);
assert.equal(state.money, firstPrice * 2 - repeatPenalty, "same number and food type pays penalty");
assert.equal(state.latestCollection.reward, -repeatPenalty);
assert.equal(state.trend, 1, "repeat penalty does not change Trend");

const pricedBoard = [
  {value: 10, foodType: "meat"},
  {value: 10, foodType: "vegetable"}
];
const displayedPrices = getBoardPrices(pricedBoard, 1, {
  10: {meat: [{}]}
});
assert.equal(displayedPrices[0], -repeatPenalty, "collected number and type displays its penalty");
assert.ok(displayedPrices[1] > 0, "uncollected type keeps its live price");
assert.equal(
  getBoardPrices([...pricedBoard, {value: 20, foodType: "seasoning"}], 1, {
    10: {meat: [{}]}
  })[0],
  -getRepeatPenalty(getCurrentPrice(10, [...pricedBoard, {value: 20, foodType: "seasoning"}], 1)),
  "collected slot follows its current theoretical penalty"
);

const beforeBoard = boardOf(14, 28, 7);
const afterBoard = boardOf(7);
let timingState = gameState(afterBoard);
timingState.collectionPricingBoard = beforeBoard;
const beforePrice = getCurrentPrice(14, beforeBoard, 1);
assert.notEqual(beforePrice, getCurrentPrice(14, afterBoard, 1));
timingState = applyCollection(timingState, collectionPiece(14));
assert.equal(timingState.money, beforePrice, "settlement uses pre-change board price");

const batchBoard = [
  {value: 55, foodType: "meat"},
  {value: 55, foodType: "vegetable"}
];
const batchState = {
  board: batchBoard,
  collection: new Set(),
  collectionNumbers: new Set(),
  collectionFoodTypeHistory: [],
  lastCollectionEvents: [],
  money: 0,
  previousCollection: 101,
  trend: 0.72
};
const batchPrice = getCurrentPrice(55, batchBoard, 0.72);
const formalBatchState = {
  ...gameState(batchBoard),
  previousCollection: 101,
  trend: 0.72
};
const formalBatchSettled = applyCollections(
  formalBatchState,
  [collectionPiece(55, "meat"), collectionPiece(55, "vegetable")],
  batchBoard
);
assert.equal(formalBatchSettled.money, batchPrice * 2, "formal game uses locked batch price");
assert.equal(formalBatchSettled.trend, getTrend(101, 55), "formal game commits Trend after batch");

const settledBatch = applyCollections(
  batchState,
  [
    {...collectionPiece(55, "meat"), origin: null, previousValue: 55},
    {...collectionPiece(55, "vegetable"), origin: null, previousValue: 55}
  ],
  batchBoard
);
assert.deepEqual(
  settledBatch.lastCollectionEvents.map(event => event.trendBefore),
  [0.72, 0.72],
  "same action collections use one locked pre-action Trend"
);
assert.deepEqual(
  settledBatch.lastCollectionEvents.map(event => event.liquidity),
  [getLiquidity(55, batchBoard), getLiquidity(55, batchBoard)],
  "same action collections use one locked liquidity context"
);
assert.deepEqual(
  settledBatch.lastCollectionEvents.map(event => event.price),
  [batchPrice, batchPrice],
  "same action collections use one locked price context"
);
assert.equal(settledBatch.money, batchPrice * 2);
assert.equal(settledBatch.trend, getTrend(101, 55), "Trend updates after batch settlement");

const repeatedBatch = {
  ...batchState,
  collection: new Set(["55:meat"]),
  collectionNumbers: new Set([55]),
  lastCollectionEvents: [],
  money: 0
};
const repeatedSettled = applyCollections(
  repeatedBatch,
  [
    {...collectionPiece(55, "meat"), origin: null, previousValue: 55},
    {...collectionPiece(55, "vegetable"), origin: null, previousValue: 55}
  ],
  batchBoard
);
assert.deepEqual(
  repeatedSettled.lastCollectionEvents.map(event => event.reward),
  [-getRepeatPenalty(batchPrice), batchPrice],
  "mixed repeat and first collection use the locked batch price"
);
assert.deepEqual(
  repeatedSettled.lastCollectionEvents.map(event => event.price),
  [batchPrice, batchPrice],
  "mixed repeat and first collection share one theoretical price context"
);
assert.equal(
  repeatedSettled.money,
  batchPrice - getRepeatPenalty(batchPrice),
  "mixed batch commits one atomic net money result"
);
assert.equal(repeatedSettled.trend, 0.72, "repeat and new type of known number do not change Trend");

const lowBalanceState = {
  ...gameState(initialBoard),
  collection: [10],
  collectionPaths: {10: {meat: [{}]}},
  money: 6,
  previousCollection: 10,
  trend: 0.83
};
const differentParentsPiece = collectionPiece(10, "meat");
differentParentsPiece.origin.parent.parents = [3, 7];
const lowBalanceSettled = applyCollection(lowBalanceState, differentParentsPiece);
assert.equal(lowBalanceSettled.money, 0, "penalty cannot make money negative");
assert.equal(lowBalanceSettled.latestCollection.reward, -6, "feedback uses actual affordable deduction");
assert.equal(lowBalanceSettled.trend, 0.83, "repeat with different parents keeps Trend unchanged");

function sourcedCollectionPiece(value, foodType, sourceKey){
  return {
    ...collectionPiece(value, foodType),
    origin: null,
    previousValue: value,
    sourceKey
  };
}

const twinBoard = [
  {value: 43, foodType: "seasoning", sourceKey: "21|22"},
  {value: 43, foodType: "meat", sourceKey: "21|22"}
];
const twinPrice = getCurrentPrice(43, twinBoard, 1);
const freshSimulationMoneyState = board => ({
  board,
  collection: new Set(),
  collectionNumbers: new Set(),
  collectionFoodTypeHistory: [],
  lastCollectionEvents: [],
  money: 0,
  previousCollection: null,
  trend: 1
});
const sameSourceSettled = applyCollections(
  freshSimulationMoneyState(twinBoard),
  [
    sourcedCollectionPiece(43, "seasoning", "21|22"),
    sourcedCollectionPiece(43, "meat", "21|22")
  ],
  twinBoard
);
assert.deepEqual(
  sameSourceSettled.lastCollectionEvents.map(event => [event.reward, event.sameSourceRepeat]),
  [[twinPrice, undefined], [-getRepeatPenalty(twinPrice), true]],
  "same-source twins yield once and penalize the second once"
);
assert.deepEqual(
  [...sameSourceSettled.collection],
  ["43:seasoning"],
  "forced same-source repeat does not permanently fill the second slot"
);
const formalSameSourceSettled = applyCollections(
  gameState(twinBoard),
  [
    Object.assign(collectionPiece(43, "seasoning"), {sourceKey: "21|22"}),
    Object.assign(collectionPiece(43, "meat"), {sourceKey: "21|22"})
  ],
  twinBoard
);
assert.equal(
  formalSameSourceSettled.money,
  twinPrice - getRepeatPenalty(twinPrice),
  "formal game uses the shared same-source settlement"
);
assert.equal(formalSameSourceSettled.collectionPaths[43]?.meat, undefined);

const differentSourceSettled = applyCollections(
  freshSimulationMoneyState([{value: 53}, {value: 53}]),
  [
    sourcedCollectionPiece(53, "seasoning", "12|41"),
    sourcedCollectionPiece(53, "meat", "24|29")
  ],
  [{value: 53}, {value: 53}]
);
const differentSourcePrice = getCurrentPrice(53, [{value: 53}, {value: 53}], 1);
assert.deepEqual(
  differentSourceSettled.lastCollectionEvents.map(event => event.reward),
  [differentSourcePrice, differentSourcePrice],
  "different-source twins retain full double earnings"
);

const collectedSameSource = applyCollections(
  {
    ...batchState,
    board: twinBoard,
    collection: new Set(["43:seasoning", "43:meat"]),
    collectionNumbers: new Set([43]),
    lastCollectionEvents: [],
    money: 100,
    previousCollection: 43,
    trend: 1
  },
  [
    sourcedCollectionPiece(43, "seasoning", "21|22"),
    sourcedCollectionPiece(43, "meat", "21|22")
  ],
  twinBoard
);
assert.deepEqual(
  collectedSameSource.lastCollectionEvents.map(event => event.reward),
  [-getRepeatPenalty(twinPrice), -getRepeatPenalty(twinPrice)],
  "collected and same-source status never stack more than one penalty per item"
);

const fatiguePrice = getCurrentPrice(10, initialBoard, 1);
const fatiguedFirst = applyCollections(
  {
    ...freshSimulationMoneyState(initialBoard),
    actionFatigue: {signature: combineSignature, fatigueCount: 5, fatigueRate: 0.5}
  },
  [{...collectionPiece(10, "meat"), origin: null, previousValue: 10}],
  initialBoard
);
assert.equal(
  fatiguedFirst.lastCollectionEvents[0].reward,
  getFatiguedFirstReward(fatiguePrice, 0.5),
  "first collection fatigue bottoms out at 50% Price"
);
assert.ok(fatiguedFirst.lastCollectionEvents[0].reward > 0);

const fatiguedRepeat = applyCollections(
  {
    ...freshSimulationMoneyState(initialBoard),
    collection: new Set(["10:meat"]),
    collectionNumbers: new Set([10]),
    money: 100,
    previousCollection: 10,
    trend: 0.83,
    actionFatigue: {signature: combineSignature, fatigueCount: 5, fatigueRate: 0.5}
  },
  [{...collectionPiece(10, "meat"), origin: null, previousValue: 10}],
  initialBoard
);
const fatiguedRepeatPrice = getCurrentPrice(10, initialBoard, 0.83);
assert.equal(
  fatiguedRepeat.lastCollectionEvents[0].reward,
  -getFatiguedRepeatPenalty(fatiguedRepeatPrice, 0.5),
  "repeat penalty grows to at most 100% Price"
);
assert.equal(fatiguedRepeat.trend, 0.83, "fatigue does not alter Trend");

const fatiguedSameSource = applyCollections(
  {
    ...freshSimulationMoneyState(twinBoard),
    money: 100,
    actionFatigue: {signature: "R:43|43>1|1", fatigueCount: 5, fatigueRate: 0.5}
  },
  [
    sourcedCollectionPiece(43, "seasoning", "21|22"),
    sourcedCollectionPiece(43, "meat", "21|22")
  ],
  twinBoard
);
assert.equal(
  fatiguedSameSource.lastCollectionEvents[1].reward,
  -twinPrice,
  "same-source repeat plus fatigue never exceeds 100% Price"
);

const formalFatigueState = createGameState([3, 9, 2]);
formalFatigueState.recentActionSignatures = ["R:3|9>1|3"];
const simulationFatigueState = createSimulationState([3, 9, 2]);
simulationFatigueState.recentActionSignatures = ["R:3|9>1|3"];
const formalFatigueResult = reduceCells(formalFatigueState, 0, 1);
applySimulationAction(simulationFatigueState, {type: "reduce", indexes: [0, 1]});
assert.equal(
  formalFatigueResult.money,
  simulationFatigueState.money,
  "formal game and MONEY simulation share fatigue settlement"
);
assert.equal(formalFatigueResult.latestCollection,null);
assert.equal(simulationFatigueState.lastCollectionEvents.length,0);
assert.equal(formalFatigueResult.board[0].specialOne.kind,"function");
assert.equal(simulationFatigueState.board[0],null);

console.log("Money system regression cases: 33 passed");
