import assert from "node:assert/strict";
import { applyAction, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { getFoodExpiryState } from "../game/foodShelfLife";
import { advanceToNextDay } from "../game/dayCycle";

const state = createGameState([{value: 6, foodType: "meat", boardIndex: 0}], {dayCycleEnabled: true});
assert.equal(state.freshenerCount, 1);

const expired = {
  ...state,
  totalActionMinutes: 24 * 60,
  dayMinutesElapsed: 60,
  board: state.board.map(piece => piece ? {...piece, bornAt: 0} : piece)
};
assert.equal(getFoodExpiryState(expired.board[0], expired).expired, true);
assert.equal(getLegalActions(expired).some(action => action.type === "freshener" && action.indexes[0] === 0), true);

const refreshed = applyAction(expired, {type: "freshener", indexes: [0]});
assert.notEqual(refreshed, expired);
assert.equal(refreshed.freshenerCount, 0);
assert.equal(refreshed.totalActionMinutes, expired.totalActionMinutes + 10);
assert.equal(refreshed.dayMinutesElapsed, expired.dayMinutesElapsed + 10);
assert.equal(getFoodExpiryState(refreshed.board[0], refreshed).remainingMinutes, 24 * 60);
assert.equal(getFoodExpiryState(refreshed.board[0], refreshed).expired, false);
assert.equal(refreshed.board[0].value, expired.board[0].value);
assert.equal(applyAction(refreshed, {type: "freshener", indexes: [0]}), refreshed);

const fresh = createGameState([{value: 7, foodType: "vegetable", boardIndex: 0}], {dayCycleEnabled: true});
const refreshedFresh = applyAction({...fresh, totalActionMinutes: 180}, {type: "freshener", indexes: [0]});
assert.equal(getFoodExpiryState(refreshedFresh.board[0], refreshedFresh).remainingMinutes, 24 * 60);

const missing = applyAction(fresh, {type: "freshener", indexes: [8]});
assert.equal(missing, fresh);
assert.equal(missing.freshenerCount, 1);

const processed = {
  ...fresh,
  totalActionMinutes: 600,
  board: fresh.board.map(piece => piece ? {...piece, processedAgeMinutes: 600} : piece)
};
const refreshedProcessed = applyAction(processed, {type: "freshener", indexes: [0]});
assert.equal(refreshedProcessed.board[0].processedAgeMinutes, 0);
assert.equal(getFoodExpiryState(refreshedProcessed.board[0], refreshedProcessed).remainingMinutes, 24 * 60);

const nextDay = advanceToNextDay({...refreshed, daySettlement: {passed: true, nextTimeSalePeriods: []}});
assert.equal(nextDay.freshenerCount, 1);

const gameOver = resolveGameOver({...fresh, gameOver: true, gameOverReason: "no_legal_actions", heaterCount: 0, superHeaterCount: 0, swapUsesRemaining: 0});
assert.equal(gameOver.gameOver, false);

console.log("freshener tests passed");
