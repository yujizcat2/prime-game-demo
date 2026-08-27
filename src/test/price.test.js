import assert from "node:assert/strict";

import {
  getBasePrice,
  getBoardPrices,
  getCurrentPrice,
  getLiquidity,
  getTrend
} from "../game/price";

import {
  applyCollection
} from "../game/collectionRules";


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
assert.equal(state.money, firstPrice * 2, "same number and food type earns zero");
assert.equal(state.latestCollection.reward, 0);

const pricedBoard = [
  {value: 10, foodType: "meat"},
  {value: 10, foodType: "vegetable"}
];
const displayedPrices = getBoardPrices(pricedBoard, 1, {
  10: {meat: [{}]}
});
assert.equal(displayedPrices[0], 0, "collected number and type stays at zero");
assert.ok(displayedPrices[1] > 0, "uncollected type keeps its live price");
assert.equal(
  getBoardPrices([...pricedBoard, {value: 20, foodType: "seasoning"}], 1, {
    10: {meat: [{}]}
  })[0],
  0,
  "collected slot remains zero after board liquidity changes"
);

const beforeBoard = boardOf(14, 28, 7);
const afterBoard = boardOf(7);
let timingState = gameState(afterBoard);
timingState.collectionPricingBoard = beforeBoard;
const beforePrice = getCurrentPrice(14, beforeBoard, 1);
assert.notEqual(beforePrice, getCurrentPrice(14, afterBoard, 1));
timingState = applyCollection(timingState, collectionPiece(14));
assert.equal(timingState.money, beforePrice, "settlement uses pre-change board price");

console.log("Money system regression cases: 6 passed");
