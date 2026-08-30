import assert from "node:assert/strict";
import {
  chooseScoreAction,
  evaluateScoreState,
  runFixedScoreAttempts,
  runScoreGame,
  scoreAITestUtils
} from "../ai/eightPalaceScoreAI";
import { applyAction, createGameState, getLegalActions } from "../game/gameEngine";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { BASE_FOOD_TYPES } from "../game/rules";

const opening = createEightPalaceInitialValues();
const result = await runScoreGame({depth: 2, beamWidth: 12, maxActions: 20, initialOpening: opening});
assert.ok(result.steps <= 100, "Score AI never exceeds 100 Step");
if(result.steps === 100){
  assert.equal(result.completed100Steps, true);
  assert.equal(result.gameOverReason, "step_limit");
}
assert.notEqual(result.gameOverReason, "eight_palace_keys_missing");
assert.equal(result.finalScore, result.collections.reduce((sum, card) => sum + card.value, 0));

let replay = createGameState(opening.map(card => ({...card, gameMode: "simpleEightPalace"})));
for(const entry of result.actionPath){
  const action = {type: entry.type, indexes: entry.indexes};
  const legalKeys = new Set(getLegalActions(replay).map(scoreAITestUtils.getActionKey));
  assert.ok(legalKeys.has(scoreAITestUtils.getActionKey(action)), `action ${entry.number} is formally legal`);
  const nextState = applyAction(replay, action);
  assert.notEqual(nextState, replay);
  replay = nextState;
}
assert.equal(replay.score, result.finalScore, "AI simulation score matches formal collection score");

const atStep99 = {...createGameState(opening.map(card => ({...card, gameMode: "simpleEightPalace"}))), steps: 99};
const finalAction = chooseScoreAction(atStep99, {depth: 1, beamWidth: 8});
assert.ok(finalAction, "Score AI can select the final legal action at Step 99");
const atStep100 = applyAction(atStep99, finalAction);
assert.equal(atStep100.steps, 100);
assert.equal(atStep100.gameOverReason, "step_limit");
assert.equal(chooseScoreAction(atStep100), null, "Score AI stops at Step 100");

const equalClearState=createGameState([
  {value:43,foodType:BASE_FOOD_TYPES[0],boardIndex:0,gameMode:"simpleEightPalace"},
  {value:43,foodType:BASE_FOOD_TYPES[1],boardIndex:1,gameMode:"simpleEightPalace"}
]);
assert.deepEqual(scoreAITestUtils.getImmediateScorePotential(equalClearState),{total:0,best:0},"equal-value clear has no predicted collection reward");

const base = createGameState(opening.map(card => ({...card, gameMode: "simpleEightPalace"})));
const manyCardsHighScore = {...base, score: 200};
const sparseLowScore = {...base, board: [base.board[0], base.board[1], null, null, null, null, null, null, null], score: 10};
assert.ok(evaluateScoreState(manyCardsHighScore) > evaluateScoreState(sparseLowScore), "score beats board clearing");

const keyless = {...base, score: 50};
const keyed = {
  ...keyless,
  eightPalaceKeys: Object.fromEntries(BASE_FOOD_TYPES.map(type => [type, {foodType: type, value: 1}]))
};
assert.equal(evaluateScoreState(keyless), evaluateScoreState(keyed), "keys have no evaluation reward");

const fixed = await runFixedScoreAttempts({attempts: 2, depth: 1, beamWidth: 8, maxActions: 12, fixedOpening: opening});
assert.equal(fixed.attempts, 2);
assert.ok(fixed.distinctRouteCount >= 1);
assert.ok(fixed.distinctFinalScoreCount >= 1);

console.log("eight palace Score AI tests passed", {
  score: result.finalScore,
  collections: result.collectionCount,
  steps: result.steps
});
