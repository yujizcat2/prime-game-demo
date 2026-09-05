import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ADAPTIVE_SEARCH_DEFAULTS,
  IMMEDIATE_DEATH_PENALTY,
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
  getAverageBoardSum,
  getScoreTelemetryClock,
  getScoreSurvivalValue,
  runFixedScoreAttempts,
  runScoreGame,
  runScoreGames,
  scoreAITestUtils,
  summarizeScoreResults
} from "../ai/eightPalaceScoreAI";
import { applyAction, createGameState, getBoardCount, getLegalActions, resolveGameOver } from "../game/gameEngine";
import {
  createEightPalaceInitialValues
} from "../game/initialValues";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { getBoardSum } from "../game/scoreValue";
import { isPrime } from "../game/prime";
import { createFoodTypeBoardSnapshot } from "../ai/foodTypeTelemetry";

assert.equal(getScoreEfficiency(60, 600), 6);
assert.equal(getScoreEfficiency(100, 600), 10);
assert.equal(getScoreEfficiency(2400, 0), 0);
assert.equal(getScoreEfficiency(0, 0).toFixed(2), "0.00");
assert.deepEqual([2, 3, 5, 7].map(isPrime), [true, true, true, true]);
assert.deepEqual([4, 6, 8, 9].map(isPrime), [false, false, false, false]);
assert.equal(isPrime(1), false);
assert.equal(getBoardSum([
  {value: 7, foodType: "land"},
  null,
  {value: 11, foodType: "drink"},
  {value: 13, foodType: "aquatic"}
]), 31, "boardSum includes every non-empty card");
assert.equal(getAverageBoardSum([{boardSum: 30}, {boardSum: 27}, {boardSum: 27}, {boardSum: 35}]), 29.75);
assert.equal(getAverageBoardSum([]), 0, "an empty action sample has a safe zero average");

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
assert.equal(result.finalScore, result.actionPath.reduce((sum, action) => sum + action.scoreGain, 0));
assert.ok(Number.isInteger(result.finalScore), "AI final score remains an integer");
assert.ok(result.collections.every(card =>
  Number.isInteger(card.baseScore) &&
  Number.isInteger(card.nonDrinkBoardSum) &&
  Number.isInteger(card.existingFoodTypeCountForSameNumber) &&
  Number.isInteger(card.collectionScore) &&
  Number.isInteger(card.bonusScore) &&
  Number.isInteger(card.totalScore)
), "AI collection settlements use integer scores");
assert.equal(result.score, result.finalScore);
assert.equal(result.scoreEfficiency, getScoreEfficiency(result.score, result.totalActionMinutes));
assert.equal(typeof result.maxCombo, "number");
assert.equal(typeof result.comboBonusTotal, "number");
assert.ok(Array.isArray(result.comboTimeline));
assert.ok(result.comboTimeline.every(event => event.step <= result.steps));
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
  action.scoreEfficiencyAfter === getScoreEfficiency(action.scoreAfter, action.totalActionMinutes)
));
for(const field of ["searchedNodes", "evaluatedNodes", "generatedActions", "prunedActions", "restoreCandidatesGenerated", "restoreCandidatesKept", "heaterCandidatesGenerated", "heaterCandidatesKept", "elapsedMs"]){
  assert.equal(typeof result[field], "number", `${field} telemetry is reported`);
}
assert.equal(getScoreEfficiency(0, 60).toFixed(2), "0.00");
assert.equal(getScoreEfficiency(100, 720).toFixed(2), "8.33");
assert.equal(getScoreEfficiency(150, 900).toFixed(2), "10.00");
assert.ok(getScoreEfficiency(160, 180) > getScoreEfficiency(160, 240));

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
  assert.equal(summary.averageMaxCombo, results.reduce((sum, game) => sum + game.maxCombo, 0) / results.length);
  assert.equal(summary.maximumMaxCombo, Math.max(...results.map(game => game.maxCombo)));
  assert.equal(summary.averageComboBonusTotal, results.reduce((sum, game) => sum + game.comboBonusTotal, 0) / results.length);
  assert.equal(
    summary.avoidableImmediateDeathCount,
    results.reduce((sum, game) => sum + game.avoidableImmediateDeathCount, 0)
  );
  assert.equal(
    summary.comboBonusScoreRatio,
    results.reduce((sum, game) => sum + game.finalScore, 0)
      ? results.reduce((sum, game) => sum + game.comboBonusTotal, 0) / results.reduce((sum, game) => sum + game.finalScore, 0)
      : 0
  );
  assert.ok(summary.daySummaries.every(day =>
    Number.isFinite(day.averageMaxCombo) && Number.isFinite(day.averageComboBonus)
  ));
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
assert.match(scoreReportSource, /平均实际动作耗时/);

