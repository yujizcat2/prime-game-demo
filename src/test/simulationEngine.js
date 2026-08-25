import {
  gcd
} from "../utils/math";

import {
  ANIMAL_TYPES,
  ANIMAL_PURITY,
  combineValue,
  combineAnimalType,
  combineAnimalPurity,
  canReduce,
  canCombine,
  getBirdMutationAnimalType
} from "../game/rules";

import {
  createMazeStateKey
} from "../game/mazeHistory";

import {
  applyCollection
} from "../game/collectionRules";





// ============================================================
// Simulation
//
// 高速模拟版本。
//
// ------------------------------------------------------------
//
// 当前支持：
//
// 狗 / 猫 / 哺乳
// → 三槽收藏
//
// 鸟
// → 不进入收藏
//
// ------------------------------------------------------------
//
// 鸟系变种规则：
//
// 普通动物 + 鸟
// ↓
// 约分
//
// 如果鸟这一侧结果 === 1：
//
// 狗
// ↓
// 猫
// ↓
// 哺乳
// ↓
// 狗
//
// ------------------------------------------------------------
//
// Simulation 不保存正式：
//
// origin
// collectionOrigins
// collectionPaths
// collectionParents
//
// 只保留测试真正需要的数据。
// ============================================================

export const SIM_BOARD_SIZE =
  9;





// ============================================================
// 快速字符串 Hash
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





function toVisitedKey(
  stateKey
){


  return `@${stateKey}`;

}





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


    return state.mazeVisited[
      key
    ];

  }



  return null;

}





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
//
// 开局：
//
// 第1个 → 狗
// 第2个 → 猫
// 第3个 → 哺乳
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

    ANIMAL_TYPES.DOG,

    ANIMAL_TYPES.CAT,

    ANIMAL_TYPES.MAMMAL

  ];



  initialValues.forEach(

    (
      value,
      index
    ) => {


      board[
        index
      ] = {

        value,

        animalType:
          types[
            index
          ],

        purity:
          ANIMAL_PURITY.PURE,

        parents:
          null,

        parentAnimals:
          null,

        previousValue:
          null

      };

    }

  );





  const state = {

    board,





    // ========================================================
    // 收藏槽
    //
    // Set 内格式：
    //
    // 17:dog
    // 17:cat
    // 17:mammal
    // ========================================================

    collection:
      new Set(),





    // ========================================================
    // 首次获得新收藏槽的动物类型历史
    // ========================================================

    collectionAnimalTypeHistory:
      [],





    steps:
      0,





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
// 获取所有棋子
// ============================================================

function getPieces(
  board
){


  return board.filter(
    Boolean
  );

}





// ============================================================
// 棋盘是否已满
// ============================================================

function isBoardFull(
  board
){


  let count =
    0;



  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[
        i
      ]
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
// 下一个空位
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
      board[
        i
      ]

      ===

      null
    ){


      return i;

    }

  }



  return -1;

}





// ============================================================
// 能否组合
// ============================================================

function canCombineIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA ===
    indexB
    ||
    isBoardFull(
      state.board
    )
  ){


    return false;

  }



  const a =

    state.board[
      indexA
    ];


  const b =

    state.board[
      indexB
    ];



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
// 能否约分
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

    state.board[
      indexA
    ];


  const b =

    state.board[
      indexB
    ];



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
// 获取全部合法动作
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
      board[
        i
      ]?.value ===
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
  // 合成 / 约分
  // ==========================================================

  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const a =

      board[
        i
      ];



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

        board[
          j
        ];



      if(
        !b ||
        b.value === 1
      ){


        continue;

      }



      if(
        !full
        &&
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
// 组合
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

    state.board[
      indexA
    ];


  const b =

    state.board[
      indexB
    ];



  if(
    !a ||
    !b
  ){


    return false;

  }



  const front =

    indexA <
    indexB

      ?

        a

      :

        b;



  const back =

    indexA <
    indexB

      ?

        b

      :

        a;





  const value =

    combineValue(

      front.value,

      back.value

    );





  const animalType =

    combineAnimalType(

      front,

      back

    );



  if(
    !animalType
  ){


    return false;

  }





  state.board[
    targetIndex
  ] = {

    value,

    animalType,

    purity:

      combineAnimalPurity(

        front,

        back

      ),

    parents: [

      a.value,

      b.value

    ],

    parentAnimals: [

      {

        value:
          front.value,

        animalType:
          front.animalType,

        purity:
          front.purity
          ?? null

      },

      {

        value:
          back.value,

        animalType:
          back.animalType,

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
//
// ============================================================
// 普通规则
// ============================================================
//
// value 改变。
//
// animalType / purity
// 默认保持。
//
// parents / parentAnimals
// 清除。
//
// previousValue
// 保存约分前数字，用于 Simulation 收藏。
//
//
// ============================================================
// 鸟系变种
// ============================================================
//
// 如果：
//
// 鸟 + 普通动物
//
// 进行约分，
//
// 且鸟这一侧结果 === 1，
//
// 则另一侧普通动物发生三角变种：
//
// 狗
// ↓
// 猫
// ↓
// 哺乳
// ↓
// 狗
//
//
// ------------------------------------------------------------
//
// 例：
//
// 狗14 + 鸟7
// ÷7
//
// → 狗2 + 鸟1
//
// → 猫2 + 鸟1
//
// ------------------------------------------------------------
//
// 当前：
//
// - 数字不改变
// - purity 不改变
// - 不检测灭绝
// - 鸟 + 鸟 不触发
// ============================================================

function applyReduce(
  state,
  indexA,
  indexB
){


  const first =

    state.board[
      indexA
    ];


  const second =

    state.board[
      indexB
    ];



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



  const firstResult =

    oldA /
    divisor;


  const secondResult =

    oldB /
    divisor;





  // ==========================================================
  // 默认类型保持
  // ==========================================================

  let firstAnimalType =

    first.animalType;


  let secondAnimalType =

    second.animalType;





  // ==========================================================
  // first 是鸟
  //
  // first → 1
  //
  // second 发生变种
  // ==========================================================

  if(
    first.animalType ===
    ANIMAL_TYPES.BIRD

    &&

    firstResult ===
    1
  ){


    const mutatedType =

      getBirdMutationAnimalType(
        second.animalType
      );



    if(
      mutatedType
    ){


      secondAnimalType =
        mutatedType;

    }

  }





  // ==========================================================
  // second 是鸟
  //
  // second → 1
  //
  // first 发生变种
  // ==========================================================

  if(
    second.animalType ===
    ANIMAL_TYPES.BIRD

    &&

    secondResult ===
    1
  ){


    const mutatedType =

      getBirdMutationAnimalType(
        first.animalType
      );



    if(
      mutatedType
    ){


      firstAnimalType =
        mutatedType;

    }

  }





  // ==========================================================
  // 更新 first
  // ==========================================================

  first.value =
    firstResult;


  first.animalType =
    firstAnimalType;


  first.parents =
    null;


  first.parentAnimals =
    null;


  first.previousValue =
    oldA;





  // ==========================================================
  // 更新 second
  // ==========================================================

  second.value =
    secondResult;


  second.animalType =
    secondAnimalType;


  second.parents =
    null;


  second.parentAnimals =
    null;


  second.previousValue =
    oldB;





  // ==========================================================
  // purity 当前保持不变
  // ==========================================================

  state.steps++;



  return true;

}





// ============================================================
// 处理1
//
// 普通三系1：
//
// → applyCollection
//
// 鸟1：
//
// → applyCollection 会自动忽略
//
// 最后删除棋子。
// ============================================================

function applyRemove(
  state,
  index
){


  const target =

    state.board[
      index
    ];



  if(
    !target ||
    target.value !==
    1
  ){


    return false;

  }





  applyCollection(

    state,

    target

  );





  state.board[
    index
  ] =
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

    value ===
    101

      ?

        2

      :

        value + 1

  );

}





// ============================================================
// 应用迷宫回转
//
// 只改变 value。
// animalType / purity 不改变。
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

      state.board[
        i
      ];



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
// 迷宫重复检测
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
  // 重复状态
  // ==========================================================

  const beforeValues =

    state.board.map(

      piece =>

        piece?.value

        ??

        null

    );





  applyMazeTurn(
    state
  );





  state.mazeTurnCount++;





  const afterValues =

    state.board.map(

      piece =>

        piece?.value

        ??

        null

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
// 应用动作
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

          action.indexes[
            0
          ],

          action.indexes[
            1
          ]

        );


      break;





    case "reduce":


      applied =

        applyReduce(

          state,

          action.indexes[
            0
          ],

          action.indexes[
            1
          ]

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
// Clone Piece
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

    animalType:
      piece.animalType,

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

    parentAnimals:

      piece.parentAnimals

        ?

          piece.parentAnimals.map(

            animal => ({

              value:
                animal.value,

              animalType:
                animal.animalType,

              purity:
                animal.purity

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
// Clone Simulation State
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





    collectionAnimalTypeHistory:

      [
        ...(
          state.collectionAnimalTypeHistory
          ?? []
        )
      ],





    steps:
      state.steps,





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
// Simulation 历史签名
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