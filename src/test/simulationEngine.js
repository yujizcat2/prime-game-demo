import {
  gcd
} from "../utils/math";

import {
  FOOD_TYPES,
  FOOD_PURITY,
  combineValue,
  combineFoodType,
  combineFoodPurity,
  canReduce,
  canCombine
} from "../game/rules";

import {
  createMazeStateKey
} from "../game/mazeHistory";





// ============================================================
// Simulation
//
// 高速版本：
//
// 不保存完整 mazeHistory.entries。
// 使用持久化 prototype 链记录访问状态。
//
// clone 时：
//
// Object.create(parentVisited)
//
// 不再复制整条历史。
// ============================================================

export const SIM_BOARD_SIZE = 9;





// ============================================================
// 快速字符串 Hash
//
// 只用于 Beam Search 历史签名。
// 不用于真正的回转判断。
// ============================================================

function hashString(
  text
){


  let hash =
    2166136261;



  for(
    let i = 0;
    i < text.length;
    i++
  ){


    hash ^=

      text.charCodeAt(
        i
      );


    hash =

      Math.imul(
        hash,
        16777619
      );

  }



  return hash >>> 0;

}





// ============================================================
// 持久化历史 Key
// ============================================================

function toVisitedKey(
  stateKey
){


  return `@${stateKey}`;

}





// ============================================================
// 当前状态是否曾经出现
// ============================================================

function getVisitedEntry(
  state,
  stateKey
){


  const key =

    toVisitedKey(
      stateKey
    );



  if(
    key in state.mazeVisited
  ){


    return state.mazeVisited[key];

  }



  return null;

}





// ============================================================
// 记录状态
//
// 注意：
//
// mazeVisited 使用 prototype chain。
// 当前分支只写自己的这一层。
// ============================================================

function recordVisitedState(
  state,
  stateKey,
  reason = "normal"
){


  const existing =

    getVisitedEntry(
      state,
      stateKey
    );



  if(
    existing
  ){


    return existing;

  }



  const hash =

    hashString(
      stateKey
    );



  const entry = {

    sequence:
      state.mazeVisitedCount,

    steps:
      state.steps,

    reason

  };



  state.mazeVisited[
    toVisitedKey(
      stateKey
    )
  ] =
    entry;



  state.mazeVisitedCount++;



  state.mazeHashXor =

    (
      state.mazeHashXor
      ^
      hash
    )

    >>>

    0;



  state.mazeHashSum =

    (
      state.mazeHashSum
      +
      hash
    )

    >>>

    0;



  return entry;

}





// ============================================================
// 创建模拟状态
// ============================================================

export function createSimulationState(
  values
){


  const board =

    Array.from(
      {
        length:
          SIM_BOARD_SIZE
      },
      () =>
        null
    );



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



  const types = [

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

        value,

        foodType:
          types[index],

        purity:
          FOOD_PURITY.PURE,

        parents:
          null,

        parentFoods:
          null,

        previousValue:
          null

      };

    }

  );





  const state = {

    board,

    collection:
      new Set(),

    steps:
      0,


    // ========================================================
    // 快速迷宫历史
    // ========================================================

    mazeVisited:
      Object.create(
        null
      ),

    mazeVisitedCount:
      0,

    mazeHashXor:
      0,

    mazeHashSum:
      0,

    mazeTurnCount:
      0,

    lastMazeTurn:
      null

  };





  // ==========================================================
  // 开局必须记录
  // ==========================================================

  recordVisitedState(

    state,

    createMazeStateKey(
      state
    ),

    "initial"

  );



  return state;

}





// ============================================================
// 当前棋子
// ============================================================

function getPieces(
  board
){


  return board.filter(
    Boolean
  );

}





// ============================================================
// 是否满盘
// ============================================================

function isBoardFull(
  board
){


  for(
    let i = 0,
        count = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i]
    ){


      count++;



      if(
        count >=
        SIM_BOARD_SIZE
      ){


        return true;

      }

    }

  }



  return false;

}





