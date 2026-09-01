import assert from "node:assert/strict";
import { applyAction, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { applySuperHeater, canUseSuperHeater } from "../game/superHeater";
import { getCurrentSuperHeaterPrice } from "../game/superHeaterPricing";
import { BASE_FOOD_TYPES } from "../game/rules";
import { createSearchTelemetry, getStrategicCandidateActions, scoreAITestUtils } from "../ai/eightPalaceScoreAI";
import { applySimulationAction, cloneSimulationState, createSimulationState, getSimulationLegalActions } from "./simulationEngine";

const opening = [
  {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "simpleEightPalace"},
  {value: 5, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "simpleEightPalace"},
  {value: 10, foodType: BASE_FOOD_TYPES[2], boardIndex: 3, gameMode: "simpleEightPalace"},
  {value: 20, foodType: BASE_FOOD_TYPES[3], boardIndex: 4, gameMode: "simpleEightPalace"}
];

const initial = createGameState(opening);
assert.equal(initial.superHeaterUseCount, 0);
assert.equal(getCurrentSuperHeaterPrice(initial), 100);
assert.equal(getCurrentSuperHeaterPrice({...initial, superHeaterUseCount: 1}), 200);
assert.equal(canUseSuperHeater({...initial, money: 99}), false);

const funded = {...initial, money: 250};
assert.equal(canUseSuperHeater(funded), true);
assert.equal(getLegalActions(funded).filter(action => action.type === "super_heater").length, 1);
const heated = applySuperHeater(funded);
assert.deepEqual(heated.board.map(piece => piece?.value ?? null), [3, 6, null, 11, 21, null, null, null, null]);
assert.deepEqual(
  heated.board.map(piece => piece?.foodType ?? null),
  funded.board.map(piece => piece?.foodType ?? null),
  "food types and native positions remain unchanged"
);
assert.equal(heated.money, 150);
assert.equal(heated.superHeaterUseCount, 1);
assert.equal(heated.score, funded.score);
assert.equal(heated.steps, funded.steps);
assert.deepEqual(heated.collectionCards, funded.collectionCards);
assert.equal(heated.board[0].origin.type, "heater");
assert.equal(heated.board[0].origin.from.value, 2);

const rejected = applySuperHeater({...initial, money: 99});
assert.equal(rejected.money, 99);
assert.equal(rejected.superHeaterUseCount, 0);
assert.equal(rejected.board[0].value, 2);

const edge = {...createGameState([{...opening[0], value: 101}]), money: 1_000};
assert.equal(canUseSuperHeater(edge), false, "super heater uses the ordinary heater boundary");
assert.equal(getLegalActions(edge).some(action => action.type === "super_heater"), false);

const survivable = resolveGameOver({...createGameState([{...opening[0], value: 17}]), money: 100});
assert.equal(survivable.gameOver, false);
assert.equal(getLegalActions(survivable).some(action => action.type === "super_heater"), true);

const telemetry = createSearchTelemetry();
const strategic = getStrategicCandidateActions(funded, getLegalActions(funded), {telemetry});
assert.equal(strategic.filter(action => action.type === "super_heater").length, 1);
assert.equal(telemetry.superHeaterCandidatesGenerated, 1);
assert.equal(telemetry.superHeaterCandidatesKept, 1);
const aiAction = strategic.find(action => action.type === "super_heater");
const replayed = applyAction(funded, aiAction);
const simulatedByAI = scoreAITestUtils.applyScoreAction(funded, aiAction);
assert.deepEqual(simulatedByAI.board, replayed.board);
assert.equal(simulatedByAI.score, replayed.score);
assert.equal(simulatedByAI.money, replayed.money);
assert.equal(simulatedByAI.steps, replayed.steps);
assert.equal(simulatedByAI.superHeaterUseCount, replayed.superHeaterUseCount);

const simulation = createSimulationState([2, 5, 10]);
simulation.money = 100;
assert.equal(getSimulationLegalActions(simulation).some(action => action.type === "super_heater"), true);
assert.equal(applySimulationAction(simulation, {type: "super_heater"}), true);
assert.deepEqual(simulation.board.slice(0, 3).map(piece => piece.value), [3, 6, 11]);
assert.equal(simulation.money, 0);
assert.equal(simulation.superHeaterUseCount, 1);
assert.equal(cloneSimulationState(simulation).superHeaterUseCount, 1);

console.log("super heater tests passed");
