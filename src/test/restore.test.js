import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { applyAction } from "../game/gameEngine";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import { BOARD_NATIVE_FOOD_TYPES } from "../game/nativeFoodTypes";
import { canRestorePiece } from "../game/restore";

const opening = BOARD_NATIVE_FOOD_TYPES.map((_, boardIndex) => ({value: boardIndex + 2, boardIndex, gameMode: "eightPalace"}));
const initial = createGameState(opening);
assert.equal(initial.restoreCount, 1);
assert.deepEqual(new Set(BOARD_NATIVE_FOOD_TYPES.filter(Boolean)), new Set(BASE_FOOD_TYPES));

const changed = structuredClone(initial);
changed.board[0].foodType = FOOD_TYPES.AQUATIC;
assert.equal(canRestorePiece(changed, 0), true);
const restored = applyAction(changed, {type: "restore", indexes: [0]});
assert.equal(restored.board[0].foodType, BOARD_NATIVE_FOOD_TYPES[0]);
assert.equal(restored.restoreCount, 0);
assert.equal(restored.steps, changed.steps, "restore does not consume a normal action");
assert.equal(applyAction(restored, {type: "restore", indexes: [1]}), restored, "restore cannot be used twice in one day");

const center = structuredClone(initial);
center.board[4].foodType = FOOD_TYPES.AQUATIC;
center.board[4].value = 37;
const restoredCenter = applyAction(center, {type: "restore", indexes: [4]});
assert.equal(restoredCenter.board[4].value, 137);
assert.equal(restoredCenter.board[4].foodType, FOOD_TYPES.DRINK);
console.log("native food type and restore tests passed");
