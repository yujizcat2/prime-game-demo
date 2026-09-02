import {
  createGameState,
  consumeStep
} from "./gameState";

import {
  BOARD_CONFIG,
  createEmptyBoard,
  getBoardPieces,
  getBoardCount,
  isBoardFull,
  getNextEmptyIndex,
  getPieceAt,
  getNumberById,
  hasOne,
  getOrderedPair
} from "./boardRules";

import {
  canCombineCells,
  canReduceCells,
  createReduceOutcome,
  combineCells,
  createCombineOutcome,
  createCombinedPiece,
  reduceCells,
  removeOne,
  applyFunctionOne,
  getLegalCombineActions,
  getLegalReduceActions,
  getLegalRemoveActions,
  getLegalActions
} from "./gameActions";

import {
  getMazeTurnValue,
  applyMazeTurn,
  clearMazeTurn,
  resolveMazeHistoryAfterAction
} from "./mazeEngine";

import { GAME_MODES } from "./eightPalaceKeys";
import { applyHeater } from "./heater";
import { applyRestore, getLegalRestoreActions } from "./restore";
import { canUseHeater } from "./heater";
import { applySuperHeater } from "./superHeater";
import { markSingleFlavorBoardPieces } from "./singleFlavorPenalty";
import { resolveCheckpoint } from "./checkpoints";





// ============================================================
// 兼容旧 import
//
// 当前 UI / 其他模块如果仍然从 gameEngine.js 导入：
//
// createGameState
// BOARD_CONFIG
// combineCells
// reduceCells
// ...
//
// 仍然全部可用。
//
// 后续可以逐步让各模块直接 import 对应文件，
// 但当前阶段不需要一次性改 UI。
// ============================================================

export {

  // ==========================================================
  // Game State
  // ==========================================================

  createGameState,

  consumeStep,


  // ==========================================================
  // Board
  // ==========================================================

  BOARD_CONFIG,

  createEmptyBoard,

  getBoardPieces,

  getBoardCount,

  isBoardFull,

  getNextEmptyIndex,

  getPieceAt,

  getNumberById,

  hasOne,

  getOrderedPair,


  // ==========================================================
  // Actions
  // ==========================================================

  canCombineCells,

  canReduceCells,
  createReduceOutcome,

  combineCells,
  createCombineOutcome,
  createCombinedPiece,

  reduceCells,

  removeOne,

  applyFunctionOne,

  getLegalCombineActions,

  getLegalReduceActions,

  getLegalRemoveActions,

  getLegalActions,


  // ==========================================================
  // Maze
  // ==========================================================

  getMazeTurnValue,

  applyMazeTurn,

  clearMazeTurn,

  resolveMazeHistoryAfterAction

};





// ============================================================
// 执行动作
//
// ------------------------------------------------------------
//
// gameEngine 现在只负责统一调度：
//
// 玩家动作
// ↓
// gameActions
// ↓
// 得到 actionState
// ↓
// mazeEngine
// ↓
// 处理迷宫历史 / 回转
//
// ------------------------------------------------------------
//
// 收藏规则已经由：
//
// gameActions.removeOne()
// ↓
// collectionRules.applyCollection()
//
// 负责。
//
// ------------------------------------------------------------
//
// 因此这里不再包含：
//
// 棋盘规则
// 数字规则
// 收藏规则
// 迷宫规则
//
// 只作为整个正式游戏的统一动作入口。
// ============================================================

