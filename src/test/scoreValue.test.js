import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection, getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore, getCollectionScoreGain } from "../game/scoreValue";

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
assert.equal(getCollectionScoreGain([card(37, aquatic)], 37, land), 200, "second type loses five");
assert.equal(getCollectionScoreGain([card(37, aquatic), card(37, land)], 37, fruit), 150, "third type loses another five");
assert.equal(getCollectionScoreGain([card(37, aquatic)], 37, aquatic), 0, "same number and type is a duplicate");
assert.equal(getCollectionScoreGain(BASE_FOOD_TYPES.map(type => card(2, type)), 2, "drink"), 0, "score never drops below zero");
assert.equal(getCollectionScoreGain([], 37, aquatic, 900, true), 250, "board sum and legacy penalty do not affect score");

const collectible = (value, foodType) => ({
  value: 1, foodType,
  origin: {type: "reduce", parent: {value, foodType, origin: null}}
});
const state = createGameState([{value: 450, foodType: aquatic, boardIndex: 0, gameMode: "eightPalace"}]);
const piece = collectible(29, land);
const preview = getEightPalaceCollectionScoreGain(state, piece);
const settled = applyEightPalaceCollection(state, piece);
assert.equal(preview, 200);
assert.equal(preview, settled.latestCollection.totalScore, "preview and settlement use the same authority");
assert.equal(settled.latestCollection.bonusScore, 0);
assert.deepEqual(settled.latestCollection.bonuses, []);

const repeatedPreview = getEightPalaceCollectionScoreGain(settled, piece);
assert.equal(repeatedPreview, 0);

const boardCellSource = readFileSync("src/components/BoardCell.jsx", "utf8");
assert.match(boardCellSource, /board-piece-available-score/);
assert.match(boardCellSource, /`\+\$\{availableScore\}分`/);

console.log("score value tests passed");
