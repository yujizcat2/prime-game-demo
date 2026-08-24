import {
  gcd
} from "../utils/math";

import {
  GAME_CONFIG
} from "./config";

import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  FOOD_TYPES,
  FOOD_PURITY,
  combineValue,
  combineFoodType,
  combineFoodPurity,
  canReduce,
  canCombine
} from "./rules";

import {
  createCombineOrigin,
  createReduceOrigin,
  getMainLineage
} from "./numberOrigin";

import {
  createMazeHistory,
  checkMazeReturn,
  recordMazeState,
  incrementMazeTurnCount,
  getMazeTurnCount
} from "./mazeHistory";





// ============================================================
// 九宫格
// ============================================================

export const BOARD_CONFIG = {

  ROWS:
    3,

  COLS:
    3,

  SIZE:
    9

};





// ============================================================
// 创建空棋盘
// ============================================================

export function createEmptyBoard(){


  return Array.from(
    {
      length:
        BOARD_CONFIG.SIZE
    },
    () =>
      null
  );

}





// ============================================================
// 获取所有正式棋子
// ============================================================

export function getBoardPieces(
  board
){


  if(
    !Array.isArray(
      board
    )
  ){


    return [];

  }



  return board.filter(
    Boolean
  );

}





// ============================================================
// 当前棋子数量
// ============================================================

export function getBoardCount(
  board
){


  return getBoardPieces(
    board
  ).length;

}





// ============================================================
// 是否满盘
// ============================================================

export function isBoardFull(
  board
){


  return (

    getBoardCount(
      board
    )

    >=

    BOARD_CONFIG.SIZE

  );

}





// ============================================================
// 获取下一个空格
//
// 九宫格顺序：
//
// 0 1 2
// 3 4 5
// 6 7 8
//
// 新棋子自动进入
// 第一个空位置。
// ============================================================

export function getNextEmptyIndex(
  board
){


  if(
    !Array.isArray(
      board
    )
  ){


    return -1;

  }



  return board.findIndex(

    item =>
      item === null

  );

}





// ============================================================
// 根据index获取节点
// ============================================================

export function getPieceAt(
  state,
  index
){


  if(
    !state?.board
  ){


    return null;

  }



  if(
    index < 0 ||
    index >= BOARD_CONFIG.SIZE
  ){


    return null;

  }



  return (

    state.board[index]

    ??

    null

  );

}





// ============================================================
// 根据ID获取节点
//
// 保留给旧UI兼容。
// ============================================================

export function getNumberById(
  state,
  id
){


  return (

    getBoardPieces(
      state?.board
    )
      .find(

        item =>
          item.id === id

      )

    ??

    null

  );

}





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
// 新增：
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
    //
    // null
    // = 当前没有新的回转事件。
    //
    // UI以后可以监听它显示提示。
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
// 是否存在1
// ============================================================

