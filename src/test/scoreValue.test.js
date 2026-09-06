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
    46,
    `selection ${selectedIndexes.join(",") || "none"} does not change the current collection preview`
  );
}
const porkCollected = applyEightPalaceCollection(
  porkPreviewState,
  {value: 1, origin: {type: "reduce", parent: pork}}
);
assert.equal(porkCollected.score - porkPreviewState.score, 46, "preview matches formal settlement: round(50 × 1.15 × 0.80)");
const porkCardPrice = getEightPalaceCollectionBaseSalePrice(
  porkPreviewState,
  {value: 1, origin: {type: "reduce", parent: pork}}
);
assert.equal(porkCardPrice, 50, "main card shows the same-item discounted base price");
assert.notEqual(porkCardPrice, 46, "main card does not include time or route multipliers");

const matchingState = createGameState([
  {value: 8, foodType: aquatic, boardIndex: 0, gameMode: "eightPalace"},
  {value: 8, foodType: land, boardIndex: 1, gameMode: "eightPalace"}
]);
for(const selectedIndexes of [[], [0], [0, 1]]){
  assert.deepEqual(
    matchingState.board.slice(0, 2).map(getFoodCardDisplayValue),
    [8, 8],
    `matching cards keep state values before confirmation (${selectedIndexes.length} selected)`
  );
}
const processedMatchingState = applyAction(matchingState, {type: "reduce", indexes: [0, 1]});
assert.deepEqual(processedMatchingState.board.slice(0, 2), [null, null], "only the confirmed equal reduction changes the board");

const routePiece = collectible(5, fruit);
routePiece.origin.parent.origin = {type: "reduce", parent: {value: 35}};
const routeSettled = applyEightPalaceCollection(state, routePiece);
assert.equal(routeSettled.latestCollection.totalScore, 140);
assert.equal(routeSettled.latestCollection.collectionMultiplier, 7);
assert.equal(routeSettled.latestCollection.collectionMultiplierRate, 1.4);

const boardCellSource = readFileSync("src/components/BoardCell.jsx", "utf8");
assert.match(boardCellSource, /board-piece-available-score/);
assert.match(boardCellSource, /`\+\$\{availableScore\}分`/);
const boardSource = readFileSync("src/components/Board.jsx", "utf8");
assert.match(boardSource, /getEightPalaceCollectionBaseSalePrice/);
assert.doesNotMatch(boardSource, /getEightPalaceCollectionScoreGain/);
assert.match(boardSource, /reducePreview\.salePreviewTotal \?\? availableScore/);
assert.doesNotMatch(boardCellSource, />\s*处理中?\s*</);

console.log("score value tests passed");
