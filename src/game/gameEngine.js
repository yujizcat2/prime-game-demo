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
  combineCells,
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

import {
  GAME_MODES,
  getEightPalaceKeyCount
} from "./eightPalaceKeys";





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

  combineCells,

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
    case "combine_drink_convert":


      actionState =

        combineCells(

          state,

          action.indexes?.[0],

          action.indexes?.[1]
          ,action.resultFoodType ?? null

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

  return resolveGameOver(

    resolveMazeHistoryAfterAction(
      actionState
    )

  );

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
  const targetFoodTypes = state.targetFoodTypes ?? [];
  const keyCount = getEightPalaceKeyCount(state.eightPalaceKeys,isSimpleEightPalace?targetFoodTypes:undefined);
  const activeState = state.gameOver
    ? {...state, gameOver: false, gameOverReason: null}
    : state;

  if(isSimpleEightPalace&&targetFoodTypes.length===2&&keyCount===2){
    return {...state,gameOver:true,gameOverReason:"simple_eight_palace_cleared"};
  }


  if(isEightPalace && keyCount === 8 && boardCount <= 2){

    return {
      ...state,
      gameOver: true,
      gameOverReason: "eight_palace_cleared"
    };

  }


  if(!isEightPalace && !isSimpleEightPalace && boardCount <= 2){

    return {
      ...state,
      gameOver: true,
      gameOverReason: "board_depleted"
    };

  }


  if(
    getLegalActions(activeState).length === 0
  ){

    const gameOverReason = isEightPalace||isSimpleEightPalace
      ? keyCount === 8
        ? "eight_palace_board_not_cleared"
        : boardCount <= 2
          ? "eight_palace_keys_missing"
          : "no_legal_actions"
      : "no_legal_actions";

    return {
      ...state,
      gameOver: true,
      gameOverReason
    };

  }


  return activeState;
}
