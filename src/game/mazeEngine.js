import {
  createMazeHistory,
  checkMazeReturn,
  recordMazeState,
  incrementMazeTurnCount,
  getMazeTurnCount
} from "./mazeHistory";
import { GAME_VALUE_MAX, GAME_VALUE_MIN, GAME_VALUE_SCALE } from "./valueScale";





// ============================================================
// 迷宫回转数值
//
// 普通：
//
// 1   → 20
// 20  → 30
// ...
// 1000 → 1010
//
// 特殊：
//
// 1010 → 20
//
// ------------------------------------------------------------
//
// 1不是正式20～1010主数域的一部分。
// 它是约分产生的特殊处理中间状态。
//
// 回转会把1变成20。
// ============================================================

export function getMazeTurnValue(
  value
){


  if(
    value === GAME_VALUE_MAX
  ){


    return GAME_VALUE_MIN;

  }



  return value + GAME_VALUE_SCALE;

}





// ============================================================
// 执行一次迷宫回转
//
// ------------------------------------------------------------
//
// 规则：
//
// 所有当前存在棋子：
//
// value + 10
//
// 1010 → 20
//
// ------------------------------------------------------------
//
// 不改变：
//
// foodType
// purity
// parents
// parentFoods
// origin
// id
//
// ------------------------------------------------------------
//
// 不改变：
//
// steps
// score
// collection
//
// 因为迷宫回转不是玩家动作。
// ============================================================

export function applyMazeTurn(
  state
){


  if(
    !state ||
    !Array.isArray(
      state.board
    )
  ){


    return state;

  }



  const nextBoard =

    state.board.map(

      piece => {


        if(
          !piece
        ){


          return null;

        }



        return {

          ...piece,

          value:

            getMazeTurnValue(
              piece.value
            )

        };

      }

    );



  return {

    ...state,

    board:
      nextBoard

  };

}





// ============================================================
// 清除最近一次迷宫回转提示
//
// UI如果以后需要：
//
// 提示动画结束
// ↓
// clearMazeTurn()
//
// 可以调用这个函数。
// ============================================================

export function clearMazeTurn(
  state
){


  if(
    !state
  ){


    return state;

  }



  if(
    !state.mazeTurn
  ){


    return state;

  }



  return {

    ...state,

    mazeTurn:
      null

  };

}





// ============================================================
// 动作完成后处理迷宫历史
//
// ------------------------------------------------------------
//
// 每次玩家合法动作完成后：
//
// 1. 生成当前第二层规则状态
// 2. 查询历史
//
// 如果没有出现过：
//
// → 记录
//
// 如果出现过：
//
// → 触发迷宫回转
// → 全盘 +1
// → 101 → 2
// → 回转次数 +1
// → 记录回转后的新状态
//
// ------------------------------------------------------------
//
// 第一版规则：
//
// 每个玩家动作最多触发一次迷宫回转。
//
// 如果 +1 后的新状态碰巧也已经存在于历史中，
// 当前这一刻不连续触发第二次。
// ============================================================

export function resolveMazeHistoryAfterAction(
  state
){


  if(
    !state
  ){


    return state;

  }





  // ==========================================================
  // 兼容旧存档 / 开发热更新
  // ==========================================================

  const history =

    state.mazeHistory

    ??

    createMazeHistory(
      state
    );





  // ==========================================================
  // 当前状态是否已经出现
  // ==========================================================

  const mazeCheck =

    checkMazeReturn(

      history,

      state

    );





  // ==========================================================
  // 没有重复
  // ==========================================================

  if(
    !mazeCheck.repeated
  ){


    const nextHistory =

      recordMazeState(

        history,

        state,

        {

          reason:
            "normal"

        }

      );



    return {

      ...state,

      mazeHistory:
        nextHistory,

      mazeTurn:
        null

    };

  }





  // ==========================================================
  // 检测到第二层状态重复
  // ==========================================================

  const beforeValues =

    state.board.map(

      piece =>

        piece
          ? piece.value
          : null

    );





  // ==========================================================
  // 回转次数 +1
  // ==========================================================

  const historyWithTurn =

    incrementMazeTurnCount(
      history
    );





  // ==========================================================
  // 执行全盘回转
  // ==========================================================

  const turnedState =

    applyMazeTurn(
      state
    );





  const afterValues =

    turnedState.board.map(

      piece =>

        piece
          ? piece.value
          : null

    );





  // ==========================================================
  // 回转后的状态写入历史
  //
  // 重复的回转前状态不再次写入。
  // 写入的是回转后的新状态。
// ==========================================================

  const nextHistory =

    recordMazeState(

      historyWithTurn,

      turnedState,

      {

        reason:
          "maze-turn"

      }

    );





  const turnCount =

    getMazeTurnCount(
      nextHistory
    );





  // ==========================================================
  // 生成 UI / 调试事件
  // ==========================================================

  const mazeTurn = {

    triggered:
      true,


    count:
      turnCount,


    repeatedKey:
      mazeCheck.key,


    previousSequence:

      mazeCheck.previous
        ?.sequence

      ??

      null,


    previousSteps:

      mazeCheck.previous
        ?.steps

      ??

      null,


    triggerSteps:
      state.steps,


    beforeValues,

    afterValues

  };





  return {

    ...turnedState,

    mazeHistory:
      nextHistory,

    mazeTurn

  };

}