// ============================================================
// 第一个空格
// ============================================================

function getNextEmptyIndex(
  board
){


  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i] ===
      null
    ){


      return i;

    }

  }



  return -1;

}





// ============================================================
// 合成合法
// ============================================================

function canCombineIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA === indexB ||
    isBoardFull(
      state.board
    )
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b ||
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }



  return canCombine(

    a,

    b,

    getPieces(
      state.board
    )

  );

}





// ============================================================
// 约分合法
// ============================================================

function canReduceIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA ===
    indexB
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b ||
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
// 所有合法动作
// ============================================================

export function getSimulationLegalActions(
  state
){


  const actions =
    [];


  const board =
    state.board;


  const full =

    isBoardFull(
      board
    );





  // ==========================================================
  // 处理1
  // ==========================================================

  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i]?.value ===
      1
    ){


      actions.push({

        type:
          "remove",

        index:
          i

      });

    }

  }





  // ==========================================================
  // 两两动作
  // ==========================================================

  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const a =
      board[i];



    if(
      !a ||
      a.value === 1
    ){


      continue;

    }



    for(
      let j = i + 1;
      j < SIM_BOARD_SIZE;
      j++
    ){


      const b =
        board[j];



      if(
        !b ||
        b.value === 1
      ){


        continue;

      }



      if(
        !full &&
        canCombineIndexes(
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



      if(
        canReduceIndexes(
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
// 合成
// ============================================================

function applyCombine(
  state,
  indexA,
  indexB
){


  const targetIndex =

    getNextEmptyIndex(
      state.board
    );



  if(
    targetIndex ===
    -1
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b
  ){


    return false;

  }



  const front =

    indexA < indexB
      ? a
      : b;



  const back =

    indexA < indexB
      ? b
      : a;



  const value =

    combineValue(

      front.value,

      back.value

    );



  const foodType =

    combineFoodType(

      front,

      back

    );



  if(
    !foodType
  ){


    return false;

  }



  state.board[
    targetIndex
  ] = {

    value,

    foodType,

    purity:

      combineFoodPurity(
        front,
        back
      ),

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

    previousValue:
      null

  };



  state.steps++;



  return true;

}





// ============================================================
// 约分
// ============================================================

function applyReduce(
  state,
  indexA,
  indexB
){


  const first =
    state.board[indexA];


  const second =
    state.board[indexB];



  if(
    !first ||
    !second
  ){


    return false;

  }



  const divisor =

    gcd(

      first.value,

      second.value

    );



  if(
    divisor <=
    1
  ){


    return false;

  }



  const oldA =
    first.value;


  const oldB =
    second.value;



  first.value =
    oldA / divisor;


  second.value =
    oldB / divisor;



  // 约分后直接父母清空

  first.parents =
    null;

  first.parentFoods =
    null;

  second.parents =
    null;

  second.parentFoods =
    null;



  // 模拟 origin.parent.value

  first.previousValue =
    oldA;

  second.previousValue =
    oldB;



  state.steps++;



  return true;

}





// ============================================================
// 处理1
// ============================================================

function applyRemove(
  state,
  index
){


  const target =
    state.board[index];



  if(
    !target ||
    target.value !== 1
  ){


    return false;

  }



  if(
    target.previousValue !=
    null
  ){


    state.collection.add(
      target.previousValue
    );

  }



  state.board[index] =
    null;



  return true;

}





// ============================================================
// 迷宫回转数值
// ============================================================

function mazeTurnValue(
  value
){


  return (

    value === 101

      ?

        2

      :

        value + 1

  );

}





// ============================================================
// 全盘迷宫回转
// ============================================================

function applyMazeTurn(
  state
){


  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const piece =
      state.board[i];



    if(
      piece
    ){


      piece.value =

        mazeTurnValue(
          piece.value
        );

    }

  }

}





// ============================================================
// 动作后的迷宫检测
//
// 每次动作最多触发一次。
// ============================================================

function resolveMaze(
  state
){


  const key =

    createMazeStateKey(
      state
    );



  const previous =

    getVisitedEntry(
      state,
      key
    );





  // ==========================================================
  // 新状态
  // ==========================================================

  if(
    !previous
  ){


    recordVisitedState(

      state,

      key,

      "normal"

    );


    state.lastMazeTurn =
      null;


    return;

  }





  // ==========================================================
  // 触发回转
  // ==========================================================

  const beforeValues =

    state.board.map(

      piece =>
        piece?.value
        ?? null

    );



  applyMazeTurn(
    state
  );



  state.mazeTurnCount++;



  const afterValues =

    state.board.map(

      piece =>
        piece?.value
        ?? null

    );



  state.lastMazeTurn = {

    triggered:
      true,

    count:
      state.mazeTurnCount,

    previousSequence:
      previous.sequence,

    previousSteps:
      previous.steps,

    triggerSteps:
      state.steps,

    beforeValues,

    afterValues

  };





  // ==========================================================
  // 记录回转后的状态
  //
  // 如果它以前已经存在，
  // 第一版仍不连续触发第二次。
  // ==========================================================

  const turnedKey =

    createMazeStateKey(
      state
    );



  if(
    !getVisitedEntry(
      state,
      turnedKey
    )
  ){


    recordVisitedState(

      state,

      turnedKey,

      "maze-turn"

    );

  }

}





// ============================================================
// 执行动作
// ============================================================

export function applySimulationAction(
  state,
  action
){


  if(
    !state ||
    !action
  ){


    return false;

  }



  let applied =
    false;



  switch(
    action.type
  ){


    case "combine":


      applied =

        applyCombine(

          state,

          action.indexes[0],

          action.indexes[1]

        );


      break;



    case "reduce":


      applied =

        applyReduce(

          state,

          action.indexes[0],

          action.indexes[1]

        );


      break;



    case "remove":


      applied =

        applyRemove(

          state,

          action.index

        );


      break;



    default:


      return false;

  }



  if(
    !applied
  ){


    return false;

  }



  resolveMaze(
    state
  );



  return true;

}





// ============================================================
// 克隆棋子
// ============================================================

function clonePiece(
  piece
){


  if(
    !piece
  ){


    return null;

  }



  return {

    value:
      piece.value,

    foodType:
      piece.foodType,

    purity:
      piece.purity,

    parents:

      piece.parents

        ?

          [
            ...piece.parents
          ]

        :

          null,

    parentFoods:

      piece.parentFoods

        ?

          piece.parentFoods.map(

            food => ({

              value:
                food.value,

              foodType:
                food.foodType,

              purity:
                food.purity

            })

          )

        :

          null,

    previousValue:
      piece.previousValue
      ?? null

  };

}





// ============================================================
// 高速 clone
//
// 关键：
//
// mazeVisited 不复制整个历史。
// 新建一层 prototype。
// ============================================================

export function cloneSimulationState(
  state
){


  return {

    board:

      state.board.map(
        clonePiece
      ),

    collection:

      new Set(
        state.collection
      ),

    steps:
      state.steps,


    // ========================================================
    // O(1) 历史分支
    // ========================================================

    mazeVisited:

      Object.create(
        state.mazeVisited
      ),

    mazeVisitedCount:
      state.mazeVisitedCount,

    mazeHashXor:
      state.mazeHashXor,

    mazeHashSum:
      state.mazeHashSum,

    mazeTurnCount:
      state.mazeTurnCount,

    lastMazeTurn:
      null

  };

}





// ============================================================
// Beam 快速历史签名
//
// 不需要重新：
//
// Set
// sort
// join
//
// O(1)
// ============================================================

export function getSimulationHistorySignature(
  state
){


  return (

    `${state.mazeVisitedCount}`

    +

    ":"

    +

    `${state.mazeHashXor}`

    +

    ":"

    +

    `${state.mazeHashSum}`

  );

}