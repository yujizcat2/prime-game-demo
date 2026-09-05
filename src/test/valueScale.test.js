import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { createCombineOutcome, createReduceOutcome } from "../game/gameActions";
import { FOOD_TYPES } from "../game/rules";
import { applyCuisineSequenceMultiplier, getCuisineSequenceIndex, scaleGameValue } from "../game/valueScale";

assert.equal(scaleGameValue(7), 70);
assert.equal(scaleGameValue(101), 1010);
assert.equal(applyCuisineSequenceMultiplier(70, 1), 70);
assert.equal(applyCuisineSequenceMultiplier(70, 2), 35);
assert.equal(applyCuisineSequenceMultiplier(70, 7), 35);
assert.equal(applyCuisineSequenceMultiplier(70, 8), 350);
assert.equal(Number.isInteger(applyCuisineSequenceMultiplier(70, 2)), true);

const collectionCards = Array.from({length: 7}, (_, index) => ({foodType: FOOD_TYPES.LAND, value: (index + 2) * 10}));
assert.equal(getCuisineSequenceIndex(collectionCards, FOOD_TYPES.LAND), 8);
assert.equal(getCuisineSequenceIndex(collectionCards, FOOD_TYPES.FRUIT), 1);

const state = createGameState([
  {value: 70, foodType: FOOD_TYPES.LAND, boardIndex: 0},
  {value: 180, foodType: FOOD_TYPES.FRUIT, boardIndex: 1}
]);
assert.equal(createCombineOutcome(state, 0, 1).value, 250, "搭配使用放大后的实际值");

const reducible = createGameState([
  {value: 200, foodType: FOOD_TYPES.LAND, boardIndex: 0},
  {value: 100, foodType: FOOD_TYPES.FRUIT, boardIndex: 1}
]);
const reduced = createReduceOutcome(reducible, 0, 1);
assert.equal(reduced.divisor, 10, "GCD 使用原规则在新尺度下的公因数");
assert.deepEqual(reduced.results.map(piece => piece.value), [20, 1]);

console.log("value scale tests passed");
