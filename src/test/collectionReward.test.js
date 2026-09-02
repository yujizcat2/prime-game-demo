import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createCollectionRewardSettlement,
  getBoardAverageValue,
  getBoardPowerBonus,
  getNewFoodTypeBonus,
  FIRST_NUMBER_BONUS
} from "../game/collectionReward";
import {
  getAbundanceBonusRate,
  getAbundanceBonusScore,
  getBoardAbundance
} from "../game/boardAbundance";
import { applyAction, createGameState } from "../game/gameEngine";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, baseScore, abundance = 0, boardAverageValue = 0) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, baseScore, abundance, boardAverageValue
  });

for(const [abundance, expectedRate] of [
  [149, 0], [150, 0.1], [249, 0.1], [250, 0.2], [349, 0.2],
  [350, 0.3], [449, 0.3], [450, 0.4], [549, 0.4], [550, 0.5]
]){
  assert.equal(getAbundanceBonusRate(abundance), expectedRate);
}

assert.equal(getBoardAbundance([null, {value: 120}, {value: 200}]), 320);
assert.equal(getAbundanceBonusScore(40, 320), 8);
{
  const reward = settle([card(29, "land"), card(13, "spice")], 29, "spice", 40, 320);
  assert.equal(reward.baseScore, 40);
  assert.equal(reward.abundance, 320);
  assert.equal(reward.abundanceBonusRate, 0.2);
  assert.equal(reward.abundanceBonusScore, 8);
  assert.equal(reward.totalScore, 48);
}

{
  const reward = settle([card(29, "spice")], 29, "spice", 40, 550);
  assert.equal(reward.baseScore, 0);
  assert.equal(reward.abundanceBonusScore, 0);
  assert.equal(reward.totalScore, 0);
}

{
  const state = createGameState([
    {value: 150, boardIndex: 0, gameMode: "eightPalace"},
    {value: 3, boardIndex: 1}
  ]);
  const nextState = applyAction(state, {type: "reduce", indexes: [0, 1]});
  const event = nextState.collectionTimeline.at(-1);
  assert.equal(getBoardAbundance(state.board), 153);
  assert.equal(getBoardAbundance(nextState.board), 50);
  assert.equal(event.abundance, 153, "collection uses the board before the action");
  assert.equal(event.boardAverageValue, 76.5, "collection uses the board average before the action");
  assert.equal(event.abundanceBonusRate, 0.1);
  assert.equal(event.abundanceBonusScore, Math.round(event.baseScore * 0.1));

  const simulatedState = structuredClone(state);
  const simulatedResult = applyAction(simulatedState, {type: "reduce", indexes: [0, 1]});
  assert.equal(simulatedResult.score, nextState.score, "search simulation and formal play share scoring");
  assert.deepEqual(
    simulatedResult.collectionTimeline.at(-1),
    nextState.collectionTimeline.at(-1)
  );
}

{
  const reward = settle([card(17, "spice")], 17, "spice", 0);
  assert.equal(reward.totalScore, 0);
  assert.equal(reward.rewardLevel, "none");
  assert.deepEqual(reward.bonuses, []);
}

{
  const reward = settle([card(17, "land"), card(13, "spice")], 17, "spice", 150);
  assert.equal(reward.totalScore, 150);
  assert.equal(reward.rewardLevel, "minor");
  assert.deepEqual(reward.bonuses, []);
}

{
  const reward = settle([card(17, "land")], 17, "spice", 150);
  assert.equal(reward.bonusScore, 10);
  assert.equal(reward.bonuses[0].type, "first_food_type");
}

{
  const reward = settle([card(13, "spice")], 17, "spice", 300);
  assert.equal(reward.bonusScore, FIRST_NUMBER_BONUS);
  assert.equal(reward.bonusScore, 2);
  assert.equal(reward.bonuses[0].type, "first_number");
}

