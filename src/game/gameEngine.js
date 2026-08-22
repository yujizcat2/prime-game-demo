import {
  gcd
} from "../utils/math";

import {
  GAME_CONFIG
} from "./config";

import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  CHECKPOINT_CONFIG,
  getRequiredScore
} from "./checkpointConfig";

import {
  FOOD_TYPES,
  combineValue,
  combineFoodType,
  canReduce,
  canCombine
} from "./rules";

import {
  sortNumbers
} from "./sort";

import {
  createCombineOrigin,
  createReduceOrigin,
  getMainLineage
} from "./numberOrigin";



// ============================================================
// 调料盘配置
// ============================================================

export const SEASONING_TRAY_CONFIG = {

  MAX_SIZE: 3

};





// ============================================================
// 创建初始游戏状态
//
// 开局4个数字：
//
// 第1个：荤
// 第2个：素
// 第3个：荤
// 第4个：素
//
// 即：
//
// 荤 × 2
// 素 × 2
//
// 后续仍然经过 sortNumbers。
// foodType跟随节点本身，不会因为排序改变。
// ============================================================

export function createGameState(
  values
) {


  const numbers =

    values.map(

      (value, index) => ({


        id:
          index + 1,


        value,


        // ====================================================
        // 料理类型
        //
        // meat
        // vegetable
        // dessert
        // ====================================================

        foodType:

          index % 2 === 0

            ? FOOD_TYPES.MEAT

            : FOOD_TYPES.VEGETABLE,


        // ====================================================
        // 合成父母限制
        //
        // 这里只保存数字。
        //
        // rules.js中的父母限制继续依赖这个结构。
        // ====================================================

        parents:
          null,


        // ====================================================
        // UI显示来源料理
        //
        // 专门保存：
        //
        // value
        // foodType
        //
        // 避免荤+素以后，
        // 父来源全部错误显示成结果系别。
        // ====================================================

        parentFoods:
          null,


        // ====================================================
        // 完整数字来源
        //
        // 开局节点没有来源。
        // ====================================================

        origin:
          null

      })

    );


  return {

    numbers:
      sortNumbers(
        numbers
      ),


    // ========================================================
    // 调料盘
    //
    // 每项：
    //
    // {
    //   id,
    //   value
    // }
    //
    // value对应seasoningData.js。
    // ========================================================

    seasoningTray: [],


    // ========================================================
    // 调料唯一ID
    //
    // 同编号调料允许重复出现，
    // 所以React key不能直接用value。
    // ========================================================

    nextSeasoningId:
      1,


    // ========================================================
    // 收藏数字种类
    //
    // 同一个数字只保存一次。
    // ========================================================

    collection: [],


    // ========================================================
    // 完整来源树
    // ========================================================

    collectionOrigins: {},


    // ========================================================
    // 父系单线路径
    // ========================================================

    collectionPaths: {},


    // ========================================================
    // 最新收藏
    // ========================================================

    latestCollection:
      null,


    score:
      0,


    steps:
      0,


    stepLimit:
      GAME_CONFIG
        .START_STEP_LIMIT,


    checkpointPending:
      false,


    gameOver:
      false,


    nextId:
      values.length + 1

  };

}





// ============================================================
// 是否存在数字1
// ============================================================

export function hasOne(
  numbers
) {


  return numbers.some(

    item =>
      item.value === 1

  );

}





// ============================================================
// 当前 checkpoint 编号
// ============================================================

export function getCheckpointNumber(
  state
) {


  return Math.floor(

    state.stepLimit /

    CHECKPOINT_CONFIG
      .STEP_INTERVAL

  );

}





// ============================================================
// 当前 checkpoint 要求积分
// ============================================================

export function getCheckpointRequiredScore(
  state
) {


  return getRequiredScore(
    state.stepLimit
  );

}





// ============================================================
// checkpoint结算
// ============================================================

export function resolveCheckpoint(
  state
) {


  const requiredScore =

    getRequiredScore(
      state.stepLimit
    );



  if(
    state.score >=
    requiredScore
  ){


    return {

      ...state,

      stepLimit:

        state.stepLimit +

        CHECKPOINT_CONFIG
          .STEP_INTERVAL,

      checkpointPending:
        false,

      gameOver:
        false

    };

  }



  return {

    ...state,

    checkpointPending:
      false,

    gameOver:
      true

  };

}





// ============================================================
// 消耗一步
// ============================================================

