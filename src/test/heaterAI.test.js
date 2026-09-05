import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { getLegalActions } from "../game/gameEngine";
import { getStrategicCandidateActions } from "../ai/eightPalaceScoreAI";
import { BASE_FOOD_TYPES } from "../game/rules";

const opening = [170, 50].map((value, index) => ({value, foodType: BASE_FOOD_TYPES[index], boardIndex: index, gameMode: "eightPalace"}));
const available = createGameState(opening);
assert.equal(getLegalActions(available).some(action => action.type === "heater"), true);
assert.equal(getStrategicCandidateActions(available, getLegalActions(available)).some(action => action.type === "heater"), true);

const used = {...available, heaterCount: 0};
assert.equal(getLegalActions(used).some(action => action.type === "heater"), false);
assert.equal(getStrategicCandidateActions(used, getLegalActions(used)).some(action => action.type === "heater"), false);
console.log("Heater AI tests passed");
