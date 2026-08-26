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
} from "./rules";


import {
  createCombineOrigin,
  createReduceOrigin,
  createReduceExtractOrigin
} from "./numberOrigin";


import {
  getBoardPieces,
  isBoardFull,
  getNextEmptyIndex,
  getPieceAt,
  getOrderedPair,
  BOARD_CONFIG
} from "./boardRules";


import {
  consumeStep
} from "./gameState";


import {
  applyCollection
} from "./collectionRules";





// ============================================================
// 两格能否组合
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

    return false;

  }



  // ==========================================================
  // 新规则下正常棋盘理论上不会长期存在1。
  //
  // 这里仍然保留保护。
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return false;

  }



  return canCombine(

    first,

    second,

    getBoardPieces(
      state.board
    )

  );

}





// ============================================================
// 是否需要提取最大公约数
//
// 普通三系 + 异值
// → 提取 gcd
//
//
// 同值：
//
// 8 / 8
// → 1 / 1
//
// 不额外生成8。
//
//
// 甜食：
//
// 暂时继续旧特殊规则，
// 不产生 gcd 新卡。
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



  // ==========================================================
  // 同值不提取
  // ==========================================================

  if(
    first.value ===
    second.value
  ){

    return false;

  }



  // ==========================================================
  // 甜食暂时不进入 gcd 提取体系
  // ==========================================================

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
// 公约数产物纯度
//
// 同类来源
// → pure
//
// 异类来源
// → mixed
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



  if(
    first.foodType ===
    second.foodType
  ){

    return FOOD_PURITY.PURE;

  }



  return FOOD_PURITY.MIXED;

}





// ============================================================
// 获取一次约分的基础计划
//
// 这个函数非常重要。
//
// canReduceCells()
// reduceCells()
//
// 都使用同一套结果，
// 避免“UI说能约但执行不了”之类的规则分叉。
//
//
// ------------------------------------------------------------
//
// 返回示例：
//
// 16 / 4
//
// {
//   divisor: 4,
//   firstResult: 4,
//   secondResult: 1,
//   autoRemoveCount: 1,
//   shouldExtract: true
// }
//
// ------------------------------------------------------------
//
// 12 / 18
//
// {
//   divisor: 6,
//   firstResult: 2,
//   secondResult: 3,
//   autoRemoveCount: 0,
//   shouldExtract: true
// }
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



  const shouldExtract =

    shouldExtractReduceDivisor(
      first,
      second
    );



  // ==========================================================
  // 本次约分结束时，
  // 有几个1会立即自动消失。
  // ==========================================================

  let autoRemoveCount =
    0;



  if(
    firstResult === 1
  ){

    autoRemoveCount++;

  }



  if(
    secondResult === 1
  ){

    autoRemoveCount++;

  }



  // ==========================================================
  // 当前已有多少空格
  // ==========================================================

  const currentCount =

    getBoardPieces(
      state.board
    ).length;



  const currentEmptyCount =

    Math.max(

      0,

      BOARD_CONFIG.SIZE -
      currentCount

    );



  // ==========================================================
  // 本次约分真正能够使用的空间
  //
  // 当前空格
  // +
  // 自动消除1释放的格子
  // ==========================================================

  const availableAfterReduce =

    currentEmptyCount +
    autoRemoveCount;



  // ==========================================================
  // gcd 新卡需要1格。
  //
  // 不提取则不需要额外格子。
  // ==========================================================

  const requiredExtraSpace =

    shouldExtract
      ? 1
      : 0;



  const canFitExtract =

    availableAfterReduce >=
    requiredExtraSpace;



  return {

    divisor,

    firstResult,

    secondResult,

    shouldExtract,

    autoRemoveCount,

    currentEmptyCount,

    availableAfterReduce,

    requiredExtraSpace,

    canFitExtract

  };

}





