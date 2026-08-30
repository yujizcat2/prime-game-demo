import {
  gcd
} from "../utils/math";

import {
  FOOD_TYPES,
  combineValue,
  combineFoodType,
  combineFoodPurity,
  FOOD_PURITY,
  SPECIAL_ONE_KINDS,
  createSpecialOne,
  canApplyFunctionOne,
  canReduce,
  canCombine,
  getDessertMutationFoodType
} from "./rules";
import { getEightPalacePositionFoodType } from "./eightPalaceBoardTypes";

import {
  createCombineOrigin,
  createReduceOrigin
} from "./numberOrigin";

import {
  getBoardPieces,
  isBoardFull,
  getNextEmptyIndex,
  getPieceAt,
  BOARD_CONFIG
} from "./boardRules";

import {
  consumeStep
} from "./gameState";

import {
  appendRecentActionSignature,
  createCombinationPairKey,
  createCombineActionSignature,
  createReduceActionSignature,
  getActionFatigue,
  hasUsedCombinationPair
} from "./actionFatigue";

import {
  applyEightPalaceKeyFromReduction,
  GAME_MODES
} from "./eightPalaceKeys";
import { applyEightPalaceCollection } from "./collectionRules";

function isEightPalaceMode(state){
  return state?.gameMode === GAME_MODES.EIGHT_PALACE
    || state?.gameMode === GAME_MODES.SIMPLE_EIGHT_PALACE;
}





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

  if(hasUsedCombinationPair(state,a.value,b.value))return false;



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

// indexA = 主料理，indexB = 搭配料理。预览与正式执行共用此构造器。
export function createCombinedPiece(state,indexA,indexB){
  const main=getPieceAt(state,indexA),pairing=getPieceAt(state,indexB);
  if(!main||!pairing)return null;
  const value=combineValue(main.value,pairing.value);
  const foodType=combineFoodType(main,pairing);
  if(!foodType)return null;
  return {
    id:state.nextId,
    value,
    foodType,
    drinkOriginValue:isEightPalaceMode(state)&&foodType===FOOD_TYPES.DRINK
      ? (main.value+pairing.value>101?value:main.foodType===FOOD_TYPES.DRINK?main.drinkOriginValue??null:null)
      : undefined,
    purity:combineFoodPurity(main,pairing,foodType),
    parents:[main.value,pairing.value],
    sourceKey:[main.value,pairing.value].sort((left,right)=>left-right).join("|"),
    parentFoods:[main,pairing].map(piece=>({value:piece.value,foodType:piece.foodType,purity:piece.purity??null})),
    crossed101:main.value+pairing.value>101,
    origin:createCombineOrigin(value,main,pairing)
  };
}

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



  if(!a || !b){


    return state;

  }



  const newPiece=createCombinedPiece(state,indexA,indexB);
  if(!newPiece)return state;
  const result=newPiece.value;





  const nextBoard = [

    ...state.board

  ];
  nextBoard[targetIndex]=newPiece;



  let nextState = {

    ...state,

    board:
      nextBoard,

    nextId: state.nextId + 1

  };



  nextState =

    consumeStep(
      nextState
    );

  nextState = {
    ...nextState,
    usedCombinationPairs:[...(state.usedCombinationPairs??[]),createCombinationPairKey(a.value,b.value)],
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



  const eightPalace = isEightPalaceMode(state);
  if(!eightPalace){
    const specialOne = createSpecialOne(first.foodType, second.foodType);
    if(firstResult === 1)firstReducedPiece.specialOne=specialOne;
    if(secondResult === 1)secondReducedPiece.specialOne=specialOne;
  }

  if(eightPalace&&firstResult===1&&first.foodType===FOOD_TYPES.DRINK){
    const restoredType=getEightPalacePositionFoodType(indexA);
    nextBoard[indexA]=restoredType&&first.drinkOriginValue!=null?{...firstReducedPiece,value:first.drinkOriginValue,foodType:restoredType,drinkOriginValue:undefined}:null;
  }else nextBoard[indexA] = eightPalace && firstResult === 1 ? null : firstReducedPiece;



  if(eightPalace&&secondResult===1&&second.foodType===FOOD_TYPES.DRINK){
    const restoredType=getEightPalacePositionFoodType(indexB);
    nextBoard[indexB]=restoredType&&second.drinkOriginValue!=null?{...secondReducedPiece,value:second.drinkOriginValue,foodType:restoredType,drinkOriginValue:undefined}:null;
  }else nextBoard[indexB] = eightPalace && secondResult === 1 ? null : secondReducedPiece;





  let nextState = {

    ...state,

    board:
      nextBoard,

    actionFatigue

  };

  if(eightPalace){
    if(firstResult === 1) nextState = applyEightPalaceCollection(nextState, firstReducedPiece);
    if(secondResult === 1) nextState = applyEightPalaceCollection(nextState, secondReducedPiece);
    nextState = applyEightPalaceKeyFromReduction(nextState,first,second,firstResult,secondResult);
  }



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
    state.gameOver ||
    isEightPalaceMode(state)
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



  if(target.specialOne?.kind!==SPECIAL_ONE_KINDS.KEY)return state;
  const keyType=target.specialOne.keyType;
  const keyRecord={foodType:keyType,value:1,parents:null,parentFoods:null};
  const nextState={...state,eightPalaceKeys:{...state.eightPalaceKeys,[keyType]:state.eightPalaceKeys?.[keyType]??keyRecord},latestEightPalaceKey:keyRecord};



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

export function applyFunctionOne(state,oneIndex,targetIndex){
  if(!state||state.gameOver||isEightPalaceMode(state)||oneIndex===targetIndex)return state;
  const one=getPieceAt(state,oneIndex),target=getPieceAt(state,targetIndex);
  if(one?.specialOne?.kind!==SPECIAL_ONE_KINDS.FUNCTION||!canApplyFunctionOne(target))return state;
  const board=[...state.board];
  board[oneIndex]=null;
  board[targetIndex]={...target,value:target.value+1,foodType:target.foodType,purity:target.purity??FOOD_PURITY.PURE,origin:{type:"applyOne",previousValue:target.value,specialOne:{...one.specialOne}}};
  return consumeStep({...state,board});
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


        const a=state.board[i],b=state.board[j];
        if(combineFoodType(a,b)!==combineFoodType(b,a)){
          actions.push({type:"combine_ordered",indexes:[i,j]},{type:"combine_ordered",indexes:[j,i]});
        }else actions.push({type:"combine",indexes:[i,j]});

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
    state.gameOver ||
    isEightPalaceMode(state)
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
      state.board[index]?.specialOne?.kind === SPECIAL_ONE_KINDS.KEY
    ){


      actions.push({

        type:
          "claim_key",

        index

      });

    }

  }



  return actions;

}

export function getLegalApplyOneActions(state){
  if(isEightPalaceMode(state))return [];
  const actions=[];
  for(let i=0;i<BOARD_CONFIG.SIZE;i++)if(state.board[i]?.specialOne?.kind===SPECIAL_ONE_KINDS.FUNCTION)for(let j=0;j<BOARD_CONFIG.SIZE;j++)if(canApplyFunctionOne(state.board[j]))actions.push({type:"apply_one",oneIndex:i,targetIndex:j});
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
    ),
    ...getLegalApplyOneActions(state)

  ];

}
