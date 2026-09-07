import assert from "node:assert/strict";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { createGameState } from "../game/gameState";
import { createCombineOutcome, createReduceOutcome } from "../game/gameActions";
import { applyAction } from "../game/gameEngine";
import {
  FOOD_SHELF_LIFE_MINUTES,
  formatShelfLife,
  getFoodExpiryState,
  isFoodExpired
} from "../game/foodShelfLife";

const state = createGameState([
  {value: 84, boardIndex: 0, foodType: "land", gameMode: "eightPalace"},
  {value: 2, boardIndex: 1, foodType: "aquatic", gameMode: "eightPalace"},
  {value: 3, boardIndex: 2, foodType: "vegetable", gameMode: "eightPalace"}
], {dayCycleEnabled: true});

assert.equal(state.board[0].bornAt, 0, "initial food is born at game minute zero");
assert.equal(formatShelfLife(510), "8h30m");
assert.equal(formatShelfLife(45), "45m");
assert.equal(getFoodExpiryState(state.board[0], 479).warning, false);
assert.equal(getFoodExpiryState(state.board[0], 480).warning, true);
assert.equal(isFoodExpired(state.board[0], FOOD_SHELF_LIFE_MINUTES), true);

const reduced = createReduceOutcome({...state, totalActionMinutes: 300}, 0, 1);
assert.equal(reduced.results[0].bornAt, 0, "reduction preserves the first card's birth time");
assert.equal(reduced.results[1].bornAt, 0, "reduction preserves the second card's birth time");

const combined = createCombineOutcome({...state, totalActionMinutes: 300}, 1, 2);
assert.equal(combined.piece.bornAt, 300, "a combined card gets a fresh birth time");

const expiredParent = {...state.board[0], bornAt: 0};
const expiredCollectionState = {
  ...state,
  totalActionMinutes: 600,
  collectionCards: [],
  collectionTimeline: [],
  collectionEventId: 0,
  score: 0,
  dayRevenue: 0
};
const collected = applyEightPalaceCollection(expiredCollectionState, {
  value: 1,
  foodType: expiredParent.foodType,
  origin: {type: "reduce", parent: expiredParent}
});
assert.equal(collected.latestCollection.expired, true);
assert.equal(collected.latestCollection.saleScore, 0, "expired food sale is zero");
assert.equal(collected.latestCollection.foodAgeMinutes, 600);

const expiresDuringCollection = createGameState([
  {value: 2, boardIndex: 0, foodType: "land", gameMode: "eightPalace"},
  {value: 4, boardIndex: 1, foodType: "aquatic", gameMode: "eightPalace"}
], {dayCycleEnabled: true});
const completedAtExpiry = applyAction({
  ...expiresDuringCollection,
  totalActionMinutes: 540,
  dayMinutesElapsed: 540
}, {type: "reduce", indexes: [0, 1]});
assert.equal(completedAtExpiry.latestCollection.expired, true, "collection uses the action completion time");
assert.equal(completedAtExpiry.latestCollection.saleScore, 0);

console.log("food shelf life tests passed");
