import assert from "node:assert/strict";
import {
  createEightPalaceBoardKey,
  describeAction,
  routeSignature,
  runEightPalaceGame,
  runFixedEightPalaceAttempts
} from "./eightPalaceSolver";
import { BASE_FOOD_TYPES } from "../game/rules";
import { createGameState } from "../game/gameEngine";

const result = await runEightPalaceGame({maxActions: 0});

assert.equal(result.initialBoard.length, 9);
assert.equal(result.initialBoard[4], null);
assert.equal(result.initialBoard.filter(Boolean).length, 8);
assert.equal(result.failureReason, "maxActions");
assert.equal(result.actions, 0);
assert.equal(typeof createEightPalaceBoardKey({board: result.initialBoard}), "string");

const outerIndexes = [0, 1, 2, 3, 5, 6, 7, 8];
const easyOpening = outerIndexes.map((boardIndex, index) => ({
  value: 2,
  foodType: BASE_FOOD_TYPES[index],
  boardIndex
}));
const state = createGameState(easyOpening);
const stateWithKey = {
  ...state,
  eightPalaceKeys: {
    ...state.eightPalaceKeys,
    [BASE_FOOD_TYPES[0]]: {
      foodType: BASE_FOOD_TYPES[0],
      value: 2,
      parents: null,
      parentFoods: null
    }
  }
};
assert.notEqual(
  createEightPalaceBoardKey(state),
  createEightPalaceBoardKey(stateWithKey),
  "identical boards with different keys must have different visited keys"
);
const fixed = await runFixedEightPalaceAttempts({
  attempts: 2,
  fixedOpening: easyOpening,
  depth: 1,
  beamWidth: 2,
  maxActions: 1
});
assert.equal(fixed.results.length, 2);
assert.deepEqual(fixed.results[0].initialOpening, fixed.results[1].initialOpening);
assert.notEqual(fixed.results[0].initialOpening, fixed.results[1].initialOpening);
assert.equal(fixed.results.every(attempt => attempt.actionPath.length === attempt.actions), true);
assert.equal(fixed.results.every(attempt => attempt.actionPath.length === 1), true);
assert.equal(fixed.results.every(attempt => attempt.actionPath[0].number === 1), true);
assert.equal(typeof fixed.prematureClearCount,"number");
assert.deepEqual(Object.keys(fixed.extinctMissingTypeCounts).sort(),[...BASE_FOOD_TYPES].sort());
assert.ok(Array.isArray(fixed.lastDrinkConsumedSteps));
assert.ok(Array.isArray(fixed.sevenKeyFailureMissingTypes));
assert.equal(fixed.results.every(attempt=>typeof attempt.prematureClear==="boolean"&&Array.isArray(attempt.extinctMissingTypes)),true);

const actionState=createGameState(easyOpening);
const claimedState={...actionState,board:[...actionState.board],eightPalaceKeys:{...actionState.eightPalaceKeys,[BASE_FOOD_TYPES[0]]:{foodType:BASE_FOOD_TYPES[0],value:1}}};
assert.doesNotThrow(()=>describeAction(actionState,{type:"claim_key",index:0},claimedState));
assert.doesNotThrow(()=>describeAction(actionState,{type:"apply_one",oneIndex:0,targetIndex:1},actionState));
assert.equal(routeSignature({actionPath:[{type:"claim_key",index:6}]}),"claim_key:6");
assert.equal(routeSignature({actionPath:[{type:"apply_one",oneIndex:3,targetIndex:7}]}),"apply_one:3-7");
assert.notEqual(
  routeSignature({actionPath:[{type:"combine_drink_convert",indexes:[1,4],resultFoodType:BASE_FOOD_TYPES[0]}]}),
  routeSignature({actionPath:[{type:"combine_drink_convert",indexes:[1,4],resultFoodType:BASE_FOOD_TYPES[1]}]})
);
console.log("eight palace solver tests passed");
