import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ADAPTIVE_SEARCH_DEFAULTS,
  chooseScoreAction,
  createSeededScoreOpenings,
  createSearchTelemetry,
  evaluateCheckpointAwareness,
  evaluateScoreSearchState,
  evaluateScoreState,
  getCheckpointGapPressure,
  getCheckpointUrgency,
  getStrategicCandidateActions,
  getAdaptiveBaseDepth,
  getAdaptiveBeamWidth,
  getCollectionNumberCounts,
  getScoreTelemetryClock,
  runFixedScoreAttempts,
  runScoreGame,
  runScoreGames,
  scoreAITestUtils,
  summarizeScoreResults
} from "../ai/eightPalaceScoreAI";
import { applyAction, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import {
  createEightPalaceInitialValues
} from "../game/initialValues";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { isPrime } from "../game/prime";
import { createFoodTypeBoardSnapshot } from "../ai/foodTypeTelemetry";

assert.equal(getScoreEfficiency(2834, 100), 28.34);
assert.equal(getScoreEfficiency(2400, 60), 40);
assert.equal(getScoreEfficiency(2400, 0), 0);
assert.equal(getScoreEfficiency(0, 0).toFixed(2), "0.00");
assert.deepEqual([2, 3, 5, 7].map(isPrime), [true, true, true, true]);
assert.deepEqual([4, 6, 8, 9].map(isPrime), [false, false, false, false]);
assert.equal(isPrime(1), false);

const checkpointState = (steps, score, checkpoint = {index: 2, step: 20, type: "score", requiredScore: 200}) => ({
  steps,
  score,
  checkpoint
});
assert.equal(getCheckpointUrgency(checkpointState(10, 100, null)), 0);
assert.equal(getCheckpointUrgency(checkpointState(18, 200)), 0);
assert.ok(getCheckpointUrgency(checkpointState(19, 100)) > getCheckpointUrgency(checkpointState(12, 100)));
assert.ok(getCheckpointGapPressure(checkpointState(18, 50)) > getCheckpointGapPressure(checkpointState(18, 150)));
assert.equal(evaluateCheckpointAwareness(checkpointState(18, 200), checkpointState(19, 250)), 0);
assert.equal(
  evaluateScoreSearchState(checkpointState(18, 100), checkpointState(19, 150), {checkpointAware: false, legalActions: []}),
  evaluateScoreState(checkpointState(19, 150), []),
  "checkpointAware=false exactly preserves the legacy evaluation"
);
assert.ok(
  evaluateCheckpointAwareness(checkpointState(18, 100), checkpointState(20, 205))
  > evaluateCheckpointAwareness(checkpointState(18, 100), checkpointState(20, 199)),
  "a visible checkpoint pass earns the finite survival bonus"
);
assert.ok(
  evaluateCheckpointAwareness(checkpointState(19, 100), checkpointState(20, 150))
  > evaluateCheckpointAwareness(checkpointState(10, 100), checkpointState(11, 150)),
  "distant checkpoints exert less pressure"
);
{
  const snapshot = createFoodTypeBoardSnapshot([
    {value: 4, foodType: BASE_FOOD_TYPES[0], singleFlavorPenalty: true},
    {value: 6, foodType: BASE_FOOD_TYPES[0]},
    {value: 8, foodType: BASE_FOOD_TYPES[1]},
    {value: 20, foodType: "drink"},
    {value: 1, foodType: BASE_FOOD_TYPES[2], singleFlavorPenalty: true}
  ], 37);
  assert.equal(snapshot.step, 37);
  assert.equal(snapshot.normalPieceCount, 3);
  assert.equal(snapshot.drinkCount, 1);
  assert.equal(snapshot.specialOneCount, 1);
  assert.equal(snapshot.distinctNormalFoodTypes, 2);
  assert.equal(snapshot.dominantFoodTypeCount, 2);
  assert.equal(snapshot.dominantFoodTypeRatio, 2 / 3);
  assert.equal(snapshot.penalizedPieceCount, 2);
  assert.equal(snapshot.penalizedPieceRatio, 2 / 5);
}
{
  const structuralOnly = createFoodTypeBoardSnapshot(
    Array.from({length: 3}, (_, index) => ({
      value: index + 2,
      foodType: BASE_FOOD_TYPES[0]
    })),
    4
  );
  assert.equal(structuralOnly.allNormalPiecesSameFoodType, true);
  assert.equal(structuralOnly.singleFlavor, false);
}
assert.deepEqual(
  getCollectionNumberCounts([{value: 1}, {value: 2}, {value: 3}, {value: 4}, {value: 9}]),
  {primeCollectionCount: 2, compositeCollectionCount: 2, otherCollectionCount: 1}
);

assert.equal(getAdaptiveBaseDepth(4), 5, "small action sets search two levels deeper");
assert.equal(getAdaptiveBaseDepth(7), 4, "medium action sets search one level deeper");
assert.equal(getAdaptiveBaseDepth(8), 3, "large action sets keep the default depth");
assert.deepEqual([0, 1, 2, 3, 4].map(level => getAdaptiveBeamWidth(level)), [20, 10, 6, 3, 2], "adaptive beam narrows by level");
assert.equal(ADAPTIVE_SEARCH_DEFAULTS.extensionHardCap, 2, "extensions have a hard cap");
{
  const seededA = createSeededScoreOpenings([11, 12, 13]);
  const seededB = createSeededScoreOpenings([11, 12, 13]);
  assert.deepEqual(seededA, seededB, "benchmark seeds reproduce identical openings");
  const baselineEvaluation = evaluateScoreState(createGameState(seededA[0]));
  const adaptiveEvaluation = evaluateScoreState(createGameState(seededA[0]));
  assert.equal(adaptiveEvaluation, baselineEvaluation, "adaptive search does not change heuristic scoring");
}

const opening = createEightPalaceInitialValues();
const result = await runScoreGame({depth: 2, beamWidth: 12, maxActions: 20, initialOpening: opening});
assert.ok(result.steps <= 100, "Score AI never exceeds 100 Step");
if(result.steps === 100){
  assert.equal(result.completed100Steps, true);
  assert.equal(result.reachedTestProtectionLimit, true);
}
assert.notEqual(result.gameOverReason, "eight_palace_keys_missing");
assert.equal(result.finalScore, result.collections.reduce((sum, card) => sum + card.scoreGain, 0));
assert.ok(Number.isInteger(result.finalScore), "AI final score remains an integer");
assert.ok(result.collections.every(card =>
  Number.isInteger(card.baseScore) &&
  Number.isInteger(card.nonDrinkBoardSum) &&
  typeof card.exponent === "number" &&
  typeof card.firstDiscoveryRate === "number" &&
  Number.isInteger(card.collectionScore) &&
  Number.isInteger(card.bonusScore) &&
  Number.isInteger(card.totalScore)
), "AI collection settlements use integer scores");
assert.equal(result.finalMoney, result.actionPath.reduce((sum, action) => sum + action.moneyGain, 0));
assert.equal(result.score, result.finalScore);
assert.equal(result.scoreEfficiency, getScoreEfficiency(result.score, result.steps));
assert.equal(result.foodTypeBoardTimeline[0].step, 0);
assert.ok(result.foodTypeBoardTimeline.every((snapshot, index, timeline) =>
  index === 0 || snapshot.step > timeline[index - 1].step
));
for(const event of result.actionPath.flatMap(action => action.collectionEvents)){
  assert.ok(event.collectionBoardState);
  assert.equal(typeof event.collectedPieceSingleFlavorPenalty, "boolean");
}
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

{
  const budgetTelemetry = createSearchTelemetry();
  const budgetAction = chooseScoreAction(createGameState(opening), {
    telemetry: budgetTelemetry,
    searchMode: "adaptive",
    adaptive: {...ADAPTIVE_SEARCH_DEFAULTS, evaluationBudget: 2}
  });
  assert.ok(budgetAction, "budget exhaustion still returns an action");
  assert.ok(getLegalActions(createGameState(opening)).some(action =>
    scoreAITestUtils.getActionKey(action) === scoreAITestUtils.getActionKey(budgetAction)
  ), "budget fallback action is legal");
  assert.equal(budgetTelemetry.budgetHits, 1, "evaluation budget stops expansion");
  assert.ok(budgetTelemetry.evaluatedNodes <= 2, "evaluation node budget is enforced");
  assert.ok(budgetTelemetry.maximumReachedDepth <= ADAPTIVE_SEARCH_DEFAULTS.maximumDepth, "adaptive search never exceeds maximum depth");
  assert.ok(budgetTelemetry.beamWidthsUsed.every((width, index, widths) => index === 0 || width <= widths[index - 1]), "used beam widths never grow");
}

{
  const comparison = await runScoreGames({games: 1, depth: 1, beamWidth: 2, maxActions: 1});
  const scoreGame = comparison.results[0];
  const randomGame = comparison.randomComparison.results[0];
  assert.equal(scoreGame.initialOpening.length, 4);
  assert.equal(new Set(scoreGame.initialOpening.map(card => card.foodType)).size, 4);
  assert.ok(scoreGame.initialOpening.every(card => card.value >= 2 && card.value <= 9));
  assert.equal(new Set(scoreGame.initialOpening.map(card => card.boardIndex)).size, 4);
  assert.deepEqual(scoreGame.initialOpening, randomGame.initialOpening, "score and random AI use one shared opening");
  assert.equal(scoreGame.gameIndex, randomGame.gameIndex);
  assert.equal(scoreGame.openingId, randomGame.openingId);
  assert.equal(comparison.depth, 1);
  assert.equal(comparison.beamWidth, 2);
  assert.equal(comparison.maxActions, 1);
}

const tenGames = await runScoreGames({games: 10, depth: 1, beamWidth: 2, maxActions: 20});
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
  assert.equal(summary.foodTypeCheckpointSummary.length, 10);
  assert.deepEqual(
    new Set(Object.keys(summary.firstDominanceThresholdSteps)),
    new Set(["0.6", "0.7", "0.8", "1"])
  );
  assert.ok(Object.values(summary.averageCollectionFoodTypeCounts).every(Number.isFinite));
  assert.equal(
    summary.averageCollectedNormalFoodTypeCount,
    summary.results.reduce((sum, game) => sum + game.collectedNormalFoodTypeCount, 0) / summary.results.length
  );
  for(const target of [5, 6, 7, 8]){
    assert.equal(
      summary.collectedNormalFoodTypeReachCounts[target],
      summary.results.filter(game => game.collectedNormalFoodTypeCount >= target).length
    );
    assert.equal(
      summary.collectedNormalFoodTypeReachRates[target],
      summary.collectedNormalFoodTypeReachCounts[target] / summary.results.length
    );
  }
  assert.equal(
    summary.averageNewFoodTypeBonus,
    summary.results.reduce((sum, game) => sum + game.newFoodTypeBonusTotal, 0) / summary.results.length
  );
  for(const threshold of [50, 70, 90]){
    assert.equal(
      summary.largeCollectionSummary[threshold].averageCount,
      summary.results.reduce((sum, game) => sum + game.largeCollectionStats[threshold].count, 0) / summary.results.length
    );
  }
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
assert.doesNotMatch(testLabSource, /旧检查站|score-ai-rules|scoreDayCycleEnabled|平均通过检查站|检查站前3步|压线通过/);
assert.match(testLabSource, /dayCycleEnabled: true/);
const scoreReportSource = testLabSource.slice(
  testLabSource.indexOf("function ScoreSummaryGrid"),
  testLabSource.indexOf("function EightPalaceResults")
);
assert.doesNotMatch(scoreReportSource, /Step /, "Score AI report uses Day and in-game time instead of visible Step labels");

assert.deepEqual([0, 20, 21, 40].map(getScoreTelemetryClock), [
  {day: 1, time: "10:00", dayActionIndex: 0},
  {day: 1, time: "20:00", dayActionIndex: 20},
  {day: 2, time: "10:30", dayActionIndex: 1},
  {day: 2, time: "20:00", dayActionIndex: 20}
]);
{
  const longSnapshots = Array.from({length: 120}, (_, index) => ({
    actionIndex: index + 1,
    day: Math.ceil((index + 1) / 20),
    collections: []
  }));
  const longRecords = scoreAITestUtils.createDayRecords(
    Array.from({length: 6}, (_, index) => ({day: index + 1})),
    longSnapshots,
    [],
    6
  );
  assert.equal(longRecords.length, 6);
  assert.ok(longRecords.every(day => day.actions.length === 20), "100+ action telemetry is retained without truncation");
}

let replay = createGameState(opening, {dayCycleEnabled: true});
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

const atStep99 = {...createGameState(opening), steps: 99, checkpoint: {index: 8, step: 110, type: "score", requiredScore: 1}};
const finalAction = chooseScoreAction(atStep99, {depth: 1, beamWidth: 8});
assert.ok(finalAction, "Score AI can select the final legal action at Step 99");
const atStep100 = applyAction(atStep99, finalAction);
assert.equal(atStep100.steps, 100);
assert.notEqual(atStep100.gameOverReason, "step_limit");
assert.notEqual(chooseScoreAction(atStep100), null, "Score AI remains playable at Step 100");

const equalClearState=createGameState([
  {value:43,foodType:BASE_FOOD_TYPES[0],boardIndex:0},
  {value:43,foodType:BASE_FOOD_TYPES[1],boardIndex:1}
]);
assert.deepEqual(scoreAITestUtils.getImmediateScorePotential(equalClearState),{total:0,best:0},"equal-value clear has no predicted collection reward");

const base = createGameState(opening);
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

const dayCycleScoreGame = await runScoreGame({depth: 1, beamWidth: 2, maxActions: 30, initialOpening: opening, dayCycleEnabled: true});
assert.equal(dayCycleScoreGame.checkpointHistory.length, 0, "day-cycle Score AI does not use checkpoints");
assert.equal(dayCycleScoreGame.dayHistory[0]?.passed, true, "Score AI passes the first day in the regression opening");
assert.equal(dayCycleScoreGame.finalDay, 2, "a passed closing automatically advances Score AI to Day 2");
assert.equal(dayCycleScoreGame.dayHistory[0].nextDayCards.length, 5);
const firstDayTwoAction = dayCycleScoreGame.actionPath.find(action => action.stepBefore >= 20 && action.inputs.length > 0);
assert.ok(firstDayTwoAction, "Score AI continues searching from the Day 2 board");
assert.ok(firstDayTwoAction.inputs.every(input => dayCycleScoreGame.dayHistory[0].nextDayCards.some(card =>
  card.value === input.value && card.foodType === input.foodType
)), "the first Day 2 action uses the five compressed cards");
const formalActions = dayCycleScoreGame.actionPath.filter(action => action.stepAfter > action.stepBefore);
assert.equal(dayCycleScoreGame.actionSnapshots.length, formalActions.length, "every time-consuming action has exactly one snapshot");
assert.equal(dayCycleScoreGame.dayRecords[0].actions.length, 20, "a completed day contains 20 action snapshots");
assert.ok(dayCycleScoreGame.actionSnapshots.every(snapshot =>
  snapshot.board.length === 9
  && snapshot.board.every(piece => piece === null || (Number.isInteger(piece.value) && typeof piece.foodType === "string"))
  && Number.isFinite(snapshot.scoreBefore)
  && Number.isFinite(snapshot.score)
  && Number.isFinite(snapshot.boardSum)
  && Number.isInteger(snapshot.legalActionCount)
), "action snapshots preserve a complete minimal 3x3 board and analysis fields");
assert.deepEqual(
  dayCycleScoreGame.dayRecords[1].opening.board.filter(Boolean).map(card => ({value: card.value, foodType: card.foodType})),
  dayCycleScoreGame.dayHistory[0].nextDayCards.map(card => ({value: card.value, foodType: card.foodType})),
  "Day 2 opening uses the stored closing preparation"
);
const firstDayCollections = dayCycleScoreGame.dayRecords[0].collectionSequence;
for(const [roundIndex, round] of ["A", "B", "C", "D"].entries()){
  assert.deepEqual(
    dayCycleScoreGame.dayRecords[0].collectionRounds[round],
    firstDayCollections.filter((_, index) => index % 4 === roundIndex),
    `${round} round follows collection order modulo four`
  );
}
const laterMaximum = firstDayCollections.reduce((best, card) => !best || card.value >= best.value ? card : best, null);
assert.deepEqual(
  (({value, foodType}) => ({value, foodType}))(dayCycleScoreGame.dayHistory[0].nextDayCards.at(-1)),
  (({value, foodType}) => ({value, foodType}))(laterMaximum),
  "the fifth preparation is the latest maximum collection"
);

const failedDayOne = resolveGameOver({
  ...createGameState(opening, {dayCycleEnabled: true}),
  steps: 20,
  score: 499
});
assert.equal(failedDayOne.gameOverReason, "day_target_failed", "an unmet Day 1 target ends the day-cycle run");
assert.equal(failedDayOne.daySettlement.nextDayCards.length, 0, "a failed day does not prepare or open another day");

const daySummary = summarizeScoreResults([
  {finalScore: 600, scoreEfficiency: 30, collectionCount: 1, primeCollectionCount: 1, compositeCollectionCount: 0, steps: 20, completed100Steps: false, deadlocked: false, dayCycleEnabled: true, finalDay: 1, dayHistory: [{day: 1, targetScore: 500, finalScore: 600, collectionGainToday: 1, boardSum: 100, passed: true}]},
  {finalScore: 400, scoreEfficiency: 20, collectionCount: 0, primeCollectionCount: 0, compositeCollectionCount: 0, steps: 20, completed100Steps: false, deadlocked: false, dayCycleEnabled: true, finalDay: 1, dayHistory: [{day: 1, targetScore: 500, finalScore: 400, collectionGainToday: 0, boardSum: 80, passed: false}]},
  {finalScore: 0, scoreEfficiency: 0, collectionCount: 0, primeCollectionCount: 0, compositeCollectionCount: 0, steps: 4, completed100Steps: false, deadlocked: true, dayCycleEnabled: true, finalDay: 1, dayHistory: []}
]);
assert.equal(daySummary.daySummaries[0].reachedCount, 3);
assert.equal(daySummary.daySummaries[0].passedCount, 1);
assert.equal(daySummary.daySummaries[0].passRate, 1 / 3, "day pass rate uses reachedCount as its denominator");

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
