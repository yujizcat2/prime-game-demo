import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyAction, createGameState } from "../game/gameEngine";
import {
  applyEightPalaceCollection,
  getEightPalaceCollectionBaseSalePrice,
  getEightPalaceCollectionScoreGain
} from "../game/collectionRules";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore, getCollectionScoreGain } from "../game/scoreValue";
import { getFoodCardDisplayValue } from "../components/foodCardDisplay";

for(const [minimum, maximum, expected] of [
  [2, 9, 100], [10, 19, 150], [20, 29, 200], [30, 39, 250],
  [40, 49, 300], [50, 59, 350], [60, 69, 400], [70, 79, 450],
  [80, 89, 500], [90, 99, 550], [100, 101, 600]
]){
  assert.equal(getBaseScore(minimum), expected);
  assert.equal(getBaseScore(maximum), expected);
}

const card = (value, foodType) => ({value, foodType});
const [aquatic, land, fruit] = BASE_FOOD_TYPES;
assert.equal(getCollectionScoreGain([], 37, aquatic), 250, "first type receives the full tier score");
assert.equal(getCollectionScoreGain([card(37, aquatic)], 37, land), 125, "another type receives one same-item half-price");
assert.equal(getCollectionScoreGain([card(37, aquatic), card(37, land)], 37, fruit), 125, "same-item half-price is applied only once");
assert.equal(getCollectionScoreGain([card(37, aquatic)], 37, aquatic), 0, "same number and type is a duplicate");
assert.equal(getCollectionScoreGain(BASE_FOOD_TYPES.map(type => card(2, type)), 2, "drink"), 50, "cross-family history applies one half-price only");
assert.equal(getCollectionScoreGain([], 37, aquatic, 900, true), 250, "board sum and legacy penalty do not affect score");

const collectible = (value, foodType) => ({
  value: 1, foodType,
  origin: {type: "reduce", parent: {value, foodType, origin: null}}
});
const state = createGameState([{value: 450, foodType: aquatic, boardIndex: 0, gameMode: "eightPalace"}]);
state.dayMinutesElapsed = 4 * 60;
const piece = collectible(29, land);
const preview = getEightPalaceCollectionScoreGain(state, piece);
const settled = applyEightPalaceCollection(state, piece);
assert.equal(preview, 200);
assert.equal(preview, settled.latestCollection.totalScore, "preview and settlement use the same authority");
assert.equal(settled.latestCollection.bonusScore, 0);
assert.deepEqual(settled.latestCollection.bonuses, []);

const repeatedPreview = getEightPalaceCollectionScoreGain(settled, piece);
assert.equal(repeatedPreview, 0);

const pork = {
  value: 8,
  foodType: land,
  origin: {type: "reduce", parent: {value: 32, foodType: land, origin: null}}
};
const porkPreviewState = {
  ...state,
  dayMinutesElapsed: 0,
  collectionCards: [{value: 8, foodType: aquatic}]
};
for(const selectedIndexes of [[], [0], [0, 1]]){
  assert.equal(
    getEightPalaceCollectionScoreGain(porkPreviewState, {value: 1, origin: {type: "reduce", parent: pork}}),
    40,
    `selection ${selectedIndexes.join(",") || "none"} does not change the current collection preview`
  );
}
const porkCollected = applyEightPalaceCollection(
  porkPreviewState,
  {value: 1, origin: {type: "reduce", parent: pork}}
);
assert.equal(porkCollected.score - porkPreviewState.score, 40, "preview matches formal settlement: round(50 × 1.00 × 0.80)");
const porkCardPrice = getEightPalaceCollectionBaseSalePrice(
  porkPreviewState,
  {value: 1, origin: {type: "reduce", parent: pork}}
);
assert.equal(porkCardPrice, 50, "main card shows the same-item discounted base price");
assert.notEqual(porkCardPrice, 40, "main card does not include time or reward multipliers");

