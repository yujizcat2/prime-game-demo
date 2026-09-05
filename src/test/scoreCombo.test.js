import assert from "node:assert/strict";
import { applyScoreCombo, getComboBonus } from "../game/scoreCombo";
import { advanceToNextDay, createDaySettlement } from "../game/dayCycle";

assert.deepEqual([1, 2, 3, 4, 5, 6, 20].map(getComboBonus), [0, 1, 2, 3, 4, 5, 19]);

const initial = {
  score: 0, steps: 0, comboCount: 0, maxCombo: 0, comboBonusTotal: 0,
  dayMaxCombo: 0, dayComboBonusTotal: 0, comboTimeline: [],
  collectionCards: [], collectionTimeline: [], latestCollectionRewards: []
};
const scoreAction = (state, baseScore = 10) => applyScoreCombo(state, {
  ...state, score: state.score + baseScore, steps: state.steps + 1
});

let state = initial;
const expectedBonuses = [0, 1, 2, 3, 4, 5];
for(const expectedBonus of expectedBonuses){
  const before = state.score;
  state = scoreAction(state);
  assert.equal(state.latestComboEvent.comboBonus, expectedBonus);
  assert.equal(state.score - before, 10 + expectedBonus);
}
assert.equal(state.comboCount, 6);
assert.equal(state.maxCombo, 6);
assert.equal(state.comboBonusTotal, 15);

const toolState = applyScoreCombo(state, {...state, heaterCount: 0});
assert.equal(toolState.comboCount, 6, "a no-time tool does not increase or break combo");
assert.equal(toolState.comboBonusTotal, 15);

const broken = applyScoreCombo(toolState, {...toolState, steps: toolState.steps + 1});
assert.equal(broken.comboCount, 0);
assert.equal(broken.latestComboEvent.message, "连击中断");
const restarted = scoreAction(broken, 25);
assert.equal(restarted.comboCount, 1);
assert.equal(restarted.latestComboEvent.comboBonus, 0);
assert.equal(restarted.score - broken.score, 25);

const zeroPointCollection = applyScoreCombo(state, {
  ...state,
  steps: state.steps + 1,
  collectionTimeline: [...state.collectionTimeline, {value: 2, totalScore: 0}]
});
assert.equal(zeroPointCollection.comboCount, 0, "a zero-point collection breaks combo");

const root = scoreAction(scoreAction(initial));
const left = scoreAction(root);
const right = applyScoreCombo(root, {...root, steps: root.steps + 1});
assert.equal(root.comboCount, 2, "search root is not mutated by either branch");
assert.equal(left.comboCount, 3);
assert.equal(right.comboCount, 0);

const settlement = createDaySettlement({
  ...state,
  dayCycleEnabled: true,
  day: 1,
  dayStartStep: 0,
  dayStartScore: 0,
  dayStartCollectionCount: 0,
  dayMinutesElapsed: 1440,
  board: [],
  collectionCards: Array.from({length: 10}, (_, index) => ({value: index + 2, foodType: "aquatic"})),
  steps: 24
});
assert.equal(settlement.scoreGainToday, state.score, "combo rewards are included in daily revenue");
assert.equal(settlement.maxComboToday, 6);
assert.equal(settlement.comboBonusToday, 15);

const nextDay = advanceToNextDay({
  ...state,
  dayCycleEnabled: true,
  day: 1,
  nextId: 1,
  board: [],
  collectionCards: [],
  daySettlement: {...settlement, passed: true}
});
assert.equal(nextDay.comboCount, 0);
assert.equal(nextDay.dayMaxCombo, 0);
assert.equal(nextDay.dayComboBonusTotal, 0);
assert.equal(nextDay.maxCombo, 6, "global combo record carries across days");
assert.equal(nextDay.comboBonusTotal, 15);

console.log("score combo tests passed");
