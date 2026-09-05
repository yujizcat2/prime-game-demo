import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { createCombineOutcome, createReduceOutcome } from "../game/gameActions";
import { FOOD_TYPES } from "../game/rules";
import { getDayTargetScore } from "../game/dayCycle";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import { applyCuisineScoreMultiplier, getCuisineSequenceIndex, scaleScore } from "../game/scoreScale";

assert.ok(createGameState([2, 3, 4]).board.filter(Boolean).every(piece => piece.value >= 2 && piece.value <= 9));
assert.equal(createGameState([{value: 101, foodType: FOOD_TYPES.LAND, boardIndex: 0}]).board[0].value, 101);

const combinedState = createGameState([
  {value: 7, foodType: FOOD_TYPES.LAND, boardIndex: 0},
  {value: 8, foodType: FOOD_TYPES.FRUIT, boardIndex: 1}
]);
assert.equal(createCombineOutcome(combinedState, 0, 1).value, 15);

const reducedState = createGameState([
  {value: 20, foodType: FOOD_TYPES.LAND, boardIndex: 0},
  {value: 10, foodType: FOOD_TYPES.FRUIT, boardIndex: 1}
]);
assert.deepEqual(createReduceOutcome(reducedState, 0, 1).results.map(piece => piece.value), [2, 1]);

assert.equal(scaleScore(10), 100);
assert.equal(scaleScore(112), 1120);
assert.equal(getDayTargetScore(1), 1000);
assert.equal(applyCuisineScoreMultiplier(100, 1), 100);
assert.equal(applyCuisineScoreMultiplier(100, 2), 50);
assert.equal(applyCuisineScoreMultiplier(100, 7), 50);
assert.equal(applyCuisineScoreMultiplier(100, 8), 500);
assert.equal(getCuisineSequenceIndex(Array(7).fill({foodType: FOOD_TYPES.LAND}), FOOD_TYPES.LAND), 8);
assert.equal(combinedState.board[0].value, 7, "积分倍率不改变盘面料理数字");
const secondCollection = createCollectionRewardSettlement({
  collectionCards: [], value: 7, foodType: FOOD_TYPES.LAND, name: "test", cuisineSequenceIndex: 2
});
assert.equal(secondCollection.value, 7);
assert.equal(secondCollection.preMultiplierScore, 100);
assert.equal(secondCollection.totalScore, 50);

console.log("score scale tests passed");