{
  const reward = settle([], 17, "spice", 300);
  assert.equal(reward.bonusScore, 12);
  assert.equal(reward.totalScore, 312);
  assert.equal(reward.rewardLevel, "major");
}

for(const [discoveredCount, boardAverageValue, expected] of [
  [5, 18, 15], [6, 32, 22], [7, 45, 27], [8, 60, 34]
]){
  const foodType = BASE_FOOD_TYPES[discoveredCount - 1];
  const previousTypes = BASE_FOOD_TYPES.slice(0, discoveredCount - 1);
  const reward = settle([card(17, FOOD_TYPES.DRINK), ...previousTypes.map(type => card(17, type))], 17, foodType, 300, 0, boardAverageValue);
  assert.equal(reward.newFoodTypeBonus, expected);
  assert.equal(reward.totalScore, 300 + expected);
}
assert.equal(getNewFoodTypeBonus(1, 0), 10);
assert.equal(getNewFoodTypeBonus(8, 1_000), 50);

{
  const reward = settle([card(13, FOOD_TYPES.AQUATIC), card(17, FOOD_TYPES.LAND)], 17, FOOD_TYPES.AQUATIC, 300);
  assert.equal(reward.newFoodTypeBonus, 0);
  assert.equal(reward.totalScore, 300);
}

assert.equal(getBoardPowerBonus(49, 1_500, 70), 0);
assert.equal(getBoardPowerBonus(50, 500, 30), 30);
assert.equal(getBoardPowerBonus(90, 1_500, 60), 100);
assert.equal(getBoardAverageValue([{value: 180}, null, {value: 45}]), 112.5);

{
  const reward = settle([card(13, FOOD_TYPES.AQUATIC), card(50, FOOD_TYPES.LAND)], 50, FOOD_TYPES.AQUATIC, 500, 0, 30);
  assert.equal(reward.boardPowerBonus, 30);
  assert.equal(reward.totalScore, 530);
}

{
  const reward = settle([card(13, FOOD_TYPES.AQUATIC), card(90, FOOD_TYPES.LAND)], 90, FOOD_TYPES.AQUATIC, 1_500, 0, 60);
  assert.equal(reward.boardPowerBonus, 100);
  assert.equal(reward.totalScore, 1_600);
}

{
  const reward = settle([card(50, FOOD_TYPES.LAND)], 50, FOOD_TYPES.LAND, 500, 0, 60);
  assert.equal(reward.duplicate, true);
  assert.equal(reward.boardPowerBonus, 0);
  assert.equal(reward.totalScore, 0);
}

{
  const reward = settle(BASE_FOOD_TYPES.slice(0, 4).map(type => card(17, type)), 17, FOOD_TYPES.DRINK, 300);
  assert.equal(reward.newFoodTypeBonus, 0);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_food_type"), false);
  assert.equal(reward.totalScore, 300);
}

{
  const reward = settle([card(17, "land")], 17, "vegetable", 150);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_number"), false);
}

{
  const reward = settle([card(13, "spice")], 17, "spice", 300);
  assert.equal(reward.bonuses.some(bonus => bonus.type === "first_food_type"), false);
}

{
  const reward = settle([card(12, "land"), card(15, "spice")], 12, "spice", 50);
  assert.equal(reward.rewardLevel, "minor");
}

for(const reward of [
  settle([], 2, "land", 100),
  settle([card(2, "land")], 2, "spice", 50),
  settle([card(2, "land")], 3, "land", 100)
]){
  assert.ok(Number.isInteger(reward.baseScore));
  assert.ok(Number.isInteger(reward.bonusScore));
  assert.ok(Number.isInteger(reward.totalScore));
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

const rewardModalSource = readFileSync("src/components/CollectionRewardModal.jsx", "utf8");
assert.match(rewardModalSource, /基础\{reward\.baseScore\} · 丰盛度\+\{reward\.abundanceBonusScore\}/);

console.log("collection reward tests passed");
