import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createCollectionRewardSettlement,
  FIRST_FOOD_TYPE_BONUS,
  FIRST_NUMBER_BONUS
} from "../game/collectionReward";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, baseScore) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, baseScore
  });

{
  const reward = settle([card(17, "spice")], 17, "spice", 0);
  assert.equal(reward.totalScore, 0);
  assert.equal(reward.rewardLevel, "none");
  assert.deepEqual(reward.bonuses, []);
}

{
  const reward = settle([card(17, "land"), card(13, "spice")], 17, "spice", 15);
  assert.equal(reward.totalScore, 15);
  assert.equal(reward.rewardLevel, "minor");
  assert.deepEqual(reward.bonuses, []);
}

{
  const reward = settle([card(17, "land")], 17, "spice", 15);
  assert.equal(reward.bonusScore, FIRST_FOOD_TYPE_BONUS);
  assert.equal(reward.bonuses[0].type, "first_food_type");
}

{
  const reward = settle([card(13, "spice")], 17, "spice", 30);
  assert.equal(reward.bonusScore, FIRST_NUMBER_BONUS);
  assert.equal(reward.bonuses[0].type, "first_number");
}

{
  const reward = settle([], 17, "spice", 30);
  assert.equal(reward.bonusScore, 60);
  assert.equal(reward.totalScore, 90);
  assert.equal(reward.rewardLevel, "major");
}

{
  const reward = settle([card(17, "land")], 17, "vegetable", 15);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_number"), false);
}

{
  const reward = settle([card(13, "spice")], 17, "spice", 30);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_food_type"), false);
}

{
  const reward = settle([card(12, "land"), card(15, "spice")], 12, "spice", 5);
  assert.equal(reward.rewardLevel, "minor");
}

for(const path of [
  "src/components/Board.jsx",
  "src/components/BoardCell.jsx",
  "src/components/ActionHintPanel.jsx",
  "src/components/ActionButtons.jsx"
]){
  const previewSource = readFileSync(path, "utf8");
  assert.doesNotMatch(previewSource, /FIRST_(?:FOOD_TYPE|NUMBER)_BONUS|first_food_type|first_number/);
}

console.log("collection reward tests passed");
