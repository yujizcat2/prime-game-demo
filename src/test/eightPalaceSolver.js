import {
  createEightPalaceInitialValues
} from "../game/initialValues";

import {
  applyAction,
  createGameState,
  getBoardCount,
  getLegalActions,
  resolveGameOver
} from "../game/gameEngine";

import {
  gcd
} from "../utils/math";


export const EIGHT_PALACE_SOLVER_DEFAULTS = Object.freeze({
  games: 100,
  depth: 6,
  beamWidth: 100,
  maxActions: 500
});


function snapshotBoard(board){
  return board.map((piece, index) => piece
    ? {
        index,
        value: piece.value,
        foodType: piece.foodType,
        purity: piece.purity ?? null,
        parents: piece.parents ? [...piece.parents] : null,
        parentFoods: piece.parentFoods
          ? piece.parentFoods.map(parent => ({...parent}))
          : null,
        sourceKey: piece.sourceKey ?? null
      }
    : null
  );
}


export function createEightPalaceBoardKey(state){
  return JSON.stringify(
    state.board.map(piece => piece
      ? [
          piece.value,
          piece.foodType,
          piece.purity ?? null,
          piece.sourceKey ?? null,
          piece.parents ?? null,
          piece.parentFoods?.map(parent => [
            parent.value,
            parent.foodType,
            parent.purity ?? null
          ]) ?? null
        ]
      : null
    )
  );
}


function countRemovablePairs(board){
  const pieces = board.filter(Boolean);
  let count = 0;

  for(let i = 0; i < pieces.length; i++){
    for(let j = i + 1; j < pieces.length; j++){
      const a = pieces[i].value;
      const b = pieces[j].value;
      const divisor = gcd(a, b);

      if(divisor > 1 && (a / divisor === 1 || b / divisor === 1)){
        count++;
      }
    }
  }

  return count;
}


function evaluateState(state, lastAction){
  const boardCount = getBoardCount(state.board);
  const legalActions = getLegalActions(state);
  const oneCount = state.board.filter(piece => piece?.value === 1).length;
  const removablePotential = countRemovablePairs(state.board);
  const deadEnd = boardCount > 2 && legalActions.length === 0;

  return {
    score:
      -(boardCount * 1_000_000_000)
      + (oneCount * 10_000_000)
      + (removablePotential * 1_000_000)
      + (legalActions.length * 1_000)
      + (lastAction?.type === "reduce" ? 100 : 0)
      - (deadEnd ? 500_000_000 : 0),
    legalActions
  };
}


function compareNodes(a, b){
  if(a.boardCount !== b.boardCount){
    return a.boardCount - b.boardCount;
  }

  return b.score - a.score;
}


function searchNextAction(rootState, {depth, beamWidth}, visited){
  let frontier = [{
    state: rootState,
    firstAction: null,
    score: evaluateState(rootState, null).score,
    boardCount: getBoardCount(rootState.board)
  }];
  let best = null;
  let repeatedPrunes = 0;
  let generated = 0;
  const searchSeen = new Set([createEightPalaceBoardKey(rootState)]);

  for(let level = 0; level < depth; level++){
    const nextByKey = new Map();

    for(const node of frontier){
      const legalActions = getLegalActions(node.state);

      for(const action of legalActions){
        const nextState = applyAction(node.state, action);

        if(nextState === node.state){
          continue;
        }

        generated++;
        const key = createEightPalaceBoardKey(nextState);

        if(visited.has(key) || searchSeen.has(key)){
          repeatedPrunes++;
          continue;
        }

        searchSeen.add(key);
        const firstAction = node.firstAction ?? action;
        const evaluation = evaluateState(nextState, action);
        const candidate = {
          state: nextState,
          firstAction,
          score: evaluation.score,
          boardCount: getBoardCount(nextState.board)
        };
        const existing = nextByKey.get(key);

        if(!existing || compareNodes(candidate, existing) < 0){
          nextByKey.set(key, candidate);
        }

        if(candidate.boardCount <= 2){
          return {
            action: firstAction,
            repeatedPrunes,
            generated,
            exhausted: false
          };
        }
      }
    }

    frontier = [...nextByKey.values()]
      .sort(compareNodes)
      .slice(0, beamWidth);

    if(frontier.length === 0){
      break;
    }

    if(!best || compareNodes(frontier[0], best) < 0){
      best = frontier[0];
    }
  }

  return {
    action: best?.firstAction ?? null,
    repeatedPrunes,
    generated,
    exhausted: !best
  };
}


function describeAction(state, action, nextState){
  const indexes = action.type === "remove"
    ? [action.index]
    : [...action.indexes];
  const inputs = indexes.map(index => {
    const piece = state.board[index];
    return {
      index,
      value: piece?.value ?? null,
      foodType: piece?.foodType ?? null
    };
  });

  return {
    number: null,
    type: action.type,
    indexes,
    inputs,
    stepBefore: state.steps,
    stepAfter: nextState.steps,
    boardCountBefore: getBoardCount(state.board),
    boardCountAfter: getBoardCount(nextState.board),
    boardAfter: snapshotBoard(nextState.board)
  };
}


