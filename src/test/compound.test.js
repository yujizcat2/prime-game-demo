import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ActionButtons from "../components/ActionButtons";
import BoardCell from "../components/BoardCell";
import { getFoodCardDisplayName, getFoodOriginDescription } from "../components/foodCardDisplay";
import {
  getCompoundDisplayName,
  getCompoundDisplayValue,
  getCompoundParentSignature
} from "../components/compoundDisplay";
import {
  canCompoundCells,
  COMPOUND_COOKING_METHODS,
  compoundCells,
  getCompoundRecombination,
  isCompoundPiece
} from "../game/compound";
import { canCombineCells, canReduceCells, getLegalActions } from "../game/gameEngine";
import { getBoardCount } from "../game/boardRules";
import { getNativeFoodType } from "../game/nativeFoodTypes";
import { getNonDrinkBoardSum } from "../game/scoreValue";
import { getNextSelectionIndexes } from "../game/selection";
import { getFoodName } from "../data/food/foodRegistry";

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
const illegalFirstCompound = compoundCells(initial, 0, 4);
assert.equal(illegalFirstCompound, initial);
assert.equal(illegalFirstCompound.steps, 0);
const firstBound = compoundCells(initial, 0, 1);
assert.equal(firstBound.board[0].value, 31);
assert.equal(firstBound.board[1], null);
assert.equal(isCompoundPiece(firstBound.board[0]), true);
assert.deepEqual(firstBound.board[0].compoundPartner, {
  id: 2, index: 1, value: 14, foodType: "aquatic", purity: "pure", name: "虾鱼饼"
});
assert.equal(getBoardCount(firstBound.board), 3);
assert.equal(firstBound.steps, 1);
assert.equal(firstBound.board[0].value + firstBound.board[0].compoundPartner.value, 45);
assert.equal(initialSum, 78);

const namedBoard = Array(9).fill(null);
namedBoard[0] = {id: 10, value: 3, foodType: "aquatic", purity: "pure", displayName: "青蟹"};
namedBoard[1] = {id: 11, value: 8, foodType: "dairyEgg", purity: "pure", displayName: "皮蛋"};
const namedState = compoundCells({board: namedBoard, gameOver: false, steps: 0}, 0, 1);
const namedCompound = namedState.board[0];
assert.equal(COMPOUND_COOKING_METHODS.A, "炒");
assert.deepEqual(COMPOUND_COOKING_METHODS, {
  A: "炒", B: "煎", C: "蒸", D: "烧", E: "烤", F: "焖",
  G: "炖", H: "烩", I: "拌", J: "煮", K: "卤", L: "炸"
});
assert.equal(namedCompound.value, 3);
assert.notEqual(namedCompound.value, Math.abs(3 - 8));
assert.equal(namedCompound.isCompound, true);
assert.equal(namedCompound.compoundPartner.value, 8);
assert.equal(namedCompound.compoundCookingMethod, "炒");
assert.equal(namedCompound.compoundDishName, "青蟹炒皮蛋");
assert.equal(namedCompound.compoundType, "A");
assert.equal(COMPOUND_COOKING_METHODS[namedCompound.compoundType], namedCompound.compoundCookingMethod);
assert.equal(getCompoundDisplayName(namedCompound), "青蟹炒皮蛋");
assert.equal(getCompoundParentSignature(namedCompound), "青蟹3 × 皮蛋8");
assert.equal(getCompoundDisplayValue(namedCompound), 11);
assert.equal(namedState.board[1], null);
assert.equal(namedState.steps, 1);

const displayValuePiece = {
  value: 20,
  foodType: "aquatic",
  displayName: "虾鱼糕",
  compoundPartner: {value: 13, foodType: "aquatic", name: "鲈鱼"}
};
assert.equal(getCompoundDisplayValue(displayValuePiece), 33);
assert.equal(displayValuePiece.value, 20);
assert.equal(displayValuePiece.compoundPartner.value, 13);
assert.equal(getCompoundParentSignature(displayValuePiece), "虾鱼糕20 × 鲈鱼13");

const twoGroups = compoundCells(firstBound, 3, 4);
assert.equal(isCompoundPiece(twoGroups.board[0]), true);
assert.equal(isCompoundPiece(twoGroups.board[3]), true);
assert.equal(twoGroups.board[1], null);
assert.equal(twoGroups.board[4], null);
assert.equal(twoGroups.steps, 2);

