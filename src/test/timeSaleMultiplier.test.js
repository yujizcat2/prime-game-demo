import assert from "node:assert/strict";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import { getTimeSaleMultiplier } from "../game/timeSaleMultiplier";
import { BASE_FOOD_TYPES } from "../game/rules";

for(const [gameTime, expected] of [
  ["03:59", 0.9], ["04:00", 1], ["10:59", 1], ["11:00", 1.1],
  ["12:59", 1.1], ["13:00", 1], ["16:59", 1], ["17:00", 1.15],
  ["18:59", 1.15], ["19:00", 1.2], ["21:29", 1.2], ["21:30", 1]
]){
  assert.equal(getTimeSaleMultiplier(gameTime), expected, gameTime);
}

assert.equal(getTimeSaleMultiplier("24:00"), 0.9, "cross-midnight clock wraps to 00:00");
assert.equal(getTimeSaleMultiplier("27:59"), 0.9, "cross-midnight 03:59 remains early morning");
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
assert.notEqual(settlement.totalScore, settlement.baseSaleScore * settlement.timeSaleMultiplier);
assert.equal(
  settlement.totalScore,
  Math.round(settlement.baseSaleScore * getTimeSaleMultiplier("17:00")),
  "time multiplier is applied exactly once"
);

console.log("time sale multiplier tests passed");
