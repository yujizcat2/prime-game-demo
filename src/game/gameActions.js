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
  getActionFatigue
} from "./actionFatigue";

import {
  applyEightPalaceKeyFromReduction,
  GAME_MODES
} from "./eightPalaceKeys";
import { applyEightPalaceCollection } from "./collectionRules";
import { getCreatedScoreValue } from "./scoreValue";
import { isHeaterTarget } from "./heater";
import { getLegalRestoreActions } from "./restore";
import { getReductionFoodTypes } from "./nativeFoodTypes";
import { DRINK_THRESHOLD, DRINK_WRAP_VALUE, normalizeReducedValue } from "./valueScale";

import {
  addCombinePair,
  createCombineHistoryRecord,
  hasCombinePair
} from "./combineHistory";

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

  if(hasCombinePair(state.combineHistoryKeys, a, b)){
    return false;
  }



  if(
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }

  const hasDrink=a.foodType===FOOD_TYPES.DRINK||b.foodType===FOOD_TYPES.DRINK;
  const wrapsToNormal=hasDrink&&a.value+b.value>DRINK_WRAP_VALUE;
  if(!wrapsToNormal&&isBoardFull(state.board))return false;

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

  if(a.foodType===FOOD_TYPES.DRINK&&b.foodType===FOOD_TYPES.DRINK)return false;



  return canReduce(
    a,
    b
  );

}

export function createReduceOutcome(state,indexA,indexB){
  const first=getPieceAt(state,indexA),second=getPieceAt(state,indexB);
  if(!first||!second||first.foodType===FOOD_TYPES.DRINK&&second.foodType===FOOD_TYPES.DRINK)return null;
  const divisor=gcd(first.value,second.value);
  if(divisor<=1)return null;
  if(first.value===second.value)return {
    kind:"equalClear",
    divisor,
    results:[first,second].map(piece=>({value:1,foodType:piece.foodType,purity:piece.purity??null,clear:true,autoCollect:false}))
  };
  const template=first.foodType===FOOD_TYPES.DRINK?second:second.foodType===FOOD_TYPES.DRINK?first:null;
  const firstResult=normalizeReducedValue(first.value/divisor),secondResult=normalizeReducedValue(second.value/divisor);
  let [firstFoodType,secondFoodType]=getReductionFoodTypes(first,second,firstResult,secondResult,indexA,indexB);
  if(first.foodType===FOOD_TYPES.DESSERT&&firstResult===1)secondFoodType=getDessertMutationFoodType(second.foodType)??secondFoodType;
  if(second.foodType===FOOD_TYPES.DESSERT&&secondResult===1)firstFoodType=getDessertMutationFoodType(first.foodType)??firstFoodType;
  return {kind:"reduce",divisor,results:[
    {...first,value:firstResult,foodType:firstFoodType,purity:template?.purity??first.purity??null},
    {...second,value:secondResult,foodType:secondFoodType,purity:template?.purity??second.purity??null}
  ]};
}





// ============================================================
// 组合
// ============================================================

// Preview 与正式执行共用：new = 第三格新卡；wrap = 饮品格原位回到普通料理。
export function createCombineOutcome(state,indexA,indexB){
  const main=getPieceAt(state,indexA),pairing=getPieceAt(state,indexB);
  if(!main||!pairing)return null;
  if(main.foodType===FOOD_TYPES.DRINK&&pairing.foodType===FOOD_TYPES.DRINK)return null;
  const drinkIndex=main.foodType===FOOD_TYPES.DRINK?indexA:pairing.foodType===FOOD_TYPES.DRINK?indexB:null;
  const value=combineValue(main.value,pairing.value);
  const foodType=combineFoodType(main,pairing);
  if(!foodType)return null;
  const ingredientIndex=drinkIndex===null?null:drinkIndex===indexA?indexB:indexA;
  if(drinkIndex!==null&&value>DRINK_WRAP_VALUE){
    const normal=drinkIndex===indexA?pairing:main;
    const wrappedValue=value-DRINK_WRAP_VALUE;
    const piece={
      ...getPieceAt(state,drinkIndex),
      value:wrappedValue,
      scoreValue:getCreatedScoreValue(wrappedValue,main,pairing),
      foodType:normal.foodType,
      purity:normal.purity??FOOD_PURITY.PURE,
      parents:[main.value,pairing.value],
      sourceKey:[main.value,pairing.value].sort((left,right)=>left-right).join("|"),
      parentFoods:[main,pairing].map(piece=>({value:piece.value,foodType:piece.foodType,purity:piece.purity??null})),
      crossed101:false,
      origin:createCombineOrigin(wrappedValue,main,pairing),
      singleFlavorPenalty:false
    };
    return {kind:"wrap",value:wrappedValue,foodType:normal.foodType,purity:piece.purity,piece,drinkIndex,ingredientIndex,targetIndex:drinkIndex};
  }
  const piece={
    id:state.nextId,
    value,
    scoreValue:getCreatedScoreValue(value,main,pairing),
    foodType,
    purity:combineFoodPurity(main,pairing,foodType),
    parents:[main.value,pairing.value],
    sourceKey:[main.value,pairing.value].sort((left,right)=>left-right).join("|"),
    parentFoods:[main,pairing].map(piece=>({value:piece.value,foodType:piece.foodType,purity:piece.purity??null})),
    crossed101:main.value+pairing.value>DRINK_THRESHOLD,
    origin:createCombineOrigin(value,main,pairing),
    singleFlavorPenalty:false
  };
  return {
    kind:"new",
    drinkMix:drinkIndex!==null,
    value,foodType,piece,drinkIndex,ingredientIndex,targetIndex:null
  };
}