export function consumeStep(
  state
) {


  const nextStep =

    state.steps +

    GAME_CONFIG
      .STEP_COST;



  let nextState = {

    ...state,

    steps:
      nextStep

  };



  if(
    nextStep <
    state.stepLimit
  ){


    return nextState;

  }



  // ==========================================================
  // 到checkpoint但还有1
  //
  // 先把1处理完。
  // ==========================================================

  if(
    hasOne(
      nextState.numbers
    )
  ){


    return {

      ...nextState,

      checkpointPending:
        true

    };

  }



  return resolveCheckpoint(
    nextState
  );

}





// ============================================================
// 根据ID获取数字节点
// ============================================================

export function getNumberById(
  state,
  id
) {


  return state.numbers.find(

    item =>
      item.id === id

  );

}





// ============================================================
// 获取两个数字在主菜盘上的前后顺序
//
// front = 主菜盘位置靠前
// back  = 主菜盘位置靠后
//
// 注意：
//
// 不是玩家点击顺序。
// ============================================================

export function getOrderedPair(
  state,
  idA,
  idB
) {


  const indexA =

    state.numbers.findIndex(

      item =>
        item.id === idA

    );


  const indexB =

    state.numbers.findIndex(

      item =>
        item.id === idB

    );



  if(
    indexA === -1 ||
    indexB === -1
  ){

    return null;

  }



  if(
    indexA < indexB
  ){


    return {

      front:
        state.numbers[indexA],

      back:
        state.numbers[indexB]

    };

  }



  return {

    front:
      state.numbers[indexB],

    back:
      state.numbers[indexA]

  };

}





// ============================================================
// 向调料盘加入调料
//
// 最大5格。
//
// 新调料永远进入末尾。
// 满5格后：
//
// [A,B,C,D,E] + F
//
// →
//
// [B,C,D,E,F]
//
// 最前面的自动倒掉。
// ============================================================

export function addSeasoningToTray(
  state,
  value
) {


  if(
    value === null ||
    value === undefined
  ){

    return state;

  }



  const newSeasoning = {

    id:
      state.nextSeasoningId,

    value

  };



  const currentTray =

    state.seasoningTray ?? [];



  const nextTray = [

    ...currentTray,

    newSeasoning

  ];



  const trimmedTray =

    nextTray.length >
    SEASONING_TRAY_CONFIG.MAX_SIZE

      ?

      nextTray.slice(
        nextTray.length -
        SEASONING_TRAY_CONFIG.MAX_SIZE
      )

      :

      nextTray;



  return {

    ...state,

    seasoningTray:
      trimmedTray,

    nextSeasoningId:
      state.nextSeasoningId + 1

  };

}





// ============================================================
// 合成
//
// 数学：
//
// A + B = C
//
// 游戏语言：
//
// A、B与C组成三拼关系。
//
// 数值规则保持原样。
//
// 类型规则：
//
// 没跨101
// → 主盘前位foodType
//
// 跨101
// → dessert
//
// 原A、B继续留在主盘。
// 新C加入。
// ============================================================

