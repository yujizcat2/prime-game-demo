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
  canCombine,
  getReduceExtractFoodType,
  getDessertMutationFoodType
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
// 新版核心：
//
// 1. 合成
//    A + B → C
//
// 2. 约分
//
//    A / B
//
//    gcd = G
//
//    普通异值：
//    → A/G
//    → B/G
//    → 析出 G
//
//    结果为1：
//    → 自动收藏
//    → 不落盘
//
//    同值：
//    → 1 / 1
//    → 两边自动收藏
//    → 不析出 G
//
// 3. 不再存在手动 remove 动作。
//
// 4. 甜食变种规则继续保留。
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


      board[
        index
      ] = {

        value,

        foodType:
          types[
            index
          ],

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


    // ========================================================
    // 收藏槽
    //
    // "17:meat"
    // "17:vegetable"
    // "17:seasoning"
    // ========================================================

    collection:
      new Set(),


    collectionFoodTypeHistory:
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


  return (

    getPieces(
      board
    ).length >=
    SIM_BOARD_SIZE

  );

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
      ] === null
    ){


      return i;

    }

  }



  return -1;

}





// ============================================================
// 是否需要析出 gcd
// ============================================================

function shouldExtractReduceDivisor(
  first,
  second
){


  if(
    !first ||
    !second
  ){


    return false;

  }



  if(
    first.value ===
    second.value
  ){


    return false;

  }



  if(
    first.foodType ===
      FOOD_TYPES.DESSERT
    ||
    second.foodType ===
      FOOD_TYPES.DESSERT
  ){


    return false;

  }



  return Boolean(

    getReduceExtractFoodType(
      first,
      second
    )

  );

}





// ============================================================
// gcd 析出物纯度
// ============================================================

function getReduceExtractPurity(
  first,
  second
){


  const foodType =

    getReduceExtractFoodType(
      first,
      second
    );



  if(
    !foodType
  ){


    return null;

  }



  return (

    first.foodType ===
    second.foodType

      ?

        FOOD_PURITY.PURE

      :

        FOOD_PURITY.MIXED

  );

}





// ============================================================
// 约分计划
// ============================================================

function getReducePlan(
  state,
  first,
  second
){


  if(
    !state ||
    !first ||
    !second
  ){


    return null;

  }



  const divisor =

    gcd(
      first.value,
      second.value
    );



  if(
    divisor <= 1
  ){


    return null;

  }



  const firstResult =

    first.value /
    divisor;



  const secondResult =

    second.value /
    divisor;



  const firstAutoCollect =

    firstResult === 1;



  const secondAutoCollect =

    secondResult === 1;



  const autoCollectCount =

    (
      firstAutoCollect
        ? 1
        : 0
    )

    +

    (
      secondAutoCollect
        ? 1
        : 0
    );



  const shouldExtract =

    shouldExtractReduceDivisor(
      first,
      second
    );



  const currentEmptyCount =

    Math.max(

      0,

      SIM_BOARD_SIZE -
      getPieces(
        state.board
      ).length

    );



  const availableAfterReduce =

    currentEmptyCount +
    autoCollectCount;



  const requiredExtraSpace =

    shouldExtract
      ? 1
      : 0;



  return {

    divisor,

    firstResult,

    secondResult,

    firstAutoCollect,

    secondAutoCollect,

    autoCollectCount,

    shouldExtract,

    currentEmptyCount,

    availableAfterReduce,

    requiredExtraSpace,

    canFitExtract:

      availableAfterReduce >=
      requiredExtraSpace

  };

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
//
// 使用与正式游戏一致的净空间逻辑。
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
    !second ||
    first.value === 1 ||
    second.value === 1
  ){


    return false;

  }



  if(
    !canReduce(
      first,
      second
    )
  ){


    return false;

  }



  const plan =

    getReducePlan(
      state,
      first,
      second
    );



  return Boolean(
    plan?.canFitExtract
  );

}





