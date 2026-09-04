import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection, getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import {
  getBaseScore,
  getCollectionScoreGain,
  getCollectionScoreParameters,
  getNonDrinkBoardSum,
  getRawBaseScore
} from "../game/scoreValue";

for(const [sum, exponent, rate] of [
  [0, 1.30, 0.10], [450, 1.35, 0.15], [900, 1.40, 0.20], [1200, 1.40, 0.20]
]){
  const parameters = getCollectionScoreParameters(sum);
  assert.ok(Math.abs(parameters.exponent - exponent) < 1e-12);
  assert.ok(Math.abs(parameters.firstDiscoveryRate - rate) < 1e-12);
}

assert.equal(getNonDrinkBoardSum([
  null,
  {value: 120, foodType: BASE_FOOD_TYPES[0]},
  {value: 800, foodType: FOOD_TYPES.DRINK},
  {value: 50, foodType: BASE_FOOD_TYPES[1]},
  {value: 7, foodType: "meat"},
  {value: 99, foodType: "special"},
  {foodType: BASE_FOOD_TYPES[2]}
]), 177, "only finite-valued normal cuisines count toward S");

for(const sum of [0, 225, 450, 675, 900, 1200]){
  for(let value = 2; value < 101; value++){
    assert.ok(getBaseScore(value + 1, sum) > getBaseScore(value, sum), `score is strictly increasing at S=${sum}, x=${value}`);
  }
}

assert.equal(getBaseScore(13, 450), Math.round(Math.pow(13, 1.35) + 100));
assert.equal(getBaseScore(12, 450), Math.round(Math.pow(12, 1.35) + 100));

const card = (value, foodType) => ({value, foodType});
const raw = getRawBaseScore(29, 450);
assert.equal(getCollectionScoreGain([], 29, BASE_FOOD_TYPES[0], 450), Math.round(raw * 1.15));
assert.equal(getCollectionScoreGain([card(29, BASE_FOOD_TYPES[0])], 29, BASE_FOOD_TYPES[1], 450), Math.round(raw * 0.5));
assert.equal(getCollectionScoreGain([card(29, BASE_FOOD_TYPES[0])], 29, BASE_FOOD_TYPES[0], 450), 0);
assert.equal(getCollectionScoreGain([], 29, BASE_FOOD_TYPES[0], 450, true), Math.round(raw * 0.5));

const collectible = (value, foodType, singleFlavorPenalty = false) => ({
  value: 1, foodType, singleFlavorPenalty,
  origin: {type: "reduce", parent: {value, foodType, singleFlavorPenalty, origin: null}}
});
const state = createGameState([{value: 450, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"}]);
const piece = collectible(29, BASE_FOOD_TYPES[1]);
const preview = getEightPalaceCollectionScoreGain(state, piece);
const settled = applyEightPalaceCollection(state, piece);
assert.equal(preview, settled.latestCollection.totalScore, "UI preview and settlement use the same authority");
assert.equal(settled.latestCollection.collectionScore, Math.round(raw * 1.15));
assert.equal(settled.latestCollection.totalScore, settled.latestCollection.collectionScore + settled.latestCollection.newFoodTypeBonus);
assert.equal(settled.latestCollection.abundanceBonusScore, undefined);
assert.equal(settled.latestCollection.boardPowerBonus, undefined);

const repeatedPreview = getEightPalaceCollectionScoreGain(settled, piece);
assert.equal(repeatedPreview, 0, "an already collected number and food type previews +0 points");

const boardCellSource = readFileSync("src/components/BoardCell.jsx", "utf8");
assert.match(boardCellSource, /board-piece-available-score/);
assert.match(boardCellSource, /`\+\$\{availableScore\}分`/);
assert.equal(boardCellSource.includes(String.fromCodePoint(165)), false);

console.log("score value tests passed");