export function combineNumbers(
  state,
  idA,
  idB
) {


  if(
    state.gameOver ||
    state.checkpointPending
  ){

    return state;

  }



  if(
    state.numbers.length >=
    GAME_CONFIG
      .MAX_NUMBERS
  ){

    return state;

  }



  const a =
    getNumberById(
      state,
      idA
    );


  const b =
    getNumberById(
      state,
      idB
    );



  if(
    !a ||
    !b ||
    a.id === b.id
  ){

    return state;

  }



  if(
    !canCombine(
      a,
      b,
      state.numbers
    )
  ){

    return state;

  }



  // ==========================================================
  // 先根据主盘位置确定front / back
  // ==========================================================

  const orderedPair =

    getOrderedPair(
      state,
      idA,
      idB
    );



  if(
    !orderedPair
  ){

    return state;

  }



  const {
    front,
    back
  } = orderedPair;



  // ==========================================================
  // 数值结果
  // ==========================================================

  const result =

    combineValue(
      front.value,
      back.value
    );



  // ==========================================================
  // 料理类型结果
  // ==========================================================

  const foodType =

    combineFoodType(
      front,
      back
    );



  // ==========================================================
  // 新料理节点
  // ==========================================================

  const newNumber = {

    id:
      state.nextId,


    value:
      result,


    foodType,


    // ========================================================
    // 合成限制继续使用
    //
    // 这里只保存数字。
    // 不要改为对象结构。
    // ========================================================

    parents: [

      a.value,

      b.value

    ],


    // ========================================================
    // UI专用来源料理
    //
    // 保存父料理当时真实的：
    //
    // value
    // foodType
    //
    // 顺序使用主盘front/back。
    //
    // 例如：
    //
    // 荤6 + 素8 → 荤14
    //
    // parentFoods仍然是：
    //
    // [
    //   { value:6, foodType:"meat" },
    //   { value:8, foodType:"vegetable" }
    // ]
    //
    // NumberCard即可正确显示：
    //
    // 鸡猪烧 + 小白菜
    // ========================================================

    parentFoods: [

      {

        value:
          front.value,

        foodType:
          front.foodType

      },

      {

        value:
          back.value,

        foodType:
          back.foodType

      }

    ],


    // ========================================================
    // 完整来源历史
    // ========================================================

    origin:

      createCombineOrigin(

        result,

        front,

        back

      )

  };



  let nextState = {

    ...state,

    numbers: [

      ...state.numbers,

      newNumber

    ],

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
// 只改变数字。
// foodType保持不变。
//
// 同时：
//
// parents清空
// parentFoods清空
//
// 因为经过约分以后，
// 当前数字已经不是原来的三拼结果节点。
// ============================================================

export function reduceNumbers(
  state,
  idA,
  idB
) {


  if(
    state.gameOver ||
    state.checkpointPending
  ){

    return state;

  }



  const first =
    getNumberById(
      state,
      idA
    );


  const second =
    getNumberById(
      state,
      idB
    );



  if(
    !first ||
    !second ||
    first.id === second.id
  ){

    return state;

  }



  if(
    !canReduce(
      first,
      second
    )
  ){

    return state;

  }



  const a =
    first.value;


  const b =
    second.value;



  const divisor =

    gcd(
      a,
      b
    );



  const a2 =
    a / divisor;


  const b2 =
    b / divisor;



  // ==========================================================
  // 保存约分来源
  // ==========================================================

  const firstOrigin =

    createReduceOrigin(

      a2,

      first

    );



  const secondOrigin =

    createReduceOrigin(

      b2,

      second

    );



  const nextNumbers =

    state.numbers.map(

      item => {


        if(
          item.id === idA
        ){


          return {

            ...item,

            value:
              a2,

            // ==================================================
            // 约分后不再属于原合成父母关系
            // ==================================================

            parents:
              null,

            parentFoods:
              null,

            origin:
              firstOrigin

          };

        }



        if(
          item.id === idB
        ){


          return {

            ...item,

            value:
              b2,

            parents:
              null,

            parentFoods:
              null,

            origin:
              secondOrigin

          };

        }



        return item;

      }

    );



  let nextState = {

    ...state,

    numbers:
      nextNumbers

  };



  nextState =
    consumeStep(
      nextState
    );


  return nextState;

}





// ============================================================
// 消除1
//
// 一个数字通过约分变成1后：
//
// 1. 找到它的直接前身n
// 2. 收藏n
// 3. 保存来源树
// 4. 保存主路径
// 5. 更新最新收藏
// 6. 获得一个n号调料
// 7. 调料进入5格调料盘
//
// 重复发现同一个n：
//
// 收藏种类不会重复增加，
// 但依然会获得一个新的n号调料。
// ============================================================

export function removeOne(
  state,
  id
) {


  if(
    state.gameOver
  ){

    return state;

  }



  const target =
    getNumberById(
      state,
      id
    );



  if(
    !target ||
    target.value !== 1
  ){

    return state;

  }



  // ==========================================================
  // 找到1的直接前身
  //
  // 例如：
  //
  // 7 → 1
  //
  // previousRecord = 7对应的完整节点记录
  // discoveredValue = 7
  // ==========================================================

  const previousRecord =

    target.origin?.type === "reduce"

      ? target.origin.parent

      : null;



  const discoveredValue =

    previousRecord?.value
    ?? null;



  let nextScore =
    state.score;


  let nextCollection =
    state.collection;



  // ==========================================================
  // 完整来源树
  // ==========================================================

  let nextCollectionOrigins =
    state.collectionOrigins ?? {};



  // ==========================================================
  // UI主路径
  // ==========================================================

  let nextCollectionPaths =
    state.collectionPaths ?? {};



  // ==========================================================
  // 最新收藏
  // ==========================================================

  let nextLatestCollection =
    state.latestCollection ?? null;



  if(
    discoveredValue !== null &&
    previousRecord
  ){


    const isFirstTime =

      !state.collection.includes(
        discoveredValue
      );



    // ========================================================
    // 保存完整来源树
    // ========================================================

    const oldOrigins =

      nextCollectionOrigins[
        discoveredValue
      ] ?? [];



    nextCollectionOrigins = {

      ...nextCollectionOrigins,

      [discoveredValue]: [

        ...oldOrigins,

        previousRecord

      ]

    };



    // ========================================================
    // 生成父系单线路径
    // ========================================================

    const mainLineage =

      getMainLineage(
        previousRecord
      );



    const oldPaths =

      nextCollectionPaths[
        discoveredValue
      ] ?? [];



    const latestPathIndex =
      oldPaths.length;



    nextCollectionPaths = {

      ...nextCollectionPaths,

      [discoveredValue]: [

        ...oldPaths,

        mainLineage

      ]

    };



    // ========================================================
    // 更新最新收藏
    // ========================================================

    nextLatestCollection = {

      value:
        discoveredValue,

      index:
        latestPathIndex

    };



    // ========================================================
    // 首次发现
    // ========================================================

    if(
      isFirstTime
    ){


      const newNumberCount =

        state.collection.length + 1;



      const discoveryScore =

        newNumberCount *

        SCORE_CONFIG
          .NEW_NUMBER_GROWTH;



      nextScore =

        state.score +

        discoveryScore;



      nextCollection = [

        ...state.collection,

        discoveredValue

      ];

    }



    // ========================================================
    // 重复发现
    // ========================================================

    else{


      nextScore =

        state.score +

        SCORE_CONFIG
          .REPEAT_SCORE;

    }

  }



  // ==========================================================
  // 删除主菜盘上的1
  // ==========================================================

  const nextNumbers =

    state.numbers.filter(

      item =>
        item.id !== id

    );



  let nextState = {

    ...state,

    numbers:
      nextNumbers,

    collection:
      nextCollection,

    collectionOrigins:
      nextCollectionOrigins,

    collectionPaths:
      nextCollectionPaths,

    latestCollection:
      nextLatestCollection,

    score:
      nextScore

  };



  // ==========================================================
  // 获得对应编号调料
  //
  // 每次有效的1都生成调料。
  //
  // 即使是重复收藏也一样。
  // ==========================================================

  if(
    discoveredValue !== null
  ){


    nextState =

      addSeasoningToTray(

        nextState,

        discoveredValue

      );

  }



  // ==========================================================
  // checkpoint期间
  //
  // 删除最后一个1后正式结算。
  // ==========================================================

  if(
    state.checkpointPending &&
    !hasOne(
      nextNumbers
    )
  ){


    nextState =
      resolveCheckpoint(
        nextState
      );

  }



  return nextState;

}





// ============================================================
// 获取所有合法合成
//
// 测试 / AI / 自动模拟使用。
// ============================================================

export function getLegalCombineActions(
  state
) {


  if(
    state.gameOver ||
    state.checkpointPending ||
    state.numbers.length >=
      GAME_CONFIG.MAX_NUMBERS
  ){

    return [];

  }



  const actions = [];



  for(
    let i = 0;
    i < state.numbers.length;
    i++
  ){


    for(
      let j = i + 1;
      j < state.numbers.length;
      j++
    ){


      const a =
        state.numbers[i];


      const b =
        state.numbers[j];



      if(
        canCombine(
          a,
          b,
          state.numbers
        )
      ){


        actions.push({

          type:
            "combine",

          ids: [
            a.id,
            b.id
          ]

        });

      }

    }

  }



  return actions;

}





// ============================================================
// 获取所有合法约分
// ============================================================

export function getLegalReduceActions(
  state
) {


  if(
    state.gameOver ||
    state.checkpointPending
  ){

    return [];

  }



  const actions = [];



  for(
    let i = 0;
    i < state.numbers.length;
    i++
  ){


    for(
      let j = i + 1;
      j < state.numbers.length;
      j++
    ){


      const a =
        state.numbers[i];


      const b =
        state.numbers[j];



      if(
        canReduce(
          a,
          b
        )
      ){


        actions.push({

          type:
            "reduce",

          ids: [
            a.id,
            b.id
          ]

        });

      }

    }

  }



  return actions;

}





// ============================================================
// 获取所有可消除1
// ============================================================

export function getLegalRemoveActions(
  state
) {


  return state.numbers

    .filter(

      item =>
        item.value === 1

    )

    .map(

      item => ({

        type:
          "remove",

        id:
          item.id

      })

    );

}





// ============================================================
// 获取所有合法Action
// ============================================================

export function getLegalActions(
  state
) {


  if(
    state.gameOver
  ){

    return [];

  }



  if(
    state.checkpointPending
  ){


    return getLegalRemoveActions(
      state
    );

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





// ============================================================
// 执行标准Action
// ============================================================

export function applyAction(
  state,
  action
) {


  if(
    !action
  ){

    return state;

  }



  switch(
    action.type
  ){


    case "combine":

      return combineNumbers(

        state,

        action.ids[0],

        action.ids[1]

      );



    case "reduce":

      return reduceNumbers(

        state,

        action.ids[0],

        action.ids[1]

      );



    case "remove":

      return removeOne(

        state,

        action.id

      );



    default:

      return state;

  }

}