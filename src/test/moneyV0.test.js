import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import {
  applyCollections,
  applyEightPalaceCollection
} from "../game/collectionRules";
import { createSimulationState } from "./simulationEngine";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore } from "../game/scoreValue";

const [land, aquatic] = BASE_FOOD_TYPES;
const opening = [
  {value: 6, foodType: land, boardIndex: 0, gameMode: "eightPalace"},
  {value: 10, foodType: aquatic, boardIndex: 1, gameMode: "eightPalace"}
];
const collectible = (value, foodType) => ({
  value: 1,
  foodType,
  previousValue: value,
  origin: {
    type: "reduce",
    parent: {value, foodType, scoreValue: getBaseScore(value), origin: null}
  }
});

const sevenLand = collectible(7, land);
const sevenAquatic = collectible(7, aquatic);
const elevenLand = collectible(11, land);

const initial = createGameState(opening);
assert.equal(initial.money, 0, "initial money is zero");

const first = applyEightPalaceCollection(initial, sevenLand);
assert.equal(first.money, 10, "first slot earns 10");
assert.equal(first.latestCollection.isNewCollection, true);

const repeated = applyEightPalaceCollection(first, sevenLand);
assert.equal(repeated.money, 10, "same value and foodType earns zero");
assert.equal(repeated.latestCollection.moneyGain, 0);
assert.equal(repeated.latestCollection.isNewCollection, false);

const differentType = applyEightPalaceCollection(repeated, sevenAquatic);
assert.equal(differentType.money, 20, "same value and different foodType is a new slot");

const twoNew = applyCollections(initial, [sevenLand, sevenAquatic]);
assert.equal(twoNew.money, 20, "two new slots in one action earn 20");

const oneNewOneRepeat = applyCollections(first, [sevenLand, elevenLand]);
assert.equal(oneNewOneRepeat.money, 20, "one new and one repeat earn 10");

const twoRepeats = applyCollections(twoNew, [sevenLand, sevenAquatic]);
assert.equal(twoRepeats.money, 20, "two repeats earn zero");

assert.equal(createGameState(opening).money, 0, "new game resets money");

const simulation = applyCollections(
  createSimulationState([2, 3, 5]),
  [sevenLand, sevenLand, sevenAquatic]
);
const formal = applyCollections(
  createGameState([2, 3, 5]),
  [sevenLand, sevenLand, sevenAquatic]
);
assert.equal(simulation.money, formal.money, "formal and simulation engines settle the same money");
assert.equal(simulation.money, 20);

const scoreBeforeMoneyChecks = initial.score;
assert.equal(
  twoNew.score,
  scoreBeforeMoneyChecks + twoNew.collectionTimeline.reduce((sum, event) => sum + event.totalScore, 0),
  "collection score includes base score and newly revealed bonuses"
);
assert.equal(twoRepeats.score, twoNew.score, "duplicate money events do not change score");

assert.deepEqual(
  twoRepeats.collectionTimeline.map(event => ({
    isNewCollection: event.isNewCollection,
    moneyGain: event.moneyGain,
    cumulativeMoney: event.cumulativeMoney
  })),
  [
    {isNewCollection: true, moneyGain: 10, cumulativeMoney: 10},
    {isNewCollection: true, moneyGain: 10, cumulativeMoney: 20},
    {isNewCollection: false, moneyGain: 0, cumulativeMoney: 20},
    {isNewCollection: false, moneyGain: 0, cumulativeMoney: 20}
  ]
);

console.log("Money V0 tests passed");
