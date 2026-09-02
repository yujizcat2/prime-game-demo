import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { applyAction, resolveGameOver } from "../game/gameEngine";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { getCollectionSourceText } from "../components/collectionDisplay";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getBaseScore, getNonDrinkBoardSum } from "../game/scoreValue";
import {
  FIRST_SCORE_REFERENCE,
  createFirstCheckpoint,
  getNextCheckpointDistance,
  getNextRequiredScore,
  getPassGrowthRate,
} from "../game/checkpoints";

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
assert.deepEqual(openingState.checkpoint, createFirstCheckpoint());
assert.equal(FIRST_SCORE_REFERENCE, 506);
assert.equal(getNextCheckpointDistance(1), 16);
assert.ok(getNextCheckpointDistance(700 / FIRST_SCORE_REFERENCE) < 16);
assert.ok(getNextCheckpointDistance(300 / FIRST_SCORE_REFERENCE) > 16);
assert.equal(getNextCheckpointDistance(1000), 10);
assert.equal(getNextCheckpointDistance(0), 24);
assert.deepEqual(
  [39, 40, 69, 70, 99, 100, 149, 150].map(getPassGrowthRate),
  [.12, .12, .12, .14, .14, .25, .25, .30]
);
const convertedRequiredScore = getNextRequiredScore(506, 10, 16, 26);
const oldEquivalentPassValue = Math.round((506 / Math.sqrt(10)) * (1 + .12));
assert.ok(Math.abs(convertedRequiredScore / Math.sqrt(26) - oldEquivalentPassValue) <= 1);

