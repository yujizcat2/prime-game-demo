import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getCollectionMultiplier } from "../game/collectionMultiplier";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, nonDrinkBoardSum = 0, singleFlavorPenalty = false) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, nonDrinkBoardSum,
    boardAverageValue: 100, singleFlavorPenalty
  });

const first = settle([], 17, BASE_FOOD_TYPES[0], 900, true);
assert.equal(first.totalScore, 150);
assert.equal(first.bonusScore, 0);
assert.deepEqual(first.bonuses, []);

const second = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[1], 0);
assert.equal(second.totalScore, 100);
assert.equal(second.existingFoodTypeCountForSameNumber, 1);

const duplicate = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[0], 900);
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.totalScore, 0);

const reductionRecord = (originalValue, value = 5) => ({
  value,
  origin: {type: "reduce", parent: {value: originalValue}}
});
for(const [originalValue, expectedMultiplier, expectedRate] of [
  [10, 2, 1], [15, 3, 1.1], [25, 5, 1.25], [35, 7, 1.4], [40, 8, 1.5], [60, 12, 1.5]
]){
  assert.deepEqual(getCollectionMultiplier(reductionRecord(originalValue)), {
    collectionMultiplier: expectedMultiplier,
    collectionMultiplierRate: expectedRate
  });
}
for(const invalidRecord of [null, {value: 5}, reductionRecord(12)]){
  assert.deepEqual(getCollectionMultiplier(invalidRecord), {
    collectionMultiplier: 1,
    collectionMultiplierRate: 1
  });
}

const multiplied = createCollectionRewardSettlement({
  collectionCards: [], value: 5, foodType: BASE_FOOD_TYPES[0], name: "5号料理",
  collectionRecord: reductionRecord(35)
});
assert.equal(multiplied.totalScore, 140, "the route multiplier is applied before final rounding");
assert.equal(multiplied.collectionMultiplier, 7);
assert.equal(multiplied.collectionMultiplierRate, 1.4);

for(const path of ["src/game/collectionReward.js", "src/components/CollectionRewardModal.jsx"]){
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(source, /首次发现|新料理系|firstDiscoveryRate|getNewFoodTypeBonus/);
}

console.log("collection reward tests passed");
