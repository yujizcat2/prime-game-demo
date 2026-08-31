import assert from "node:assert/strict";
import { applyAction, createCombineOutcome, createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { FOOD_TYPES as T } from "../game/rules";
import { getBaseScore, getCreatedScoreValue, getOriginMultiplier } from "../game/scoreValue";

assert.deepEqual([2, 37, 83, 97, 100, 101].map(getBaseScore), [18, 110, 137, 139, 82, 140]);
assert.equal(Number.isFinite(getBaseScore(202)), true);

const eightState = pieces => {
  const state = createGameState(pieces.map((piece, boardIndex) => ({...piece, boardIndex, gameMode: "eightPalace"})));
  return {...state, gameOver: false, board: [...state.board]};
};

const nativeState = eightState([
  {value: 10, foodType: T.LAND},
  {value: 20, foodType: T.VEGETABLE},
  {value: 30, foodType: T.FRUIT}
]);
assert.equal(nativeState.board[0].scoreValue, getBaseScore(10));
assert.equal(getOriginMultiplier(nativeState.board[0], nativeState.board[1]), 1.1);

const nativeCombined = applyAction(nativeState, {type: "combine_ordered", indexes: [0, 1]});
const firstCreated = nativeCombined.board[3];
assert.equal(firstCreated.scoreValue, getCreatedScoreValue(30, nativeState.board[0], nativeState.board[1]));
assert.equal(firstCreated.scoreValue, Math.round(getBaseScore(30) * 1.1));
assert.equal(nativeCombined.board[0].scoreValue, nativeState.board[0].scoreValue);
assert.equal(nativeCombined.board[1].scoreValue, nativeState.board[1].scoreValue);

const mixedOutcome = createCombineOutcome(nativeCombined, 3, 2);
assert.equal(getOriginMultiplier(firstCreated, nativeCombined.board[2]), 1.2);
assert.equal(mixedOutcome.piece.scoreValue, Math.round(getBaseScore(60) * 1.2));

let doubleCombined = eightState([
  {value: 10, foodType: T.LAND},
  {value: 20, foodType: T.VEGETABLE},
  {value: 11, foodType: T.FRUIT},
  {value: 22, foodType: T.SPICE}
]);
doubleCombined = applyAction(doubleCombined, {type: "combine_ordered", indexes: [0, 1]});
doubleCombined = applyAction(doubleCombined, {type: "combine_ordered", indexes: [2, 3]});
const combinedParentsOutcome = createCombineOutcome(doubleCombined, 4, 5);
assert.equal(getOriginMultiplier(doubleCombined.board[4], doubleCombined.board[5]), 1.3);
assert.equal(combinedParentsOutcome.piece.scoreValue, Math.round(getBaseScore(63) * 1.3));

const wrapState = eightState([{value: 190, foodType: T.DRINK}, {value: 20, foodType: T.LAND}]);
const wrapOutcome = createCombineOutcome(wrapState, 0, 1);
assert.equal(wrapOutcome.kind, "wrap");
assert.equal(wrapOutcome.piece.scoreValue, Math.round(getBaseScore(10) * 1.1));
assert.notEqual(wrapOutcome.piece.scoreValue, wrapState.board[0].scoreValue);

let reduced = eightState([
  {value: 84, foodType: T.LAND},
  {value: 2, foodType: T.VEGETABLE},
  {value: 3, foodType: T.FRUIT}
]);
const locked84 = reduced.board[0].scoreValue;
reduced = applyAction(reduced, {type: "reduce", indexes: [0, 1]});
assert.equal(reduced.board[0].value, 42);
assert.equal(reduced.board[0].scoreValue, locked84);
reduced = applyAction({...reduced, gameOver: false}, {type: "reduce", indexes: [0, 2]});
assert.equal(reduced.board[0].value, 14);
assert.equal(reduced.board[0].scoreValue, locked84);
reduced.board[1] = {...eightState([{value: 28, foodType: T.VEGETABLE}]).board[0], id: 999};
reduced = applyAction({...reduced, gameOver: false}, {type: "reduce", indexes: [0, 1]});
assert.equal(reduced.collectionCards.at(-1).value, 14);
assert.equal(reduced.collectionCards.at(-1).scoreGain, locked84);

const collectible = (value, foodType, scoreValue, origin = null) => ({
  value: 1,
  foodType,
  origin: {type: "reduce", parent: {value, foodType, scoreValue, origin}}
});
let collectionState = eightState([{value: 7, foodType: T.SEASONING}]);
collectionState = applyEightPalaceCollection(collectionState, collectible(83, T.LAND, getBaseScore(83)));
assert.equal(collectionState.latestCollection.scoreGain, getBaseScore(83));
assert.equal(collectionState.collectionCards[0].scoreGain, getBaseScore(83));
assert.equal(collectionState.score, getBaseScore(83));
const duplicateCollection = applyEightPalaceCollection(collectionState, collectible(83, T.LAND, 999));
assert.equal(duplicateCollection.score, collectionState.score);
assert.equal(duplicateCollection.money, collectionState.money);
assert.equal(duplicateCollection.latestCollection.isNewCollection, false);
assert.equal(duplicateCollection.latestCollection.moneyGain, 0);

const combined83Score = Math.round(getBaseScore(83) * 1.1);
collectionState = applyEightPalaceCollection(
  collectionState,
  collectible(83, T.FRUIT, combined83Score, {type: "combine", parents: []})
);
assert.notEqual(collectionState.collectionCards[0].scoreGain, collectionState.collectionCards[1].scoreGain);
assert.equal(collectionState.collectionCards[1].scoreGain, combined83Score);
assert.equal(collectionState.score, getBaseScore(83) + combined83Score);

const fallback = applyEightPalaceCollection(
  eightState([{value: 7, foodType: T.SEASONING}]),
  collectible(37, T.LAND, undefined)
);
assert.equal(fallback.latestCollection.scoreGain, getBaseScore(37));

console.log("score value tests passed");
