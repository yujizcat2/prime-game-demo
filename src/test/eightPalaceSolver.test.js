import assert from "node:assert/strict";
import {
  createEightPalaceBoardKey,
  runEightPalaceGame
} from "./eightPalaceSolver";
import { BASE_FOOD_TYPES } from "../game/rules";

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
const solved = await runEightPalaceGame({
  initialOpening: easyOpening,
  depth: 3,
  beamWidth: 20,
  maxActions: 20
});
assert.equal(solved.success, true);
assert.ok(solved.finalBoardCount <= 2);
assert.ok(solved.actionPath.length > 0);
console.log("eight palace solver tests passed");
