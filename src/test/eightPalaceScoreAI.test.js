import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  chooseScoreAction,
  createSearchTelemetry,
  evaluateScoreState,
  getStrategicCandidateActions,
  getCollectionNumberCounts,
  runFixedScoreAttempts,
  runScoreGame,
  runScoreGames,
  scoreAITestUtils,
  summarizeScoreResults
} from "../ai/eightPalaceScoreAI";
import { applyAction, createGameState, getLegalActions } from "../game/gameEngine";
import {
  DIFFICULTY_OPENINGS,
  createEightPalaceInitialValues
} from "../game/initialValues";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { isPrime } from "../game/prime";

assert.equal(getScoreEfficiency(2834, 100), 28.34);
assert.equal(getScoreEfficiency(2400, 60), 40);
assert.equal(getScoreEfficiency(2400, 0), 0);
assert.equal(getScoreEfficiency(0, 0).toFixed(2), "0.00");
assert.deepEqual([2, 3, 5, 7].map(isPrime), [true, true, true, true]);
assert.deepEqual([4, 6, 8, 9].map(isPrime), [false, false, false, false]);
assert.equal(isPrime(1), false);
assert.deepEqual(
  getCollectionNumberCounts([{value: 1}, {value: 2}, {value: 3}, {value: 4}, {value: 9}]),
  {primeCollectionCount: 2, compositeCollectionCount: 2, otherCollectionCount: 1}
);

const opening = createEightPalaceInitialValues();
const result = await runScoreGame({depth: 2, beamWidth: 12, maxActions: 20, initialOpening: opening});
assert.ok(result.steps <= 100, "Score AI never exceeds 100 Step");
if(result.steps === 100){
  assert.equal(result.completed100Steps, true);
  assert.equal(result.gameOverReason, "step_limit");
}
assert.notEqual(result.gameOverReason, "eight_palace_keys_missing");
assert.equal(result.finalScore, result.collections.reduce((sum, card) => sum + card.scoreGain, 0));
assert.ok(Number.isInteger(result.finalScore), "AI final score remains an integer");
assert.ok(result.collections.every(card =>
  Number.isInteger(card.baseScore) &&
  Number.isInteger(card.bonusScore) &&
  Number.isInteger(card.totalScore)
), "AI collection settlements use integer scores");
assert.equal(result.finalMoney, result.collectionCount * 10 - result.heaterSpending - result.restoreSpending);
assert.equal(result.score, result.finalScore);
assert.equal(result.scoreEfficiency, getScoreEfficiency(result.score, result.steps));
assert.equal(typeof result.primeCollectionCount, "number");
assert.equal(typeof result.compositeCollectionCount, "number");
assert.equal(
  result.primeCollectionCount + result.compositeCollectionCount + result.otherCollectionCount,
  result.collections.length
);
const behaviorBeforeObservation = JSON.stringify({
  actionPath: result.actionPath,
  score: result.score,
  steps: result.steps,
  collectionCount: result.collectionCount
});
getCollectionNumberCounts(result.collections);
assert.equal(JSON.stringify({
  actionPath: result.actionPath,
  score: result.score,
  steps: result.steps,
  collectionCount: result.collectionCount
}), behaviorBeforeObservation, "collection observation does not alter AI results");
assert.ok(result.actionPath.every(action =>
  action.scoreEfficiencyAfter === getScoreEfficiency(action.scoreAfter, action.stepAfter)
));
for(const field of ["searchedNodes", "evaluatedNodes", "generatedActions", "prunedActions", "restoreCandidatesGenerated", "restoreCandidatesKept", "heaterCandidatesGenerated", "heaterCandidatesKept", "elapsedMs"]){
  assert.equal(typeof result[field], "number", `${field} telemetry is reported`);
}
assert.equal(getScoreEfficiency(0, 1).toFixed(2), "0.00");
assert.equal(getScoreEfficiency(64, 2).toFixed(2), "32.00");
assert.equal(getScoreEfficiency(160, 3).toFixed(2), "53.33");
assert.ok(getScoreEfficiency(160, 4) < getScoreEfficiency(160, 3));

for(const [difficulty, config] of Object.entries(DIFFICULTY_OPENINGS)){
  const comparison = await runScoreGames({games: 1, difficulty, depth: 1, beamWidth: 2, maxActions: 1});
  const scoreGame = comparison.results[0];
  const randomGame = comparison.randomComparison.results[0];
  assert.equal(scoreGame.initialOpening.length, config.count);
  assert.equal(new Set(scoreGame.initialOpening.map(card => card.foodType)).size, config.typeCount);
  assert.equal(scoreGame.initialOpening.reduce((sum, card) => sum + card.value, 0), config.targetSum);
  assert.deepEqual(scoreGame.initialOpening, randomGame.initialOpening, `${difficulty} uses one shared opening`);
  assert.equal(scoreGame.gameIndex, randomGame.gameIndex);
  assert.equal(scoreGame.openingId, randomGame.openingId);
  assert.equal(comparison.depth, 1);
  assert.equal(comparison.beamWidth, 2);
  assert.equal(comparison.maxActions, 1);
}

