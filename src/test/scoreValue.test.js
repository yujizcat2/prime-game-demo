import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection, getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore, getCollectionScoreGain } from "../game/scoreValue";

for(const [minimum, maximum, expected] of [
  [2, 9, 10], [10, 19, 15], [20, 29, 20], [30, 39, 25],
  [40, 49, 30], [50, 59, 35], [60, 69, 40], [70, 79, 45],
  [80, 89, 50], [90, 99, 55], [100, 101, 60]
].map(([minimum, maximum, expected]) => [minimum * 10, maximum * 10, expected])){
  assert.equal(getBaseScore(minimum), expected);
  assert.equal(getBaseScore(maximum), expected);
}

const card = (value, foodType) => ({value, foodType});
const [aquatic, land, fruit] = BASE_FOOD_TYPES;
assert.equal(getCollectionScoreGain([], 370, aquatic), 25, "first type receives the full tier score");
assert.equal(getCollectionScoreGain([card(370, aquatic)], 370, land), 20, "second type loses five");
assert.equal(getCollectionScoreGain([card(370, aquatic), card(370, land)], 370, fruit), 15, "third type loses another five");
assert.equal(getCollectionScoreGain([card(370, aquatic)], 370, aquatic), 0, "same number and type is a duplicate");
assert.equal(getCollectionScoreGain(BASE_FOOD_TYPES.map(type => card(20, type)), 20, "drink"), 0, "score never drops below zero");
assert.equal(getCollectionScoreGain([], 370, aquatic, 9000, true), 25, "board sum and legacy penalty do not affect score");

const collectible = (value, foodType) => ({
  value: 1, foodType,
  origin: {type: "reduce", parent: {value, foodType, origin: null}}
});
const state = createGameState([{value: 450, foodType: aquatic, boardIndex: 0, gameMode: "eightPalace"}]);
const piece = collectible(290, land);
const preview = getEightPalaceCollectionScoreGain(state, piece);
const settled = applyEightPalaceCollection(state, piece);
assert.equal(preview, 20);
assert.equal(preview, settled.latestCollection.totalScore, "preview and settlement use the same authority");
assert.equal(settled.latestCollection.bonusScore, 0);
assert.deepEqual(settled.latestCollection.bonuses, []);

const repeatedPreview = getEightPalaceCollectionScoreGain(settled, piece);
assert.equal(repeatedPreview, 0);

const boardCellSource = readFileSync("src/components/BoardCell.jsx", "utf8");
assert.match(boardCellSource, /board-piece-available-score/);
assert.match(boardCellSource, /`\+\$\{availableScore\}分`/);

console.log("score value tests passed");