export async function runEightPalaceGame({
  depth = EIGHT_PALACE_SOLVER_DEFAULTS.depth,
  beamWidth = EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,
  maxActions = EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,
  initialOpening = null
} = {}){
  const opening = initialOpening ?? createEightPalaceInitialValues();
  let state = resolveGameOver(createGameState(opening));
  const initialBoard = snapshotBoard(state.board);
  const visited = new Set([createEightPalaceBoardKey(state)]);
  const actionPath = [];
  let minimumBoardCount = getBoardCount(state.board);
  let repeatedPrunes = 0;
  let failureReason = null;

  while(actionPath.length < maxActions && getBoardCount(state.board) > 2){
    const legalActions = getLegalActions(state);

    if(legalActions.length === 0){
      failureReason = "deadlock";
      break;
    }

    const choice = searchNextAction(
      state,
      {depth, beamWidth},
      visited
    );
    repeatedPrunes += choice.repeatedPrunes;

    if(!choice.action){
      failureReason = choice.generated > 0 && choice.repeatedPrunes > 0
        ? "repeated-state / loop"
        : "search exhausted";
      break;
    }

    const nextState = applyAction(state, choice.action);

    if(nextState === state){
      failureReason = "search exhausted";
      break;
    }

    const pathEntry = describeAction(state, choice.action, nextState);
    pathEntry.number = actionPath.length + 1;
    actionPath.push(pathEntry);
    state = nextState;
    visited.add(createEightPalaceBoardKey(state));
    minimumBoardCount = Math.min(minimumBoardCount, getBoardCount(state.board));
  }

  const finalBoardCount = getBoardCount(state.board);
  const success = finalBoardCount <= 2;

  if(!success && !failureReason){
    failureReason = actionPath.length >= maxActions
      ? "maxActions"
      : "search exhausted";
  }

  return {
    success,
    initialOpening: opening.map(item => ({...item})),
    initialBoard,
    minimumBoardCount,
    finalBoardCount,
    steps: state.steps,
    actions: actionPath.length,
    finalBoard: snapshotBoard(state.board),
    actionPath,
    failureReason,
    repeatedPrunes
  };
}


function createDistribution(results){
  const distribution = Object.fromEntries(
    Array.from({length: 9}, (_, boardCount) => [boardCount, 0])
  );

  for(const result of results){
    const key = result.minimumBoardCount;
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  return distribution;
}


export async function runEightPalaceSolver({
  games = EIGHT_PALACE_SOLVER_DEFAULTS.games,
  depth = EIGHT_PALACE_SOLVER_DEFAULTS.depth,
  beamWidth = EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,
  maxActions = EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,
  onProgress = null
} = {}){
  const results = [];

  for(let gameIndex = 1; gameIndex <= games; gameIndex++){
    const result = await runEightPalaceGame({depth, beamWidth, maxActions});
    result.gameIndex = gameIndex;
    results.push(result);

    onProgress?.({
      completed: gameIndex,
      total: games,
      currentGame: result,
      currentActions: result.actions,
      currentSteps: result.steps,
      currentBoardCount: result.finalBoardCount,
      currentSuccess: result.success
    });

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const successes = results.filter(result => result.success);
  const successfulSteps = successes.map(result => result.steps);
  const failureCounts = {
    deadlock: 0,
    "repeated-state / loop": 0,
    maxActions: 0,
    "search exhausted": 0
  };

  for(const result of results){
    if(!result.success){
      failureCounts[result.failureReason]++;
    }
  }

  const shortestSuccess = successes.length > 0
    ? successes.reduce((best, result) => result.steps < best.steps ? result : best)
    : null;
  const hardestSuccess = successes.length > 0
    ? successes.reduce((best, result) => result.steps > best.steps ? result : best)
    : null;

  return {
    games,
    depth,
    beamWidth,
    maxActions,
    successCount: successes.length,
    successRate: games > 0 ? successes.length / games : 0,
    averageSuccessSteps: successes.length > 0
      ? successfulSteps.reduce((sum, value) => sum + value, 0) / successes.length
      : 0,
    shortestSuccessSteps: successes.length > 0 ? Math.min(...successfulSteps) : null,
    longestSuccessSteps: successes.length > 0 ? Math.max(...successfulSteps) : null,
    averageMinimumBoardCount: games > 0
      ? results.reduce((sum, result) => sum + result.minimumBoardCount, 0) / games
      : 0,
    minimumBoardCountDistribution: createDistribution(results),
    failureCounts,
    shortestSuccess,
    hardestSuccess,
    results
  };
}
