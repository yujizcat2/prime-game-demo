import assert from "node:assert/strict";

import {
  SMART_AI_MODES,
  collectionAITestUtils,
  runSmartGame
} from "./smartExplorer";

import {
  applySimulationAction,
  cloneSimulationState,
  createSimulationState,
  getSimulationLegalActions
} from "./simulationEngine";

import {
  getCurrentPrice,
  getRepeatPenalty
} from "../game/price";


function piece(value, foodType){
  return {
    value,
    foodType,
    purity: "pure",
    parents: null,
    parentFoods: null,
    previousValue: null
  };
}


function collectionChoiceState(){
  const state = createSimulationState([2, 3, 5]);
  state.board = Array(9).fill(null);
  state.board[0] = piece(7, "vegetable");
  state.board[1] = piece(14, "vegetable");
  state.board[2] = piece(7, "meat");
  state.board[3] = piece(21, "meat");
  state.collection.add("7:vegetable");
  state.collectionFoodTypeHistory.push("vegetable");
  return state;
}


function assertSameSourceSimulationPath(parentA, parentB, expectedSourceKey){
  const value = parentA + parentB;
  const state = createSimulationState([parentA, parentB, 2]);

  assert.equal(applySimulationAction(state, {type: "combine", indexes: [0, 1]}), true);
  const firstGeneratedCard = state.board[3];
  assert.equal(firstGeneratedCard.sourceKey, expectedSourceKey, `${value}: generated card keeps sourceKey`);
  console.log(`${value} generated: ${firstGeneratedCard.sourceKey}`);
  assert.equal(state.board[3].sourceKey, expectedSourceKey, `${value}: board keeps first sourceKey`);

  assert.equal(applySimulationAction(state, {type: "combine", indexes: [0, 1]}), true);
  const secondGeneratedCard = state.board[4];
  assert.equal(secondGeneratedCard.sourceKey, expectedSourceKey, `${value}: second generated card keeps sourceKey`);
  assert.equal(state.board[4].sourceKey, expectedSourceKey, `${value}: board keeps second sourceKey`);
  console.log(`${value} board: ${state.board[3].sourceKey} / ${state.board[4].sourceKey}`);

  const searchState = cloneSimulationState(state);
  assert.deepEqual(
    [searchState.board[3].sourceKey, searchState.board[4].sourceKey],
    [expectedSourceKey, expectedSourceKey],
    `${value}: simulation clone/search state keeps both sourceKeys`
  );
  console.log(`${value} clone/search: ${searchState.board[3].sourceKey} / ${searchState.board[4].sourceKey}`);

  const preReduceSourceKeys = [
    searchState.board[3].sourceKey,
    searchState.board[4].sourceKey
  ];
  assert.deepEqual(
    preReduceSourceKeys,
    [expectedSourceKey, expectedSourceKey],
    `${value}: C/C inputs retain sourceKeys before reduce`
  );
  console.log(`${value} before reduce: ${preReduceSourceKeys.join(" / ")}`);

  const price = getCurrentPrice(value, searchState.board, searchState.trend);
  assert.equal(applySimulationAction(searchState, {type: "reduce", indexes: [3, 4]}), true);
  const events = searchState.lastCollectionEvents;

  assert.deepEqual(
    events.map(event => event.sourceKey),
    [expectedSourceKey, expectedSourceKey],
    `${value}: batch collection events retain both sourceKeys`
  );
  console.log(`${value} collection events: ${events.map(event => event.sourceKey).join(" / ")}`);
  assert.deepEqual(
    events.map(event => event.sameSource),
    [true, true],
    `${value}: final sameSource result is true for both batch events`
  );
  console.log(`${value} sameSource: ${events.every(event => event.sameSource)}`);
  assert.deepEqual(
    events.map(event => event.reward),
    [price, -getRepeatPenalty(price)],
    `${value}: same-source twins settle as +Price then one 50% penalty`
  );
  assert.equal(events[0].first, true);
  assert.equal(events[1].sameSourceRepeat, true);
}