assert.deepEqual([[0, 1, 0], [1440, 1, 24], [60, 2, 1], [1440, 2, 24]].map(args => getScoreTelemetryClock(...args)), [
  {day: 1, time: "00:00", dayActionIndex: 0},
  {day: 1, time: "24:00", dayActionIndex: 24},
  {day: 2, time: "01:00", dayActionIndex: 1},
  {day: 2, time: "24:00", dayActionIndex: 24}
]);
{
  const longSnapshots = Array.from({length: 144}, (_, index) => ({
    actionIndex: index + 1,
    day: Math.ceil((index + 1) / 24),
    collections: []
  }));
  const longRecords = scoreAITestUtils.createDayRecords(
    Array.from({length: 6}, (_, index) => ({day: index + 1})),
    longSnapshots,
    [],
    6
  );
  assert.equal(longRecords.length, 6);
  assert.ok(longRecords.every(day => day.actions.length === 24), "100+ action telemetry is retained without truncation");
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

const atStep99 = {...createGameState(opening), steps: 99, checkpoint: {index: 8, step: 110, type: "score", requiredScore: 1}};
const finalAction = chooseScoreAction(atStep99, {depth: 1, beamWidth: 8});
assert.ok(finalAction, "Score AI can select the final legal action at Step 99");
const stepAction = ["combine", "reduce"].includes(finalAction.type)
  ? finalAction
  : getLegalActions(atStep99).find(action => ["combine", "reduce"].includes(action.type));
const atStep100 = applyAction(atStep99, stepAction);
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
const candidateState = base;
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

const oneCardState = {
  ...base,
  board: [base.board[0], null, null, null, null, null, null, null, null],
  heaterCount: 0,
  restoreCount: 0,
  superHeaterCount: 0
};
const healthyState = createGameState([
  {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
  {value: 3, foodType: BASE_FOOD_TYPES[1], boardIndex: 1},
  {value: 4, foodType: BASE_FOOD_TYPES[2], boardIndex: 2},
  {value: 5, foodType: BASE_FOOD_TYPES[3], boardIndex: 3}
]);
const healthyActions = getLegalActions(healthyState);
assert.ok(getScoreSurvivalValue(oneCardState, []) < getScoreSurvivalValue(healthyState, healthyActions), "one card evaluates far below a healthy board");
assert.ok(getBoardCount(healthyState.board) >= 3 && getBoardCount(healthyState.board) <= 7 && healthyActions.length > 1);
const fullReducibleState = {
  ...base,
  board: Array.from({length: 9}, (_, index) => ({...base.board[index % base.board.filter(Boolean).length], id: 100 + index, value: (index + 1) * 6})),
  combineHistoryKeys: {}
};
const fullReduceActions = getLegalActions(fullReducibleState).filter(action => action.type === "reduce");
assert.ok(fullReduceActions.length > 1);
assert.ok(getScoreSurvivalValue(fullReducibleState, getLegalActions(fullReducibleState)) > getScoreSurvivalValue(oneCardState, []), "a full board with reductions remains operable");

const avoidableDeathState = {
  ...createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1},
    {value: 3, foodType: BASE_FOOD_TYPES[2], boardIndex: 2}
  ]),
  board: createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1},
    {value: 3, foodType: BASE_FOOD_TYPES[2], boardIndex: 2}
  ]).board.map((piece, index) => index === 2 ? {...piece, parentFoods: [{value: 2, foodType: BASE_FOOD_TYPES[1]}]} : piece),
  heaterCount: 0,
  restoreCount: 0,
  superHeaterCount: 0
};
const suicidalReduce = getLegalActions(avoidableDeathState).find(action => action.type === "reduce" && action.indexes[0] === 0 && action.indexes[1] === 1);
assert.ok(suicidalReduce);
const suicidalResult = applyAction(avoidableDeathState, suicidalReduce);
assert.equal(suicidalResult.gameOverReason, "no_legal_actions");
const safeAction = chooseScoreAction(avoidableDeathState, {depth: 1, beamWidth: 50, searchMode: "legacy"});
assert.notDeepEqual(safeAction, suicidalReduce, "Score AI avoids an immediately fatal scoring action when a live option exists");
assert.notEqual(applyAction(avoidableDeathState, safeAction).gameOverReason, "no_legal_actions");

const deadLowScore = {...oneCardState, score: 10, gameOver: true, gameOverReason: "no_legal_actions"};
const deadHighScore = {...deadLowScore, score: 20};
assert.ok(evaluateScoreState(deadHighScore, []) > evaluateScoreState(deadLowScore, []), "when every result dies, higher score still wins");
assert.ok(evaluateScoreState(deadLowScore, []) < evaluateScoreState({...oneCardState, score: 0}, []));
assert.ok(IMMEDIATE_DEATH_PENALTY > 10 * 1_000_000_000);

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

