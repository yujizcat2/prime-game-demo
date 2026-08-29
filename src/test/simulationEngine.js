import {
  gcd
} from "../utils/math";

import {
  FOOD_TYPES,
  FOOD_PURITY,
  combineValue,
  combineFoodType,
  combineFoodPurity,
  BASE_FOOD_TYPES,
  canReduce,
  canCombine,
  getDessertMutationFoodType
} from "../game/rules";

import {
  createMazeStateKey
} from "../game/mazeHistory";

import {
  appendRecentActionSignature,
  createCombineActionSignature,
  createReduceActionSignature,
  getActionFatigue
} from "../game/actionFatigue";





// ============================================================
// Simulation
//
// 高速模拟版本。
//
// ------------------------------------------------------------
//
// 当前支持：
//
// 荤 / 素 / 调料
// → 三槽收藏
//
// 甜食
// → 不进入收藏
//
// ------------------------------------------------------------
//
// 甜食系变种规则：
//
// 普通食物 + 甜食
// ↓
// 约分
//
// 如果甜食这一侧结果 === 1：
//
// 荤
// ↓
// 素
// ↓
// 调料
// ↓
// 荤
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
// 第1个 → 荤
// 第2个 → 素
// 第3个 → 调料
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



  const types = [FOOD_TYPES.LAND, FOOD_TYPES.VEGETABLE, FOOD_TYPES.SEASONING];



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
          null,

        sourceKey:
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
    // 17:meat
    // 17:vegetable
    // 17:seasoning
    // ========================================================

    collection:
      new Set(),

    collectionNumbers:
      new Set(),

    money:
      0,

    previousCollection:
      null,

    trend:
      1,

    recentActionSignatures:
      [],

    latestCollectionReward:
      0,

    lastCollectionEvents:
      [],





    // ========================================================
    // 首次获得新收藏槽的食物类型历史
    // ========================================================

    collectionFoodTypeHistory:
      [],

    // Test-AI-only telemetry. Unlike collectionFoodTypeHistory this records
    // every automatic collection, including repeats, so search can detect
    // unproductive same-type loops without changing the game rules.
    collectionEventHistory:
      [],

    repeatCollectionCount:
      0,





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
      null,

    eightPalaceKeys: Object.fromEntries(BASE_FOOD_TYPES.map(type=>[type,null]))

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
        const oneDrink=(a.foodType===FOOD_TYPES.DRINK)!==(b.foodType===FOOD_TYPES.DRINK);
        if(oneDrink)for(const resultFoodType of BASE_FOOD_TYPES)actions.push({type:"combine_drink_convert",indexes:[i,j],resultFoodType});
        else if(a.foodType!==FOOD_TYPES.DRINK&&b.foodType!==FOOD_TYPES.DRINK&&a.foodType!==b.foodType&&a.value+b.value<=101)actions.push({type:"combine_ordered",indexes:[i,j]},{type:"combine_ordered",indexes:[j,i]});
        else actions.push({type:"combine",indexes:[i,j]});

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
  indexB,
  resultFoodType=null
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



  const front=a;
  const back=b;





  const value =

    combineValue(

      front.value,

      back.value

    );

  const actionSignature = createCombineActionSignature(a.value, b.value, value);





  const foodType =

    combineFoodType(

      front,
      back,
      resultFoodType

    );



  if(
    !foodType
  ){


    return false;

  }





  const resultPiece = {

    value,

    foodType,

    crossed101:
      front.value + back.value > 101,

    purity:

      combineFoodPurity(

        front,
        back,
        resultFoodType

      ),

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

    previousValue:
      null

  };
  const drinkIndex=a.foodType===FOOD_TYPES.DRINK?indexA:b.foodType===FOOD_TYPES.DRINK?indexB:null;
  const isDrinkConvert=drinkIndex!==null&&(a.foodType===FOOD_TYPES.DRINK)!==(b.foodType===FOOD_TYPES.DRINK);
  if(isDrinkConvert){state.board[drinkIndex]=null;state.board[drinkIndex===indexA?indexB:indexA]=resultPiece;}
  else state.board[targetIndex]=resultPiece;



  state.steps++;

  state.recentActionSignatures = appendRecentActionSignature(
    state.recentActionSignatures,
    actionSignature
  );



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
// foodType / purity
// 默认保持。
//
// parents / parentFoods
// 清除。
//
// previousValue
// 保存约分前数字，用于 Simulation 收藏。
//
//
// ============================================================
// 甜食系变种
// ============================================================
//
// 如果：
//
// 甜食 + 普通食物
//
// 进行约分，
//
// 且甜食这一侧结果 === 1，
//
// 则另一侧普通食物发生三角变种：
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
// 例：
//
// 荤14 + 甜食7
// ÷7
//
// → 荤2 + 甜食1
//
// → 素2 + 甜食1
//
// ------------------------------------------------------------
//
// 当前：
//
// - 数字不改变
// - purity 不改变
// - 不检测灭绝
// - 甜食 + 甜食 不触发
// ============================================================