async function runRegressionTests(){
  const utils = collectionAITestUtils;
  const state = collectionChoiceState();
  const actions = getSimulationLegalActions(state);
  const repeated = actions.find(action =>
    action.type === "reduce" && action.indexes.includes(0) && action.indexes.includes(1)
  );
  const fresh = actions.find(action =>
    action.type === "reduce" && action.indexes.includes(2) && action.indexes.includes(3)
  );

  assert.ok(repeated && fresh, "fixture must expose both reduction routes");
  assert.equal(utils.analyzeReduceAutoCollections(state, repeated)[0].alreadyCollected, true);
  assert.deepEqual(
    utils.analyzeReduceAutoCollections(state, fresh).map(event => [event.value, event.foodType, event.alreadyCollected]),
    [[7, "meat", false]],
    "same number with a different food type must be a new slot"
  );

  const chosen = utils.chooseSmartAction(state, SMART_AI_MODES.COLLECTION, {depth: 1, beamWidth: 50});
  assert.ok(
    utils.analyzeReduceAutoCollections(state, chosen).some(event => !event.alreadyCollected),
    "new slot must beat a repeated collection"
  );

  const repeatState = cloneSimulationState(state);
  const freshState = cloneSimulationState(state);
  applySimulationAction(repeatState, repeated);
  applySimulationAction(freshState, fresh);
  assert.ok(
    utils.compareRanks(
      utils.createCollectionRank(freshState, state),
      utils.createCollectionRank(repeatState, state)
    ) < 0,
    "repeated 1 production must not accumulate like collection progress"
  );

  const imbalanced = createSimulationState([2, 3, 5]);
  imbalanced.collectionFoodTypeHistory = [
    ...Array(4).fill("meat"),
    ...Array(12).fill("vegetable"),
    ...Array(3).fill("seasoning")
  ];
  for(let index = 0; index < 4; index++) imbalanced.collection.add(`${index + 2}:meat`);
  for(let index = 0; index < 12; index++) imbalanced.collection.add(`${index + 2}:vegetable`);
  for(let index = 0; index < 3; index++) imbalanced.collection.add(`${index + 2}:seasoning`);
  const meatGain = cloneSimulationState(imbalanced);
  const vegetableGain = cloneSimulationState(imbalanced);
  meatGain.collection.add("97:meat");
  meatGain.collectionFoodTypeHistory.push("meat");
  vegetableGain.collection.add("97:vegetable");
  vegetableGain.collectionFoodTypeHistory.push("vegetable");
  assert.ok(
    utils.compareRanks(
      utils.createCollectionRank(meatGain, imbalanced),
      utils.createCollectionRank(vegetableGain, imbalanced)
    ) < 0,
    "scarce type must break ties between equally new slots"
  );

  const dead = cloneSimulationState(state);
  dead.collection.add("11:seasoning");
  dead.collectionFoodTypeHistory.push("seasoning");
  dead.board = Array(9).fill(null);
  const alive = cloneSimulationState(dead);
  alive.board[0] = piece(2, "meat");
  alive.board[1] = piece(4, "vegetable");
  assert.ok(
    utils.compareRanks(
      utils.createCollectionRank(alive, state),
      utils.createCollectionRank(dead, state)
    ) < 0,
    "an equally productive live route must beat an immediate dead end"
  );

  const lowerMoneyState = createSimulationState([2, 3, 5]);
  const higherMoneyState = cloneSimulationState(lowerMoneyState);
  lowerMoneyState.money = 20;
  higherMoneyState.money = 21;
  assert.ok(
    collectionAITestUtils.compareRanks(
      collectionAITestUtils.createMoneyRank(higherMoneyState),
      collectionAITestUtils.createMoneyRank(lowerMoneyState)
    ) < 0,
    "MONEY rank must prioritize higher accumulated money"
  );

  const formalMoneyState = createSimulationState([2, 4, 3]);
  const formalPrice = getCurrentPrice(2, formalMoneyState.board, 1);
  applySimulationAction(formalMoneyState, {type: "reduce", indexes: [0, 1]});
  assert.equal(
    formalMoneyState.money,
    formalPrice,
    "simulation must settle through the formal pre-change board price"
  );

  const repeatedMoneyState = createSimulationState([2, 4, 3]);
  repeatedMoneyState.collection.add("2:meat");
  repeatedMoneyState.collectionNumbers.add(2);
  repeatedMoneyState.previousCollection = 2;
  repeatedMoneyState.money = 20;
  const repeatedPenalty = getRepeatPenalty(
    getCurrentPrice(2, repeatedMoneyState.board, repeatedMoneyState.trend)
  );
  applySimulationAction(repeatedMoneyState, {type: "reduce", indexes: [0, 1]});
  assert.equal(
    repeatedMoneyState.money,
    20 - repeatedPenalty,
    "MONEY simulation must use the formal repeat penalty"
  );

  const sourceOrderState = createSimulationState([16, 17, 2]);
  assert.equal(applySimulationAction(sourceOrderState, {type: "combine", indexes: [0, 1]}), true);
  assert.equal(applySimulationAction(sourceOrderState, {type: "combine", indexes: [1, 0]}), true);
  assert.equal(sourceOrderState.board[3].sourceKey, "16|17");
  assert.equal(sourceOrderState.board[4].sourceKey, "16|17");
  applySimulationAction(sourceOrderState, {type: "reduce", indexes: [3, 4]});
  assert.equal(
    sourceOrderState.lastCollectionEvents[1].sameSourceRepeat,
    true,
    "simulation uses the shared same-source twin settlement"
  );

  assertSameSourceSimulationPath(9, 5, "5|9");
  assertSameSourceSimulationPath(14, 13, "13|14");
  assertSameSourceSimulationPath(13, 36, "13|36");

  const limited = await runSmartGame({
    mode: SMART_AI_MODES.MONEY,
    initialValues: [2, 4, 3],
    depth: 1,
    beamWidth: 10,
    maxActions: 1,
    yieldEvery: 100
  });
  assert.equal(limited.steps, 1, "configured Step limit must stop the game immediately");
  assert.equal(limited.hitLimit, true, "living route stopped by Step limit must be recorded");
  assert.equal(limited.actionHistory.length, limited.steps, "actual MONEY path must be retained");
  assert.equal(limited.actionHistory[0].money, limited.money, "path money must match final record");
  assert.ok(
    limited.actionHistory[0].collections.every(event =>
      event.reward === 0 || (event.base > 0 && event.liquidity > 0 && event.price === event.reward)
    ),
    "paid collection history must retain formal price components"
  );

  console.log("Collection and money AI regression cases: 14 passed");
}