export function hasOne(
  board
){


  return getBoardPieces(
    board
  )
    .some(

      item =>
        item.value === 1

    );

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





// ============================================================
// 确定两个棋子的前后
//
// index较小 = front
//
// 点击顺序不影响结果。
// ============================================================

export function getOrderedPair(
  state,
  indexA,
  indexB
){


  const a =

    getPieceAt(
      state,
      indexA
    );


  const b =

    getPieceAt(
      state,
      indexB
    );



  if(
    !a ||
    !b ||
    indexA === indexB
  ){


    return null;

  }



  if(
    indexA <
    indexB
  ){


    return {

      front:
        a,

      back:
        b,

      frontIndex:
        indexA,

      backIndex:
        indexB

    };

  }



  return {

    front:
      b,

    back:
      a,

    frontIndex:
      indexB,

    backIndex:
      indexA

  };

}





// ============================================================
// 两格能否合成
// ============================================================

export function canCombineCells(
  state,
  indexA,
  indexB
){


  if(
    !state ||
    state.gameOver
  ){


    return false;

  }



  if(
    indexA ===
    indexB
  ){


    return false;

  }



  if(
    isBoardFull(
      state.board
    )
  ){


    return false;

  }



  const a =

    getPieceAt(
      state,
      indexA
    );


  const b =

    getPieceAt(
      state,
      indexB
    );



  if(
    !a ||
    !b
  ){


    return false;

  }



  if(
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }



  return canCombine(

    a,

    b,

    getBoardPieces(
      state.board
    )

  );

}





// ============================================================
// 两格能否约分
// ============================================================

export function canReduceCells(
  state,
  indexA,
  indexB
){


  if(
    !state ||
    state.gameOver
  ){


    return false;

  }



  if(
    indexA ===
    indexB
  ){


    return false;

  }



  const a =

    getPieceAt(
      state,
      indexA
    );


  const b =

    getPieceAt(
      state,
      indexB
    );



  if(
    !a ||
    !b
  ){


    return false;

  }



  if(
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }



  return canReduce(
    a,
    b
  );

}





// ============================================================
// 合成
//
// A、B保留。
// 新棋子进入第一个空格。
//
// 新棋子同时获得：
//
// value
// foodType
// purity
//
// purity只根据当前一代父节点类型生成。
// ============================================================

export function combineCells(
  state,
  indexA,
  indexB
){


  if(
    !state ||
    state.gameOver
  ){


    return state;

  }



  if(
    !canCombineCells(
      state,
      indexA,
      indexB
    )
  ){


    return state;

  }



  const targetIndex =

    getNextEmptyIndex(
      state.board
    );



  if(
    targetIndex === -1
  ){


    return state;

  }



  const a =

    getPieceAt(
      state,
      indexA
    );


  const b =

    getPieceAt(
      state,
      indexB
    );



  const orderedPair =

    getOrderedPair(

      state,

      indexA,

      indexB

    );



  if(
    !a ||
    !b ||
    !orderedPair
  ){


    return state;

  }



  const {
    front,
    back
  } =
    orderedPair;





  // ==========================================================
  // 数字结果
  // ==========================================================

  const result =

    combineValue(

      front.value,

      back.value

    );





  // ==========================================================
  // 类型结果
  // ==========================================================

  const foodType =

    combineFoodType(

      front,

      back

    );



  if(
    !foodType
  ){


    return state;

  }





  // ==========================================================
  // 纯度结果
  //
  // pure
  // mixed
  // null（甜食）
  // ==========================================================

  const purity =

    combineFoodPurity(

      front,

      back

    );





  const newPiece = {


    id:
      state.nextId,


    value:
      result,


    foodType,


    purity,


    parents: [

      a.value,

      b.value

    ],


    parentFoods: [

      {

        value:
          front.value,

        foodType:
          front.foodType,

        purity:
          front.purity
          ?? null

      },

      {

        value:
          back.value,

        foodType:
          back.foodType,

        purity:
          back.purity
          ?? null

      }

    ],


    origin:

      createCombineOrigin(

        result,

        front,

        back

      )

  };





  const nextBoard = [

    ...state.board

  ];



  nextBoard[
    targetIndex
  ] =
    newPiece;



  let nextState = {

    ...state,

    board:
      nextBoard,

    nextId:
      state.nextId + 1

  };



  nextState =

    consumeStep(
      nextState
    );



  return nextState;

}





// ============================================================
// 约分
//
// 约分只改变数字。
//
// 当前保留：
//
// foodType
// purity
//
// 因此：
//
// 半纯肉40
// ↓
// 半纯肉10
//
// purity不会因为约分重新计算。
//
// ------------------------------------------------------------
//
// 当前约分会清空：
//
// parents
// parentFoods
//
// 并生成新的 reduce origin。
// ============================================================

export function reduceCells(
  state,
  indexA,
  indexB
){


  if(
    !state ||
    state.gameOver
  ){


    return state;

  }



  if(
    !canReduceCells(
      state,
      indexA,
      indexB
    )
  ){


    return state;

  }



  const first =

    getPieceAt(
      state,
      indexA
    );


  const second =

    getPieceAt(
      state,
      indexB
    );



  if(
    !first ||
    !second
  ){


    return state;

  }



  const divisor =

    gcd(

      first.value,

      second.value

    );



  const firstResult =

    first.value /
    divisor;



  const secondResult =

    second.value /
    divisor;



  const firstOrigin =

    createReduceOrigin(

      firstResult,

      first

    );



  const secondOrigin =

    createReduceOrigin(

      secondResult,

      second

    );



  const nextBoard = [

    ...state.board

  ];



  nextBoard[
    indexA
  ] = {

    ...first,

    value:
      firstResult,

    parents:
      null,

    parentFoods:
      null,

    origin:
      firstOrigin

  };



  nextBoard[
    indexB
  ] = {

    ...second,

    value:
      secondResult,

    parents:
      null,

    parentFoods:
      null,

    origin:
      secondOrigin

  };



  let nextState = {

    ...state,

    board:
      nextBoard

  };



  nextState =

    consumeStep(
      nextState
    );



  return nextState;

}





// ============================================================
// 消除1
// ============================================================

export function removeOne(
  state,
  index
){


  if(
    !state ||
    state.gameOver
  ){


    return state;

  }



  const target =

    getPieceAt(
      state,
      index
    );



  if(
    !target ||
    target.value !== 1
  ){


    return state;

  }



  const previousRecord =

    target.origin?.type ===
    "reduce"

      ?

        target.origin.parent

      :

        null;



  const discoveredValue =

    previousRecord?.value

    ??

    null;



  let nextScore =
    state.score;


  let nextCollection =
    state.collection;


  let nextCollectionOrigins =

    state.collectionOrigins

    ??

    {};


  let nextCollectionPaths =

    state.collectionPaths

    ??

    {};


  let nextLatestCollection =

    state.latestCollection

    ??

    null;



  if(
    discoveredValue !== null &&
    previousRecord
  ){


    const isFirstTime =

      !state.collection.includes(
        discoveredValue
      );



    const oldOrigins =

      nextCollectionOrigins[
        discoveredValue
      ]

      ??

      [];



    nextCollectionOrigins = {

      ...nextCollectionOrigins,

      [discoveredValue]: [

        ...oldOrigins,

        previousRecord

      ]

    };



    const mainLineage =

      getMainLineage(
        previousRecord
      );



    const oldPaths =

      nextCollectionPaths[
        discoveredValue
      ]

      ??

      [];



    const latestPathIndex =
      oldPaths.length;



    nextCollectionPaths = {

      ...nextCollectionPaths,

      [discoveredValue]: [

        ...oldPaths,

        mainLineage

      ]

    };



    nextLatestCollection = {

      value:
        discoveredValue,

      index:
        latestPathIndex

    };



    if(
      isFirstTime
    ){


      const newNumberCount =

        state.collection.length + 1;



      const discoveryScore =

        newNumberCount

        *

        SCORE_CONFIG.NEW_NUMBER_GROWTH;



      nextScore =

        state.score

        +

        discoveryScore;



      nextCollection = [

        ...state.collection,

        discoveredValue

      ];

    }
    else{


      nextScore =

        state.score

        +

        SCORE_CONFIG.REPEAT_SCORE;

    }

  }



  const nextBoard = [

    ...state.board

  ];



  nextBoard[
    index
  ] =
    null;



  return {

    ...state,

    board:
      nextBoard,

    collection:
      nextCollection,

    collectionOrigins:
      nextCollectionOrigins,

    collectionPaths:
      nextCollectionPaths,

    latestCollection:
      nextLatestCollection,

    score:
      nextScore

  };

}





// ============================================================
// 所有合法合成
// ============================================================

export function getLegalCombineActions(
  state
){


  if(
    !state ||
    state.gameOver ||
    isBoardFull(
      state.board
    )
  ){


    return [];

  }



  const actions =
    [];



  for(
    let i = 0;
    i < BOARD_CONFIG.SIZE;
    i++
  ){


    if(
      !state.board[i]
    ){


      continue;

    }



    for(
      let j = i + 1;
      j < BOARD_CONFIG.SIZE;
      j++
    ){


      if(
        !state.board[j]
      ){


        continue;

      }



      if(
        canCombineCells(
          state,
          i,
          j
        )
      ){


        actions.push({

          type:
            "combine",

          indexes: [
            i,
            j
          ]

        });

      }

    }

  }



  return actions;

}





// ============================================================
// 所有合法约分
// ============================================================

export function getLegalReduceActions(
  state
){


  if(
    !state ||
    state.gameOver
  ){


    return [];

  }



  const actions =
    [];



  for(
    let i = 0;
    i < BOARD_CONFIG.SIZE;
    i++
  ){


    if(
      !state.board[i]
    ){


      continue;

    }



    for(
      let j = i + 1;
      j < BOARD_CONFIG.SIZE;
      j++
    ){


      if(
        !state.board[j]
      ){


        continue;

      }



      if(
        canReduceCells(
          state,
          i,
          j
        )
      ){


        actions.push({

          type:
            "reduce",

          indexes: [
            i,
            j
          ]

        });

      }

    }

  }



  return actions;

}





// ============================================================
// 所有可消除1
// ============================================================

export function getLegalRemoveActions(
  state
){


  if(
    !state ||
    state.gameOver
  ){


    return [];

  }



  const actions =
    [];



  for(
    let index = 0;
    index < BOARD_CONFIG.SIZE;
    index++
  ){


    if(
      state.board[index]?.value === 1
    ){


      actions.push({

        type:
          "remove",

        index

      });

    }

  }



  return actions;

}





// ============================================================
// 所有合法动作
// ============================================================

export function getLegalActions(
  state
){


  if(
    !state ||
    state.gameOver
  ){


    return [];

  }



  return [

    ...getLegalCombineActions(
      state
    ),

    ...getLegalReduceActions(
      state
    ),

    ...getLegalRemoveActions(
      state
    )

  ];

}





// ============================================================
// 迷宫回转数值
//
// 普通：
//
// 1   → 2
// 2   → 3
// ...
// 100 → 101
//
// 特殊：
//
// 101 → 2
//
// ------------------------------------------------------------
//
// 注意：
//
// 1不是正式2～101主数域的一部分。
// 它是约分产生的特殊处理中间状态。
//
// 回转会把1变成2。
// ============================================================

export function getMazeTurnValue(
  value
){


  if(
    value === 101
  ){


    return 2;

  }



  return value + 1;

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
// value + 1
//
// 101 → 2
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
// ------------------------------------------------------------
//
// UI如果以后需要：
//
// 提示动画结束
// ↓
// clearMazeTurn()
//
// 可以调用这个函数。
//
// ------------------------------------------------------------
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
// 这是正式「迷宫回转」的核心调度器。
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
// 也就是说：
//
// 如果 +1 后的新状态碰巧也已经存在于历史中，
// 当前这一刻不连续触发第二次。
//
// 先保持规则简单，
// 后续可以通过AI测试判断是否需要“连续回转检测”。
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
  //
  // 如果当前状态还没有 mazeHistory，
  // 就从当前状态建立一个。
  //
  // 正常新游戏不会走这里。
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
  //
  // 直接记录当前状态。
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
  //
  // → 迷宫回转
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
  // 真正执行全盘 +1
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
  // 注意：
//
// 重复的“回转前状态”不再次写入。
// 因为历史里已经有它。
//
// 写入的是：
//
// 回转后的新状态。
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


    // ========================================================
    // 第几次迷宫回转
    // ========================================================

    count:
      turnCount,


    // ========================================================
    // 本次命中的规则状态Key
    // ========================================================

    repeatedKey:
      mazeCheck.key,


    // ========================================================
    // 以前第一次出现的位置
    // ========================================================

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


    // ========================================================
    // 本次触发时的正式步数
    //
    // 回转本身不增加steps。
    // ========================================================

    triggerSteps:
      state.steps,


    // ========================================================
    // 回转前后数字
    //
    // 主要给UI动画和测试使用。
    // ========================================================

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





// ============================================================
// 执行动作
//
// ------------------------------------------------------------
//
// 新流程：
//
// 玩家动作
// ↓
// combine / reduce / remove
// ↓
// 得到 actionState
// ↓
// resolveMazeHistoryAfterAction()
// ↓
// 检测第二层重复
// ↓
// 必要时触发迷宫回转
//
// ------------------------------------------------------------
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


      actionState =

        removeOne(

          state,

          action.index

        );


      break;





    default:


      return state;

  }





  // ==========================================================
  // 非法动作
  //
  // combineCells / reduceCells / removeOne
  // 在非法情况下会原样返回 state。
  //
  // 这种情况不能进行迷宫历史检测，
  // 否则单纯点一个非法动作就可能触发回转。
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

  return resolveMazeHistoryAfterAction(
    actionState
  );

}