import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ActionButtons from "../components/ActionButtons";
import BoardCell from "../components/BoardCell";
import { getCompoundDisplayName, getCompoundParentSignature } from "../components/compoundDisplay";
import {
  canCompoundCells,
  compoundCells,
  getCompoundRecombination,
  isCompoundPiece
} from "../game/compound";
import { canCombineCells, canReduceCells, getLegalActions } from "../game/gameEngine";
import { getBoardCount } from "../game/boardRules";
import { getNativeFoodType } from "../game/nativeFoodTypes";
import { getNonDrinkBoardSum } from "../game/scoreValue";
import { getNextSelectionIndexes } from "../game/selection";

function createLifecycleState(){
  const board = Array(9).fill(null);
  board[0] = {id: 1, value: 31, foodType: "land", purity: "pure"};
  board[1] = {id: 2, value: 14, foodType: "aquatic", purity: "pure"};
  board[3] = {id: 3, value: 22, foodType: "vegetable", purity: "pure"};
  board[4] = {id: 4, value: 11, foodType: "seasoning", purity: "pure"};
  return {board, gameOver: false, daySettlement: null, score: 0, money: 0, steps: 0};
}

const initial = createLifecycleState();
const initialSum = getNonDrinkBoardSum(initial.board);
const firstBound = compoundCells(initial, 0, 1);
assert.equal(firstBound.board[0].value, 31);
assert.equal(firstBound.board[1].value, 14);
assert.equal(isCompoundPiece(firstBound.board[0]), true);
assert.equal(isCompoundPiece(firstBound.board[1]), false);
assert.deepEqual(firstBound.board[0].compoundPartner, {
  id: 2, index: 1, value: 14, foodType: "aquatic", purity: "pure"
});
assert.equal(getBoardCount(firstBound.board), 4);
assert.equal(getNonDrinkBoardSum(firstBound.board), initialSum);

const twoGroups = compoundCells(firstBound, 3, 4);
assert.equal(isCompoundPiece(twoGroups.board[0]), true);
assert.equal(isCompoundPiece(twoGroups.board[3]), true);
assert.equal(twoGroups.board[1].value, 14);
assert.equal(twoGroups.board[4].value, 11);
assert.equal(getNonDrinkBoardSum(twoGroups.board), 78);

const preview = getCompoundRecombination(twoGroups, 0, 3);
assert.deepEqual(preview, {
  kind: "recombine",
  firstValue: 42,
  secondValue: 36,
  firstFoodType: getNativeFoodType(0),
  secondFoodType: getNativeFoodType(3),
  consumedIndexes: [1, 4],
  targetIndexes: [0, 3]
});

const recombined = compoundCells(twoGroups, 0, 3);
assert.equal(recombined.board[0].value, 42);
assert.equal(recombined.board[3].value, 36);
assert.equal(recombined.board[0].foodType, getNativeFoodType(0));
assert.equal(recombined.board[3].foodType, getNativeFoodType(3));
assert.notEqual(recombined.board[0].foodType, recombined.board[3].foodType);
assert.equal(isCompoundPiece(recombined.board[0]), false);
assert.equal(isCompoundPiece(recombined.board[3]), false);
assert.equal(recombined.board[1], null);
assert.equal(recombined.board[4], null);
assert.equal(getBoardCount(recombined.board), 2);
assert.equal(getNonDrinkBoardSum(recombined.board), 78);
assert.equal(recombined.board[0].value + recombined.board[3].value, 31 + 14 + 22 + 11);

const alternate = createLifecycleState();
alternate.board[0] = {id: 3, value: 22, foodType: "land", purity: "pure"};
alternate.board[1] = {id: 4, value: 11, foodType: "aquatic", purity: "pure"};
alternate.board[3] = {id: 1, value: 31, foodType: "vegetable", purity: "pure"};
alternate.board[4] = {id: 2, value: 14, foodType: "seasoning", purity: "pure"};
const alternateGroups = compoundCells(compoundCells(alternate, 3, 4), 0, 1);
const alternateResult = compoundCells(alternateGroups, 3, 0);
assert.equal(alternateResult.board[3].value, 42);
assert.equal(alternateResult.board[3].foodType, getNativeFoodType(3));
assert.notEqual(alternateResult.board[3].foodType, recombined.board[0].foodType);

const stalePartner = {
  ...twoGroups,
  board: twoGroups.board.map(piece => piece ? {...piece} : null)
};
stalePartner.board[1].value = 15;
assert.equal(getCompoundRecombination(stalePartner, 0, 3), null);
assert.equal(canCompoundCells(stalePartner, 0, 3), false);
assert.equal(compoundCells(stalePartner, 0, 3), stalePartner);

assert.equal(firstBound.board[0].value, 31);
assert.equal(firstBound.board[1].value, 14);
assert.equal(firstBound.board.filter(Boolean).length, 4);
assert.equal(canCombineCells(twoGroups, 0, 3), false);
assert.equal(canReduceCells(twoGroups, 0, 3), false);
assert.equal(getLegalActions(twoGroups).some(action => action.type === "compound" || action.type === "recombine"), false);
assert.deepEqual(getNextSelectionIndexes(getNextSelectionIndexes([], 0), 3), [0, 3]);

assert.equal(getCompoundParentSignature(firstBound.board[0]), "与14复合");
assert.ok(getCompoundDisplayName(firstBound.board[0]));
const compoundCard = renderToStaticMarkup(React.createElement(BoardCell, {
  index: 0,
  piece: firstBound.board[0],
  selected: true,
  onClick: () => {}
}));
assert.match(compoundCard, /复合系/);
assert.match(compoundCard, />31</);
assert.match(compoundCard, /与14复合/);
assert.match(compoundCard, /board-piece--selected/);

const recombinationButton = renderToStaticMarkup(React.createElement(ActionButtons, {
  selected: [1, 3],
  preview: {compound: preview},
  onCompound: () => {},
  gameOver: false
}));
assert.match(recombinationButton, /重组 陆产42 \/ 谷物36/);
assert.doesNotMatch(recombinationButton, /disabled=""[^>]*title="重组后/);

console.log("compound binding and recombination tests passed");
