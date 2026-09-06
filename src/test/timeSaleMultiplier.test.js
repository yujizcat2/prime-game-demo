import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import { getTimeSaleMultiplier } from "../game/timeSaleMultiplier";
import { BASE_FOOD_TYPES } from "../game/rules";
import { applyAction, createGameState } from "../game/gameEngine";
import { getEightPalaceCollectionScoreGain } from "../game/collectionRules";

for(const [gameTime, expected] of [
  ["03:59", 0.5], ["04:00", 1], ["10:59", 1], ["11:00", 1.1],
  ["12:59", 1.1], ["13:00", 1], ["16:59", 1], ["17:00", 1.15],
  ["18:59", 1.15], ["19:00", 1.2], ["21:29", 1.2], ["21:30", 1]
]){
  assert.equal(getTimeSaleMultiplier(gameTime), expected, gameTime);
}

assert.equal(getTimeSaleMultiplier("24:00"), 0.5, "cross-midnight clock wraps to 00:00");
assert.equal(getTimeSaleMultiplier("27:59"), 0.5, "cross-midnight 03:59 remains early morning");
assert.equal(getTimeSaleMultiplier("28:00"), 1, "cross-midnight 04:00 returns to normal");

const settlement = createCollectionRewardSettlement({
  collectionCards: [], value: 2, foodType: BASE_FOOD_TYPES[0], name: "test",
  cuisineSequenceIndex: 2, gameTime: "17:00"
});
assert.equal(settlement.baseSaleScore, 50);
assert.equal(
  settlement.totalScore,
  Math.round(settlement.baseSaleScore * settlement.timeSaleMultiplier),
  "final score uses Math.round"
);

const reduceAt = dayMinutesElapsed => applyAction({
  ...createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"}
  ], {dayCycleEnabled: true}),
  dayMinutesElapsed
}, {type: "reduce", indexes: [0, 1]});

const sameCollectible = {
  value: 1,
  foodType: BASE_FOOD_TYPES[0],
  origin: {type: "reduce", parent: {value: 2, foodType: BASE_FOOD_TYPES[0], origin: null}}
};
const previewState = {
  collectionCards: [],
  board: [],
  dayMinutesElapsed: 3 * 60 + 59
};
assert.equal(getEightPalaceCollectionScoreGain(previewState, sameCollectible), 50);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 4 * 60}, sameCollectible),
  100,
  "the same uncollected dish updates when current time crosses 04:00"
);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 10 * 60 + 59}, sameCollectible),
  100
);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 11 * 60}, sameCollectible),
  110,
  "the same preview also updates across the lunch boundary"
);

const earlyMorningCollection = reduceAt(3 * 60 + 59);
const earlyMorningReward = earlyMorningCollection.latestCollectionRewards[0];
assert.equal(earlyMorningReward.baseSaleScore, 100);
assert.equal(earlyMorningReward.timeSaleMultiplier, 0.5);
assert.equal(earlyMorningReward.totalScore, 50);
assert.equal(earlyMorningCollection.score, 50, "real reduce-to-one action banks the discounted score once");
assert.equal(earlyMorningCollection.latestCollection.totalScore, 50);

const normalCollection = reduceAt(4 * 60);
assert.equal(normalCollection.latestCollectionRewards[0].baseSaleScore, 100);
assert.equal(normalCollection.latestCollectionRewards[0].totalScore, 100);
assert.equal(normalCollection.score, 100, "04:00 real auto-collection banks the restored base price once");

const lunchCollection = reduceAt(11 * 60);
assert.equal(lunchCollection.latestCollectionRewards[0].timeSaleMultiplier, 1.1);
assert.equal(lunchCollection.score, 110, "real non-early-morning action keeps its configured multiplier");

const rewardModalSource = readFileSync("src/components/CollectionRewardModal.jsx", "utf8");
assert.match(rewardModalSource, /<strong>\+\{reward\.totalScore\}分<\/strong>/);
const boardSource = readFileSync("src/components/Board.jsx", "utf8");
assert.match(boardSource, /\{collectionCards, board, dayMinutesElapsed\}/);
assert.notEqual(settlement.totalScore, settlement.baseSaleScore * settlement.timeSaleMultiplier);
assert.equal(
  settlement.totalScore,
  Math.round(settlement.baseSaleScore * getTimeSaleMultiplier("17:00")),
  "time multiplier is applied exactly once"
);

console.log("time sale multiplier tests passed");
