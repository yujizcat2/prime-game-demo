import assert from "node:assert/strict";
import {
  applyAction,
  createGameState,
  getBoardCount,
  resolveGameOver
} from "../game/gameEngine";
import {
  createEmptyEightPalaceKeys,
  getEightPalaceKeyCount
} from "../game/eightPalaceKeys";
import {
  BASE_FOOD_TYPES,
  FOOD_TYPES
} from "../game/rules";


const opening = (first, second) => [
  {...first, boardIndex: 0},
  {...second, boardIndex: 1}
];

const reduce = (first, second) => applyAction(
  createGameState(opening(first, second)),
  {type: "reduce", indexes: [0, 1]}
);

const sameType = reduce(
  {value: 6, foodType: FOOD_TYPES.LAND},
  {value: 3, foodType: FOOD_TYPES.LAND}
);
assert.equal(sameType.board[0].value, 2);
assert.equal(sameType.board[1].value, 1);
assert.equal(sameType.board[1].specialOne.kind, "key");
assert.equal(getEightPalaceKeyCount(sameType.eightPalaceKeys), 0);
const claimed=applyAction(sameType,{type:"claim_key",index:1});
assert.equal(claimed.board[1],null);
assert.equal(getEightPalaceKeyCount(claimed.eightPalaceKeys),1);

const crossType = reduce(
  {value: 6, foodType: FOOD_TYPES.AQUATIC},
  {value: 3, foodType: FOOD_TYPES.LAND}
);
assert.equal(crossType.board[0].value, 2);
assert.equal(crossType.board[1].value, 1);
assert.equal(crossType.board[1].specialOne.kind,"function");
assert.equal(getEightPalaceKeyCount(crossType.eightPalaceKeys), 0);

const noOne = reduce(
  {value: 6, foodType: FOOD_TYPES.LAND},
  {value: 4, foodType: FOOD_TYPES.LAND}
);
assert.equal(noOne.board[0].value, 3);
assert.equal(noOne.board[1].value, 2);
assert.equal(getEightPalaceKeyCount(noOne.eightPalaceKeys), 0);

const duplicateBase = createGameState(opening(
  {value: 10, foodType: FOOD_TYPES.LAND},
  {value: 5, foodType: FOOD_TYPES.LAND}
));
const duplicateResult = applyAction(
  {...duplicateBase, eightPalaceKeys: claimed.eightPalaceKeys},
  {type: "reduce", indexes: [0, 1]}
);
assert.equal(getEightPalaceKeyCount(duplicateResult.eightPalaceKeys), 1);
assert.equal(duplicateResult.eightPalaceKeys[FOOD_TYPES.LAND].value, 1);

const base = createGameState(opening(
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
assert.equal(clearedWithoutKeys.gameOverReason, "eight_palace_keys_missing");

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
assert.equal(trueClear.gameOver, true);
assert.equal(trueClear.gameOverReason, "eight_palace_cleared");

assert.deepEqual(createEmptyEightPalaceKeys(), Object.fromEntries(
  BASE_FOOD_TYPES.map(foodType => [foodType, null])
));
console.log("eight palace key tests passed");
