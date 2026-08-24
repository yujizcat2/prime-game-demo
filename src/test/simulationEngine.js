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



// ============================================================
// 高速模拟引擎
//
// 目标：
//
// 与正式 Game Engine 保持相同的核心玩法规则，
// 但完全移除：
//
// origin
// collectionOrigins
// collectionPaths
// latestCollection
// score
// UI历史
//
// 专门用于：
//
// 随机测试
// AI搜索
// 大规模压力测试
// ============================================================





// ============================================================
// 九宫格
// ============================================================

export const SIM_BOARD_SIZE =
  9;





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
      () => null
    );



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

        value,

        foodType:
          initialFoodTypes[index],

        purity:
          FOOD_PURITY.PURE,

        parents:
          null,

        parentFoods:
          null

      };

    }

  );



  return {

    board,

    collection:
      new Set(),

    steps:
      0

  };

}





// ============================================================
// 棋盘棋子
// ============================================================

function getPieces(
  board
){


  return board.filter(
    Boolean
  );

}





// ============================================================
// 棋盘是否满
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
// 下一个空格
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
      board[i] === null
    ){

      return i;

    }

  }



  return -1;

}





// ============================================================
// 是否可以合成
// ============================================================

function canCombineIndexes(
  state,
  indexA,
  indexB
){


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
    state.board[indexA];


  const b =
    state.board[indexB];



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

    getPieces(
      state.board
    )

  );

}





// ============================================================
// 是否可以约分
// ============================================================

function canReduceIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA === indexB
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
// 获取所有合法动作
//
// 为了测试速度，这里一次遍历直接生成：
//
// combine
// reduce
// remove
//
// 不像正式 Engine 那样分别生成三个数组再合并。
// ============================================================

export function getSimulationLegalActions(
  state
){


  const actions = [];


  const board =
    state.board;


  const boardFull =

    isBoardFull(
      board
    );



  // ==========================================================
  // 1 可以直接处理
  // ==========================================================

  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i]?.value === 1
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
  // 两两组合
  // ==========================================================

  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      !board[i] ||
      board[i].value === 1
    ){

      continue;

    }



    for(
      let j = i + 1;
      j < SIM_BOARD_SIZE;
      j++
    ){


      if(
        !board[j] ||
        board[j].value === 1
      ){

        continue;

      }





      // ======================================================
      // 合成
      // ======================================================

      if(
        !boardFull &&
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
    targetIndex === -1
  ){

    return;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b
  ){

    return;

  }





  // ==========================================================
  // 正式 Engine：
  //
  // index 小的棋子是 front。
  //
  // 因为合法动作始终 i < j，
  // 所以这里 indexA 就是 front。
  // ==========================================================

  const front =

    indexA < indexB

      ? a

      : b;


  const back =

    indexA < indexB

      ? b

      : a;





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

    return;

  }



  const purity =

    combineFoodPurity(

      front,

      back

    );





  // ==========================================================
  // 注意：
  //
  // parents 与正式 Engine 一样，
  // 使用原 indexA / indexB 的 value。
  //
  // parentFoods 则使用 front / back。
  // ==========================================================

  state.board[
    targetIndex
  ] = {

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

    ]

  };



  state.steps++;

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

    return;

  }



  const divisor =

    gcd(

      first.value,

      second.value

    );



  const firstOldValue =
    first.value;


  const secondOldValue =
    second.value;



  first.value =

    firstOldValue /
    divisor;



  second.value =

    secondOldValue /
    divisor;





  // ==========================================================
  // 正式 Engine：
  //
  // 约分后 parents / parentFoods 清空。
  // ==========================================================

  first.parents =
    null;


  first.parentFoods =
    null;


  second.parents =
    null;


  second.parentFoods =
    null;





  // ==========================================================
  // 高速模拟唯一额外保存的信息：
  //
  // 如果之后这个棋子变成1并被处理，
  // 收藏的是它约分前的数字。
  //
  // 正式 Engine 从 origin.parent.value 读取。
  //
  // Simulation 不保存 origin，
  // 只保存一个 previousValue。
  // ==========================================================

  first.previousValue =
    firstOldValue;


  second.previousValue =
    secondOldValue;



  state.steps++;

}





// ============================================================
// 处理1
//
// 正式游戏：
//
// 1 本身不收藏。
//
// 收藏的是：
//
// target.origin.parent.value
//
// Simulation 中等价为：
//
// target.previousValue
//
// 同时：
//
// 处理1不增加 steps。
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

    return;

  }



  const discoveredValue =

    target.previousValue
    ?? null;



  if(
    discoveredValue !== null
  ){


    state.collection.add(
      discoveredValue
    );

  }



  state.board[index] =
    null;

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

    return;

  }



  switch(
    action.type
  ){


    case "combine":


      applyCombine(

        state,

        action.indexes[0],

        action.indexes[1]

      );


      break;



    case "reduce":


      applyReduce(

        state,

        action.indexes[0],

        action.indexes[1]

      );


      break;



    case "remove":


      applyRemove(

        state,

        action.index

      );


      break;



    default:

      break;

  }

}


// ============================================================
// 克隆单个棋子
//
// Smart AI 搜索未来分支时使用。
//
// 这里只复制会影响游戏规则的数据。
// 不存在 origin / UI history 等正式游戏数据。
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


    // ========================================================
    // 处理1收藏时需要
    // ========================================================

    previousValue:

      piece.previousValue
      ?? null

  };

}





// ============================================================
// 克隆模拟状态
//
// Beam Search 必须能够从同一个局面同时探索：
//
// A动作
// B动作
// C动作
// ...
//
// 所以每个未来分支必须拥有独立状态。
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
      state.steps

  };

}