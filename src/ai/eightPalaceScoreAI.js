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
import { FOOD_TYPES } from "../game/rules";
import { BOARD_NATIVE_FOOD_TYPES } from "../game/nativeFoodTypes";

export const SCORE_AI_DEFAULTS = Object.freeze({
  depth: 3,
  beamWidth: 12,
  maxActions: 100
});

export const STRATEGIC_CANDIDATE_LIMITS = Object.freeze({
  normal: 24,
  restore: 3,
  heater: 2,
  total: 24
});

export const PAID_ACTION_OPTION_VALUE_WEIGHT = 100;

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
    piece.specialOne?.identity ?? null,
    (piece.parents ?? []).join(","),
    (piece.parentFoods ?? []).map(parent => `${parent.value}:${parent.foodType}`).join(",")
  ] : null);

  return JSON.stringify({
    board,
    score: state.score,
    money: state.money ?? 0,
    steps: state.steps,
    heaterUseCount: state.heaterUseCount ?? 0,
    restoreUseCount: state.restoreUseCount ?? 0,
    collectionCards: (state.collectionCards ?? []).map(card => [card.value, card.foodType]).sort(),
    combineHistoryKeys: Object.keys(state.combineHistoryKeys ?? {}).sort(),
    recentActionSignatures: [...(state.recentActionSignatures ?? [])],
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
function compactSearchState(state, preserveCollections = true){
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

function getImmediateScorePotential(state, legalActions = getLegalActions(state)){
  let total = 0;
  let best = 0;

  for(const action of legalActions){
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

export function evaluateScoreState(state, legalActions = state.gameOver ? [] : getLegalActions(state)){
  const reduceActions = legalActions.filter(action => action.type === "reduce").length;
  const remainingSteps = Math.max(0, (state.stepLimit ?? 100) - state.steps);
  const potential = getImmediateScorePotential(state, legalActions);
  const urgency = remainingSteps <= 8 ? 4 : remainingSteps <= 20 ? 2 : 1;
  const terminalDeadlock = state.gameOver && state.gameOverReason === "no_legal_actions" && state.steps < state.stepLimit;
  const collected = new Set((state.collectionCards ?? []).map(card => `${card.value}:${card.foodType}`));
  let boardNovelty = 0;
  for(const piece of state.board ?? []){
    if(piece && !collected.has(`${piece.value}:${piece.foodType}`)) boardNovelty++;
  }

  // One point of banked score outweighs every auxiliary term. Board count is
  // intentionally absent: clearing or retaining cards has no value by itself.
  return (state.score ?? 0) * 1_000_000_000
    + potential.best * 1_000_000 * urgency
    + potential.total * 10_000
    + boardNovelty * 5_000
    + reduceActions * 1_000
    + legalActions.length * 10
    + Math.min(state.money ?? 0, 200) * PAID_ACTION_OPTION_VALUE_WEIGHT
    - (terminalDeadlock ? 100_000_000 : 0);
}

export function getScoreCandidateActions(state, {
  allowHeater: _allowHeater = true,
  heaterUsedThisStep: _heaterUsedThisStep = false
} = {}){
  return state?.gameOver ? [] : getLegalActions(state);
}

function getCollectionFacts(state){
  const identities = new Set();
  const typesByValue = new Map();
  for(const card of state.collectionCards ?? []){
    identities.add(`${card.value}:${card.foodType}`);
    if(!typesByValue.has(card.value)) typesByValue.set(card.value, new Set());
    typesByValue.get(card.value).add(card.foodType);
  }
  return {identities, typesByValue};
}

function scoreRestoreCandidate(state, action, facts, boardTypes){
  const index = action.indexes[0];
  const piece = state.board[index];
  const targetType = BOARD_NATIVE_FOOD_TYPES[index];
  const targetValue = index === 4 ? piece.value + 100 : piece.value;
  const novelty = !facts.identities.has(`${targetValue}:${targetType}`);
  const progress = facts.typesByValue.get(targetValue)?.size ?? 0;
  const restoresExtinctType = targetType !== FOOD_TYPES.DRINK && !boardTypes.has(targetType);
  let followUp = 0;
  for(const other of state.board){
    if(!other || other === piece) continue;
    if(targetType === FOOD_TYPES.DRINK || other.foodType === FOOD_TYPES.DRINK){
      if(!(targetType === FOOD_TYPES.DRINK && other.foodType === FOOD_TYPES.DRINK)) followUp++;
    }else if(gcd(targetValue, other.value) > 1 || targetValue + other.value <= 202){
      followUp++;
    }
  }
  return (novelty ? 1_000 : 0)
    + progress * 120
    + (restoresExtinctType ? 400 : 0)
    + followUp * 12
    + (index === 4 && followUp > 0 ? 80 : 0);
}

function scoreHeaterCandidate(state, action){
  const index = action.indexes[0];
  const piece = state.board[index];
  const heatedValue = piece.value + 1;
  let score = 0;
  for(const other of state.board){
    if(!other || other === piece) continue;
    const divisor = gcd(heatedValue, other.value);
    if(divisor > 1) score += 80 + (heatedValue / divisor === 1 ? heatedValue * 4 : 0) + (other.value / divisor === 1 ? other.value * 4 : 0);
    if(heatedValue === other.value) score += 40;
  }
  return score;
}

function scoreNormalCandidate(state, action, facts){
  const [leftIndex, rightIndex] = action.indexes ?? [];
  const left = state.board[leftIndex];
  const right = state.board[rightIndex];
  if(!left || !right) return 0;
  if(action.type === "reduce"){
    const divisor = gcd(left.value, right.value);
    let score = 300;
    for(const piece of [left, right]){
      if(piece.value / divisor !== 1) continue;
      score += piece.value * 100;
      if(!facts.identities.has(`${piece.value}:${piece.foodType}`)) score += 2_000;
    }
    return score;
  }
  if(action.type === "combine" || action.type === "combine_ordered"){
    const value = left.value + right.value;
    let futureDivisors = 0;
    for(const piece of state.board){
      if(piece && piece !== left && piece !== right && gcd(value, piece.value) > 1) futureDivisors++;
    }
    return 100 + futureDivisors * 60 + Math.min(value, 202);
  }
  return 50;
}

export function getStrategicCandidateActions(state, legalActions, {
  limits = STRATEGIC_CANDIDATE_LIMITS,
  previousActionType = null,
  telemetry = null
} = {}){
  const facts = getCollectionFacts(state);
  const boardTypes = new Set((state.board ?? []).filter(Boolean).map(piece => piece.foodType));
  const restore = [];
  const heater = [];
  const normal = [];
  for(const action of legalActions){
    if(action.type === "restore") restore.push({action, rank: scoreRestoreCandidate(state, action, facts, boardTypes)});
    else if(action.type === "heater") heater.push({action, rank: scoreHeaterCandidate(state, action)});
    else normal.push({action, rank: scoreNormalCandidate(state, action, facts)});
  }
  const paidStreakPenalty = previousActionType === "heater" || previousActionType === "restore" ? 150 : 0;
  for(const candidate of restore) candidate.rank -= paidStreakPenalty;
  for(const candidate of heater) candidate.rank -= paidStreakPenalty;
  const sort = (left, right) => right.rank - left.rank || getActionKey(left.action).localeCompare(getActionKey(right.action));
  normal.sort(sort); restore.sort(sort); heater.sort(sort);
  const keptNormal = normal.slice(0, limits.normal);
  const keptRestore = restore.slice(0, limits.restore);
  const keptHeater = heater.slice(0, limits.heater);
  const kept = [...keptNormal, ...keptRestore, ...keptHeater]
    .sort(sort)
    .slice(0, limits.total)
    .map(candidate => candidate.action);
  if(telemetry){
    telemetry.generatedActions += legalActions.length;
    telemetry.prunedActions += legalActions.length - kept.length;
    telemetry.restoreCandidatesGenerated += restore.length;
    telemetry.restoreCandidatesKept += kept.filter(action => action.type === "restore").length;
    telemetry.heaterCandidatesGenerated += heater.length;
    telemetry.heaterCandidatesKept += kept.filter(action => action.type === "heater").length;
  }
  return kept;
}

export function createSearchTelemetry(){
  return {
    searchedNodes: 0,
    evaluatedNodes: 0,
    generatedActions: 0,
    prunedActions: 0,
    restoreCandidatesGenerated: 0,
    restoreCandidatesKept: 0,
    heaterCandidatesGenerated: 0,
    heaterCandidatesKept: 0,
    evaluationCacheHits: 0,
    legalActionCacheHits: 0,
    elapsedMs: 0
  };
}

function applyScoreAction(state, action){
  return applyAction(state, action);
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
  allowHeater: _allowHeater = true,
  heaterUsedThisStep = false,
  telemetry = null,
  candidateLimits = STRATEGIC_CANDIDATE_LIMITS
} = {}){
  if(!state || state.gameOver || state.steps >= state.stepLimit) return null;
  const startedAt = performance.now();
  const stats = telemetry ?? createSearchTelemetry();
  const legalActionCache = new Map();
  const evaluationCache = new Map();
  const getCachedLegalActions = candidateState => {
    const key = getStateKey(candidateState);
    if(legalActionCache.has(key)){ stats.legalActionCacheHits++; return legalActionCache.get(key); }
    const actions = candidateState.gameOver ? [] : getLegalActions(candidateState);
    legalActionCache.set(key, actions);
    return actions;
  };
  const getCachedEvaluation = candidateState => {
    const key = getStateKey(candidateState);
    if(evaluationCache.has(key)){ stats.evaluationCacheHits++; return evaluationCache.get(key); }
    const value = evaluateScoreState(candidateState, getCachedLegalActions(candidateState));
    evaluationCache.set(key, value);
    stats.evaluatedNodes++;
    return value;
  };
  let frontier = [{state, firstAction: null, evaluation: getCachedEvaluation(state), heaterUsedThisStep, previousActionType: null}];
  let best = null;
  const seen = new Map([[getStateKey(state), frontier[0].evaluation]]);

  for(let level = 0; level < depth; level++){
    const candidates = [];

    for(const node of frontier){
      stats.searchedNodes++;
      const legalActions = getCachedLegalActions(node.state);
      const availableActions = getStrategicCandidateActions(node.state, legalActions, {
        limits: candidateLimits,
        previousActionType: node.previousActionType,
        telemetry: stats
      });
      const actions = explore ? shuffled(availableActions) : availableActions;
      for(const action of actions){
        const appliedState = applyScoreAction(node.state, action);
        if(appliedState === node.state) continue;
        const evaluation = getCachedEvaluation(appliedState);
        const nextState = compactSearchState(appliedState);
        const nextHeaterUsedThisStep = action.type === "heater";
        const key = getStateKey(nextState);
        if((seen.get(key) ?? -Infinity) >= evaluation) continue;
        seen.set(key, evaluation);
        candidates.push({
          state: nextState,
          firstAction: node.firstAction ?? action,
          evaluation,
          immediateGain: nextState.score - state.score,
          heaterUsedThisStep: nextHeaterUsedThisStep,
          previousActionType: action.type,
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
  stats.elapsedMs += performance.now() - startedAt;
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
      fromValue: state.board[indexes[0]]?.value ?? null,
      toValue: nextState.board[indexes[0]]?.value ?? null,
      foodType: state.board[indexes[0]]?.foodType ?? null,
      cost: nextState.latestHeaterUse.cost,
      price: nextState.latestHeaterUse.price,
      moneyBefore: state.money ?? 0,
      moneyAfter: nextState.money ?? 0
    } : null,
    restoreUse: action.type === "restore" ? structuredClone(nextState.latestRestoreUse) : null,
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
  allowHeater: _allowHeater = true,
  candidateLimits = STRATEGIC_CANDIDATE_LIMITS
} = {}){
  const gameStartedAt = performance.now();
  const searchTelemetry = createSearchTelemetry();
  const opening = createScoreOpening(initialOpening ?? createEightPalaceInitialValues());
  let state = resolveGameOver(createGameState(opening));
  const initialBoard = snapshotBoard(state.board);
  const actionPath = [];
  let heaterUsedThisStep = false;

  while(!state.gameOver && state.steps < state.stepLimit && state.steps < maxActions){
    const legalActions = getScoreCandidateActions(state);
    if(legalActions.length === 0){
      state = {...state, gameOver: true, gameOverReason: "no_legal_actions"};
      break;
    }

    const action = strategy === "random"
      ? legalActions[Math.floor(Math.random() * legalActions.length)]
      : chooseStrategicAction(state, {depth, beamWidth, explore, heaterUsedThisStep, telemetry: searchTelemetry, candidateLimits});
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
  const restoreTimeline = actionPath.flatMap(action => action.restoreUse ? [action.restoreUse] : []);
  const restoreSpending = restoreTimeline.reduce((sum, event) => sum + event.cost, 0);
  const elapsedMs = performance.now() - gameStartedAt;

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
    restoreUseCount: restoreTimeline.length,
    restoreSpending,
    restoreTimeline,
    searchTelemetry: {
      ...searchTelemetry,
      elapsedMs
    },
    searchedNodes: searchTelemetry.searchedNodes,
    evaluatedNodes: searchTelemetry.evaluatedNodes,
    generatedActions: searchTelemetry.generatedActions,
    prunedActions: searchTelemetry.prunedActions,
    restoreCandidatesGenerated: searchTelemetry.restoreCandidatesGenerated,
    restoreCandidatesKept: searchTelemetry.restoreCandidatesKept,
    heaterCandidatesGenerated: searchTelemetry.heaterCandidatesGenerated,
    heaterCandidatesKept: searchTelemetry.heaterCandidatesKept,
    elapsedMs,
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

export const chooseStrategicAction = chooseScoreAction;

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
  const totalRestoreUseCount = results.reduce((sum, result) => sum + (result.restoreUseCount ?? 0), 0);
  const totalRestoreSpending = results.reduce((sum, result) => sum + (result.restoreSpending ?? 0), 0);
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
    averageRestoreUseCount: average(results, result => result.restoreUseCount ?? 0),
    averageRestoreSpending: average(results, result => result.restoreSpending ?? 0),
    totalRestoreUseCount,
    totalRestoreSpending,
    averageSearchedNodes: average(results, result => result.searchedNodes ?? 0),
    averageEvaluatedNodes: average(results, result => result.evaluatedNodes ?? 0),
    averageGeneratedActions: average(results, result => result.generatedActions ?? 0),
    averagePrunedActions: average(results, result => result.prunedActions ?? 0),
    averageRestoreCandidatesGenerated: average(results, result => result.restoreCandidatesGenerated ?? 0),
    averageRestoreCandidatesKept: average(results, result => result.restoreCandidatesKept ?? 0),
    averageHeaterCandidatesGenerated: average(results, result => result.heaterCandidatesGenerated ?? 0),
    averageHeaterCandidatesKept: average(results, result => result.heaterCandidatesKept ?? 0),
    averageElapsedMs: average(results, result => result.elapsedMs ?? 0),
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
      currentDeadlocked: result.deadlocked,
      currentSearchTelemetry: result.searchTelemetry
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
