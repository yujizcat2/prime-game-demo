import assert from "node:assert/strict";
import {
  applyAction,
  createGameState,
  getBoardCount,
  resolveGameOver
} from "../game/gameEngine";
import {
  createEmptyEightPalaceKeys,
  getEightPalaceKeyCount,
  GAME_MODES
} from "../game/eightPalaceKeys";
import {
  BASE_FOOD_TYPES,
  FOOD_TYPES
} from "../game/rules";


const opening = (first, second) => [
  {...first, boardIndex: 0},
  {...second, boardIndex: 1}
];

const createTypedState = values => {
  const state = createGameState(values);
  state.board = state.board.map((piece, index) => piece ? {...piece, foodType: values[index].foodType} : null);
  return state;
};

const reduce = (first, second) => applyAction(
  createTypedState(opening(first, second)),
  {type: "reduce", indexes: [0, 1]}
);

const sameType = reduce(
  {value: 6, foodType: FOOD_TYPES.LAND},
  {value: 3, foodType: FOOD_TYPES.LAND}
);
assert.equal(sameType.board[0].value, 2);
assert.equal(sameType.board[1], null);
assert.equal(getEightPalaceKeyCount(sameType.eightPalaceKeys), 1);
assert.equal(sameType.latestEightPalaceKey.foodType,FOOD_TYPES.LAND);
const claimed=sameType;

const crossType = reduce(
  {value: 6, foodType: FOOD_TYPES.AQUATIC},
  {value: 3, foodType: FOOD_TYPES.LAND}
);
assert.equal(crossType.board[0].value, 2);
assert.equal(crossType.board[1], null);
assert.equal(getEightPalaceKeyCount(crossType.eightPalaceKeys), 0);

const bothOne = reduce(
  {value: 7, foodType: FOOD_TYPES.FRUIT},
  {value: 7, foodType: FOOD_TYPES.FRUIT}
);
assert.equal(bothOne.board[0],null);
assert.equal(bothOne.board[1],null);
assert.equal(bothOne.eightPalaceKeys[FOOD_TYPES.FRUIT],null);

const simpleBase=createTypedState([
  {...opening({value:6,foodType:FOOD_TYPES.DAIRY_EGG},{value:3,foodType:FOOD_TYPES.DAIRY_EGG})[0],gameMode:GAME_MODES.SIMPLE_EIGHT_PALACE,targetFoodTypes:[FOOD_TYPES.DAIRY_EGG,FOOD_TYPES.FRUIT]},
  opening({value:6,foodType:FOOD_TYPES.DAIRY_EGG},{value:3,foodType:FOOD_TYPES.DAIRY_EGG})[1]
]);
const simpleResult=applyAction(simpleBase,{type:"reduce",indexes:[0,1]});
assert.equal(simpleResult.board[1],null);
assert.equal(simpleResult.eightPalaceKeys[FOOD_TYPES.DAIRY_EGG].value,1);

const noOne = reduce(
  {value: 6, foodType: FOOD_TYPES.LAND},
  {value: 4, foodType: FOOD_TYPES.LAND}
);
assert.equal(noOne.board[0].value, 3);
assert.equal(noOne.board[1].value, 2);
assert.equal(getEightPalaceKeyCount(noOne.eightPalaceKeys), 0);

const duplicateBase = createTypedState(opening(
  {value: 10, foodType: FOOD_TYPES.LAND},
  {value: 5, foodType: FOOD_TYPES.LAND}
));
const duplicateResult = applyAction(
  {...duplicateBase, eightPalaceKeys: claimed.eightPalaceKeys},
  {type: "reduce", indexes: [0, 1]}
);
assert.equal(getEightPalaceKeyCount(duplicateResult.eightPalaceKeys), 1);
assert.equal(duplicateResult.eightPalaceKeys[FOOD_TYPES.LAND].value, 1);
assert.equal(duplicateResult.latestEightPalaceKey,null);

const base = createTypedState(opening(
  {value: 2, foodType: FOOD_TYPES.LAND},
  {value: 3, foodType: FOOD_TYPES.AQUATIC}
));
const sevenKeys = Object.fromEntries(
  BASE_FOOD_TYPES.map((foodType, index) => [
    foodType,
    index < 7 ? {foodType, value: 2, parents: null, parentFoods: null} : null
  ])
);
const allKeys = Object.fromEntries(
  BASE_FOOD_TYPES.map(foodType => [
    foodType,
    {foodType, value: 2, parents: null, parentFoods: null}
  ])
);
const onePieceBoard = [base.board[0], null, null, null, null, null, null, null, null];
const twoPieceBoard = [...base.board];
const threePieceBoard = [...base.board];
threePieceBoard[2] = {...base.board[0], id: 3, value: 5};

const clearedWithoutKeys = resolveGameOver({
  ...base,
  board: onePieceBoard,
  eightPalaceKeys: sevenKeys,
  gameOver: false,
  gameOverReason: null
});
assert.equal(getBoardCount(clearedWithoutKeys.board) <= 2, true);
assert.equal(clearedWithoutKeys.gameOver, true);
assert.equal(clearedWithoutKeys.gameOverReason, "no_legal_actions");

const keysWithoutClear = resolveGameOver({
  ...base,
  board: threePieceBoard,
  eightPalaceKeys: allKeys,
  gameOver: false,
  gameOverReason: null
});
assert.equal(keysWithoutClear.gameOver, false);

const trueClear = resolveGameOver({
  ...base,
  board: twoPieceBoard,
  eightPalaceKeys: allKeys,
  gameOver: false,
  gameOverReason: null
});
assert.equal(trueClear.gameOver, false, "keys and a small board no longer end Eight Palace");

assert.deepEqual(createEmptyEightPalaceKeys(), Object.fromEntries(
  BASE_FOOD_TYPES.map(foodType => [foodType, null])
));
console.log("eight palace key tests passed");