const preview = getCompoundRecombination(twoGroups, 0, 3);
assert.deepEqual(preview, {
  kind: "recombine",
  firstValue: 6,
  secondValue: 72,
  firstFoodType: getNativeFoodType(0),
  secondFoodType: getNativeFoodType(3),
  targetIndexes: [0, 3]
});

const recombined = compoundCells(twoGroups, 0, 3);
assert.equal(recombined.board[0].value, 6);
assert.equal(recombined.board[3].value, 72);
assert.notDeepEqual([recombined.board[0].value, recombined.board[3].value], [42, 36]);
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
assert.equal(recombined.steps, 3);

const alternate = createLifecycleState();
alternate.board[0] = {id: 3, value: 22, foodType: "land", purity: "pure"};
alternate.board[1] = {id: 4, value: 11, foodType: "aquatic", purity: "pure"};
alternate.board[3] = {id: 1, value: 31, foodType: "vegetable", purity: "pure"};
alternate.board[4] = {id: 2, value: 14, foodType: "seasoning", purity: "pure"};
const alternateGroups = compoundCells(compoundCells(alternate, 3, 4), 0, 1);
const alternateResult = compoundCells(alternateGroups, 3, 0);
assert.equal(alternateResult.board[3].value, 6);
assert.equal(alternateResult.board[3].foodType, getNativeFoodType(3));
assert.notEqual(alternateResult.board[3].foodType, recombined.board[0].foodType);

const smallBoard = Array(9).fill(null);
smallBoard[0] = {id: 20, value: 3, foodType: "land", purity: "pure"};
smallBoard[1] = {id: 21, value: 8, foodType: "aquatic", purity: "pure"};
smallBoard[3] = {id: 22, value: 15, foodType: "vegetable", purity: "pure"};
smallBoard[4] = {id: 23, value: 5, foodType: "seasoning", purity: "pure"};
const smallGroups = compoundCells(compoundCells({board: smallBoard, gameOver: false}, 0, 1), 3, 4);
assert.equal(canCompoundCells(smallGroups, 0, 3), true);
const smallResult = compoundCells(smallGroups, 0, 3);
assert.equal(smallResult.board[0].value, 15);
assert.equal(smallResult.board[3].value, 16);
assert.equal(smallResult.board[1], null);
assert.equal(smallResult.board[4], null);
assert.equal(getNonDrinkBoardSum(smallResult.board), 31);
assert.equal(smallResult.steps, 3);
for(const piece of [smallResult.board[0], smallResult.board[3]]){
  assert.equal(piece.isCompound, undefined);
  assert.equal(piece.compoundPartner, undefined);
  assert.equal(piece.compoundType, undefined);
  assert.equal(piece.compoundCookingMethod, undefined);
  assert.equal(piece.compoundDishName, undefined);
}

const zeroDifferenceBoard = Array(9).fill(null);
zeroDifferenceBoard[0] = {id: 30, value: 10, foodType: "land", purity: "pure"};
zeroDifferenceBoard[1] = {id: 31, value: 5, foodType: "aquatic", purity: "pure"};
zeroDifferenceBoard[3] = {id: 32, value: 8, foodType: "vegetable", purity: "pure"};
zeroDifferenceBoard[4] = {id: 33, value: 3, foodType: "seasoning", purity: "pure"};
const zeroDifferenceGroups = compoundCells(
  compoundCells({board: zeroDifferenceBoard, gameOver: false}, 0, 1),
  3,
  4
);
assert.equal(getCompoundRecombination(zeroDifferenceGroups, 0, 3), null);
assert.equal(canCompoundCells(zeroDifferenceGroups, 0, 3), false);
assert.equal(compoundCells(zeroDifferenceGroups, 0, 3), zeroDifferenceGroups);
assert.equal(zeroDifferenceGroups.board.some(piece => piece?.value === 0), false);

const missingStoredPartner = {
  ...twoGroups,
  board: twoGroups.board.map(piece => piece ? {...piece} : null)
};
delete missingStoredPartner.board[0].compoundPartner;
assert.equal(getCompoundRecombination(missingStoredPartner, 0, 3), null);
assert.equal(canCompoundCells(missingStoredPartner, 0, 3), false);
assert.equal(compoundCells(missingStoredPartner, 0, 3), missingStoredPartner);
assert.equal(missingStoredPartner.steps, 2);

