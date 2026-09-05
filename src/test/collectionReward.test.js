import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import { BASE_FOOD_TYPES } from "../game/rules";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, nonDrinkBoardSum = 0, singleFlavorPenalty = false) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, nonDrinkBoardSum,
    boardAverageValue: 1000, singleFlavorPenalty
  });

const first = settle([], 170, BASE_FOOD_TYPES[0], 9000, true);
assert.equal(first.totalScore, 15);
assert.equal(first.bonusScore, 0);
assert.deepEqual(first.bonuses, []);

const second = settle([card(170, BASE_FOOD_TYPES[0])], 170, BASE_FOOD_TYPES[1], 0);
assert.equal(second.totalScore, 10);
assert.equal(second.existingFoodTypeCountForSameNumber, 1);

const duplicate = settle([card(170, BASE_FOOD_TYPES[0])], 170, BASE_FOOD_TYPES[0], 9000);
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.totalScore, 0);

for(const path of ["src/game/collectionReward.js", "src/components/CollectionRewardModal.jsx"]){
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(source, /首次发现|新料理系|firstDiscoveryRate|getNewFoodTypeBonus/);
}

console.log("collection reward tests passed");
