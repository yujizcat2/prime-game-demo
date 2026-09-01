import assert from "node:assert/strict";
import {
  chooseScoreAction,
  getScoreCandidateActions,
  runScoreGames,
  scoreAITestUtils
} from "../ai/eightPalaceScoreAI";
import { createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { getHeaterCost } from "../game/heater";
import { BASE_FOOD_TYPES } from "../game/rules";

const [land, aquatic] = BASE_FOOD_TYPES;
const createState = (values, money = 0) => {
  const state = createGameState(values.map((value, index) => ({
    value,
    foodType: index ? aquatic : land,
    boardIndex: index,
    gameMode: "simpleEightPalace"
  })));
  return {...state, money};
};

const funded = createState([5, 6], 40);
assert.equal(getScoreCandidateActions(funded).some(action => action.type === "heater"), true);
const heaterActions = getScoreCandidateActions(funded, {allowHeater: true});
assert.equal(heaterActions.filter(action => action.type === "heater").length, 2);
assert.deepEqual(
  heaterActions.filter(action => action.type === "heater").map(action => action.indexes[0]),
  [0, 1]
);

const poor = createState([5, 6], 0);
assert.equal(getScoreCandidateActions(poor, {allowHeater: true}).some(action => action.type === "heater"), false);
const all101 = createState([101, 101], 100);
assert.equal(getScoreCandidateActions(all101, {allowHeater: true}).some(action => action.type === "heater"), false);

const heater = heaterActions.find(action => action.type === "heater" && action.indexes[0] === 0);
const cost = getHeaterCost(funded);
const heated = scoreAITestUtils.applyScoreAction(funded, heater);
assert.equal(heated.board[0].value, 6);
assert.equal(heated.money, funded.money - cost);
assert.equal(heated.steps, funded.steps);
assert.equal(heated.score, funded.score);
assert.ok(getLegalActions(heated).some(action => action.type === "reduce"));
assert.equal(
  getScoreCandidateActions(heated, {allowHeater: true, heaterUsedThisStep: true})
    .some(action => action.type === "heater"),
  true
);

const normalAction = getLegalActions(heated)[0];
const afterNormal = scoreAITestUtils.applyScoreAction(heated, normalAction);
assert.ok(afterNormal.steps > heated.steps);
assert.equal(
  getScoreCandidateActions(afterNormal, {allowHeater: true, heaterUsedThisStep: false})
    .some(action => action.type === "heater"),
  true
);

const deadButHeatable = resolveGameOver(createState([17], 10));
assert.equal(deadButHeatable.gameOver, false);
assert.equal(
  getScoreCandidateActions(deadButHeatable, {allowHeater: true}).some(action => action.type === "heater"),
  true
);

const defaultChoice = chooseScoreAction(funded, {depth: 1, beamWidth: 10});
const disabledChoice = chooseScoreAction(funded, {depth: 1, beamWidth: 10, allowHeater: false});
assert.deepEqual(disabledChoice, defaultChoice, "legacy option does not split the unified AI action space");

const comparison = await runScoreGames({
  games: 2,
  difficulty: "medium",
  depth: 1,
  beamWidth: 2,
  maxActions: 1,
  compareRandom: false,
  compareHeater: true
});
assert.equal(comparison.heaterComparison.results.length, 2);
assert.deepEqual(
  comparison.results.map(result => result.initialOpening),
  comparison.heaterComparison.results.map(result => result.initialOpening),
  "A/B uses matched openings"
);
assert.ok(comparison.results.every(result => result.heaterUseCount >= 0));

console.log("Heater AI tests passed");
