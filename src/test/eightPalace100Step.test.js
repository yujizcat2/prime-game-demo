import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { applyAction, resolveGameOver } from "../game/gameEngine";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { getCollectionSourceText } from "../components/collectionDisplay";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore } from "../game/scoreValue";

for(let attempt = 0; attempt < 200; attempt++){
  const opening = createEightPalaceInitialValues();
  const values = opening.map(card => card.value);
  assert.equal(opening.length, 8);
  assert.equal(values.reduce((sum, value) => sum + value, 0), 300);
  assert.ok(values.every(value => value >= 2 && value <= 101));
  assert.equal(new Set(values).size, 8);
}

const openingState = createGameState(createEightPalaceInitialValues());
assert.equal(openingState.stepLimit, 100);

const actionOpening = [
  {value: 6, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
  {value: 12, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"},
  {value: 17, foodType: BASE_FOOD_TYPES[2], boardIndex: 2, gameMode: "eightPalace"}
];
const step99 = {...createGameState(actionOpening), steps: 99};
assert.equal(resolveGameOver(step99).gameOver, false, "Step 99 remains playable");
const step100 = applyAction(step99, {type: "reduce", indexes: [0, 1]});
assert.equal(step100.steps, 100);
assert.equal(step100.gameOver, true);
assert.equal(step100.gameOverReason, "step_limit");
assert.ok(step100.board.some(Boolean), "uncleared board still settles");
assert.equal(Object.values(step100.eightPalaceKeys).filter(Boolean).length, 0, "missing keys do not block settlement");

const deadEarly = resolveGameOver({
  ...createGameState(actionOpening),
  board: [{id: 1, value: 17, foodType: BASE_FOOD_TYPES[0]}, ...Array(8).fill(null)],
  steps: 73
});
assert.equal(deadEarly.gameOver, true);
assert.equal(deadEarly.gameOverReason, "no_legal_actions");

function collectible(value, leftParent, rightParent){
  return {
    value: 1,
    foodType: BASE_FOOD_TYPES[0],
    origin: {
      type: "reduce",
      parent: {
        value,
        foodType: BASE_FOOD_TYPES[0],
        origin: {
          type: "combine",
          parents: [
            {value: leftParent, foodType: BASE_FOOD_TYPES[1]},
            {value: rightParent, foodType: BASE_FOOD_TYPES[2]}
          ]
        }
      }
    }
  };
}

let collectionState = createGameState(actionOpening);
collectionState = applyEightPalaceCollection(collectionState, collectible(24, 7, 17));
collectionState = applyEightPalaceCollection(collectionState, collectible(24, 11, 13));
collectionState = applyEightPalaceCollection(collectionState, {
  value: 1,
  foodType: BASE_FOOD_TYPES[0],
  origin: {type: "reduce", parent: {value: 24, foodType: BASE_FOOD_TYPES[0], origin: {type: "reduce", parent: {value: 48, foodType: BASE_FOOD_TYPES[0]}}}}
});
collectionState = applyEightPalaceCollection(collectionState, collectible(83, 41, 42));
assert.equal(collectionState.collectionCards.length, 2);
assert.equal(collectionState.collectionCards[0].value, 24);
assert.equal(typeof collectionState.collectionCards[0].name, "string");
assert.deepEqual(collectionState.collectionCards[0].parents.map(parent => parent.value), [7, 17]);
assert.ok(collectionState.collectionCards[0].parents.every(parent => typeof parent.name === "string"));
assert.equal(collectionState.collectionTimeline.length, 4);
assert.equal(collectionState.score, getBaseScore(24) + getBaseScore(83));
assert.equal(collectionState.money, 20);

const nativeCollection = applyEightPalaceCollection(createGameState(actionOpening), {
  value: 1,
  foodType: BASE_FOOD_TYPES[0],
  origin: {type: "reduce", parent: {value: 37, foodType: BASE_FOOD_TYPES[0], origin: null}}
});
const reducedCollection = applyEightPalaceCollection(createGameState(actionOpening), {
  value: 1,
  foodType: BASE_FOOD_TYPES[0],
  origin: {type: "reduce", parent: {value: 37, foodType: BASE_FOOD_TYPES[0], origin: {type: "reduce", parent: {value: 74, foodType: BASE_FOOD_TYPES[0]}}}}
});
assert.match(getCollectionSourceText(nativeCollection.collectionCards[0]), /^一种原生的/);
assert.match(getCollectionSourceText(reducedCollection.collectionCards[0]), /^一种由.+处理而来的/);
assert.match(getCollectionSourceText(collectionState.collectionCards[0]), /^一种由.+与.+制成的/);
assert.equal(nativeCollection.collectionCards[0].scoreGain, getBaseScore(37));
const collectionPanelSource = readFileSync("src/components/EightPalaceCollectionPanel.jsx", "utf8");
assert.match(collectionPanelSource, /\+\{card\.scoreGain/);
assert.match(collectionPanelSource, /\{name\} \{card\.value\}/);
assert.match(collectionPanelSource, /getFoodCardTypeLabel/);
assert.match(collectionPanelSource, /getFoodOriginDescription/);

const hudSource = readFileSync("src/components/StepPanel.jsx", "utf8");
assert.match(hudSource, /isEightPalace \? "积分" : "金钱"/);
assert.match(hudSource, /isEightPalace \? "步数" : "时间"/);
assert.match(hudSource, /!isEightPalace && <span/);

const settlementSource = readFileSync("src/components/GameOver.jsx", "utf8");
assert.match(settlementSource, /\? "本局结束"/);
assert.match(settlementSource, />积分</);
assert.match(settlementSource, />Step</);
assert.match(settlementSource, />收藏</);
assert.doesNotMatch(settlementSource, /挑战失败|Game Over/);

console.log("eight palace 100 Step tests passed");
