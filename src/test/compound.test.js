import assert from "node:assert/strict";
import { COMPOUND_EDGES, canCompoundCells, compoundCells, getCompoundType } from "../game/compound";
import { canCombineCells, canReduceCells, getLegalActions } from "../game/gameEngine";
import { isHeaterTarget } from "../game/heaterPricing";
import { applyMazeTurn } from "../game/mazeEngine";
import { getRestoreOutcome } from "../game/restore";

function stateWith(firstIndex, firstValue, secondIndex, secondValue){
  const board = Array(9).fill(null);
  board[firstIndex] = {id: 1, value: firstValue, foodType: "land"};
  board[secondIndex] = {id: 2, value: secondValue, foodType: "vegetable"};
  return {board, gameOver: false, daySettlement: null};
}

assert.equal(getCompoundType(0, 1), "A");
assert.equal(getCompoundType(0, 3), "G");
assert.equal(getCompoundType(0, 4), null);
assert.deepEqual(COMPOUND_EDGES, {
  "0-1": "A", "1-2": "B", "3-4": "C", "4-5": "D", "6-7": "E", "7-8": "F",
  "0-3": "G", "3-6": "H", "1-4": "I", "4-7": "J", "2-5": "K", "5-8": "L"
});

const horizontal = compoundCells(stateWith(0, 7, 1, 11), 0, 1);
assert.deepEqual(horizontal.board[0], {
  id: 1,
  isCompound: true,
  compoundType: "A",
  value: 4
});
assert.equal(horizontal.board[1], null);

const vertical = compoundCells(stateWith(0, 7, 3, 11), 0, 3);
assert.equal(vertical.board[0].compoundType, "G");
assert.equal(vertical.board[0].value, 4);
assert.equal(vertical.board[3], null);

const diagonal = stateWith(0, 7, 4, 11);
assert.equal(canCompoundCells(diagonal, 0, 4), false);
assert.equal(compoundCells(diagonal, 0, 4), diagonal);

const equal = stateWith(0, 7, 1, 7);
assert.equal(canCompoundCells(equal, 0, 1), false);

horizontal.board[1] = {id: 3, value: 9, foodType: "land"};
assert.equal(canCompoundCells(horizontal, 0, 1), false);
assert.equal(canCombineCells(horizontal, 0, 1), false);
assert.equal(canReduceCells(horizontal, 0, 1), false);
assert.equal(getLegalActions(horizontal).some(action => action.type === "compound"), false);
assert.equal(isHeaterTarget(horizontal.board[0]), false);
assert.equal(getRestoreOutcome(horizontal.board[0], 0), null);
assert.equal(applyMazeTurn(horizontal).board[0].value, 4);

console.log("compound V0 tests passed");