function applyReduce(
  state,
  indexA,
  indexB
){

  const collectionPricingBoard =
    state.board.map(clonePiece);

  state.lastCollectionEvents = [];


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

  const actionSignature = createReduceActionSignature(oldA, oldB, firstResult, secondResult);
  const actionFatigue = getActionFatigue(state.recentActionSignatures, actionSignature);

  // ==========================================================
  // 默认类型保持
  // ==========================================================

  let firstFoodType =

    first.foodType;


  let secondFoodType =

    second.foodType;





  // ==========================================================
  // first 是甜食
  //
  // first → 1
  //
  // second 发生变种
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




  const collectionEvents = [];

  if(firstResult === 1 && firstFoodType !== FOOD_TYPES.DESSERT){
    const key = `${oldA}:${firstFoodType}`;
    collectionEvents.push({
      foodType: firstFoodType,
      key,
      repeated: state.collection.has(key)
    });
  }

  if(secondResult === 1 && secondFoodType !== FOOD_TYPES.DESSERT){
    const key = `${oldB}:${secondFoodType}`;
    collectionEvents.push({
      foodType: secondFoodType,
      key,
      repeated: state.collection.has(key)
    });
  }





  // ==========================================================
  // second 是甜食
  //
  // second → 1
  //
  // first 发生变种
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
  // 更新 first
  // ==========================================================

  first.value =
    firstResult;


  first.foodType =
    firstFoodType;


  first.parents =
    null;


  first.parentFoods =
    null;


  first.previousValue =
    oldA;

  first.sourceKey =
    firstResult === 1 ? (first.sourceKey ?? null) : null;





  // ==========================================================
  // 更新 second
  // ==========================================================

  second.value =
    secondResult;


  second.foodType =
    secondFoodType;


  second.parents =
    null;


  second.parentFoods =
    null;


  second.previousValue =
    oldB;

  second.sourceKey =
    secondResult === 1 ? (second.sourceKey ?? null) : null;



  if(firstFoodType===secondFoodType&&BASE_FOOD_TYPES.includes(firstFoodType)&&!state.eightPalaceKeys?.[firstFoodType]&&(firstResult===1||secondResult===1)){
    state.eightPalaceKeys ??= Object.fromEntries(BASE_FOOD_TYPES.map(type=>[type,null]));
    state.eightPalaceKeys[firstFoodType]={foodType:firstFoodType,value:1};
    state.latestEightPalaceKey=state.eightPalaceKeys[firstFoodType];
  }

  if(firstResult===1)state.board[indexA]=null;
  if(secondResult===1)state.board[indexB]=null;

  for(const event of collectionEvents){
    state.collectionEventHistory.push(event);

    if(event.repeated){
      state.repeatCollectionCount++;
    }
  }

  state.collectionEventHistory = state.collectionEventHistory.slice(-12);





  // ==========================================================
  // purity 当前保持不变
  // ==========================================================

  state.steps++;

  state.recentActionSignatures = appendRecentActionSignature(
    state.recentActionSignatures,
    actionSignature
  );



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
// foodType / purity 不改变。
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
    case "combine_ordered":
    case "combine_drink_convert":


      applied =

        applyCombine(

          state,

          action.indexes[
            0
          ],

          action.indexes[
            1
          ],
          action.resultFoodType ?? null

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
      ?? null,

    sourceKey:
      piece.sourceKey
      ?? null,

    specialOne: piece.specialOne ? {...piece.specialOne,sourceTypes:[...(piece.specialOne.sourceTypes??[])]} : null

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

    collectionNumbers:

      new Set(
        state.collectionNumbers ?? []
      ),

    money:
      state.money ?? 0,

    previousCollection:
      state.previousCollection ?? null,

    trend:
      state.trend ?? 1,

    recentActionSignatures:
      [...(state.recentActionSignatures ?? [])],

    latestCollectionReward:
      state.latestCollectionReward ?? 0,

    lastCollectionEvents:
      (state.lastCollectionEvents ?? []).map(event => ({...event})),





    collectionFoodTypeHistory:

      [
        ...(
          state.collectionFoodTypeHistory
          ?? []
        )
      ],

    collectionEventHistory:
      (state.collectionEventHistory ?? []).map(event => ({...event})),

    repeatCollectionCount:
      state.repeatCollectionCount ?? 0,





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

    +

    ":"

    +

    (state.recentActionSignatures ?? []).join(",")

  );

}