async function runBenchmark(gameCount){
  globalThis.window = {setTimeout};
  const results = [];

  for(let index = 0; index < gameCount; index++){
    results.push(await runSmartGame({
      mode: SMART_AI_MODES.COLLECTION,
      depth: 4,
      beamWidth: 50,
      maxActions: 1000,
      yieldEvery: 1001
    }));
  }

  const total = key => results.reduce((sum, result) => sum + result[key], 0);
  const best = results.reduce((left, right) =>
    left.collectionCount >= right.collectionCount ? left : right
  );
  console.log(JSON.stringify({
    games: gameCount,
    averageCollectionSlots: total("collectionCount") / gameCount,
    maxCollectionSlots: best.collectionCount,
    totalAutoCollections: total("totalAutoCollectionEvents"),
    totalRepeats: total("repeatAutoCollections"),
    repeatRate: total("repeatAutoCollections") / Math.max(1, total("totalAutoCollectionEvents")),
    bestTypeCounts: best.collectionFoodTypeCounts,
    bestImbalance: best.collectionBalance.imbalance,
    protectionLimitGames: results.filter(result => result.actions === 1000).length
  }, null, 2));
}


await runRegressionTests();

const benchmarkIndex = process.argv.indexOf("--benchmark");
if(benchmarkIndex >= 0){
  await runBenchmark(Number(process.argv[benchmarkIndex + 1] ?? 1));
}
