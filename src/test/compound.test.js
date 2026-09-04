import assert from "node:assert/strict";
import { COMPOUND_EDGES, canCompoundCells, compoundCells, getCompoundType } from "../game/compound";
import { canCombineCells, canReduceCells, getLegalActions } from "../game/gameEngine";
import { isHeaterTarget } from "../game/heaterPricing";
import { applyMazeTurn } from "../game/mazeEngine";
import { getRestoreOutcome } from "../game/restore";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ActionButtons from "../components/ActionButtons";
import BoardCell from "../components/BoardCell";
import { COMPOUND_COOKING_LABELS, getCompoundDisplayName, getCompoundParentSignature } from "../components/compoundDisplay";

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
  value: 4,
  parentNames: ["羊肉", "香菇"],
  parentValues: [7, 11]
});
assert.equal(horizontal.board[1], null);
assert.equal(getCompoundDisplayName(horizontal.board[0]), "羊肉炒香菇");
assert.equal(getCompoundParentSignature(horizontal.board[0]), "羊肉7 ◇ 香菇11");
assert.deepEqual(COMPOUND_COOKING_LABELS, {
  A: "炒", B: "煎", C: "蒸", D: "烧", E: "烤", F: "焖",
  G: "炖", H: "烩", I: "拌", J: "煮", K: "卤", L: "炸"
});

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

const disabledButtons = renderToStaticMarkup(React.createElement(ActionButtons, {
  selected: [], preview: null, gameOver: false
}));
assert.match(disabledButtons, /disabled=""[^>]*>[\s\S]*复合/);

const activeButtons = renderToStaticMarkup(React.createElement(ActionButtons, {
  selected: [1, 2], preview: {compound: {compoundType: "A", value: 4}},
  onCompound: () => {}, gameOver: false
}));
const compoundButton = activeButtons.match(/<button[^>]*action-toolbar-button--compound-active[^>]*>[\s\S]*?复合[\s\S]*?<\/button>/)?.[0];
assert.ok(compoundButton);
assert.doesNotMatch(compoundButton, /disabled/);

const compoundCard = renderToStaticMarkup(React.createElement(BoardCell, {
  index: 0,
  piece: horizontal.board[0]
}));
assert.match(compoundCard, /复合系/);
assert.match(compoundCard, /A4/);
assert.match(compoundCard, /羊肉炒香菇/);
assert.match(compoundCard, /羊肉7 ◇ 香菇11/);
assert.doesNotMatch(compoundCard, /原 · 陆产/);

console.log("compound V0 tests passed");
