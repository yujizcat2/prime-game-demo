import assert from "node:assert/strict";
import { applyAction, createGameState, getLegalActions } from "../game/gameEngine";
import { applySuperHeater, canUseSuperHeater } from "../game/superHeater";
import { BASE_FOOD_TYPES } from "../game/rules";

const opening = [20, 50, 100].map((value, index) => ({value, foodType: BASE_FOOD_TYPES[index], boardIndex: index, gameMode: "eightPalace"}));
const initial = createGameState(opening);
assert.equal(initial.superHeaterCount, 1);
assert.equal(canUseSuperHeater(initial), true);
assert.equal(getLegalActions(initial).some(action => action.type === "super_heater"), true);

const heated = applySuperHeater(initial);
assert.deepEqual(heated.board.slice(0, 3).map(piece => piece.value), [30, 60, 110]);
assert.equal(heated.superHeaterCount, 0);
assert.equal(heated.steps, initial.steps, "direct super heater effect does not consume an action");
assert.equal(applySuperHeater(heated), heated, "super heater cannot be used twice in one day");
assert.equal(applyAction(heated, {type: "super_heater"}), heated);

const edge = createGameState([{...opening[0], value: 1010}]);
assert.equal(canUseSuperHeater(edge), false);
console.log("super heater tests passed");
