import {
  GAME_CONFIG
} from "./config";

import {
  FOOD_TYPES,
  FOOD_PURITY
} from "./rules";

import {
  createMazeHistory
} from "./mazeHistory";

import {
  BOARD_CONFIG,
  createEmptyBoard
} from "./boardRules";





// ============================================================
// 创建初始状态
//
// 新版开局：
//
// 荤   素   调料
// ·    ·    ·
// ·    ·    ·
//
// 初始三个棋子均视为原生食材。
//
// 因此：
//
// 荤   → pure
// 素   → pure
// 调料 → pure
//
// ------------------------------------------------------------
//
// mazeHistory
//
// 初始规则状态必须立即写入迷宫历史。
//
// 否则：
//
// S0
// ↓
// 绕一圈
// ↓
// S0
//
// 将无法在第一次回到开局时触发迷宫回转。
// ============================================================

export function createGameState(
  values
){


  const board =
    createEmptyBoard();



  const initialValues =

    Array.isArray(
      values
    )

      ?

        values.slice(
          0,
          3
        )

      :

        [];



  const initialFoodTypes = [

    FOOD_TYPES.MEAT,

    FOOD_TYPES.VEGETABLE,

    FOOD_TYPES.SEASONING

  ];



  initialValues.forEach(

    (
      value,
      index
    ) => {


      board[index] = {


        id:
          index + 1,


        value,


        foodType:

          initialFoodTypes[index]

          ??

          FOOD_TYPES.MEAT,


        purity:
          FOOD_PURITY.PURE,


        parents:
          null,


        parentFoods:
          null,


        origin:
          null

      };

    }

  );





  // ==========================================================
  // 先建立基础状态
  // ==========================================================

  const baseState = {

    board,


    collection:
      [],


    collectionOrigins:
      {},


    collectionPaths:
      {},


    latestCollection:
      null,


    score:
      0,


    steps:
      0,


    gameOver:
      false,


    nextId:
      initialValues.length + 1,


    // ========================================================
    // 最近一次迷宫回转事件
    // ========================================================

    mazeTurn:
      null

  };





  // ==========================================================
  // 创建迷宫历史
  //
  // createMazeHistory 会立即记录开局 S0。
  // ==========================================================

  const mazeHistory =

    createMazeHistory(
      baseState
    );





  return {

    ...baseState,

    mazeHistory

  };

}





// ============================================================
// 消耗一个时间单位
//
// 这个函数目前也属于状态层。
// 后面如果你想把它放到 gameActions.js 也可以。
//
// V0 保持现有行为不变。
// ============================================================

export function consumeStep(
  state
){


  return {

    ...state,

    steps:

      state.steps

      +

      GAME_CONFIG.STEP_COST

  };

}