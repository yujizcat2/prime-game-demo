import {
  createDifficultyInitialValues,
  createEightPalaceInitialValues
} from "../game/initialValues";
import {
  applyAction,
  createGameState,
  getBoardCount,
  getLegalActions,
  resolveGameOver
} from "../game/gameEngine";
import { gcd } from "../utils/math";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { isPrime } from "../game/prime";
import { summarizeCollectionEfficiencyTimelines } from "../game/collectionEfficiency";
import { applyHeater, isHeaterTarget } from "../game/heater";
import { getCurrentHeaterPrice } from "../game/heaterPricing";

export const SCORE_AI_DEFAULTS = Object.freeze({
  depth: 4,
  beamWidth: 50,
  maxActions: 100
});

export const HEATER_AI_COST_PENALTY_WEIGHT = 100_000;

function createScoreOpening(opening = createEightPalaceInitialValues()){
  return opening.map(card => ({
    ...card,
    gameMode: "simpleEightPalace"
  }));
}

function snapshotBoard(board){
  return board.map((piece, index) => piece ? {
    index,
    value: piece.value,
    foodType: piece.foodType,
    drinkOriginValue: piece.drinkOriginValue ?? null
  } : null);
}

function getActionKey(action){
  if(action.type === "heater") return `${action.type}:${action.index}`;
  if(action.type === "apply_one") return `${action.type}:${action.oneIndex}:${action.targetIndex}`;
  if(action.index !== undefined) return `${action.type}:${action.index}`;
  return `${action.type}:${(action.indexes ?? []).join("-")}`;
}

function getStateKey(state){
  const board = state.board.map(piece => piece ? [
    piece.value,
    piece.foodType,
    piece.drinkOriginValue ?? null,
    piece.purity ?? null,
    piece.sourceKey ?? null,
    piece.specialOne?.identity ?? null
  ] : null);

  return JSON.stringify({
    board,
    score: state.score,
    steps: state.steps,
    usedCombinationPairs: [...(state.usedCombinationPairs ?? [])].sort(),
    usedKeyTriggerValues: [...(state.usedKeyTriggerValues ?? [])].sort((a, b) => a - b)
  });
}

function compactOrigin(origin, depth = 0){
  if(!origin || depth >= 2) return null;
  if(origin.type === "combine"){
    return {
      type: origin.type,
      value: origin.value,
      parents: (origin.parents ?? []).map(parent => ({
        value: parent.value,
        foodType: parent.foodType ?? null,
        purity: parent.purity ?? null,
        origin: null
      }))
    };
  }
  if(origin.type === "reduce"){
    return {
      type: origin.type,
      value: origin.value,
      parent: origin.parent ? {
        value: origin.parent.value,
        foodType: origin.parent.foodType ?? null,
        purity: origin.parent.purity ?? null,
        origin: compactOrigin(origin.parent.origin, depth + 1)
      } : null
    };
  }
  return {type: origin.type, value: origin.value ?? null};
}

// Beam nodes only need rule-relevant board data and current score. The live
// route is never compacted; this prevents thousands of speculative nodes from
// retaining recursive UI provenance and collection display history.
function compactSearchState(state, preserveCollections = false){
  return {
    ...state,
    board: state.board.map(piece => piece ? {...piece, origin: compactOrigin(piece.origin)} : null),
    collectionCards: preserveCollections ? state.collectionCards : [],
    collectionTimeline: preserveCollections ? state.collectionTimeline : [],
    latestCollection: preserveCollections ? state.latestCollection : null
  };
}

function compactLiveState(state){
  return {
    ...compactSearchState(state),
    collectionCards: state.collectionCards,
    collectionTimeline: state.collectionTimeline,
    latestCollection: state.latestCollection
  };
}

function getImmediateScorePotential(state){
  let total = 0;
  let best = 0;

  for(const action of getLegalActions(state)){
    if(action.type !== "reduce") continue;
    const [leftIndex, rightIndex] = action.indexes ?? [];
    const left = state.board[leftIndex];
    const right = state.board[rightIndex];
    if(!left || !right) continue;
    if(left.value===right.value)continue;
    const divisor = gcd(left.value, right.value);
    let reward = 0;
    if(left.value / divisor === 1) reward += left.value;
    if(right.value / divisor === 1) reward += right.value;
    total += reward;
    best = Math.max(best, reward);
  }

  return {total, best};
}

