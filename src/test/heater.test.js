import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { applyAction } from "../game/gameEngine";
import { applyHeater, canUseHeater, canUseHeaterOnPiece } from "../game/heater";
import { BASE_FOOD_TYPES } from "../game/rules";

const opening = values => values.map((value, index) => ({value, foodType: BASE_FOOD_TYPES[index], boardIndex: index, gameMode: "eightPalace"}));
const initial = createGameState(opening([17, 5]));
assert.equal(initial.heaterCount, 1);
assert.equal(canUseHeater(initial), true);
assert.equal(canUseHeaterOnPiece(initial, 0), true);

const heated = applyHeater(initial, 0);
assert.equal(heated.board[0].value, 18);
assert.equal(heated.board[0].foodType, initial.board[0].foodType);
assert.equal(heated.heaterCount, 0);
assert.equal(heated.steps, initial.steps, "direct heater effect does not consume an action");
assert.equal(applyHeater(heated, 0), heated, "heater cannot be used twice in one day");

const hundred = applyHeater(createGameState(opening([100])), 0);
assert.equal(hundred.board[0].value, 101);
assert.equal(canUseHeaterOnPiece({...hundred, heaterCount: 1}, 0), false);

const combined = applyAction(heated, {type: "combine", indexes: [0, 1]});
assert.equal(combined.steps, heated.steps + 1);
console.log("heater tests passed");