const actionOpening = [
  {value: 6, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
  {value: 12, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"},
  {value: 17, foodType: BASE_FOOD_TYPES[2], boardIndex: 2, gameMode: "eightPalace"}
];
const step99 = {...createGameState(actionOpening), steps: 99, checkpoint: {index: 8, step: 110, type: "score", requiredScore: 1}};
assert.equal(resolveGameOver(step99).gameOver, false, "Step 99 remains playable");
const step100 = applyAction(step99, {type: "reduce", indexes: [0, 1]});
assert.equal(step100.steps, 100);
assert.equal(step100.gameOver, false);
assert.notEqual(step100.gameOverReason, "step_limit");
assert.ok(step100.board.some(Boolean), "uncleared board still settles");
assert.equal(Object.values(step100.eightPalaceKeys).filter(Boolean).length, 0, "missing keys do not block settlement");

const failedFirst = resolveGameOver({...createGameState(actionOpening), steps: 10});
assert.equal(failedFirst.gameOver, true);
assert.equal(failedFirst.gameOverReason, "checkpoint_failed");
const passedFirst = resolveGameOver({
  ...createGameState(actionOpening),
  steps: 10,
  score: 506,
  collectionCards: [{value: 2, foodType: BASE_FOOD_TYPES[0]}]
});
assert.equal(passedFirst.gameOver, false);
assert.equal(passedFirst.passedCheckpointCount, 1);
assert.equal(passedFirst.checkpoint.index, 2);
assert.equal(passedFirst.checkpoint.step, 26);
assert.equal(passedFirst.checkpoint.requiredScore, convertedRequiredScore);
assert.equal(passedFirst.checkpoint.growthRate, .12);
assert.equal(passedFirst.checkpoint.generatedFromScore, 506);
assert.equal(passedFirst.checkpoint.generatedDistance, 16);
const passedDynamic = resolveGameOver({
  ...passedFirst,
  steps: passedFirst.checkpoint.step,
  score: passedFirst.checkpoint.requiredScore + 300
});
assert.equal(passedDynamic.gameOver, false);
assert.equal(passedDynamic.passedCheckpointCount, 2);
assert.equal(passedDynamic.checkpoint.index, 3);
assert.equal(passedDynamic.checkpoint.performanceRatio, (passedFirst.checkpoint.requiredScore + 300) / passedFirst.checkpoint.requiredScore);
assert.equal(passedDynamic.checkpoint.generatedFromScore, passedFirst.checkpoint.requiredScore + 300);
assert.equal(
  passedDynamic.checkpoint.requiredScore,
  getNextRequiredScore(passedFirst.checkpoint.requiredScore + 300, passedFirst.checkpoint.step, passedDynamic.checkpoint.generatedDistance, passedDynamic.checkpoint.step)
);
assert.notEqual(
  passedDynamic.checkpoint.requiredScore,
  getNextRequiredScore(passedFirst.checkpoint.requiredScore, passedFirst.checkpoint.step, passedDynamic.checkpoint.generatedDistance, passedDynamic.checkpoint.step)
);
const failedDynamic = resolveGameOver({...passedFirst, steps: passedFirst.checkpoint.step, score: 0});
assert.equal(failedDynamic.gameOverReason, "checkpoint_failed");
assert.equal(resolveGameOver({...passedFirst, steps: passedFirst.checkpoint.step, score: passedFirst.checkpoint.requiredScore}).gameOver, false);

const afterStep100 = resolveGameOver({
  ...passedDynamic,
  steps: 110,
  score: Math.ceil(500 * Math.sqrt(110)),
  checkpoint: {index: 9, step: 110, type: "score", requiredScore: 400}
});
assert.equal(afterStep100.gameOver, false);
assert.ok(afterStep100.checkpoint.step > 110);

const afterStep150 = resolveGameOver({
  ...passedDynamic,
  steps: 150,
  score: Math.ceil(600 * Math.sqrt(150)),
  checkpoint: {index: 12, step: 150, type: "score", requiredScore: 500, growthRate: .30}
});
assert.equal(afterStep150.gameOver, false);
assert.ok(afterStep150.checkpoint.step > 150);
assert.equal(afterStep150.checkpoint.growthRate, .30);

const deadEarly = resolveGameOver({
  ...createGameState(actionOpening),
  board: [{id: 1, value: 17, foodType: BASE_FOOD_TYPES[0]}, ...Array(8).fill(null)],
  steps: 73,
  checkpoint: {index: 5, step: 80, type: "score", requiredScore: 1}
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
assert.equal(
  collectionState.score,
  collectionState.collectionTimeline.reduce((sum, event) => sum + event.totalScore, 0)
);
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
assert.equal(
  nativeCollection.collectionCards[0].baseScore,
  getBaseScore(37, getNonDrinkBoardSum(createGameState(actionOpening).board))
);
const collectionPanelSource = readFileSync("src/components/EightPalaceCollectionPanel.jsx", "utf8");
assert.match(collectionPanelSource, /\+\{card\.scoreGain/);
assert.match(collectionPanelSource, /\{name\} \{card\.value\}/);
assert.match(collectionPanelSource, /getFoodCardTypeLabel/);
assert.match(collectionPanelSource, /getFoodOriginDescription/);

const hudSource = readFileSync("src/components/StepPanel.jsx", "utf8");
assert.match(hudSource, /isEightPalace \? "积分" : "金钱"/);
assert.match(hudSource, /isEightPalace \? "步数" : "时间"/);
assert.match(hudSource, /!isEightPalace && <span/);
assert.match(hudSource, /第 \{checkpoint\.index\} 检查站/);
assert.match(hudSource, /CHECKPOINT/);
assert.match(hudSource, /目标/);
assert.match(hudSource, /获得至少 1 个收藏/);
assert.match(hudSource, /还差/);
assert.match(hudSource, /领先/);
assert.match(hudSource, /checkpointProgress \* 100/);
assert.match(hudSource, /checkpoint-card--near/);
assert.match(hudSource, /checkpoint-card--imminent/);
assert.doesNotMatch(hudSource, /通行值/);

const settlementSource = readFileSync("src/components/GameOver.jsx", "utf8");
assert.match(settlementSource, /\? "本局结束"/);
assert.match(settlementSource, />积分</);
assert.match(settlementSource, />Step</);
assert.match(settlementSource, />收藏</);
assert.match(settlementSource, /第 \$\{checkpointResult\?\.index/);
assert.match(settlementSource, /检查站失败/);
assert.match(settlementSource, /还差/);
assert.doesNotMatch(settlementSource, /通行值/);
assert.doesNotMatch(settlementSource, /挑战失败|Game Over/);

console.log("dynamic checkpoint tests passed");