const tenGames = await runScoreGames({games: 10, difficulty: "medium", depth: 1, beamWidth: 2, maxActions: 20});
assert.equal(tenGames.results.length, 10);
assert.equal(tenGames.randomComparison.results.length, 10);
assert.ok(tenGames.results.every(game => Array.isArray(game.actionPath)));
for(let index = 0; index < 10; index++){
  const scoreGame = tenGames.results[index];
  const randomGame = tenGames.randomComparison.results[index];
  assert.equal(scoreGame.gameIndex, index + 1);
  assert.equal(randomGame.gameIndex, index + 1);
  assert.deepEqual(scoreGame.initialOpening, randomGame.initialOpening);
  assert.ok(scoreGame.actionPath.every(action => Object.hasOwn(action, "scoreEfficiencyAfter")));
  assert.ok(randomGame.actionPath.every(action => Object.hasOwn(action, "scoreEfficiencyAfter")));
}
for(const summary of [tenGames, tenGames.randomComparison]){
  const results = summary.results;
  const totalPrime = results.reduce((sum, game) => sum + game.primeCollectionCount, 0);
  const totalComposite = results.reduce((sum, game) => sum + game.compositeCollectionCount, 0);
  assert.equal(summary.averagePrimeCollectionCount, totalPrime / results.length);
  assert.equal(summary.averageCompositeCollectionCount, totalComposite / results.length);
  assert.equal(summary.primeCollectionShare, totalPrime + totalComposite ? totalPrime / (totalPrime + totalComposite) : 0);
  assert.equal(summary.compositeCollectionShare, totalPrime + totalComposite ? totalComposite / (totalPrime + totalComposite) : 0);
  const triggered = results.filter(game => game.singleFlavorTriggered);
  assert.equal(summary.singleFlavorTriggeredGameCount, triggered.length);
  assert.equal(summary.singleFlavorTriggerRate, triggered.length / results.length);
  assert.equal(
    summary.earliestSingleFlavorFirstTriggeredStep,
    triggered.length ? Math.min(...triggered.map(game => game.singleFlavorFirstTriggeredStep)) : null
  );
  assert.ok(results.every(game => Number.isInteger(game.finalScore) && !Number.isNaN(game.finalScore)));
}

const weightedSummary = summarizeScoreResults([
  {finalScore: 0, scoreEfficiency: 0, collectionCount: 1, primeCollectionCount: 1, compositeCollectionCount: 0, steps: 1, completed100Steps: false, deadlocked: false},
  {finalScore: 0, scoreEfficiency: 0, collectionCount: 9, primeCollectionCount: 0, compositeCollectionCount: 9, steps: 1, completed100Steps: false, deadlocked: false}
]);
assert.equal(weightedSummary.primeCollectionShare, 0.1, "batch share weights every classified collection equally");
assert.notEqual(weightedSummary.primeCollectionShare, 0.5, "batch share is not an average of per-game shares");

const testLabSource = readFileSync("src/components/TestLab.jsx", "utf8");
assert.match(testLabSource, /Score AI 全部测试记录/);
assert.match(testLabSource, /Random AI 全部测试记录/);
assert.match(testLabSource, /expanded && <div/);
assert.match(testLabSource, /allowExpandAll = games\.length <= 100/);

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
assert.equal(replay.money, result.finalMoney, "AI simulation money matches formal game money");

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
assert.notEqual(
  scoreAITestUtils.getStateKey(base),
  scoreAITestUtils.getStateKey({...base, board: base.board.map((piece, index) => index === 0 && piece ? {...piece, parentFoods: [{value: 99, foodType: BASE_FOOD_TYPES[0]}]} : piece)}),
  "transposition key preserves parent relation legality"
);
assert.notEqual(
  scoreAITestUtils.getStateKey(base),
  scoreAITestUtils.getStateKey({
    ...base,
    board: base.board.map((piece, index) =>
      index === 0 && piece ? {...piece, singleFlavorPenalty: true} : piece
    )
  }),
  "transposition key preserves per-instance single-flavor value"
);
const candidateState = {...base, money: 1_000};
const candidateTelemetry = createSearchTelemetry();
const allCandidates = getLegalActions(candidateState);
const strategicCandidates = getStrategicCandidateActions(candidateState, allCandidates, {telemetry: candidateTelemetry});
assert.ok(strategicCandidates.length <= 24);
assert.ok(strategicCandidates.filter(action => action.type === "restore").length <= 3);
assert.ok(strategicCandidates.filter(action => action.type === "heater").length <= 2);
assert.equal(candidateTelemetry.generatedActions, allCandidates.length);
assert.equal(candidateTelemetry.prunedActions, allCandidates.length - strategicCandidates.length);
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
assert.equal(
  fixed.averageScoreEfficiency,
  fixed.results.reduce((sum, game) => sum + game.scoreEfficiency, 0) / fixed.results.length
);

console.log("eight palace Score AI tests passed", {
  score: result.finalScore,
  collections: result.collectionCount,
  steps: result.steps,
  tenGameSingleFlavor: {
    triggeredGames: tenGames.singleFlavorTriggeredGameCount,
    triggerRate: tenGames.singleFlavorTriggerRate,
    averageFirstStep: tenGames.averageSingleFlavorFirstTriggeredStep,
    earliestFirstStep: tenGames.earliestSingleFlavorFirstTriggeredStep
  }
});