const matchingState = createGameState([
  {value: 5, foodType: "seasoning", boardIndex: 3, gameMode: "eightPalace"},
  {value: 5, foodType: land, boardIndex: 0, gameMode: "eightPalace"}
]);
for(const selectedIndexes of [[], [0], [0, 1]]){
  assert.deepEqual(
    [matchingState.board[3], matchingState.board[0]].map(getFoodCardDisplayValue),
    [5, 5],
    `matching cards keep state values before confirmation (${selectedIndexes.length} selected)`
  );
}
const processedMatchingState = applyAction(matchingState, {type: "reduce", indexes: [3, 0]});
assert.equal(processedMatchingState.board[3], null, "equal-value processing removes the first card");
assert.equal(processedMatchingState.board[0], null, "equal-value processing removes the second card");
assert.equal(processedMatchingState.collectionCards.length, 0, "equal-value processing does not collect");
assert.equal(processedMatchingState.score, matchingState.score, "equal-value processing produces no revenue");

const reverseMatchingState = createGameState([
  {value: 5, foodType: "seasoning", boardIndex: 3, gameMode: "eightPalace"},
  {value: 5, foodType: "fruit", boardIndex: 0, gameMode: "eightPalace"}
]);
const reverseProcessed = applyAction(reverseMatchingState, {type: "reduce", indexes: [3, 0]});
assert.equal(reverseProcessed.board[3], null,"reversed equal-value processing removes the first card too");
assert.equal(reverseProcessed.board[0], null);

const sameTypeMatchingState = createGameState([
  {value: 7, foodType: "vegetable", boardIndex: 2, gameMode: "eightPalace"},
  {value: 7, foodType: "vegetable", boardIndex: 0, gameMode: "eightPalace"}
]);
const sameTypeProcessed = applyAction(sameTypeMatchingState, {type: "reduce", indexes: [2, 0]});
assert.equal(sameTypeProcessed.board[2], null,"same-type equal cards are both removed");
assert.equal(sameTypeProcessed.board[0], null);

const ordinaryGcdState = createGameState([
  {value: 20, foodType: land, boardIndex: 0, gameMode: "eightPalace"},
  {value: 10, foodType: land, boardIndex: 1, gameMode: "eightPalace"}
]);
const ordinaryGcdProcessed = applyAction(ordinaryGcdState, {type: "reduce", indexes: [0, 1]});
assert.equal(ordinaryGcdProcessed.board[0].value, 2, "different values keep the ordinary gcd result");
assert.equal(ordinaryGcdProcessed.board[1].value, 1, "ordinary reduce-to-one leaves a finished dish");
assert.equal(ordinaryGcdProcessed.collectionCards.length,0);
const ordinarySold=applyAction(ordinaryGcdProcessed,{type:"sell",indexes:[1]});
assert.ok(ordinarySold.collectionCards.some(item => item.value === 10 && item.foodType === land));

for(const [otherValue, expectedLevel, expectedRate] of [
  [10, 2, 1], [15, 3, 1.05], [20, 4, 1.1], [35, 7, 1.25], [60, 12, 1.5], [100, 20, 1.5]
]){
  const rewardState = createGameState([
    {value: otherValue, foodType: land, boardIndex: 0, gameMode: "eightPalace"},
    {value: 5, foodType: fruit, boardIndex: 1, gameMode: "eightPalace"}
  ]);
  const processed = applyAction(rewardState, {type: "reduce", indexes: [0, 1]});
  const sellIndex=processed.board.findIndex(piece=>piece?.value===1);
  const sold=applyAction(processed,{type:"sell",indexes:[sellIndex]});
  assert.equal(sold.latestCollection.collectionRewardLevel, expectedLevel);
  assert.equal(sold.latestCollection.collectionMultiplierRate, expectedRate);
}

const leveledPiece = collectible(5, fruit);
leveledPiece.collectionRewardLevel = 7;
const levelSettled = applyEightPalaceCollection(state, leveledPiece);
assert.equal(levelSettled.latestCollection.totalScore, 125);
assert.equal(levelSettled.latestCollection.collectionRewardLevel, 7);
assert.equal(levelSettled.latestCollection.collectionMultiplierRate, 1.25);

const boardCellSource = readFileSync("src/components/BoardCell.jsx", "utf8");
assert.match(boardCellSource, /board-piece-available-score/);
assert.match(boardCellSource, /`\+\$\{availableScore\}分`/);
const boardSource = readFileSync("src/components/Board.jsx", "utf8");
assert.match(boardSource, /getEightPalaceCollectionBaseSalePrice/);
assert.doesNotMatch(boardSource, /getEightPalaceCollectionScoreGain/);
assert.match(boardSource, /reducePreview\.salePreviewTotal \?\? availableScore/);
assert.doesNotMatch(boardCellSource, />\s*处理中?\s*</);

console.log("score value tests passed");