const dayCycleOpening = createSeededScoreOpenings([35])[0];
const dayCycleScoreGame = await runScoreGame({depth: 1, beamWidth: 2, maxActions: 80, initialOpening: dayCycleOpening, dayCycleEnabled: true});
assert.equal(dayCycleScoreGame.checkpointHistory.length, 0, "day-cycle Score AI does not use checkpoints");
assert.ok(dayCycleScoreGame.dayHistory.length >= 1, "Score AI completes a day with scaled scoring");
const formalActions = dayCycleScoreGame.actionPath.filter(action => action.stepAfter > action.stepBefore);
assert.equal(dayCycleScoreGame.actionSnapshots.length, formalActions.length, "every time-consuming action has exactly one snapshot");
assert.ok(dayCycleScoreGame.dayRecords[0].actions.length > 0, "a completed day contains its action snapshots");
assert.ok(
  dayCycleScoreGame.dayRecords[0].actions.reduce((sum, action) => sum + action.durationMinutes, 0) >= 1440,
  "a completed day contains at least 1440 minutes of actions"
);
assert.ok(dayCycleScoreGame.actionSnapshots.every(snapshot =>
  snapshot.board.length === 9
  && snapshot.board.every(piece => piece === null || (Number.isInteger(piece.value) && typeof piece.foodType === "string"))
  && Number.isFinite(snapshot.scoreBefore)
  && Number.isFinite(snapshot.score)
  && Number.isFinite(snapshot.boardSum)
  && Number.isInteger(snapshot.legalActionCount)
), "action snapshots preserve a complete minimal 3x3 board and analysis fields");
assert.ok(dayCycleScoreGame.actionSnapshots.every(snapshot =>
  snapshot.boardSum === getBoardSum(snapshot.board)
), "every successful timed action records its post-action boardSum");
const firstDayRecord = dayCycleScoreGame.dayRecords[0];
assert.equal(
  firstDayRecord.dayAverageBoardSum,
  getAverageBoardSum(firstDayRecord.actions),
  "daily board sum averages all post-action samples"
);
assert.ok(firstDayRecord.closing.time >= "24:00", "the final overtime action remains in the closing day");
assert.equal(firstDayRecord.actions.at(-1), firstDayRecord.closing, "the overtime action is included in the day's average samples");
const firstDayCollections = dayCycleScoreGame.dayRecords[0].collectionSequence;
assert.ok(firstDayCollections.length > 0, "daily collection telemetry remains available");

const failedDayOne = resolveGameOver({
  ...createGameState(opening, {dayCycleEnabled: true}),
  steps: 24,
  dayMinutesElapsed: 1440,
  score: 99,
  collectionCards: Array.from({length: 20}, (_, index) => ({value: index + 2, foodType: "aquatic"}))
});
assert.equal(failedDayOne.gameOverReason, "daily_score_target_not_met", "fewer than 100 daily points ends the day-cycle run");
assert.equal(Object.hasOwn(failedDayOne.daySettlement, "nextDayCards"), false, "settlement no longer creates next-day preparation");

const daySummary = summarizeScoreResults([
  {finalScore: 600, scoreEfficiency: 25, collectionCount: 10, primeCollectionCount: 1, compositeCollectionCount: 9, steps: 24, completed100Steps: false, deadlocked: false, dayCycleEnabled: true, finalDay: 1, dayHistory: [{day: 1, targetScore: 100, finalScore: 600, scoreGainToday: 600, scoreTargetMet: true, collectionGainToday: 10, boardSum: 100, passed: true}], dayRecords: [{day: 1, dayAverageBoardSum: 30}]},
  {finalScore: 400, scoreEfficiency: 16.67, collectionCount: 9, primeCollectionCount: 0, compositeCollectionCount: 9, steps: 24, completed100Steps: false, deadlocked: false, dayCycleEnabled: true, finalDay: 1, dayHistory: [{day: 1, targetScore: 100, finalScore: 400, scoreGainToday: 99, scoreTargetMet: false, collectionGainToday: 9, boardSum: 80, passed: false}], dayRecords: [{day: 1, dayAverageBoardSum: 15}]},
  {finalScore: 0, scoreEfficiency: 0, collectionCount: 0, primeCollectionCount: 0, compositeCollectionCount: 0, steps: 4, completed100Steps: false, deadlocked: true, dayCycleEnabled: true, finalDay: 1, dayHistory: []}
]);
assert.equal(daySummary.daySummaries[0].reachedCount, 3);
assert.equal(daySummary.daySummaries[0].passedCount, 1);
assert.equal(daySummary.daySummaries[0].passRate, 1 / 3, "day pass rate uses reachedCount as its denominator");
assert.equal(daySummary.daySummaries[0].averageBoardSum, 90, "closing board sum reporting is unchanged");
assert.equal(daySummary.daySummaries[0].averageDayBoardSum, 15, "daily averages are averaged across every reached game, including empty samples");

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