export function evaluateScoreState(state){
  const legalActions = state.gameOver ? [] : getLegalActions(state);
  const reduceActions = legalActions.filter(action => action.type === "reduce").length;
  const remainingSteps = Math.max(0, (state.stepLimit ?? 100) - state.steps);
  const potential = getImmediateScorePotential(state);
  const urgency = remainingSteps <= 8 ? 4 : remainingSteps <= 20 ? 2 : 1;
  const terminalDeadlock = state.gameOver && state.gameOverReason === "no_legal_actions" && state.steps < state.stepLimit;

  // One point of banked score outweighs every auxiliary term. Board count is
  // intentionally absent: clearing or retaining cards has no value by itself.
  return (state.score ?? 0) * 1_000_000_000
    + potential.best * 1_000_000 * urgency
    + potential.total * 10_000
    + reduceActions * 1_000
    + legalActions.length * 10
    - (terminalDeadlock ? 100_000_000 : 0);
}

export function getScoreCandidateActions(state, {
  allowHeater = false,
  heaterUsedThisStep = false
} = {}){
  const actions = state?.gameOver ? [] : getLegalActions(state);
  if(!allowHeater || heaterUsedThisStep) return actions;
  const heaterPrice = getCurrentHeaterPrice(state);
  if((state.money ?? 0) < heaterPrice) return actions;
  return [
    ...actions,
    ...state.board.flatMap((piece, index) =>
      isHeaterTarget(piece) ? [{type: "heater", index}] : []
    )
  ];
}

function applyScoreAction(state, action){
  return action.type === "heater"
    ? resolveGameOver(applyHeater(state, action.index))
    : applyAction(state, action);
}