// Compatibility for existing consumers that need the resulting card only.
export function createCombinedPiece(state,indexA,indexB){
  return createCombineOutcome(state,indexA,indexB)?.piece??null;
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



  const outcome=createCombineOutcome(state,indexA,indexB);
  if(!outcome)return state;
  const result=outcome.value;





  const nextBoard = [

    ...state.board

  ];
  if(outcome.kind==="wrap"){
    nextBoard[outcome.drinkIndex]=outcome.piece;
  }else{
    const targetIndex=getNextEmptyIndex(state.board);
    if(targetIndex===-1)return state;
    nextBoard[targetIndex]=outcome.piece;
  }



  let nextState = {

    ...state,

    board:
      nextBoard,

    nextId: state.nextId + (outcome.kind==="wrap"?0:1)

  };



  nextState =

    consumeStep(
      nextState
    );

  nextState = {
    ...nextState,
    usedCombinationPairs:[...(state.usedCombinationPairs??[]),createCombinationPairKey(a.value,b.value)],
    combineHistoryKeys: addCombinePair(state.combineHistoryKeys, a, b),
    combineHistory: [
      ...(state.combineHistory ?? []),
      createCombineHistoryRecord(a, b, outcome.piece, nextState.steps)
    ],
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



  const reductionOutcome=createReduceOutcome(state,indexA,indexB);
  if(!reductionOutcome)return state;
  const collectionBoardBeforeAction = state.board;
  const [firstOutcome,secondOutcome]=reductionOutcome.results;
  const firstResult=firstOutcome.value;
  const secondResult=secondOutcome.value;

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

  if(reductionOutcome.kind==="equalClear"){
    const board=[...state.board];
    board[indexA]=null;board[indexB]=null;
    return consumeStep({
      ...state,
      board,
      latestCollectionRewards: [],
      actionFatigue,
      recentActionSignatures:appendRecentActionSignature(state.recentActionSignatures,actionSignature)
    });
  }





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

  let firstFoodType=firstOutcome.foodType;
  let secondFoodType=secondOutcome.foodType;





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

    purity:firstOutcome.purity,

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

    purity:secondOutcome.purity,

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
    const specialOne = createSpecialOne(firstFoodType, secondFoodType);
    if(firstResult === 1)firstReducedPiece.specialOne=specialOne;
    if(secondResult === 1)secondReducedPiece.specialOne=specialOne;
  }

  nextBoard[indexA] = eightPalace && firstResult === 1 ? null : firstReducedPiece;



  nextBoard[indexB] = eightPalace && secondResult === 1 ? null : secondReducedPiece;





  let nextState = {

    ...state,

    board:
      nextBoard,

    latestCollectionRewards: [],

    actionFatigue

  };

  if(eightPalace){
    if(firstResult === 1) nextState = applyEightPalaceCollection(nextState, firstReducedPiece, collectionBoardBeforeAction);
    if(secondResult === 1) nextState = applyEightPalaceCollection(nextState, secondReducedPiece, collectionBoardBeforeAction);
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
    state.gameOver || (!isEightPalaceMode(state) && state.steps >= state.stepLimit)
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
    ...getLegalApplyOneActions(state),
    ...(state.heaterCount ?? 0) > 0
      ? state.board.flatMap((piece, index) => isHeaterTarget(piece) ? [{type: "heater", indexes: [index]}] : [])
      : [],
    ...(
      state.board.some(Boolean)
      && state.board.filter(Boolean).every(isHeaterTarget)
      && (state.superHeaterCount ?? 0) > 0
        ? [{type: "super_heater"}]
        : []
    ),
    ...getLegalRestoreActions(state)

  ];

}
