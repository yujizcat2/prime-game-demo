import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { applyAction, resolveGameOver } from "../game/gameEngine";
import { applyHeater, canUseHeater, canUseHeaterOnPiece, getHeaterCost } from "../game/heater";
import { BASE_FOOD_TYPES } from "../game/rules";
import { cloneSimulationState, createSimulationState } from "./simulationEngine";

const [land, aquatic] = BASE_FOOD_TYPES;
const opening = (values = [17, 5]) => values.map((value, index) => ({
  value, foodType: index ? aquatic : land, boardIndex: index, gameMode: "eightPalace"
}));
const fixedState = state => ({...state, heaterPricingMode: "fixed"});

const initial = fixedState(createGameState(opening()));
assert.equal(initial.heaterUseCount, 0);
assert.equal(getHeaterCost(initial), 10);
assert.equal(canUseHeater({...initial, money: 10}), true);
assert.equal(canUseHeater(initial), false);

const funded = {...initial, money: 40};
const first = applyHeater(funded, 0);
assert.equal(first.board[0].value, 18);
assert.equal(first.board[0].foodType, land);
assert.equal(first.money, 30);
assert.equal(first.heaterUseCount, 1);
assert.equal(getHeaterCost(first), 20);
assert.equal(first.steps, funded.steps);
assert.equal(first.score, funded.score);
assert.equal(first.collectionCards.length, funded.collectionCards.length);

const second = applyHeater(first, 0);
assert.equal(second.board[0].value, 19);
assert.equal(second.money, 10);
assert.equal(second.heaterUseCount, 2);
assert.equal(getHeaterCost(second), 30);

const insufficient = applyHeater(second, 0);
assert.equal(insufficient, second);
assert.equal(insufficient.money, 10);
assert.equal(insufficient.heaterUseCount, 2);
assert.ok(insufficient.money >= 0);

const hundred = {...fixedState(createGameState(opening([100]))), money: 10};
const oneOhOne = applyHeater(hundred, 0);
assert.equal(oneOhOne.board[0].value, 101);
assert.equal(oneOhOne.money, 0);
assert.equal(canUseHeaterOnPiece({...oneOhOne, money: 100}, 0), false);
assert.equal(applyHeater({...oneOhOne, money: 100}, 0).board[0].value, 101);
assert.equal(canUseHeater({...oneOhOne, money: 100}), false);

assert.equal(first.board[0].origin.type, "heater");
assert.equal(first.board[0].origin.from.value, 17);
const historyState = fixedState(createGameState(opening([17])));
historyState.board[0].origin = {
  type: "combine",
  value: 17,
  parents: [{value: 8, foodType: land}, {value: 9, foodType: aquatic}],
  mainParent: {value: 8, foodType: land}
};
const withHistory = applyHeater({...historyState, money: 10}, 0);
assert.equal(withHistory.board[0].origin.from.origin.type, "combine");
assert.equal(withHistory.board[0].origin.from.origin.parents[1].value, 9);

const combineAfterHeat = applyAction(first, {type: "combine", indexes: [0, 1]});
assert.notEqual(combineAfterHeat, first);
assert.equal(combineAfterHeat.steps, first.steps + 1);

const reducible = {...fixedState(createGameState(opening([17, 6]))), money: 10};
const heatedReducible = applyHeater(reducible, 0);
const reduceAfterHeat = applyAction(heatedReducible, {type: "reduce", indexes: [0, 1]});
assert.notEqual(reduceAfterHeat, heatedReducible);
assert.equal(reduceAfterHeat.steps, heatedReducible.steps + 1);

const deadButFunded = resolveGameOver({...fixedState(createGameState(opening([17]))), money: 10});
assert.equal(deadButFunded.gameOver, false);
const deadAndPoor = resolveGameOver({...fixedState(createGameState(opening([17]))), money: 0});
assert.equal(deadAndPoor.gameOver, true);
const revived = resolveGameOver(applyHeater({
  ...fixedState(createGameState(opening())), money: 10, gameOver: true, gameOverReason: "no_legal_actions"
}, 0));
assert.equal(revived.gameOver, false);

assert.equal(createGameState(opening()).heaterUseCount, 0);
assert.equal(getHeaterCost(fixedState(createGameState(opening()))), 10);
const simulation = createSimulationState([2, 3, 5]);
assert.equal(simulation.heaterUseCount, 0);
simulation.heaterUseCount = 3;
assert.equal(cloneSimulationState(simulation).heaterUseCount, 3);

console.log("heater tests passed");
