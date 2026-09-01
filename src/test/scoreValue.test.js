import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { BASE_FOOD_TYPES } from "../game/rules";
import {
  BASE_SCORE_BANDS,
  SCORE_SCALE,
  getBaseScore,
  getCollectionScoreGain,
  getCreatedScoreValue
} from "../game/scoreValue";

const allowedScores = new Set([10, 20, 30, 40, 50, 60, 70, 80]);
const mappedEntries = Object.entries(BASE_SCORE_BANDS).flatMap(([score, values]) =>
  values.map(value => [value, Number(score)])
);
const mappedNumbers = mappedEntries.map(([value]) => value);

assert.equal(mappedEntries.length, 100, "the table has exactly one entry for every number from 2 through 101");
assert.equal(new Set(mappedNumbers).size, 100, "the table contains no duplicate number mappings");
assert.deepEqual([...mappedNumbers].sort((a, b) => a - b), Array.from({length: 100}, (_, index) => index + 2));
assert.ok(mappedEntries.every(([, score]) => allowedScores.has(score)), "only the eight formal scores are used");
assert.deepEqual(BASE_SCORE_BANDS[80], [101], "101 is the unique 80-point number");
assert.deepEqual(
  [2, 3, 11, 13, 29, 43, 59, 79, 100, 101].map(getBaseScore),
  [100, 100, 200, 300, 400, 500, 600, 700, 700, 800]
);
assert.equal(SCORE_SCALE, 10);
assert.equal(getCreatedScoreValue(29, {origin: {type: "combine"}}, {origin: {type: "combine"}}), 400);
for(const [value, originalScore] of mappedEntries){
  assert.equal(getBaseScore(value), originalScore * SCORE_SCALE, "every legacy base score is scaled uniformly");
}

const stateWithBoard = () => {
  const state = createGameState([{value: 7, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"}]);
  return {...state, gameOver: false, board: [...state.board]};
};
const collectible = (value, foodType, scoreValue = 999) => ({
  value: 1,
  foodType,
  origin: {type: "reduce", parent: {value, foodType, scoreValue, origin: null}}
});
const collect = (state, value, foodType) => applyEightPalaceCollection(state, collectible(value, foodType));

let state = stateWithBoard();
state = collect(state, 29, BASE_FOOD_TYPES[0]);
assert.equal(state.latestCollection.baseScore, 400, "first collection of a number earns 100% base score");
state = collect(state, 29, BASE_FOOD_TYPES[1]);
assert.equal(state.latestCollection.baseScore, 200, "second food type earns 50% base score");
state = collect(state, 29, BASE_FOOD_TYPES[2]);
assert.equal(state.latestCollection.baseScore, 200, "third food type still earns 50% base score");
for(const foodType of BASE_FOOD_TYPES.slice(3)){
  state = collect(state, 29, foodType);
  assert.equal(state.latestCollection.baseScore, 200, "every later new food type still earns 50% base score");
}
assert.equal(state.score, 1842, "scaled base score plus small integer bonuses are awarded");
assert.equal(state.collectionTimeline.reduce((sum, event) => sum + event.scoreGain, 0), state.score);

const beforeDuplicate = state.score;
state = collect(state, 29, BASE_FOOD_TYPES[0]);
assert.equal(state.latestCollection.baseScore, 0, "same number and food type earns zero");
assert.equal(state.score, beforeDuplicate);

let separateNumbers = stateWithBoard();
separateNumbers = collect(separateNumbers, 29, BASE_FOOD_TYPES[0]);
separateNumbers = collect(separateNumbers, 43, BASE_FOOD_TYPES[0]);
assert.deepEqual(separateNumbers.collectionTimeline.map(event => event.baseScore), [400, 500]);

let oneOhOne = stateWithBoard();
for(const foodType of BASE_FOOD_TYPES) oneOhOne = collect(oneOhOne, 101, foodType);
assert.deepEqual(oneOhOne.collectionTimeline.slice(0, 2).map(event => event.baseScore), [800, 400]);
assert.equal(oneOhOne.score, 3642, "scaled base score and small collection bonuses are both included");

let edgeBands = stateWithBoard();
edgeBands = collect(edgeBands, 2, BASE_FOOD_TYPES[0]);
edgeBands = collect(edgeBands, 2, BASE_FOOD_TYPES[1]);
edgeBands = collect(edgeBands, 79, BASE_FOOD_TYPES[0]);
edgeBands = collect(edgeBands, 79, BASE_FOOD_TYPES[1]);
assert.deepEqual(edgeBands.collectionTimeline.map(event => event.baseScore), [100, 50, 700, 350]);

const previewCards = separateNumbers.collectionCards;
const previewGain = getCollectionScoreGain(previewCards, 29, BASE_FOOD_TYPES[1]);
const previewSettled = collect(separateNumbers, 29, BASE_FOOD_TYPES[1]);
assert.equal(previewGain, previewSettled.latestCollection.baseScore, "UI preview exposes only the formal base scorer");
assert.match(readFileSync("src/components/Board.jsx", "utf8"), /scorePreview = availableScore/);

console.log("score value tests passed");
