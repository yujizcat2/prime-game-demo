import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement, getNewFoodTypeBonus } from "../game/collectionReward";
import { getRawBaseScore } from "../game/scoreValue";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, nonDrinkBoardSum = 0, singleFlavorPenalty = false) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, nonDrinkBoardSum,
    boardAverageValue: 0, singleFlavorPenalty
  });

{
  const raw = getRawBaseScore(17, 0);
  const reward = settle([], 17, BASE_FOOD_TYPES[0]);
  assert.equal(reward.baseScore, Math.round(raw));
  assert.equal(reward.collectionScore, Math.round(raw * 1.1));
  assert.equal(reward.totalScore, reward.collectionScore + getNewFoodTypeBonus(1, 0));
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_discovery"), true);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "abundance" || bonus.type === "board_power"), false);
}

{
  const raw = getRawBaseScore(17, 900);
  const reward = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[1], 900);
  assert.equal(reward.collectionScore, Math.round(raw * 0.5));
  assert.equal(reward.firstDiscoveryRate, 0.2);
}

{
  const reward = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[0], 900);
  assert.equal(reward.duplicate, true);
  assert.equal(reward.totalScore, 0);
}

{
  const raw = getRawBaseScore(17, 450);
  const reward = settle([], 17, BASE_FOOD_TYPES[0], 450, true);
  assert.equal(reward.collectionScore, Math.round(raw * 0.5));
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_discovery"), false);
}

{
  const reward = settle(BASE_FOOD_TYPES.slice(0, 4).map(type => card(13, type)), 13, FOOD_TYPES.DRINK);
  assert.equal(reward.newFoodTypeBonus, 0);
}

assert.equal(getNewFoodTypeBonus(1, 0), 10);
assert.equal(getNewFoodTypeBonus(8, 1_000), 50);

for(const path of ["src/game/collectionReward.js", "src/components/CollectionRewardModal.jsx", "src/components/BoardStatus.jsx"]){
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(source, /丰盛度奖励|盘面强度奖励|boardPowerBonus|abundanceBonus/);
}

console.log("collection reward tests passed");