// ============================================================
// 获取全部合法动作
//
// 新版只有：
//
// combine
// reduce
//
// 不再产生 remove。
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



  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const first =

      board[
        i
      ];



    if(
      !first ||
      first.value === 1
    ){


      continue;

    }



    for(
      let j = i + 1;
      j < SIM_BOARD_SIZE;
      j++
    ){


      const second =

        board[
          j
        ];



      if(
        !second ||
        second.value === 1
      ){


        continue;

      }



      // ======================================================
      // 合成
      // ======================================================

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



      // ======================================================
      // 约分
      // ======================================================

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



  const front =

    indexA <
    indexB

      ?

        first

      :

        second;



  const back =

    indexA <
    indexB

      ?

        second

      :

        first;



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

      first.value,

      second.value

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
// 自动收藏一个约成1的临时节点
//
// Simulation 不保存完整 origin，
// 所以继续通过 previousValue
// 告诉 applyCollection：
//
// “这个1来自哪个数字”。
// ============================================================

function autoCollectReducedOne(
  state,
  piece
){


  if(
    !piece ||
    piece.value !== 1
  ){


    return;

  }



  applyCollection(
    state,
    piece
  );

}





// ============================================================
// 约分
//
// 新版：
//
// 12 / 18
// → 2 / 3 + 6
//
// 16 / 4
// → 4 / 1 + 4
// → 1自动收藏
// → 最终 4 + 4
//
// 8 / 8
// → 1 / 1
// → 两边自动收藏
// → 两格消失
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



  const plan =

    getReducePlan(
      state,
      first,
      second
    );



  if(
    !plan ||
    !plan.canFitExtract
  ){


    return false;

  }



  const {

    divisor,

    firstResult,

    secondResult,

    shouldExtract

  } = plan;



  const oldA =
    first.value;


  const oldB =
    second.value;



  // ==========================================================
  // 默认类型
  // ==========================================================

  let firstFoodType =
    first.foodType;


  let secondFoodType =
    second.foodType;



  // ==========================================================
  // 甜食变种 A
  // ==========================================================

  if(
    first.foodType ===
      FOOD_TYPES.DESSERT
    &&
    firstResult === 1
  ){


    const mutatedType =

      getDessertMutationFoodType(
        second.foodType
      );



    if(
      mutatedType
    ){


      secondFoodType =
        mutatedType;

    }

  }



  // ==========================================================
  // 甜食变种 B
  // ==========================================================

  if(
    second.foodType ===
      FOOD_TYPES.DESSERT
    &&
    secondResult === 1
  ){


    const mutatedType =

      getDessertMutationFoodType(
        first.foodType
      );



    if(
      mutatedType
    ){


      firstFoodType =
        mutatedType;

    }

  }



  // ==========================================================
  // 构造约分后的临时节点
  // ==========================================================

  const firstReducedPiece = {

    ...first,

    value:
      firstResult,

    foodType:
      firstFoodType,

    parents:
      null,

    parentFoods:
      null,

    previousValue:
      oldA

  };



  const secondReducedPiece = {

    ...second,

    value:
      secondResult,

    foodType:
      secondFoodType,

    parents:
      null,

    parentFoods:
      null,

    previousValue:
      oldB

  };



  // ==========================================================
  // 结果不是1
  // → 留盘
  //
  // 结果是1
  // → 直接释放格
  // ==========================================================

  state.board[
    indexA
  ] =

    firstResult === 1

      ?

        null

      :

        firstReducedPiece;



  state.board[
    indexB
  ] =

    secondResult === 1

      ?

        null

      :

        secondReducedPiece;



  // ==========================================================
  // 自动收藏
  // ==========================================================

  if(
    firstResult === 1
  ){


    autoCollectReducedOne(
      state,
      firstReducedPiece
    );

  }



  if(
    secondResult === 1
  ){


    autoCollectReducedOne(
      state,
      secondReducedPiece
    );

  }



  // ==========================================================
  // 析出 gcd
  // ==========================================================

  if(
    shouldExtract
  ){


    const extractFoodType =

      getReduceExtractFoodType(
        first,
        second
      );



    if(
      !extractFoodType
    ){


      return false;

    }



    const targetIndex =

      getNextEmptyIndex(
        state.board
      );



    if(
      targetIndex === -1
    ){


      return false;

    }



    state.board[
      targetIndex
    ] = {

      value:
        divisor,

      foodType:
        extractFoodType,

      purity:

        getReduceExtractPurity(
          first,
          second
        ),

      parents:
        null,

      parentFoods:
        null,

      previousValue:
        null

    };

  }



  state.steps++;



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
//
// 新版正式 Simulation 动作只有：
//
// combine
// reduce
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


    collectionFoodTypeHistory:

      [
        ...(
          state.collectionFoodTypeHistory
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