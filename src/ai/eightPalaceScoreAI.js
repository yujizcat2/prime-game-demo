import {
  createStandardInitialValues
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
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import { BOARD_NATIVE_FOOD_TYPES } from "../game/nativeFoodTypes";
import { getNonDrinkBoardSum } from "../game/scoreValue";
import {
  createCollectionFoodTypeTimeline,
  createFoodTypeBoardSnapshot,
  summarizeFoodTypeTelemetry
} from "./foodTypeTelemetry";
import { ACTIONS_PER_DAY, advanceToNextDay, getDayScoreTarget, getDayTime } from "../game/dayCycle";

export const SCORE_AI_DEFAULTS = Object.freeze({
  depth: 3,
  beamWidth: 12,
  maxActions: 500,
  searchMode: "adaptive"
});

export const ADAPTIVE_SEARCH_DEFAULTS = Object.freeze({
  beams: Object.freeze([20, 10, 6, 3, 2]),
  evaluationBudget: 640,
  maximumDepth: 5,
  extensionHardCap: 2
});

export const STRATEGIC_CANDIDATE_LIMITS = Object.freeze({
  normal: 24,
  restore: 3,
  heater: 2,
  superHeater: 1,
  total: 24
});

export const PAID_ACTION_OPTION_VALUE_WEIGHT = 100;
export const CHECKPOINT_SCORE_WEIGHT = 250_000_000;
export const CHECKPOINT_PASS_BONUS = 750_000_000;

export function getCheckpointUrgency(state){
  const checkpoint = state?.checkpoint;
  if(checkpoint?.type !== "score" || (state.score ?? 0) >= checkpoint.requiredScore) return 0;
  const remainingSteps = checkpoint.step - (state.steps ?? 0);
  if(remainingSteps <= 1) return 1;
  if(remainingSteps <= 3) return .8;
  if(remainingSteps <= 5) return .55;
  if(remainingSteps <= 8) return .3;
  return .1;
}

export function getCheckpointGapPressure(state){
  const checkpoint = state?.checkpoint;
  if(checkpoint?.type !== "score" || !checkpoint.requiredScore) return 0;
  const scoreGap = Math.max(0, checkpoint.requiredScore - (state.score ?? 0));
  if(scoreGap === 0) return 0;
  return Math.min(.5, scoreGap / checkpoint.requiredScore);
}

export function evaluateCheckpointAwareness(rootState, leafState){
  const checkpoint = rootState?.checkpoint;
  const urgency = getCheckpointUrgency(rootState);
  if(checkpoint?.type !== "score" || urgency === 0) return 0;
  const gapPressure = getCheckpointGapPressure(rootState);
  const scoreGain = Math.max(0, (leafState.score ?? 0) - (rootState.score ?? 0));
  const attainableGapWeight = .5 + gapPressure;
  const scoreValue = scoreGain * urgency * attainableGapWeight * CHECKPOINT_SCORE_WEIGHT;
  const reachesTarget = (leafState.steps ?? 0) <= checkpoint.step
    && (leafState.score ?? 0) >= checkpoint.requiredScore;
  return scoreValue + (reachesTarget ? CHECKPOINT_PASS_BONUS * urgency : 0);
}

function createScoreOpening(opening = createStandardInitialValues()){
  return opening.map(card => ({...card}));
}

function snapshotBoard(board){
  return board.map((piece, index) => piece ? {
    index,
    value: piece.value,
    foodType: piece.foodType
  } : null);
}

export function getScoreTelemetryClock(step = 0){
  const normalizedStep = Math.max(0, step);
  const day = normalizedStep === 0 ? 1 : Math.ceil(normalizedStep / ACTIONS_PER_DAY);
  const dayStartStep = (day - 1) * ACTIONS_PER_DAY;
  return {
    day,
    time: getDayTime({steps: normalizedStep, dayStartStep}),
    dayActionIndex: normalizedStep - dayStartStep
  };
}

function createOpeningSnapshot(state){
  return {
    day: state.day,
    time: getDayTime(state),
    score: state.score ?? 0,
    money: state.money ?? 0,
    collectionCount: state.collectionCards?.length ?? 0,
    board: snapshotBoard(state.board),
    boardCount: getBoardCount(state.board),
    boardSum: getNonDrinkBoardSum(state.board)
  };
}

function createTimedActionSnapshot(state, nextState, describedAction, toolsUsedSincePreviousAction){
  const foodTypes = createFoodTypeBoardSnapshot(nextState.board, nextState.steps);
  const legalActions = nextState.gameOver || nextState.daySettlement ? [] : getLegalActions(nextState);
  const collections = describedAction.collectionEvents.map(event => ({
    value: event.value,
    foodType: event.foodType,
    isNewCollection: event.isNewCollection !== false,
    scoreGain: event.totalScore ?? event.scoreGain ?? 0
  }));
  return {
    actionIndex: nextState.steps,
    day: nextState.day,
    time: getDayTime(nextState),
    dayActionIndex: nextState.steps - nextState.dayStartStep,
    scoreBefore: state.score ?? 0,
    score: nextState.score ?? 0,
    scoreGain: (nextState.score ?? 0) - (state.score ?? 0),
    money: nextState.money ?? 0,
    collectionCount: nextState.collectionCards?.length ?? 0,
    collectionGain: (nextState.collectionCards?.length ?? 0) - (state.collectionCards?.length ?? 0),
    newCollection: collections.find(event => event.isNewCollection) ?? null,
    collections,
    board: snapshotBoard(nextState.board),
    boardCount: foodTypes.boardPieceCount,
    boardSum: getNonDrinkBoardSum(nextState.board),
    foodTypeCounts: foodTypes.foodTypeCounts,
    distinctNormalFoodTypes: foodTypes.distinctNormalFoodTypes,
    dominantFoodType: foodTypes.dominantFoodType,
    dominantFoodTypeRatio: foodTypes.dominantFoodTypeRatio,
    penalizedPieceCount: foodTypes.penalizedPieceCount,
    singleFlavor: foodTypes.singleFlavor,
    legalActionCount: legalActions.length,
    combineCount: legalActions.filter(action => action.type === "combine" || action.type === "combine_ordered").length,
    reduceCount: legalActions.filter(action => action.type === "reduce").length,
    action: {
      type: describedAction.type,
      indexes: describedAction.indexes,
      inputs: describedAction.inputs
    },
    toolsUsedSincePreviousAction
  };
}

function createDayRecords(openings, actionSnapshots, dayHistory, finalDay){
  return Array.from({length: finalDay ?? 0}, (_, index) => index + 1).map(day => {
    const actions = actionSnapshots.filter(snapshot => snapshot.day === day);
    const settlement = dayHistory.find(item => item.day === day) ?? null;
    const collectionSequence = actions.flatMap(snapshot => snapshot.collections).filter(event => event.isNewCollection);
    return {
      day,
      opening: openings.find(item => item.day === day) ?? null,
      actions,
      closing: settlement ? actions.at(-1) ?? null : null,
      settlement,
      collectionSequence,
      collectionRounds: Object.fromEntries(["A", "B", "C", "D"].map((round, roundIndex) => [
        round,
        collectionSequence.filter((_, collectionIndex) => collectionIndex % 4 === roundIndex)
      ])),
      nextDayCards: settlement?.nextDayCards ?? []
    };
  });
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
    piece.singleFlavorPenalty === true,
    (piece.parents ?? []).join(","),
    (piece.parentFoods ?? []).map(parent => `${parent.value}:${parent.foodType}`).join(",")
  ] : null);

  return JSON.stringify({
    board,
    score: state.score,
    money: state.money ?? 0,
    steps: state.steps,
    heaterUseCount: state.heaterUseCount ?? 0,
    superHeaterUseCount: state.superHeaterUseCount ?? 0,
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

export function evaluateScoreSearchState(rootState, candidateState, {
  checkpointAware = true,
  legalActions = candidateState.gameOver ? [] : getLegalActions(candidateState)
} = {}){
  return evaluateScoreState(candidateState, legalActions)
    + (checkpointAware ? evaluateCheckpointAwareness(rootState, candidateState) : 0);
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

function scoreSuperHeaterCandidate(state, action){
  const nextState = applyScoreAction(state, action);
  if(nextState === state) return -Infinity;
  const before = getLegalActions(state);
  const after = nextState.gameOver ? [] : getLegalActions(nextState);
  const count = (actions, type) => actions.filter(candidate => candidate.type === type).length;
  return (after.length - before.length) * 10
    + (count(after, "reduce") - count(before, "reduce")) * 80
    + (count(after, "combine") + count(after, "combine_ordered")
      - count(before, "combine") - count(before, "combine_ordered")) * 20;
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
  const superHeater = [];
  const normal = [];
  for(const action of legalActions){
    if(action.type === "restore") restore.push({action, rank: scoreRestoreCandidate(state, action, facts, boardTypes)});
    else if(action.type === "heater") heater.push({action, rank: scoreHeaterCandidate(state, action)});
    else if(action.type === "super_heater") superHeater.push({action, rank: scoreSuperHeaterCandidate(state, action)});
    else normal.push({action, rank: scoreNormalCandidate(state, action, facts)});
  }
  const paidStreakPenalty = ["heater", "super_heater", "restore"].includes(previousActionType) ? 150 : 0;
  for(const candidate of restore) candidate.rank -= paidStreakPenalty;
  for(const candidate of heater) candidate.rank -= paidStreakPenalty;
  for(const candidate of superHeater) candidate.rank -= paidStreakPenalty;
  const sort = (left, right) => right.rank - left.rank || getActionKey(left.action).localeCompare(getActionKey(right.action));
  normal.sort(sort); restore.sort(sort); heater.sort(sort); superHeater.sort(sort);
  const keptNormal = normal.slice(0, limits.normal);
  const keptRestore = restore.slice(0, limits.restore);
  const keptHeater = heater.slice(0, limits.heater);
  const keptSuperHeater = superHeater.slice(0, limits.superHeater ?? 1);
  const kept = [...keptNormal, ...keptRestore, ...keptHeater, ...keptSuperHeater]
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
    telemetry.superHeaterCandidatesGenerated += superHeater.length;
    telemetry.superHeaterCandidatesKept += kept.filter(action => action.type === "super_heater").length;
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
    superHeaterCandidatesGenerated: 0,
    superHeaterCandidatesKept: 0,
    evaluationCacheHits: 0,
    evaluationCacheMisses: 0,
    legalActionCacheHits: 0,
    legalActionCacheMisses: 0,
    transpositionHits: 0,
    budgetHits: 0,
    maximumReachedDepth: 0,
    reachedDepthTotal: 0,
    completedSearches: 0,
    depthNodeCounts: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
    beamWidthsUsed: [],
    heaterExtensionCount: 0,
    restoreExtensionCount: 0,
    superHeaterExtensionCount: 0,
    retypeExtensionCount: 0,
    heaterExtensionChosenCount: 0,
    restoreExtensionChosenCount: 0,
    superHeaterExtensionChosenCount: 0,
    retypeExtensionChosenCount: 0,
    elapsedMs: 0
  };
}

export function getAdaptiveBeamWidth(level, beams = ADAPTIVE_SEARCH_DEFAULTS.beams){
  return beams[Math.min(level, beams.length - 1)];
}

export function getAdaptiveBaseDepth(legalActionCount, defaultDepth = SCORE_AI_DEFAULTS.depth){
  if(legalActionCount <= 4) return Math.min(ADAPTIVE_SEARCH_DEFAULTS.maximumDepth, defaultDepth + 2);
  if(legalActionCount <= 7) return Math.min(ADAPTIVE_SEARCH_DEFAULTS.maximumDepth, defaultDepth + 1);
  return defaultDepth;
}

function tacticalExtensionType(beforeState, action, afterState, beforeActions, afterActions){
  const newCollections = (afterState.collectionCards ?? []).slice((beforeState.collectionCards ?? []).length);
  if(newCollections.some(card => card.value >= 50)) return action.type;
  const beforeReduce = beforeActions.filter(candidate => candidate.type === "reduce").length;
  const afterReduce = afterActions.filter(candidate => candidate.type === "reduce").length;
  const beforeCombine = beforeActions.filter(candidate => candidate.type.startsWith("combine")).length;
  const afterCombine = afterActions.filter(candidate => candidate.type.startsWith("combine")).length;
  const recovered = beforeActions.length <= 4 && afterActions.length >= 8;
  if(["heater", "restore", "super_heater", "retype"].includes(action.type)
    && (afterReduce > beforeReduce || afterCombine > beforeCombine || recovered)) return action.type;
  if(action.type.startsWith("combine")){
    const createdLargeOrdinary = afterState.board.some((piece, index) =>
      piece && piece.value >= 50 && piece.foodType !== FOOD_TYPES.DRINK
      && beforeState.board[index]?.value !== piece.value
    );
    if(createdLargeOrdinary) return action.type;
  }
  return null;
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
  candidateLimits = STRATEGIC_CANDIDATE_LIMITS,
  searchMode = SCORE_AI_DEFAULTS.searchMode,
  adaptive = ADAPTIVE_SEARCH_DEFAULTS,
  checkpointAware = true
} = {}){
  if(!state || state.gameOver) return null;
  const startedAt = performance.now();
  const stats = telemetry ?? createSearchTelemetry();
  const adaptiveMode = searchMode === "adaptive";
  const evaluationStart = stats.evaluatedNodes;
  let budgetHit = false;
  const legalActionCache = new Map();
  const evaluationCache = new Map();
  const getCachedLegalActions = candidateState => {
    const key = getStateKey(candidateState);
    if(legalActionCache.has(key)){ stats.legalActionCacheHits++; return legalActionCache.get(key); }
    stats.legalActionCacheMisses++;
    const actions = candidateState.gameOver ? [] : getLegalActions(candidateState);
    legalActionCache.set(key, actions);
    return actions;
  };
  const getCachedEvaluation = candidateState => {
    const key = getStateKey(candidateState);
    if(evaluationCache.has(key)){ stats.evaluationCacheHits++; return evaluationCache.get(key); }
    if(adaptiveMode && stats.evaluatedNodes - evaluationStart >= adaptive.evaluationBudget) return null;
    const value = evaluateScoreSearchState(state, candidateState, {
      checkpointAware,
      legalActions: getCachedLegalActions(candidateState)
    });
    evaluationCache.set(key, value);
    stats.evaluatedNodes++;
    stats.evaluationCacheMisses++;
    return value;
  };
  let frontier = [{state, firstAction: null, evaluation: getCachedEvaluation(state), heaterUsedThisStep, previousActionType: null, extensionCount: 0, extensionTypes: []}];
  let best = null;
  const seen = new Map([[getStateKey(state), frontier[0].evaluation]]);
  const baseDepth = adaptiveMode ? getAdaptiveBaseDepth(getCachedLegalActions(state).length, depth) : depth;
  const absoluteDepth = adaptiveMode ? adaptive.maximumDepth : depth;
  let reachedDepth = 0;

  for(let level = 0; level < absoluteDepth; level++){
    const candidates = [];

    for(const node of frontier){
      if(level >= Math.min(absoluteDepth, baseDepth + node.extensionCount)) continue;
      stats.searchedNodes++;
      const legalActions = getCachedLegalActions(node.state);
      const availableActions = getStrategicCandidateActions(node.state, legalActions, {
        limits: candidateLimits,
        previousActionType: node.previousActionType,
        telemetry: stats
      });
      const actions = explore ? shuffled(availableActions) : availableActions;
      for(const action of actions){
        if(adaptiveMode && stats.evaluatedNodes - evaluationStart >= adaptive.evaluationBudget){ budgetHit = true; break; }
        const appliedState = applyScoreAction(node.state, action);
        if(appliedState === node.state) continue;
        const evaluation = getCachedEvaluation(appliedState);
        if(evaluation === null){ budgetHit = true; break; }
        const nextState = compactSearchState(appliedState);
        const nextHeaterUsedThisStep = action.type === "heater";
        const key = getStateKey(nextState);
        if((seen.get(key) ?? -Infinity) >= evaluation){ stats.transpositionHits++; continue; }
        seen.set(key, evaluation);
        const afterActions = getCachedLegalActions(nextState);
        const extensionType = adaptiveMode && node.extensionCount < adaptive.extensionHardCap
          ? tacticalExtensionType(node.state, action, nextState, legalActions, afterActions)
          : null;
        const extensionCount = node.extensionCount + (extensionType ? 1 : 0);
        const extensionTypes = extensionType ? [...node.extensionTypes, extensionType] : node.extensionTypes;
        if(extensionType === "heater") stats.heaterExtensionCount++;
        else if(extensionType === "restore") stats.restoreExtensionCount++;
        else if(extensionType === "super_heater") stats.superHeaterExtensionCount++;
        else if(extensionType === "retype") stats.retypeExtensionCount++;
        candidates.push({
          state: nextState,
          firstAction: node.firstAction ?? action,
          evaluation,
          immediateGain: nextState.score - state.score,
          heaterUsedThisStep: nextHeaterUsedThisStep,
          previousActionType: action.type,
          extensionCount,
          extensionTypes,
          tieBreaker: explore ? Math.random() : 0
        });
      }
      if(budgetHit) break;
    }

    candidates.sort((left, right) =>
      right.evaluation - left.evaluation
      || right.immediateGain - left.immediateGain
      || right.tieBreaker - left.tieBreaker
      || getActionKey(left.firstAction).localeCompare(getActionKey(right.firstAction))
    );
    const currentBeamWidth = adaptiveMode ? getAdaptiveBeamWidth(level, adaptive.beams) : beamWidth;
    stats.beamWidthsUsed.push(currentBeamWidth);
    frontier = candidates.slice(0, currentBeamWidth);
    if(frontier.length === 0) break;
    reachedDepth = level + 1;
    stats.maximumReachedDepth = Math.max(stats.maximumReachedDepth, reachedDepth);
    stats.depthNodeCounts[reachedDepth] = (stats.depthNodeCounts[reachedDepth] ?? 0) + candidates.length;
    if(!best || frontier[0].evaluation > best.evaluation) best = frontier[0];
    if(budgetHit) break;
  }
  if(budgetHit) stats.budgetHits++;
  stats.reachedDepthTotal += reachedDepth;
  stats.completedSearches++;
  for(const type of new Set(best?.extensionTypes ?? [])){
    if(type === "heater") stats.heaterExtensionChosenCount++;
    else if(type === "restore") stats.restoreExtensionChosenCount++;
    else if(type === "super_heater") stats.superHeaterExtensionChosenCount++;
    else if(type === "retype") stats.retypeExtensionChosenCount++;
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

  const collectionBoardState = createFoodTypeBoardSnapshot(nextState.board, nextState.steps);
  const preActionValues = state.board.filter(Boolean).map(piece => piece.value);
  const preActionBoardAverage = preActionValues.length
    ? preActionValues.reduce((sum, value) => sum + value, 0) / preActionValues.length
    : 0;
  const collectionEvents = (nextState.collectionTimeline ?? [])
    .slice((state.collectionTimeline ?? []).length)
    .map(event => ({
      ...structuredClone(event),
      collectionBoardState,
      preActionBoardAverage
    }));

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
      day: state.day,
      time: getDayTime(state),
      fromValue: state.board[indexes[0]]?.value ?? null,
      toValue: nextState.board[indexes[0]]?.value ?? null,
      foodType: state.board[indexes[0]]?.foodType ?? null,
      cost: nextState.latestHeaterUse.cost,
      price: nextState.latestHeaterUse.price,
      moneyBefore: state.money ?? 0,
      moneyAfter: nextState.money ?? 0
    } : null,
    superHeaterUse: action.type === "super_heater" ? {
      ...structuredClone(nextState.latestSuperHeaterUse),
      step: state.steps,
      day: state.day,
      time: getDayTime(state),
      legalActionsBefore: getLegalActions(state).length,
      legalActionsAfter: nextState.gameOver ? 0 : getLegalActions(nextState).length,
      reduceActionsBefore: getLegalActions(state).filter(candidate => candidate.type === "reduce").length,
      reduceActionsAfter: nextState.gameOver ? 0 : getLegalActions(nextState).filter(candidate => candidate.type === "reduce").length
    } : null,
    restoreUse: action.type === "restore" ? {
      ...structuredClone(nextState.latestRestoreUse),
      day: nextState.day,
      time: getDayTime(nextState)
    } : null,
    collectionEvents,
    foodTypeBoardState: collectionBoardState,
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
  candidateLimits = STRATEGIC_CANDIDATE_LIMITS,
  searchMode = SCORE_AI_DEFAULTS.searchMode,
  adaptive = ADAPTIVE_SEARCH_DEFAULTS,
  checkpointAware = true,
  dayCycleEnabled = true
} = {}){
  const gameStartedAt = performance.now();
  const searchTelemetry = createSearchTelemetry();
  const opening = createScoreOpening(initialOpening ?? createStandardInitialValues());
  let state = resolveGameOver(createGameState(opening, {dayCycleEnabled}));
  const initialBoard = snapshotBoard(state.board);
  const actionPath = [];
  const actionSnapshots = [];
  const dayOpenings = [createOpeningSnapshot(state)];
  let toolsUsedSincePreviousAction = [];
  const foodTypeBoardTimeline = [createFoodTypeBoardSnapshot(state.board, state.steps)];
  let heaterUsedThisStep = false;

  const isWithinProtectionLimit = () => dayCycleEnabled
    ? actionPath.length < maxActions
    : state.steps < maxActions;

  while(!state.gameOver && isWithinProtectionLimit()){
    const legalActions = getScoreCandidateActions(state);
    if(legalActions.length === 0){
      state = {...state, gameOver: true, gameOverReason: "no_legal_actions"};
      break;
    }

    const action = strategy === "random"
      ? legalActions[Math.floor(Math.random() * legalActions.length)]
      : chooseStrategicAction(state, {depth, beamWidth, explore, heaterUsedThisStep, telemetry: searchTelemetry, candidateLimits, searchMode, adaptive, checkpointAware});
    if(!action) break;

    // Keep the exact legal set used for selection so tests and records can
    // verify that every executed action belonged to the formal game engine.
    const legalActionKeys = new Set(legalActions.map(getActionKey));
    if(!legalActionKeys.has(getActionKey(action))) throw new Error("Score AI selected an illegal action");

    const nextState = applyScoreAction(state, action);
    if(nextState === state) throw new Error("Score AI action was rejected by the formal game engine");
    const describedAction = describeAction(state, action, nextState, actionPath.length + 1);
    actionPath.push(describedAction);
    if(nextState.steps > state.steps){
      actionSnapshots.push(createTimedActionSnapshot(state, nextState, describedAction, toolsUsedSincePreviousAction));
      toolsUsedSincePreviousAction = [];
    }else{
      toolsUsedSincePreviousAction.push({
        type: describedAction.type,
        indexes: describedAction.indexes,
        moneyBefore: describedAction.moneyBefore,
        moneyAfter: describedAction.moneyAfter
      });
    }
    if(nextState.steps > foodTypeBoardTimeline.at(-1).step){
      foodTypeBoardTimeline.push(describedAction.foodTypeBoardState);
    }
    heaterUsedThisStep = action.type === "heater";
    const continuedState =
      nextState.daySettlement?.passed
        ? advanceToNextDay(nextState)
        : nextState;
    if(continuedState.day !== nextState.day) dayOpenings.push(createOpeningSnapshot(continuedState));
    state = compactLiveState(continuedState);
  }

  const completed100Steps = state.steps >= 100;
  const reachedTestProtectionLimit = !state.gameOver && !isWithinProtectionLimit();
  const deadlocked = state.gameOverReason === "no_legal_actions";
  const collectionNumberCounts = getCollectionNumberCounts(state.collectionCards);
  const collectionFoodTypeCounts = Object.fromEntries(
    [...BASE_FOOD_TYPES, FOOD_TYPES.DRINK].map(foodType => [
      foodType,
      state.collectionCards.filter(card => card.foodType === foodType).length
    ])
  );
  const collectionFoodTypeTimeline = createCollectionFoodTypeTimeline(
    state.collectionCards,
    state.steps
  );
  const collectedNormalFoodTypeStats = getCollectedNormalFoodTypeStats(state.collectionCards);
  const newFoodTypeBonusTotal = state.collectionCards.reduce((sum, card) => sum + (card.newFoodTypeBonus ?? 0), 0);
  const largeCollectionStats = Object.fromEntries([50, 70, 90].map(threshold => {
    const cards = state.collectionCards.filter(card => card.value >= threshold);
    return [threshold, {
      count: cards.length,
      averageBoardValue: cards.length
        ? cards.reduce((sum, card) => sum + (card.boardAverageValue ?? 0), 0) / cards.length
        : null
    }];
  }));
  const dominantCollectionEntry = Object.entries(collectionFoodTypeCounts).reduce(
    (best, entry) => best === null || entry[1] > best[1] ? entry : best,
    null
  );
  const firstStructuralSingleFlavor = foodTypeBoardTimeline.find(
    snapshot => snapshot.allNormalPiecesSameFoodType
  ) ?? null;
  const finalFoodTypeBoardState = foodTypeBoardTimeline.at(-1);
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
  const superHeaterTimeline = actionPath.flatMap(action => action.superHeaterUse ? [action.superHeaterUse] : []);
  const superHeaterSpending = superHeaterTimeline.reduce((sum, event) => sum + event.cost, 0);
  const restoreTimeline = actionPath.flatMap(action => action.restoreUse ? [action.restoreUse] : []);
  const restoreSpending = restoreTimeline.reduce((sum, event) => sum + event.cost, 0);
  const elapsedMs = performance.now() - gameStartedAt;
  const dayHistory = structuredClone(state.dayHistory ?? []);
  const finalDay = state.day ?? 1;

  return {
    strategy,
    searchMode,
    checkpointAware,
    dayCycleEnabled,
    initialOpening: opening.map(card => ({...card})),
    initialBoard,
    score: state.score,
    finalScore: state.score,
    finalMoney: state.money ?? 0,
    heaterUseCount: heaterTimeline.length,
    heaterSpending,
    averageHeaterCost: heaterTimeline.length ? heaterSpending / heaterTimeline.length : 0,
    heaterTimeline,
    superHeaterUseCount: superHeaterTimeline.length,
    superHeaterSpending,
    superHeaterTimeline,
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
    superHeaterCandidatesGenerated: searchTelemetry.superHeaterCandidatesGenerated,
    superHeaterCandidatesKept: searchTelemetry.superHeaterCandidatesKept,
    budgetHits: searchTelemetry.budgetHits,
    maximumReachedDepth: searchTelemetry.maximumReachedDepth,
    averageReachedDepth: searchTelemetry.completedSearches ? searchTelemetry.reachedDepthTotal / searchTelemetry.completedSearches : 0,
    evaluationCacheHits: searchTelemetry.evaluationCacheHits,
    evaluationCacheMisses: searchTelemetry.evaluationCacheMisses,
    transpositionHits: searchTelemetry.transpositionHits,
    elapsedMs,
    scoreEfficiency: getScoreEfficiency(state.score, state.steps),
    collectionCount: state.collectionCards.length,
    collectionEfficiencyTimeline: structuredClone(state.collectionEfficiencyTimeline ?? []),
    collections: state.collectionCards.map(card => structuredClone(card)),
    collectionFoodTypeCounts,
    collectionFoodTypeTimeline,
    collectedNormalFoodTypeCount: collectedNormalFoodTypeStats.count,
    firstCollectedNormalFoodTypeSteps: collectedNormalFoodTypeStats.firstSteps,
    newFoodTypeBonusTotal,
    largeCollectionStats,
    dominantCollectionFoodType: dominantCollectionEntry?.[0] ?? null,
    dominantCollectionFoodTypeCount: dominantCollectionEntry?.[1] ?? 0,
    dominantCollectionFoodTypeRatio: state.collectionCards.length
      ? (dominantCollectionEntry?.[1] ?? 0) / state.collectionCards.length
      : 0,
    ...collectionNumberCounts,
    steps: state.steps,
    actions: actionPath.length,
    completed100Steps,
    reachedTestProtectionLimit,
    passedCheckpointCount: state.passedCheckpointCount ?? 0,
    checkpointHistory: structuredClone(state.checkpointHistory ?? []),
    dayHistory,
    dayOpenings,
    actionSnapshots,
    dayRecords: createDayRecords(dayOpenings, actionSnapshots, dayHistory, finalDay),
    finalDay,
    completedDayCount: (state.dayHistory ?? []).filter(day => day.passed).length,
    deadlocked,
    gameOverReason: state.gameOverReason,
    finalBoard: snapshotBoard(state.board),
    finalBoardCount: getBoardCount(state.board),
    singleFlavorTriggered: state.singleFlavorTriggered === true,
    singleFlavorFirstTriggeredStep: state.singleFlavorFirstTriggeredStep ?? null,
    singleFlavorFirstTriggeredBoardCount: state.singleFlavorFirstTriggeredBoardCount ?? null,
    firstSingleFlavorNormalPieceCount: state.firstSingleFlavorNormalPieceCount ?? null,
    structuralSingleFlavorReached: firstStructuralSingleFlavor !== null,
    firstStructuralSingleFlavorStep: firstStructuralSingleFlavor?.step ?? null,
    maximumDominantFoodTypeRatio: Math.max(
      ...foodTypeBoardTimeline.map(snapshot => snapshot.dominantFoodTypeRatio)
    ),
    finalFoodTypeBoardState,
    finalSingleFlavorPenaltyCount: state.board.filter(piece => piece?.singleFlavorPenalty === true).length,
    foodTypeBoardTimeline,
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

function getCollectedNormalFoodTypeStats(collections){
  const seen = new Set();
  const firstSteps = {5: null, 6: null, 7: null, 8: null};
  for(const card of collections ?? []){
    if(!BASE_FOOD_TYPES.includes(card.foodType) || seen.has(card.foodType)) continue;
    seen.add(card.foodType);
    if(seen.size >= 5) firstSteps[seen.size] = card.step ?? null;
  }
  return {count: seen.size, firstSteps};
}

function percentile(values, ratio){
  if(values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]) * fraction;
}

function thresholdCollectionSummary(results, threshold){
  const events = results.flatMap(result => (result.actionPath ?? []).flatMap(action =>
    (action.collectionEvents ?? []).filter(event => event.isNewCollection !== false && event.value >= threshold)
  ));
  return {
    averagePerGame: results.length ? events.length / results.length : 0,
    averagePreActionBoardAverage: average(events, event => event.preActionBoardAverage ?? 0)
  };
}

export function summarizeScoreResults(results){
  const completed100StepCount = results.filter(result => result.completed100Steps).length;
  const deadlockCount = results.filter(result => result.deadlocked).length;
  const maximumDay = results.length ? Math.max(0, ...results.map(result => result.finalDay ?? 0)) : 0;
  const daySummaries = Array.from({length: maximumDay}, (_, index) => index + 1).map(day => {
    const reached = results.filter(result => (result.finalDay ?? 0) >= day);
    const settlements = reached.flatMap(result => {
      const settlement = (result.dayHistory ?? []).find(item => item.day === day);
      return settlement ? [settlement] : [];
    });
    const passedCount = settlements.filter(settlement => settlement.passed).length;
    const preparations = settlements.filter(settlement => settlement.nextDayCards?.length > 0);
    return {
      day,
      targetScore: getDayScoreTarget(day),
      reachedCount: reached.length,
      passedCount,
      passRate: reached.length ? passedCount / reached.length : 0,
      averageClosingScore: average(settlements, settlement => settlement.finalScore),
      averageLeadOrDeficit: average(settlements, settlement => settlement.finalScore - settlement.targetScore),
      averageScoreGainToday: average(settlements, settlement => settlement.scoreGainToday),
      averageCollectionCount: average(settlements, settlement => settlement.collectionGainToday),
      averageBoardSum: average(settlements, settlement => settlement.boardSum),
      averagePreparationValues: Array.from({length: 5}, (_, cardIndex) => average(
        preparations.filter(settlement => settlement.nextDayCards[cardIndex]),
        settlement => settlement.nextDayCards[cardIndex].value
      )),
      averagePreparationMaximum: average(preparations, settlement => Math.max(...settlement.nextDayCards.map(card => card.value))),
      averagePreparationSum: average(preparations, settlement => settlement.nextDayCards.reduce((sum, card) => sum + card.value, 0))
    };
  });
  const highScore = results.length
    ? results.reduce((best, result) => result.finalScore > best.finalScore ? result : best)
    : null;
  const totalPrimeCollectionCount = results.reduce((sum, result) => sum + result.primeCollectionCount, 0);
  const totalCompositeCollectionCount = results.reduce((sum, result) => sum + result.compositeCollectionCount, 0);
  const classifiedCollectionCount = totalPrimeCollectionCount + totalCompositeCollectionCount;
  const totalHeaterUseCount = results.reduce((sum, result) => sum + (result.heaterUseCount ?? 0), 0);
  const totalHeaterSpending = results.reduce((sum, result) => sum + (result.heaterSpending ?? 0), 0);
  const totalSuperHeaterUseCount = results.reduce((sum, result) => sum + (result.superHeaterUseCount ?? 0), 0);
  const totalSuperHeaterSpending = results.reduce((sum, result) => sum + (result.superHeaterSpending ?? 0), 0);
  const totalRestoreUseCount = results.reduce((sum, result) => sum + (result.restoreUseCount ?? 0), 0);
  const totalRestoreSpending = results.reduce((sum, result) => sum + (result.restoreSpending ?? 0), 0);
  const singleFlavorResults = results.filter(result => result.singleFlavorTriggered);
  const foodTypeTelemetry = summarizeFoodTypeTelemetry(results);
  const heaterEvents = results.flatMap(result => result.heaterTimeline ?? []);
  const collectedTypeTargets = [5, 6, 7, 8];
  const collectedNormalFoodTypeReachCounts = Object.fromEntries(collectedTypeTargets.map(target => [
    target,
    results.filter(result => (result.collectedNormalFoodTypeCount ?? 0) >= target).length
  ]));
  const averageFirstCollectedNormalFoodTypeSteps = Object.fromEntries(collectedTypeTargets.map(target => {
    const reached = results.filter(result => result.firstCollectedNormalFoodTypeSteps?.[target] != null);
    return [target, reached.length ? average(reached, result => result.firstCollectedNormalFoodTypeSteps[target]) : null];
  }));
  const totalFinalScore = results.reduce((sum, result) => sum + result.finalScore, 0);
  const totalNewFoodTypeBonus = results.reduce((sum, result) => sum + (result.newFoodTypeBonusTotal ?? 0), 0);
  const largeCollectionSummary = Object.fromEntries([50, 70, 90].map(threshold => {
    const totalCount = results.reduce((sum, result) => sum + (result.largeCollectionStats?.[threshold]?.count ?? 0), 0);
    const boardValueTotal = results.reduce((sum, result) => {
      const stats = result.largeCollectionStats?.[threshold];
      return sum + (stats?.averageBoardValue ?? 0) * (stats?.count ?? 0);
    }, 0);
    return [threshold, {
      averageCount: results.length ? totalCount / results.length : 0,
      averageBoardValue: totalCount ? boardValueTotal / totalCount : null
    }];
  }));
  const heaterPrices = heaterEvents.map(event => event.price ?? event.cost);
  const priceDistribution = {
    "10": 0, "20": 0, "25": 0, "30": 0, "35": 0,
    "40": 0, "45": 0, "50": 0, "55": 0, "60+": 0
  };
  for(const event of heaterEvents){
    const price = event.price ?? event.cost;
    priceDistribution[price >= 60 ? "60+" : String(price)]++;
  }
  const scores = results.map(result => result.finalScore);
  const times = results.map(result => result.elapsedMs ?? 0);
  const meanScore = average(results, result => result.finalScore);
  const scoreStandardDeviation = results.length
    ? Math.sqrt(scores.reduce((sum, score) => sum + (score - meanScore) ** 2, 0) / results.length)
    : 0;
  const scoreBands = {
    under2000: scores.filter(score => score < 2000).length,
    under3000: scores.filter(score => score < 3000).length,
    under4000: scores.filter(score => score < 4000).length,
    under5000: scores.filter(score => score < 5000).length,
    from5000To8000: scores.filter(score => score >= 5000 && score < 8000).length,
    from8000To10000: scores.filter(score => score >= 8000 && score < 10000).length,
    atLeast10000: scores.filter(score => score >= 10000).length,
    atLeast12000: scores.filter(score => score >= 12000).length
  };
  const sumSearch = field => results.reduce((sum, result) => sum + (result.searchTelemetry?.[field] ?? 0), 0);

  return {
    ...foodTypeTelemetry,
    games: results.length,
    averageFinalScore: meanScore,
    medianFinalScore: percentile(scores, .5),
    scoreStandardDeviation,
    scoreP10: percentile(scores, .1),
    scoreP25: percentile(scores, .25),
    scoreP75: percentile(scores, .75),
    scoreP90: percentile(scores, .9),
    scoreBands,
    largeCollections: {
      atLeast50: thresholdCollectionSummary(results, 50),
      atLeast70: thresholdCollectionSummary(results, 70),
      atLeast90: thresholdCollectionSummary(results, 90),
      atLeast100: thresholdCollectionSummary(results, 100)
    },
    averageCollectedNormalFoodTypeCount: average(results, result => result.collectedNormalFoodTypeCount ?? 0),
    collectedNormalFoodTypeReachCounts,
    collectedNormalFoodTypeReachRates: Object.fromEntries(collectedTypeTargets.map(target => [
      target,
      results.length ? collectedNormalFoodTypeReachCounts[target] / results.length : 0
    ])),
    averageFirstCollectedNormalFoodTypeSteps,
    averageNewFoodTypeBonus: average(results, result => result.newFoodTypeBonusTotal ?? 0),
    newFoodTypeBonusScoreRatio: totalFinalScore ? totalNewFoodTypeBonus / totalFinalScore : 0,
    combinedAuxiliaryBonusScoreRatio: totalFinalScore ? totalNewFoodTypeBonus / totalFinalScore : 0,
    largeCollectionSummary,
    averageFinalMoney: average(results, result => result.finalMoney ?? 0),
    averageHeaterUseCount: average(results, result => result.heaterUseCount ?? 0),
    averageHeaterSpending: average(results, result => result.heaterSpending ?? 0),
    averageHeaterCost: totalHeaterUseCount ? totalHeaterSpending / totalHeaterUseCount : 0,
    minimumHeaterCost: heaterPrices.length ? Math.min(...heaterPrices) : 0,
    maximumHeaterCost: heaterPrices.length ? Math.max(...heaterPrices) : 0,
    heaterPriceDistribution: priceDistribution,
    totalHeaterUseCount,
    totalHeaterSpending,
    averageSuperHeaterUseCount: average(results, result => result.superHeaterUseCount ?? 0),
    averageSuperHeaterSpending: average(results, result => result.superHeaterSpending ?? 0),
    totalSuperHeaterUseCount,
    totalSuperHeaterSpending,
    averageRestoreUseCount: average(results, result => result.restoreUseCount ?? 0),
    averageRestoreSpending: average(results, result => result.restoreSpending ?? 0),
    totalRestoreUseCount,
    totalRestoreSpending,
    singleFlavorTriggeredGameCount: singleFlavorResults.length,
    singleFlavorTriggerRate: results.length ? singleFlavorResults.length / results.length : 0,
    averageSingleFlavorFirstTriggeredStep: average(
      singleFlavorResults,
      result => result.singleFlavorFirstTriggeredStep
    ),
    earliestSingleFlavorFirstTriggeredStep: singleFlavorResults.length
      ? Math.min(...singleFlavorResults.map(result => result.singleFlavorFirstTriggeredStep))
      : null,
    averageSingleFlavorTriggeredBoardCount: average(
      singleFlavorResults,
      result => result.singleFlavorFirstTriggeredBoardCount
    ),
    totalFinalSingleFlavorPenaltyCount: results.reduce(
      (sum, result) => sum + (result.finalSingleFlavorPenaltyCount ?? 0),
      0
    ),
    averageSearchedNodes: average(results, result => result.searchedNodes ?? 0),
    averageEvaluatedNodes: average(results, result => result.evaluatedNodes ?? 0),
    averageGeneratedActions: average(results, result => result.generatedActions ?? 0),
    averagePrunedActions: average(results, result => result.prunedActions ?? 0),
    averageRestoreCandidatesGenerated: average(results, result => result.restoreCandidatesGenerated ?? 0),
    averageRestoreCandidatesKept: average(results, result => result.restoreCandidatesKept ?? 0),
    averageHeaterCandidatesGenerated: average(results, result => result.heaterCandidatesGenerated ?? 0),
    averageHeaterCandidatesKept: average(results, result => result.heaterCandidatesKept ?? 0),
    averageSuperHeaterCandidatesGenerated: average(results, result => result.superHeaterCandidatesGenerated ?? 0),
    averageSuperHeaterCandidatesKept: average(results, result => result.superHeaterCandidatesKept ?? 0),
    averageElapsedMs: average(results, result => result.elapsedMs ?? 0),
    elapsedP50Ms: percentile(times, .5),
    elapsedP90Ms: percentile(times, .9),
    slowestElapsedMs: times.length ? Math.max(...times) : 0,
    totalBudgetHits: sumSearch("budgetHits"),
    averageMaximumReachedDepth: average(results, result => result.maximumReachedDepth ?? 0),
    maximumReachedDepth: results.length ? Math.max(...results.map(result => result.maximumReachedDepth ?? 0)) : 0,
    averageReachedDepth: average(results, result => result.averageReachedDepth ?? 0),
    totalEvaluationCacheHits: sumSearch("evaluationCacheHits"),
    totalEvaluationCacheMisses: sumSearch("evaluationCacheMisses"),
    totalTranspositionHits: sumSearch("transpositionHits"),
    extensionTelemetry: Object.fromEntries([
      "heater", "restore", "superHeater", "retype"
    ].map(name => [name, {
      branches: sumSearch(`${name}ExtensionCount`),
      chosen: sumSearch(`${name}ExtensionChosenCount`)
    }])),
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
    averageFinalStep: average(results, result => result.steps),
    dayCycleEnabled: results.some(result => result.dayCycleEnabled),
    averageOperatingDays: average(results, result => result.finalDay ?? 0),
    highestOperatingDays: results.length ? Math.max(...results.map(result => result.finalDay ?? 0)) : 0,
    lowestOperatingDays: results.length ? Math.min(...results.map(result => result.finalDay ?? 0)) : 0,
    daySummaries,
    reachedTestProtectionLimitCount: results.filter(result => result.reachedTestProtectionLimit).length,
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
  depth = SCORE_AI_DEFAULTS.depth,
  beamWidth = SCORE_AI_DEFAULTS.beamWidth,
  maxActions = SCORE_AI_DEFAULTS.maxActions,
  onProgress = null,
  compareRandom = true,
  compareHeater = false,
  searchMode = SCORE_AI_DEFAULTS.searchMode,
  openings = null,
  adaptive = ADAPTIVE_SEARCH_DEFAULTS,
  checkpointAware = true,
  dayCycleEnabled = true
} = {}){
  const scoreResults = [];
  const randomResults = [];
  const heaterResults = [];

  for(let gameIndex = 1; gameIndex <= games; gameIndex++){
    const opening = openings?.[gameIndex - 1] ?? createStandardInitialValues();
    const result = await runScoreGame({depth, beamWidth, maxActions, initialOpening: opening, searchMode, adaptive, checkpointAware, dayCycleEnabled});
    result.gameIndex = gameIndex;
    result.openingId = gameIndex;
    scoreResults.push(result);

    if(compareHeater){
      const heaterResult = await runScoreGame({
        depth,
        beamWidth,
        maxActions,
        initialOpening: opening,
        allowHeater: true,
        dayCycleEnabled
      });
      heaterResult.gameIndex = gameIndex;
      heaterResult.openingId = gameIndex;
      heaterResults.push(heaterResult);
    }

    if(compareRandom){
      const randomResult = await runScoreGame({maxActions, initialOpening: opening, strategy: "random", dayCycleEnabled});
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
    searchMode,
    checkpointAware,
    dayCycleEnabled,
    heaterComparison,
    heaterAverageScoreDifference: heaterComparison
      ? heaterComparison.averageFinalScore - scoreSummary.averageFinalScore
      : 0,
    randomComparison: compareRandom ? summarizeScoreResults(randomResults) : null
  };
}

function seededRandom(seed){
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = value;
    mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

export function createSeededScoreOpenings(seeds){
  return seeds.map(seed => {
    const originalRandom = Math.random;
    Math.random = seededRandom(seed);
    try { return createStandardInitialValues(); }
    finally { Math.random = originalRandom; }
  });
}

export async function runAdaptiveScoreBenchmark({games = 100, seedStart = 1, maxActions = 100, adaptive = ADAPTIVE_SEARCH_DEFAULTS} = {}){
  const seeds = Array.from({length: games}, (_, index) => seedStart + index);
  const openings = createSeededScoreOpenings(seeds);
  const baseline = await runScoreGames({games, depth: 3, beamWidth: 12, maxActions, compareRandom: false, searchMode: "legacy", openings});
  const adaptiveResult = await runScoreGames({games, depth: 3, beamWidth: 12, maxActions, compareRandom: false, searchMode: "adaptive", openings, adaptive});
  return {seeds, openings, baseline, adaptive: adaptiveResult};
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
  onProgress = null,
  dayCycleEnabled = true
} = {}){
  const opening = createScoreOpening(fixedOpening ?? createStandardInitialValues());
  const results = [];

  for(let attemptIndex = 1; attemptIndex <= attempts; attemptIndex++){
    const result = await runScoreGame({
      depth,
      beamWidth,
      maxActions,
      initialOpening: opening,
      explore: true,
      dayCycleEnabled
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
    maxActions,
    dayCycleEnabled
  };
}

export const scoreAITestUtils = {
  getActionKey,
  getStateKey,
  getImmediateScorePotential,
  applyScoreAction,
  createDayRecords
};
