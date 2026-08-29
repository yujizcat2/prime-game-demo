import {
  GAME_CONFIG
} from "./config";

import {
  FOOD_TYPES,
  FOOD_PURITY,
  BASE_FOOD_TYPES
} from "./rules";

import {
  createMazeHistory
} from "./mazeHistory";

import {
  createEmptyBoard
} from "./boardRules";

import {
  createEmptyEightPalaceKeys,
  GAME_MODES
} from "./eightPalaceKeys";





// ============================================================
// 创建初始状态
//
// 新版开局：
//
// 荤   素   调料
// ·    ·    ·
// ·    ·    ·
//
// 初始三个棋子均视为原生食物。
//
// 因此：
//
// 荤   → pure
// 素   → pure
// 调料 → pure
//
// ------------------------------------------------------------
//
// collectionFoodTypeHistory
//
// 只记录“首次新收藏”的真实 foodType 顺序。
//
// 例如：
//
// [
//   "seasoning",
//   "meat",
//   "vegetable",
//   "meat"
// ]
//
// 重复处理旧收藏时，不应追加。
//
// 当前 V1 只用于研究三系失衡度。
// 暂时不产生任何惩罚。
// ------------------------------------------------------------
//
// mazeHistory
//
// 初始规则状态必须立即写入迷宫历史。
// ============================================================

export function createGameState(
  values
){


  const board =
    createEmptyBoard();



  const suppliedValues =

    Array.isArray(
      values
    )

      ?

        values

      :

        [];



  const usesPlacedInitialValues =
    suppliedValues.every(
      item =>
        item
        && typeof item === "object"
        && Number.isInteger(item.boardIndex)
    );

  const suppliedGameMode=suppliedValues[0]?.gameMode;
  const targetFoodTypes=Array.isArray(suppliedValues[0]?.targetFoodTypes)
    ? [...suppliedValues[0].targetFoodTypes]
    : [...BASE_FOOD_TYPES];


  const initialValues =
    usesPlacedInitialValues
      ? suppliedValues.slice(0, 8)
      : suppliedValues.slice(0, 3);


  const initialFoodTypes = [...BASE_FOOD_TYPES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);



  initialValues.forEach(

    (
      initialValue,
      index
    ) => {


      const value =
        usesPlacedInitialValues
          ? initialValue.value
          : initialValue;


      const boardIndex =
        usesPlacedInitialValues
          ? initialValue.boardIndex
          : index;


      board[boardIndex] = {


        id:
          index + 1,


        value,


        foodType:

          (
            usesPlacedInitialValues
              ? initialValue.foodType
              : initialFoodTypes[index]
          )

          ??

          FOOD_TYPES.LAND,


        purity:
          FOOD_PURITY.PURE,


        parents:
          null,


        parentFoods:
          null,

        sourceKey:
          null,


        origin:
          null

      };

    }

  );





  // ==========================================================
  // 基础状态
  // ==========================================================

  const baseState = {

    board,

    gameMode:
      suppliedGameMode===GAME_MODES.SIMPLE_EIGHT_PALACE
        ? GAME_MODES.SIMPLE_EIGHT_PALACE
        : usesPlacedInitialValues
        ? GAME_MODES.EIGHT_PALACE
        : GAME_MODES.CLASSIC,

    targetFoodTypes,

    eightPalaceKeys:
      createEmptyEightPalaceKeys(),

    latestEightPalaceKey:
      null,





    // ========================================================
    // 已收藏的不同数字
    // ========================================================

    collection:
      [],
    collectionTimeline:
      [],





    // ========================================================
    // 首次收藏食物类型历史
    //
    // 注意：
    //
    // 这里记录的是收藏发生时棋子的真实 foodType，
    // 不是根据数字推断类型。
    //
    // 只有“首次收藏”才会加入。
    // ========================================================

    collectionFoodTypeHistory:
      [],





    // ========================================================
    // 收藏来源
    // ========================================================

    collectionOrigins:
      {},





    // ========================================================
    // 收藏路径
    // ========================================================

    collectionPaths:
      {},





    // ========================================================
    // 最新收藏
    // ========================================================

    latestCollection:
      null,





    // ========================================================
    // 分数
    // ========================================================

    score:
      0,

    money:
      0,

    previousCollection:
      null,

    trend:
      1,

    recentActionSignatures:
      [],

    usedCombinationPairs:
      [],

    usedKeyTriggerValues:
      [],





    // ========================================================
    // 正式步数
    // ========================================================

    steps:
      0,





    // ========================================================
    // 游戏结束
    // ========================================================

    gameOver:
      false,

    gameOverReason:
      null,





    // ========================================================
    // 下一棋子 ID
    // ========================================================

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
