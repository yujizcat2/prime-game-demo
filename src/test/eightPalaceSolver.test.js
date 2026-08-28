import assert from "node:assert/strict";
import {
  createEightPalaceBoardKey,
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
  maxActions: 0
});
assert.equal(fixed.results.length, 2);
assert.deepEqual(fixed.results[0].initialOpening, fixed.results[1].initialOpening);
assert.notEqual(fixed.results[0].initialOpening, fixed.results[1].initialOpening);
assert.equal(fixed.results.every(attempt => attempt.steps === 0 && attempt.finalKeyCount === 0), true);
console.log("eight palace solver tests passed");
