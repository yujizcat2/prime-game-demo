import {
  gcd
} from "../utils/math";

import {
  ANIMAL_TYPES,
  combineValue,
  combineAnimalType,
  combineAnimalPurity,
  canReduce,
  canCombine,
  getBirdMutationAnimalType
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





  const animalType =

    combineAnimalType(

      front,

      back

    );



  if(
    !animalType
  ){


    return state;

  }





  const purity =

    combineAnimalPurity(

      front,

      back

    );





  const newPiece = {


    id:
      state.nextId,


    value:
      result,


    animalType,


    purity,


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
// 基础规则：
//
// 约分：
//
// - 改变 value
// - 默认不改变 animalType
// - 默认不改变 purity
// - 清除当前这一代的组合父母
//
//
// ============================================================
// 鸟系变种规则
// ============================================================
//
// 如果：
//
// 普通动物 + 鸟
//
// 进行约分，
//
// 并且鸟这一侧约分后的结果 === 1，
//
// 那么另一侧普通动物发生一次三角变种：
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
// 例如：
//
// 狗14 + 鸟7
//
// ÷7
//
// → 狗2 + 鸟1
//
// 鸟变成1，因此：
//
// 狗2 → 猫2
//
//
// 最终：
//
// 猫2 + 鸟1
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
// - 鸟 + 鸟 不触发变种
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





  // ==========================================================
  // 先记录约分来源
  //
  // 注意：
  //
  // origin 保存的是“变种之前”的真实父节点。
  //
  // 这样以后仍然可以知道：
  //
  // 这个猫2原本其实是狗14，
  // 因为鸟系约分而发生了变种。
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
  // 默认 animalType
  //
  // 普通约分保持原类型。
  // ==========================================================

  let firstAnimalType =
    first.animalType;


  let secondAnimalType =
    second.animalType;





  // ==========================================================
  // 情况 A
  //
  // first 是鸟
  // second 是普通动物
  //
  // 如果 firstResult === 1：
  //
  // second 发生变种。
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
  // 情况 B
  //
  // second 是鸟
  // first 是普通动物
  //
  // 如果 secondResult === 1：
  //
  // first 发生变种。
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
  // 更新棋盘
  // ==========================================================

  const nextBoard = [

    ...state.board

  ];



  nextBoard[
    indexA
  ] = {

    ...first,

    value:
      firstResult,

    animalType:
      firstAnimalType,

    // ========================================================
    // 当前 V1：
    //
    // 鸟变种不改变 purity。
    // ========================================================

    purity:
      first.purity,

    parents:
      null,

    parentAnimals:
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

    animalType:
      secondAnimalType,

    purity:
      second.purity,

    parents:
      null,

    parentAnimals:
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
// 处理1
//
// 收藏逻辑交给 collectionRules。
//
// 普通三系1：
//
// dog
// cat
// mammal
//
// → 正常进入三槽收藏。
//
//
// bird 1：
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