// ============================================================
// 两格能否约分
//
// 新核心规则：
//
// 1. gcd > 1
//
// 2. 结果为1时：
//    → 自动收藏
//    → 自动消失
//
// 3. 判断空间时：
//
//    当前空位
//    +
//    本次会自动消失的1
//
//    都可以用来容纳 gcd 新卡。
//
//
// ------------------------------------------------------------
//
// 满盘：
//
// 16 / 4
// → 4 / 1 + 4
//
// 1会消失
// → 有1个释放格
// → 可以容纳析出的4
// → 允许
//
//
// 满盘：
//
// 12 / 18
// → 2 / 3 + 6
//
// 没有1
// → 没有释放格
// → 禁止
//
//
// 满盘：
//
// 8 / 8
// → 1 / 1
//
// 两边自动收藏
// 不产生新8
//
// → 允许
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

    return false;

  }



  // ==========================================================
  // 正常新棋盘不会存在1。
  //
  // 仍然保护旧状态。
  // ==========================================================

  if(
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



  if(
    !plan
  ){

    return false;

  }



  // ==========================================================
  // 唯一真正的容量判断：
  //
  // 约分完成后的空间
  // 是否容得下析出物。
  // ==========================================================

  if(
    !plan.canFitExtract
  ){

    return false;

  }



  return true;

}