function shuffled(items){
  const copy = [...items];
  for(let index = copy.length - 1; index > 0; index--){
    const target = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function chooseScoreAction(state, {
  depth = SCORE_AI_DEFAULTS.depth,
  beamWidth = SCORE_AI_DEFAULTS.beamWidth,
  explore = false,
  allowHeater = false,
  heaterUsedThisStep = false
} = {}){
  if(!state || state.gameOver || state.steps >= state.stepLimit) return null;

  let frontier = [{state, firstAction: null, evaluation: evaluateScoreState(state), heaterUsedThisStep, heaterSpending: 0}];
  let best = null;
  const seen = new Map([[getStateKey(state), evaluateScoreState(state)]]);

  for(let level = 0; level < depth; level++){
    const candidates = [];

    for(const node of frontier){
      const availableActions = getScoreCandidateActions(node.state, {
        allowHeater,
        heaterUsedThisStep: node.heaterUsedThisStep
      });
      const actions = explore ? shuffled(availableActions) : availableActions;
      for(const action of actions){
        const appliedState = applyScoreAction(node.state, action);
        if(appliedState === node.state) continue;
        const heaterCost = action.type === "heater"
          ? getCurrentHeaterPrice(node.state)
          : 0;
        const heaterSpending = node.heaterSpending + heaterCost;
        const evaluation = evaluateScoreState(appliedState)
          - heaterSpending * HEATER_AI_COST_PENALTY_WEIGHT;
        const nextState = compactSearchState(appliedState, allowHeater);
        const nextHeaterUsedThisStep = action.type === "heater";
        const key = allowHeater
          ? `${getStateKey(nextState)}:${nextState.money}:${nextState.heaterUseCount}:${nextHeaterUsedThisStep}`
          : getStateKey(nextState);
        if((seen.get(key) ?? -Infinity) >= evaluation) continue;
        seen.set(key, evaluation);
        candidates.push({
          state: nextState,
          firstAction: node.firstAction ?? action,
          evaluation,
          immediateGain: nextState.score - state.score,
          heaterUsedThisStep: nextHeaterUsedThisStep,
          heaterSpending,
          tieBreaker: explore ? Math.random() : 0
        });
      }
    }

    candidates.sort((left, right) =>
      right.evaluation - left.evaluation
      || right.immediateGain - left.immediateGain
      || right.tieBreaker - left.tieBreaker
      || getActionKey(left.firstAction).localeCompare(getActionKey(right.firstAction))
    );
    frontier = candidates.slice(0, beamWidth);
    if(frontier.length === 0) break;
    if(!best || frontier[0].evaluation > best.evaluation) best = frontier[0];
  }

  return best?.firstAction ?? null;
}

function describeAction(state, action, nextState, number){
  const indexes = action.type === "apply_one"
    ? [action.oneIndex, action.targetIndex]
    : action.index !== undefined
      ? [action.index]
      : [...(action.indexes ?? [])];

  const collectionEvents = (nextState.collectionTimeline ?? [])
    .slice((state.collectionTimeline ?? []).length)
    .map(event => structuredClone(event));

  return {
    number,
    type: action.type,
    indexes,
    inputs: indexes.map(index => ({
      index,
      value: state.board[index]?.value ?? null,
      foodType: state.board[index]?.foodType ?? null
    })),
    stepBefore: state.steps,
    stepAfter: nextState.steps,
    scoreBefore: state.score,
    scoreAfter: nextState.score,
    scoreEfficiencyAfter: getScoreEfficiency(nextState.score, nextState.steps),
    scoreGain: nextState.score - state.score,
    moneyBefore: state.money ?? 0,
    moneyAfter: nextState.money ?? 0,
    moneyGain: (nextState.money ?? 0) - (state.money ?? 0),
    heaterUse: action.type === "heater" ? {
      step: state.steps,
      fromValue: state.board[action.index]?.value ?? null,
      toValue: nextState.board[action.index]?.value ?? null,
      foodType: state.board[action.index]?.foodType ?? null,
      cost: nextState.latestHeaterUse.cost,
      price: nextState.latestHeaterUse.price,
      moneyBefore: state.money ?? 0,
      moneyAfter: nextState.money ?? 0
    } : null,
    collectionEvents,
    collectionCountAfter: nextState.collectionCards.length,
    boardCountAfter: getBoardCount(nextState.board)
  };
}

export async function runScoreGame({
  depth = SCORE_AI_DEFAULTS.depth,
  beamWidth = SCORE_AI_DEFAULTS.beamWidth,
  maxActions = SCORE_AI_DEFAULTS.maxActions,
  initialOpening = null,
  explore = false,
  strategy = "score",
  allowHeater = false
} = {}){
  const opening = createScoreOpening(initialOpening ?? createEightPalaceInitialValues());
  let state = resolveGameOver(createGameState(opening));
  const initialBoard = snapshotBoard(state.board);
  const actionPath = [];
  let heaterUsedThisStep = false;

  while(!state.gameOver && state.steps < state.stepLimit && state.steps < maxActions){
    const legalActions = getScoreCandidateActions(state, {allowHeater, heaterUsedThisStep});
    if(legalActions.length === 0){
      state = {...state, gameOver: true, gameOverReason: "no_legal_actions"};
      break;
    }

    const action = strategy === "random"
      ? legalActions[Math.floor(Math.random() * legalActions.length)]
      : chooseScoreAction(state, {depth, beamWidth, explore, allowHeater, heaterUsedThisStep});
    if(!action) break;

    // Keep the exact legal set used for selection so tests and records can
    // verify that every executed action belonged to the formal game engine.
    const legalActionKeys = new Set(legalActions.map(getActionKey));
    if(!legalActionKeys.has(getActionKey(action))) throw new Error("Score AI selected an illegal action");

    const nextState = applyScoreAction(state, action);
    if(nextState === state) throw new Error("Score AI action was rejected by the formal game engine");
    actionPath.push(describeAction(state, action, nextState, actionPath.length + 1));
    heaterUsedThisStep = action.type === "heater";
    state = compactLiveState(nextState);
  }

  const completed100Steps = state.steps === state.stepLimit;
  const deadlocked = state.gameOverReason === "no_legal_actions" && !completed100Steps;
  const collectionNumberCounts = getCollectionNumberCounts(state.collectionCards);
  const heaterTimeline = actionPath.flatMap((action, index) => {
    if(!action.heaterUse) return [];
    const nextAction = actionPath.slice(index + 1).find(candidate => candidate.type !== "heater") ?? null;
    return [{
      ...action.heaterUse,
      nextAction: nextAction ? {
        type: nextAction.type,
        indexes: nextAction.indexes,
        inputs: nextAction.inputs
      } : null
    }];
  });
  const heaterSpending = heaterTimeline.reduce((sum, event) => sum + event.cost, 0);

  return {
    strategy,
    initialOpening: opening.map(card => ({...card})),
    initialBoard,
    score: state.score,
    finalScore: state.score,
    finalMoney: state.money ?? 0,
    heaterUseCount: heaterTimeline.length,
    heaterSpending,
    averageHeaterCost: heaterTimeline.length ? heaterSpending / heaterTimeline.length : 0,
    heaterTimeline,
    scoreEfficiency: getScoreEfficiency(state.score, state.steps),
    collectionCount: state.collectionCards.length,
    collectionEfficiencyTimeline: structuredClone(state.collectionEfficiencyTimeline ?? []),
    collections: state.collectionCards.map(card => structuredClone(card)),
    ...collectionNumberCounts,
    steps: state.steps,
    actions: actionPath.length,
    completed100Steps,
    deadlocked,
    gameOverReason: state.gameOverReason,
    finalBoard: snapshotBoard(state.board),
    finalBoardCount: getBoardCount(state.board),
    actionPath
  };
}

export function getCollectionNumberCounts(collections){
  let primeCollectionCount = 0;
  let compositeCollectionCount = 0;

  for(const collection of collections ?? []){
    const value = collection?.value;
    if(Number.isInteger(value) && isPrime(value)) primeCollectionCount++;
    else if(Number.isInteger(value) && value > 1) compositeCollectionCount++;
  }

  return {
    primeCollectionCount,
    compositeCollectionCount,
    otherCollectionCount: (collections?.length ?? 0) - primeCollectionCount - compositeCollectionCount
  };
}

function average(results, selector){
  return results.length
    ? results.reduce((sum, result) => sum + selector(result), 0) / results.length
    : 0;
}

export function summarizeScoreResults(results){
  const completed100StepCount = results.filter(result => result.completed100Steps).length;
  const deadlockCount = results.filter(result => result.deadlocked).length;
  const highScore = results.length
    ? results.reduce((best, result) => result.finalScore > best.finalScore ? result : best)
    : null;
  const totalPrimeCollectionCount = results.reduce((sum, result) => sum + result.primeCollectionCount, 0);
  const totalCompositeCollectionCount = results.reduce((sum, result) => sum + result.compositeCollectionCount, 0);
  const classifiedCollectionCount = totalPrimeCollectionCount + totalCompositeCollectionCount;
  const totalHeaterUseCount = results.reduce((sum, result) => sum + (result.heaterUseCount ?? 0), 0);
  const totalHeaterSpending = results.reduce((sum, result) => sum + (result.heaterSpending ?? 0), 0);
  const heaterEvents = results.flatMap(result => result.heaterTimeline ?? []);
  const heaterPrices = heaterEvents.map(event => event.price ?? event.cost);
  const priceDistribution = {
    "10": 0, "20": 0, "25": 0, "30": 0, "35": 0,
    "40": 0, "45": 0, "50": 0, "55": 0, "60+": 0
  };
  for(const event of heaterEvents){
    const price = event.price ?? event.cost;
    priceDistribution[price >= 60 ? "60+" : String(price)]++;
  }

  return {
    games: results.length,
    averageFinalScore: average(results, result => result.finalScore),
    averageFinalMoney: average(results, result => result.finalMoney ?? 0),
    averageHeaterUseCount: average(results, result => result.heaterUseCount ?? 0),
    averageHeaterSpending: average(results, result => result.heaterSpending ?? 0),
    averageHeaterCost: totalHeaterUseCount ? totalHeaterSpending / totalHeaterUseCount : 0,
    minimumHeaterCost: heaterPrices.length ? Math.min(...heaterPrices) : 0,
    maximumHeaterCost: heaterPrices.length ? Math.max(...heaterPrices) : 0,
    heaterPriceDistribution: priceDistribution,
    totalHeaterUseCount,
    totalHeaterSpending,
    averageScoreEfficiency: average(results, result => result.scoreEfficiency),
    highestScore: results.length ? Math.max(...results.map(result => result.finalScore)) : 0,
    lowestScore: results.length ? Math.min(...results.map(result => result.finalScore)) : 0,
    highestFinalMoney: results.length ? Math.max(...results.map(result => result.finalMoney ?? 0)) : 0,
    lowestFinalMoney: results.length ? Math.min(...results.map(result => result.finalMoney ?? 0)) : 0,
    averageCollectionCount: average(results, result => result.collectionCount),
    averagePrimeCollectionCount: average(results, result => result.primeCollectionCount),
    averageCompositeCollectionCount: average(results, result => result.compositeCollectionCount),
    totalPrimeCollectionCount,
    totalCompositeCollectionCount,
    primeCollectionShare: classifiedCollectionCount ? totalPrimeCollectionCount / classifiedCollectionCount : 0,
    compositeCollectionShare: classifiedCollectionCount ? totalCompositeCollectionCount / classifiedCollectionCount : 0,
    maxCollectionCount: results.length ? Math.max(...results.map(result => result.collectionCount)) : 0,
    averageSteps: average(results, result => result.steps),
    completed100StepCount,
    completed100StepRate: results.length ? completed100StepCount / results.length : 0,
    deadlockCount,
    deadlockRate: results.length ? deadlockCount / results.length : 0,
    averageCollectionEfficiencyTimeline: summarizeCollectionEfficiencyTimelines(results),
    highScore,
    results
  };
}

export async function runScoreGames({
  games = 1,
  difficulty = "medium",
  depth = SCORE_AI_DEFAULTS.depth,
  beamWidth = SCORE_AI_DEFAULTS.beamWidth,
  maxActions = SCORE_AI_DEFAULTS.maxActions,
  onProgress = null,
  compareRandom = true,
  compareHeater = false
} = {}){
  const scoreResults = [];
  const randomResults = [];
  const heaterResults = [];

  for(let gameIndex = 1; gameIndex <= games; gameIndex++){
    const opening = createDifficultyInitialValues(difficulty);
    const result = await runScoreGame({depth, beamWidth, maxActions, initialOpening: opening});
    result.gameIndex = gameIndex;
    result.openingId = gameIndex;
    scoreResults.push(result);

    if(compareHeater){
      const heaterResult = await runScoreGame({
        depth,
        beamWidth,
        maxActions,
        initialOpening: opening,
        allowHeater: true
      });
      heaterResult.gameIndex = gameIndex;
      heaterResult.openingId = gameIndex;
      heaterResults.push(heaterResult);
    }

    if(compareRandom){
      const randomResult = await runScoreGame({maxActions, initialOpening: opening, strategy: "random"});
      randomResult.gameIndex = gameIndex;
      randomResult.openingId = gameIndex;
      randomResults.push(randomResult);
    }

    onProgress?.({
      completed: gameIndex,
      total: games,
      currentGame: result,
      currentScore: result.finalScore,
      currentMoney: result.finalMoney,
      currentCollection: result.collectionCount,
      currentSteps: result.steps,
      currentDeadlocked: result.deadlocked
    });
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const scoreSummary = summarizeScoreResults(scoreResults);
  const heaterComparison = compareHeater ? summarizeScoreResults(heaterResults) : null;

  return {
    ...scoreSummary,
    depth,
    beamWidth,
    maxActions,
    difficulty,
    heaterComparison,
    heaterAverageScoreDifference: heaterComparison
      ? heaterComparison.averageFinalScore - scoreSummary.averageFinalScore
      : 0,
    randomComparison: compareRandom ? summarizeScoreResults(randomResults) : null
  };
}

export function scoreRouteSignature(result){
  return result.actionPath.map(action => `${action.type}:${action.indexes.join("-")}`).join("|");
}

export async function runFixedScoreAttempts({
  attempts = 10,
  depth = SCORE_AI_DEFAULTS.depth,
  beamWidth = SCORE_AI_DEFAULTS.beamWidth,
  maxActions = SCORE_AI_DEFAULTS.maxActions,
  fixedOpening = null,
  onProgress = null
} = {}){
  const opening = createScoreOpening(fixedOpening ?? createEightPalaceInitialValues());
  const results = [];

  for(let attemptIndex = 1; attemptIndex <= attempts; attemptIndex++){
    const result = await runScoreGame({
      depth,
      beamWidth,
      maxActions,
      initialOpening: opening,
      explore: true
    });
    result.attemptIndex = attemptIndex;
    result.routeSignature = scoreRouteSignature(result);
    results.push(result);
    onProgress?.({completed: attemptIndex, total: attempts, currentGame: result, currentScore: result.finalScore, currentMoney: result.finalMoney, currentCollection: result.collectionCount, currentSteps: result.steps, currentDeadlocked: result.deadlocked});
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return {
    ...summarizeScoreResults(results),
    attempts,
    fixedOpening: opening.map(card => ({...card})),
    distinctRouteCount: new Set(results.map(result => result.routeSignature)).size,
    distinctFinalScoreCount: new Set(results.map(result => result.finalScore)).size,
    depth,
    beamWidth,
    maxActions
  };
}

export const scoreAITestUtils = {
  getActionKey,
  getStateKey,
  getImmediateScorePotential,
  applyScoreAction
};
