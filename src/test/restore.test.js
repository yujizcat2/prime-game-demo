import assert from "node:assert/strict";
import { createGameState, applyAction, resolveGameOver, getLegalActions } from "../game/gameEngine";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import { BOARD_NATIVE_FOOD_TYPES } from "../game/nativeFoodTypes";
import { getCurrentRestorePrice } from "../game/restorePricing";
import { canRestorePiece } from "../game/restore";
import { createSimulationState, applySimulationAction } from "./simulationEngine";
import { createMazeHistory } from "../game/mazeHistory";
import { chooseStrategicAction, scoreAITestUtils } from "../ai/eightPalaceScoreAI";

const opening = BOARD_NATIVE_FOOD_TYPES.map((_, boardIndex) => ({value: boardIndex + 2, boardIndex, gameMode: "eightPalace"}));
const initial = createGameState(opening);
assert.equal(BOARD_NATIVE_FOOD_TYPES.length, 9);
assert.equal(BOARD_NATIVE_FOOD_TYPES[4], null);
assert.deepEqual(new Set(BOARD_NATIVE_FOOD_TYPES.filter((_, index) => index !== 4)), new Set(BASE_FOOD_TYPES));
assert.equal(initial.board.every((piece, index) => index === 4 || !piece || piece.foodType === BOARD_NATIVE_FOOD_TYPES[index]), true);

const outer = structuredClone(initial);
outer.board[0].foodType = FOOD_TYPES.AQUATIC;
outer.money = 40;
outer.mazeHistory = createMazeHistory(outer);
const restoredOuter = applyAction(outer, {type: "restore", indexes: [0]});
assert.equal(restoredOuter.board[0].value, 2);
assert.equal(restoredOuter.board[0].foodType, BOARD_NATIVE_FOOD_TYPES[0]);
assert.equal(restoredOuter.money, 0);
assert.equal(restoredOuter.restoreUseCount, 1);
assert.equal(restoredOuter.steps, 1);

const center = structuredClone(initial);
center.board[4].foodType = FOOD_TYPES.AQUATIC;
center.board[4].value = 37;
center.money = 40;
center.mazeHistory = createMazeHistory(center);
const restoredCenter = applyAction(center, {type: "restore", indexes: [4]});
assert.equal(restoredCenter.board[4].value, 137);
assert.equal(restoredCenter.board[4].foodType, FOOD_TYPES.DRINK);
assert.equal(canRestorePiece(restoredCenter, 4), false);

assert.deepEqual([0,1,2,3].map(restoreUseCount => getCurrentRestorePrice({restoreUseCount})), [40,80,120,160]);
assert.equal(canRestorePiece({...outer, money: 39}, 0), false);
assert.equal(canRestorePiece({...outer, money: 40}, 0), true);
assert.equal(canRestorePiece({...outer, board: outer.board.map(() => null)}, 0), false);
assert.equal(canRestorePiece({...outer, board: initial.board}, 0), false);

const step99 = {...outer, steps: 99, stepLimit: 100, checkpoint: {index: 8, step: 110, type: "score", requiredScore: 1}};
const step100 = applyAction(step99, {type: "restore", indexes: [0]});
assert.equal(step100.steps, 100);
assert.notEqual(step100.gameOverReason, "step_limit");
assert.ok(getLegalActions(step100).length > 0);

const rescue = structuredClone(initial);
rescue.board = rescue.board.map(() => null);
rescue.board[0] = {...initial.board[0], value: 101, foodType: FOOD_TYPES.AQUATIC};
rescue.money = 40;
assert.equal(resolveGameOver(rescue).gameOver, false);
assert.equal(resolveGameOver({...rescue, money: 39}).gameOver, true);
const strategicRestore = chooseStrategicAction(rescue, {depth: 1, beamWidth: 8});
assert.equal(strategicRestore.type, "restore");
assert.equal(new Set(getLegalActions(rescue).map(scoreAITestUtils.getActionKey)).has(scoreAITestUtils.getActionKey(strategicRestore)), true);

const simulation = createSimulationState([2, 3, 5]);
simulation.board[0].foodType = FOOD_TYPES.AQUATIC;
simulation.money = 40;
assert.equal(applySimulationAction(simulation, {type: "restore", indexes: [0]}), true);
assert.equal(simulation.board[0].foodType, BOARD_NATIVE_FOOD_TYPES[0]);
assert.equal(simulation.money, 0);
assert.equal(simulation.restoreUseCount, 1);

console.log("native food type and restore tests passed");