// ============================================================
// 组合
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



  const orderedPair =

    getOrderedPair(
      state,
      indexA,
      indexB
    );



  if(
    !first ||
    !second ||
    !orderedPair
  ){

    return state;

  }



  const {
    front,
    back
  } =
    orderedPair;



  const result =

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

    return state;

  }



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
          front.purity ?? null

      },

      {

        value:
          back.value,

        foodType:
          back.foodType,

        purity:
          back.purity ?? null

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
// ============================================================
// 新核心：1不再进入棋盘
// ============================================================
//
// 任何一边约分结果 === 1：
//
// 1. 创建临时的1节点
// 2. origin 仍然记录 reduce
// 3. 调用 applyCollection()
// 4. 不把1写入 board
// 5. 原格立即变成空格
//
// ------------------------------------------------------------
//
// 例如：
//
// 素4 → 1
//
// 实际内部会瞬间创建：
//
// {
//   value: 1,
//   foodType: "vegetable",
//   origin: {
//     type: "reduce",
//     parent: 素4
//   }
// }
//
// applyCollection()
// ↓
//
// 收藏「4素」
//
// 然后这个临时节点消失。
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



  const plan =

    getReducePlan(
      state,
      first,
      second
    );



  if(
    !plan
  ){

    return state;

  }



  const {

    divisor,

    firstResult,

    secondResult,

    shouldExtract

  } = plan;





  // ==========================================================
  // 先记录两边自己的约分来源
  // ==========================================================

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





  // ==========================================================
  // 默认类型保持不变
  // ==========================================================

  let firstFoodType =
    first.foodType;


  let secondFoodType =
    second.foodType;





  // ==========================================================
  // 甜食特殊变种 A
  //
  // first 是甜食，
  // 并且 first 约成1。
  //
  // → second 发生变种。
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
  // 甜食特殊变种 B
  //
  // second 是甜食，
  // 并且 second 约成1。
  //
  // → first 发生变种。
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
  // 创建两边约分后的临时节点
  //
  // 即使结果为1，也先创建。
  //
  // 因为收藏系统需要通过：
  //
  // piece.value === 1
  // piece.origin.type === "reduce"
  //
  // 找回约分前的数字。
  // ==========================================================

  const firstReducedPiece = {

    ...first,

    value:
      firstResult,

    foodType:
      firstFoodType,

    purity:
      first.purity,

    parents:
      null,

    parentFoods:
      null,

    origin:
      firstOrigin

  };



  const secondReducedPiece = {

    ...second,

    value:
      secondResult,

    foodType:
      secondFoodType,

    purity:
      second.purity,

    parents:
      null,

    parentFoods:
      null,

    origin:
      secondOrigin

  };





  // ==========================================================
  // 第一阶段：
  //
  // 更新棋盘上的两个原位置。
  //
  // 如果结果 === 1：
  //
  // → 直接写 null
  //
  // 1永远不真正进入 board。
  // ==========================================================

  const nextBoard = [
    ...state.board
  ];



  nextBoard[
    indexA
  ] =

    firstResult === 1

      ? null

      : firstReducedPiece;



  nextBoard[
    indexB
  ] =

    secondResult === 1

      ? null

      : secondReducedPiece;





  // ==========================================================
  // 先建立基础 nextState
  // ==========================================================

  let nextState = {

    ...state,

    board:
      nextBoard

  };





  // ==========================================================
  // 第二阶段：
  //
  // 自动收藏 first 的1
  // ==========================================================

  if(
    firstResult === 1
  ){


    nextState =

      applyCollection(

        nextState,

        firstReducedPiece

      );

  }





  // ==========================================================
  // 自动收藏 second 的1
  //
  // 必须使用 first 收藏后的 nextState，
  // 这样如果两边同时收藏，
  // 两次收藏都不会丢失。
  // ==========================================================

  if(
    secondResult === 1
  ){


    nextState =

      applyCollection(

        nextState,

        secondReducedPiece

      );

  }





  // ==========================================================
  // 第三阶段：
  //
  // 析出 gcd 新卡。
  //
  // 注意：
  //
  // 此时结果为1的格子已经是 null。
  //
  // 所以即使原来是满盘，
  // getNextEmptyIndex() 也能找到
  // 刚刚自动释放出来的位置。
  // ==========================================================

  let nextId =
    state.nextId;



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

      return state;

    }



    const extractPurity =

      getReduceExtractPurity(
        first,
        second
      );



    const extractTargetIndex =

      getNextEmptyIndex(
        nextState.board
      );



    // ========================================================
    // 按照 canReduceCells 的规则，
    // 理论上一定有空间。
    //
    // 再做一次安全保护。
    // ========================================================

    if(
      extractTargetIndex === -1
    ){

      return state;

    }



    const extractedPiece = {

      id:
        state.nextId,

      value:
        divisor,

      foodType:
        extractFoodType,

      purity:
        extractPurity,

      parents:
        null,

      parentFoods:
        null,

      origin:

        createReduceExtractOrigin(
          divisor,
          first,
          second
        )

    };



    const boardWithExtract = [
      ...nextState.board
    ];



    boardWithExtract[
      extractTargetIndex
    ] =
      extractedPiece;



    nextState = {

      ...nextState,

      board:
        boardWithExtract

    };



    nextId =
      state.nextId + 1;

  }





  // ==========================================================
  // 写入 nextId
  // ==========================================================

  nextState = {

    ...nextState,

    nextId

  };





  // ==========================================================
  // 玩家只执行了一次“约分”动作，
  //
  // 即使内部：
  //
  // - 自动收藏1次或2次
  // - 析出一个 gcd
  //
  // 仍然只消耗1步。
  // ==========================================================

  nextState =

    consumeStep(
      nextState
    );



  return nextState;

}





// ============================================================
// 旧版手动处理1
//
// 新核心已经不再使用。
//
// 保留这个函数只为了：
//
// - 热更新时旧棋盘兼容
// - 旧模块 import 不立即报错
//
// 新游戏正常流程中不会再产生可点击的1。
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



  let nextState =

    applyCollection(
      state,
      target
    );



  const nextBoard = [
    ...nextState.board
  ];



  nextBoard[
    index
  ] =
    null;



  return {

    ...nextState,

    board:
      nextBoard

  };

}





// ============================================================
// 所有合法组合
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
//
// 新版 canReduceCells 已经自动考虑：
//
// - 当前空格
// - 约成1后释放的空格
// - gcd 新卡需要的空间
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
// 手动消除1
//
// 新核心正式关闭。
//
// 正常运行时永远返回空数组。
// ============================================================

export function getLegalRemoveActions(
  state
){


  return [];

}





// ============================================================
// 所有合法动作
//
// 新核心只有：
//
// combine
// reduce
//
// 不再存在正式的 remove 动作。
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
    )

  ];

}