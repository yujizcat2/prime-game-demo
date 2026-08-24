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
  combineValue,
  combineFoodType,
  canReduce,
  canCombine
} from "./rules";

import {
  createCombineOrigin,
  createReduceOrigin,
  getMainLineage
} from "./numberOrigin";



// ============================================================
// 九宫格
// ============================================================

export const BOARD_CONFIG = {

  ROWS: 3,

  COLS: 3,

  SIZE: 9

};



// ============================================================
// 创建空棋盘
// ============================================================

export function createEmptyBoard(){


  return Array.from(
    {
      length: BOARD_CONFIG.SIZE
    },
    () => null
  );

}



// ============================================================
// 获取所有正式棋子
// ============================================================

export function getBoardPieces(
  board
){


  if(
    !Array.isArray(board)
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
    ) >=
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
    !Array.isArray(board)
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


  return state.board[index]
    ?? null;

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


  return getBoardPieces(
    state?.board
  ).find(

    item =>
      item.id === id

  ) ?? null;

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
// 只读取前三个数字。
//
// 推荐由 StartScreen 保证：
//
// 1. 数字来自 2-9
// 2. 三个数字互不重复
//
// Engine 这里只负责赋予类型。
// ============================================================

export function createGameState(
  values
){


  const board =
    createEmptyBoard();



  const initialValues =

    Array.isArray(values)

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


        parents:
          null,


        parentFoods:
          null,


        origin:
          null

      };

    }

  );



  return {

    board,


    collection: [],


    collectionOrigins: {},


    collectionPaths: {},


    latestCollection:
      null,


    score:
      0,


    steps:
      0,


    gameOver:
      false,


    nextId:
      initialValues.length + 1

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
  ).some(

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

      state.steps +

      GAME_CONFIG.STEP_COST

  };

}



// ============================================================
// 确定两个棋子的前后
//
// index较小 = front
//
// 点击顺序不影响结果。
//
// 注意：
//
// 新版 foodType 合成规则
// 已经不再依赖前后位置。
//
// 但这里仍然保留 front / back，
// 因为来源路径、parentFoods 等
// 仍然需要稳定的棋盘顺序。
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
    indexA < indexB
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
    indexA === indexB
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



  // ==========================================================
  // 1不能参与合成
  // ==========================================================

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
    indexA === indexB
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



  // ==========================================================
  // 1不能继续约分
  // ==========================================================

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
// 九宫格规则：
//
// 1. A、B保留
// 2. 自动寻找第一个null
// 3. C进入该格
//
// 玩家不选择结果位置。
//
//
// 类型规则交给 combineFoodType：
//
// 荤 + 素
// → 调料
//
// 素 + 调料
// → 荤
//
// 调料 + 荤
// → 素
//
// 同类 + 同类
// → 同类
//
// 甜食 + 普通
// → 普通
//
// 甜食 + 甜食
// → 甜食
//
//
// 跨101只改变数字，
// 不改变类型。
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
  } = orderedPair;



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
  //
  // 与数字是否跨101完全独立。
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



  const newPiece = {


    id:
      state.nextId,


    value:
      result,


    foodType,


    parents: [

      a.value,

      b.value

    ],


    parentFoods: [

      {

        value:
          front.value,

        foodType:
          front.foodType

      },

      {

        value:
          back.value,

        foodType:
          back.foodType

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
  ] = newPiece;



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
// 原地变化。
//
// 当前版本：
//
// 约分只改变数字，
// 暂时保持原 foodType 不变。
//
// 下一阶段如果要加入
// “约分产生甜食”规则，
// 就主要从这里扩展。
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



  // ==========================================================
  // 第一个数字原地约分
  //
  // foodType保持不变。
  // ==========================================================

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



  // ==========================================================
  // 第二个数字原地约分
  //
  // foodType保持不变。
  // ==========================================================

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
//
// board[index] = null
//
// 新版已经完全取消调料盘。
//
// 因此：
//
// 约分得到1
// → 玩家消除1
// → 记录收藏 / 来源 / 路径 / 分数
// → 该格变为空
//
// 不再自动生成调料。
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



  // ==========================================================
  // 获取1之前的来源
  // ==========================================================

  const previousRecord =

    target.origin?.type === "reduce"

      ? target.origin.parent

      : null;



  const discoveredValue =

    previousRecord?.value
    ?? null;



  let nextScore =
    state.score;


  let nextCollection =
    state.collection;


  let nextCollectionOrigins =
    state.collectionOrigins
    ?? {};


  let nextCollectionPaths =
    state.collectionPaths
    ?? {};


  let nextLatestCollection =
    state.latestCollection
    ?? null;



  // ==========================================================
  // 有合法来源
  // ==========================================================

  if(
    discoveredValue !== null &&
    previousRecord
  ){


    const isFirstTime =

      !state.collection.includes(
        discoveredValue
      );



    // ========================================================
    // 保存来源实例
    // ========================================================

    const oldOrigins =

      nextCollectionOrigins[
        discoveredValue
      ] ?? [];



    nextCollectionOrigins = {

      ...nextCollectionOrigins,

      [discoveredValue]: [

        ...oldOrigins,

        previousRecord

      ]

    };



    // ========================================================
    // 保存主路径
    // ========================================================

    const mainLineage =

      getMainLineage(
        previousRecord
      );



    const oldPaths =

      nextCollectionPaths[
        discoveredValue
      ] ?? [];



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



    // ========================================================
    // 第一次发现
    // ========================================================

    if(
      isFirstTime
    ){


      const newNumberCount =

        state.collection.length + 1;



      const discoveryScore =

        newNumberCount *

        SCORE_CONFIG.NEW_NUMBER_GROWTH;



      nextScore =

        state.score +

        discoveryScore;



      nextCollection = [

        ...state.collection,

        discoveredValue

      ];

    }


    // ========================================================
    // 重复发现
    // ========================================================

    else{


      nextScore =

        state.score +

        SCORE_CONFIG.REPEAT_SCORE;

    }

  }



  // ==========================================================
  // 清空棋盘位置
  // ==========================================================

  const nextBoard = [

    ...state.board

  ];



  nextBoard[
    index
  ] = null;



  // ==========================================================
  // 新状态
  // ==========================================================

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



  const actions = [];



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



  const actions = [];



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



  const actions = [];



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
// 执行动作
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



  switch(
    action.type
  ){


    case "combine":

      return combineCells(

        state,

        action.indexes?.[0],

        action.indexes?.[1]

      );



    case "reduce":

      return reduceCells(

        state,

        action.indexes?.[0],

        action.indexes?.[1]

      );



    case "remove":

      return removeOne(

        state,

        action.index

      );



    default:

      return state;

  }

}