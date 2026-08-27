import {
  gcd
} from "../utils/math";

import {
  FOOD_TYPES,
  combineValue,
  combineFoodType,
  combineFoodPurity,
  canReduce,
  canCombine,
  getDessertMutationFoodType
} from "./rules";

import {
  createCombineOrigin,
  createReduceOrigin
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
  applyCollection,
  applyCollections
} from "./collectionRules";

import {
  appendRecentActionSignature,
  createCombineActionSignature,
  createReduceActionSignature,
  getActionFatigue
} from "./actionFatigue";





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

      a.value,

      b.value

    ],

    sourceKey:
      [a.value, b.value].sort((left, right) => left - right).join("|"),


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

  nextState = {
    ...nextState,
    recentActionSignatures: appendRecentActionSignature(
      state.recentActionSignatures,
      createCombineActionSignature(a.value, b.value, result)
    )
  };



  return nextState;

}





// ============================================================
// 约分
//
// 基础规则：
//
// 约分：
//
// - 改变 value
// - 默认不改变 foodType
// - 默认不改变 purity
// - 清除当前这一代的组合父母
//
//
// ============================================================
// 甜食系变种规则
// ============================================================
//
// 如果：
//
// 普通食物 + 甜食
//
// 进行约分，
//
// 并且甜食这一侧约分后的结果 === 1，
//
// 那么另一侧普通食物发生一次三角变种：
//
// 荤
// ↓
// 素
// ↓
// 调料
// ↓
// 荤
//
//
// ------------------------------------------------------------
//
// 例如：
//
// 荤14 + 甜食7
//
// ÷7
//
// → 荤2 + 甜食1
//
// 甜食变成1，因此：
//
// 荤2 → 素2
//
//
// 最终：
//
// 素2 + 甜食1
//
//
// ------------------------------------------------------------
//
// 当前 V1：
//
// - 不检测是否灭绝
// - 不随机
// - 不允许玩家选择
// - 不改变数字
// - 不改变 purity
// - 甜食 + 甜食 不触发变种
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

  const actionSignature = createReduceActionSignature(
    first.value,
    second.value,
    firstResult,
    secondResult
  );

  const actionFatigue = getActionFatigue(
    state.recentActionSignatures,
    actionSignature
  );





  // ==========================================================
  // 先记录约分来源
  //
  // 注意：
  //
  // origin 保存的是“变种之前”的真实父节点。
  //
  // 这样以后仍然可以知道：
  //
  // 这个素2原本其实是荤14，
  // 因为甜食系约分而发生了变种。
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
  // 默认 foodType
  //
  // 普通约分保持原类型。
  // ==========================================================

  let firstFoodType =
    first.foodType;


  let secondFoodType =
    second.foodType;





  // ==========================================================
  // 情况 A
  //
  // first 是甜食
  // second 是普通食物
  //
  // 如果 firstResult === 1：
  //
  // second 发生变种。
  // ==========================================================

  if(
    first.foodType ===
    FOOD_TYPES.DESSERT

    &&

    firstResult ===
    1
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
  // 情况 B
  //
  // second 是甜食
  // first 是普通食物
  //
  // 如果 secondResult === 1：
  //
  // first 发生变种。
  // ==========================================================

  if(
    second.foodType ===
    FOOD_TYPES.DESSERT

    &&

    secondResult ===
    1
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
  // 更新棋盘
  // ==========================================================

  const nextBoard = [

    ...state.board

  ];



  const firstReducedPiece = {

    ...first,

    value:
      firstResult,

    foodType:
      firstFoodType,

    // ========================================================
    // 当前 V1：
    //
    // 甜食变种不改变 purity。
    // ========================================================

    purity:
      first.purity,

    sourceKey:
      firstResult === 1 ? (first.sourceKey ?? null) : null,

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

    sourceKey:
      secondResult === 1 ? (second.sourceKey ?? null) : null,

    parents:
      null,

    parentFoods:
      null,

    origin:
      secondOrigin

  };



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





  let nextState = {

    ...state,

    board:
      nextBoard,

    actionFatigue

  };



  const collectedPieces = [
    firstResult === 1 ? firstReducedPiece : null,
    secondResult === 1 ? secondReducedPiece : null
  ].filter(Boolean);


  nextState = applyCollections(
    nextState,
    collectedPieces,
    state.board
  );



  nextState =

    consumeStep(
      nextState
    );

  nextState = {
    ...nextState,
    actionFatigue: null,
    recentActionSignatures: appendRecentActionSignature(
      state.recentActionSignatures,
      actionSignature
    )
  };


  return nextState;

}





// ============================================================
// 处理1
//
// 收藏逻辑交给 collectionRules。
//
// 普通三系1：
//
// meat
// vegetable
// seasoning
//
// → 正常进入三槽收藏。
//
//
// dessert 1：
//
// → collectionRules 会自动忽略。
// → 删除棋子。
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
