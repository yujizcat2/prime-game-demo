import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createCollectionRewardSettlement,
  FIRST_FOOD_TYPE_BONUS,
  FIRST_NUMBER_BONUS
} from "../game/collectionReward";
import {
  getAbundanceBonusRate,
  getAbundanceBonusScore,
  getBoardAbundance
} from "../game/boardAbundance";
import { applyAction, createGameState } from "../game/gameEngine";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, baseScore, abundance = 0) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, baseScore, abundance
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
  assert.equal(reward.bonusScore, FIRST_FOOD_TYPE_BONUS);
  assert.equal(reward.bonusScore, 5);
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
  assert.equal(reward.bonusScore, 7);
  assert.equal(reward.totalScore, 307);
  assert.equal(reward.rewardLevel, "major");
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