export function applyAction(
  state,
  action
){


  if(
    !state ||
    !action
  ){


    return state;

  }





  let actionState =
    state;





  switch(
    action.type
  ){


    // ========================================================
    // 合成
    // ========================================================

    case "combine":
    case "combine_ordered":


      actionState =

        combineCells(

          state,

          action.indexes?.[0],

          action.indexes?.[1]

        );


      break;





    // ========================================================
    // 约分
    // ========================================================

    case "reduce":


      actionState =

        reduceCells(

          state,

          action.indexes?.[0],

          action.indexes?.[1]

        );


      break;





    // ========================================================
    // 处理1
    // ========================================================

    case "remove":
    case "claim_key":


      actionState =

        removeOne(

          state,

          action.index

        );


      break;

    case "apply_one":
      actionState = applyFunctionOne(state,action.oneIndex,action.targetIndex);
      break;

    case "heater":
      actionState = applyHeater(state, action.indexes?.[0] ?? action.index);
      break;

    case "super_heater":
      actionState = applySuperHeater(state);
      break;

    case "restore":
      actionState = applyRestore(state, action.indexes?.[0] ?? action.index);
      break;





    // ========================================================
    // 未知动作
    // ========================================================

    default:


      return state;

  }





  // ==========================================================
  // 非法动作
  //
  // gameActions 中：
  //
  // combineCells
  // reduceCells
  // removeOne
  //
  // 如果动作非法，
  // 都会直接返回原 state。
  //
  // 此时绝对不能进行迷宫重复检测。
  // ==========================================================

  if(
    actionState === state
  ){


    return state;

  }





  // ==========================================================
  // 合法动作完成
  //
  // 统一进入迷宫历史系统。
  // ==========================================================

  const recapActionCounts = state.recapActionCounts ?? {combine: 0, reduce: 0};
  const countedState = {
    ...actionState,
    recapActionCounts: {
      combine: recapActionCounts.combine + (action.type === "combine" || action.type === "combine_ordered" ? 1 : 0),
      reduce: recapActionCounts.reduce + (action.type === "reduce" ? 1 : 0)
    },
    recapItemSpending: (state.recapItemSpending ?? 0)
      + (["heater", "restore", "super_heater"].includes(action.type)
        ? Math.max(0, (state.money ?? 0) - (actionState.money ?? 0))
        : 0)
  };
  const settledState = recordGameRecapSnapshot(
    resolveMazeHistoryAfterAction(markSingleFlavorBoardPieces(countedState))
  );
  const resolvedState = resolveGameOver(settledState);
  if(!resolvedState.gameOver) return resolvedState;
  const finalSnapshotState = recordGameRecapSnapshot(settledState, true);
  return {...resolvedState, gameRecapSnapshots: finalSnapshotState.gameRecapSnapshots};

}

export function recordGameRecapSnapshot(state, force = false){
  if(!state || (!force && (state.steps === 0 || state.steps % 10 !== 0))) return state;
  const snapshots = state.gameRecapSnapshots ?? [];
  if(snapshots.at(-1)?.step === state.steps) return state;
  return {
    ...state,
    gameOver: force ? true : state.gameOver,
    gameRecapSnapshots: [...snapshots, {
      step: state.steps,
      score: state.score ?? 0,
      collectionCount: state.collectionCards?.length ?? state.collection?.length ?? 0,
      legalCombineCount: getLegalCombineActions(state).length,
      legalReduceCount: getLegalReduceActions(state).length
    }]
  };
}



export function resolveGameOver(
  state
){

  if(
    !state
  ){

    return state;

  }


  const boardCount = getBoardCount(state.board);
  const isEightPalace = state.gameMode === GAME_MODES.EIGHT_PALACE;
  const isSimpleEightPalace = state.gameMode === GAME_MODES.SIMPLE_EIGHT_PALACE;
  const activeState = state.gameOver
    ? {...state, gameOver: false, gameOverReason: null}
    : state;

  if(state.gameOverReason === "checkpoint_failed") return state;

  if(isEightPalace || isSimpleEightPalace){
    const checkpointState = resolveCheckpoint(activeState);
    if(checkpointState !== activeState) return checkpointState.gameOver
      ? checkpointState
      : resolveGameOver(checkpointState);
  }


  if(
    !isEightPalace
    && !isSimpleEightPalace
    && boardCount <= 2
    && !canUseHeater(activeState)
    && !getLegalActions(activeState).some(action => action.type === "super_heater")
    && getLegalRestoreActions(activeState).length === 0
  ){

    return {
      ...state,
      gameOver: true,
      gameOverReason: "board_depleted"
    };

  }


  if(
    getLegalActions(activeState).length === 0
  ){

    return {
      ...state,
      gameOver: true,
      gameOverReason: "no_legal_actions"
    };

  }


  return activeState;
}
