import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  recordCollectionEfficiencySnapshot,
  summarizeCollectionEfficiencyTimelines
} from "../game/collectionEfficiency";
import { applyEightPalaceCollection } from "../game/collectionRules";

function stateAt(step, collectionCount, timeline = [], score = 0){
  return {
    gameMode: "simpleEightPalace",
    steps: step,
    score,
    collectionCards: Array.from({length: collectionCount}, (_, index) => ({collectionKey: `land:${index}`})),
    collectionEfficiencyTimeline: timeline
  };
}

let state = recordCollectionEfficiencySnapshot(stateAt(10, 4, [], 40));
assert.deepEqual(state.collectionEfficiencyTimeline, [{
  step: 10,
  cumulativeScore: 40,
  cumulativeCollections: 4,
  collectionEfficiency: 4,
  recent10Collections: 4
}], "Step 10 records the first snapshot");

state = recordCollectionEfficiencySnapshot(stateAt(20, 11, state.collectionEfficiencyTimeline, 110));
assert.equal(state.collectionEfficiencyTimeline.length, 2, "Step 20 does not repeat Step 10");
assert.deepEqual(state.collectionEfficiencyTimeline.map(item => item.step), [10, 20]);
assert.equal(state.collectionEfficiencyTimeline[1].collectionEfficiency, 5.5, "efficiency formula is correct");
assert.equal(state.collectionEfficiencyTimeline[1].recent10Collections, 7, "recent collection count is correct");
assert.equal(recordCollectionEfficiencySnapshot(state).collectionEfficiencyTimeline.length, 2, "same Step is not recorded twice");
assert.equal(
  recordCollectionEfficiencySnapshot({...state, steps: 21, score: 9999}).collectionEfficiencyTimeline[0].cumulativeScore,
  40,
  "historical checkpoints keep their original score instead of using final state"
);
assert.equal(recordCollectionEfficiencySnapshot(stateAt(0, 0)).collectionEfficiencyTimeline.length, 0, "Step 0 has no checkpoint");
assert.equal(
  recordCollectionEfficiencySnapshot(stateAt(30, 14, [], 140)).collectionEfficiencyTimeline[0].collectionEfficiency,
  4.67,
  "snapshot efficiency is stored to two decimals"
);

const collectible = {
  value: 1,
  foodType: "land",
  origin: {type: "reduce", parent: {value: 37, foodType: "land", scoreValue: 37}}
};
const collected = applyEightPalaceCollection(stateAt(9, 0), collectible);
const repeated = applyEightPalaceCollection(collected, collectible);
assert.equal(collected.collectionCards.length, 1);
assert.equal(repeated.collectionCards.length, 1, "repeat collection does not increase effective collection count");

const retained = {...state, gameOver: true, gameOverReason: "no_legal_actions"};
assert.deepEqual(retained.collectionEfficiencyTimeline, state.collectionEfficiencyTimeline, "deadlock retains existing snapshots");

const average = summarizeCollectionEfficiencyTimelines([
  {collectionEfficiencyTimeline: state.collectionEfficiencyTimeline},
  {collectionEfficiencyTimeline: [state.collectionEfficiencyTimeline[0]]}
]);
assert.deepEqual(average.map(item => [item.step, item.sampleCount]), [[10, 2], [20, 1]], "averages only include games that reached each checkpoint");
assert.equal(average[1].averageCollectionEfficiency, 5.5);

const testLabSource = readFileSync("src/components/TestLab.jsx", "utf8");
assert.match(testLabSource, /效率时间线/);
assert.match(testLabSource, /averageCollectionEfficiencyTimeline/);

console.log("collection efficiency tests passed");