assert.equal(firstBound.board[0].value, 31);
assert.equal(firstBound.board[1], null);
assert.equal(firstBound.board.filter(Boolean).length, 3);
assert.equal(canCombineCells(twoGroups, 0, 3), false);
assert.equal(canReduceCells(twoGroups, 0, 3), false);
assert.equal(getLegalActions(twoGroups).some(action => action.type === "compound" || action.type === "recombine"), false);
assert.deepEqual(getNextSelectionIndexes(getNextSelectionIndexes([], 0), 3), [0, 3]);

assert.match(getCompoundParentSignature(firstBound.board[0]), /31 × 虾鱼饼14/);
assert.ok(getCompoundDisplayName(firstBound.board[0]));
const compoundCard = renderToStaticMarkup(React.createElement(BoardCell, {
  index: 0,
  piece: firstBound.board[0],
  selected: true,
  onClick: () => {}
}));
assert.match(compoundCard, />复合系</);
assert.doesNotMatch(compoundCard, /复合系 · A/);
assert.match(compoundCard, /board-piece-compound-letter">A</);
assert.match(compoundCard, /board-piece-compound-letter">A<\/span><span>45/);
assert.match(compoundCard, /31 × 虾鱼饼14/);
assert.match(compoundCard, /board-piece--selected/);

const typeBCard = renderToStaticMarkup(React.createElement(BoardCell, {
  index: 1,
  piece: {
    value: 20,
    foodType: "aquatic",
    isCompound: true,
    compoundType: "B",
    compoundDishName: "青柠煎柠檬",
    compoundPartner: {value: 8, foodType: "fruit", name: "柠檬"}
  },
  onClick: () => {}
}));
assert.match(typeBCard, />复合系</);
assert.doesNotMatch(typeBCard, /复合系 · B/);
assert.match(typeBCard, /board-piece-compound-letter">B<\/span><span>28/);

const recombinedCard = renderToStaticMarkup(React.createElement(BoardCell, {
  index: 0,
  piece: recombined.board[0],
  onClick: () => {}
}));
assert.doesNotMatch(recombinedCard, /复合系 · [A-L]/);
assert.doesNotMatch(recombinedCard, /board-piece-compound-letter/);

const namedResultBoard = Array(9).fill(null);
namedResultBoard[0] = {id: 40, value: 3, foodType: "land", purity: "pure"};
namedResultBoard[1] = {id: 41, value: 8, foodType: "aquatic", purity: "pure"};
namedResultBoard[3] = {id: 42, value: 4, foodType: "vegetable", purity: "pure"};
namedResultBoard[4] = {id: 43, value: 7, foodType: "seasoning", purity: "pure"};
const namedResultGroups = compoundCells(
  compoundCells({board: namedResultBoard, gameOver: false, steps: 0}, 0, 1),
  3,
  4
);
const namedResults = compoundCells(namedResultGroups, 0, 3);
const valueTwoResult = namedResults.board[0];
const otherNamedResult = namedResults.board[3];
assert.equal(valueTwoResult.isCompound, undefined);
assert.equal(valueTwoResult.value, 2);
assert.equal(valueTwoResult.foodType, getNativeFoodType(0));
assert.equal(valueTwoResult.name, getFoodName(2, getNativeFoodType(0)));
assert.equal(valueTwoResult.displayName, getFoodName(2, getNativeFoodType(0)));
assert.notEqual(valueTwoResult.name, "2");
assert.equal(getFoodCardDisplayName(valueTwoResult), getFoodName(2, getNativeFoodType(0)));
assert.notEqual(getFoodOriginDescription(valueTwoResult), "一种原生的2");
assert.equal(otherNamedResult.value, 20);
assert.equal(otherNamedResult.foodType, getNativeFoodType(3));
assert.equal(otherNamedResult.name, getFoodName(20, getNativeFoodType(3)));
assert.notEqual(otherNamedResult.name, "20");

const recombinationButton = renderToStaticMarkup(React.createElement(ActionButtons, {
  selected: [1, 3],
  preview: {compound: preview},
  onCompound: () => {},
  gameOver: false
}));
assert.match(recombinationButton, /重组 陆产6 \/ 谷物72/);
assert.doesNotMatch(recombinationButton, /disabled=""[^>]*title="重组后/);

console.log("compound binding and recombination tests passed");
