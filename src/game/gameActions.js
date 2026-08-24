import {
  gcd
} from "../utils/math";

import {
  combineValue,
  combineFoodType,
  combineFoodPurity,
  canReduce,
  canCombine
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
// 处理1
//
// 收藏逻辑已经交给 collectionRules。
// 这里只负责：
//
// 1. 找到目标1
// 2. 结算收藏
// 3. 删除棋子
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