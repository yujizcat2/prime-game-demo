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
  combineValue,
  combineAnimal,
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
// 创建初始游戏状态
//
// 【当前核心使用】
//
// 开局4个数字属于“原生数字”：
// origin = null
//
// 后续通过合成 / 约分变化出来的数字
// 都会开始拥有来源历史。
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
        // 猫狗属性
        //
        // 【当前使用】
        // ====================================================

        animal:

          index % 2 === 0

            ? "cat"

            : "dog",


        // ====================================================
        // 合成父母限制
        //
        // 【当前使用】
        //
        // 和origin来源系统不是一回事。
        // ====================================================

        parents:
          null,


        // ====================================================
        // 数字来源
        //
        // 【当前核心使用】
        //
        // 开局4个原生数字没有来源历史。
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
    // 收藏数字种类
    //
    // 【当前UI使用】
    //
    // 同一个数字只保存一次。
    // ========================================================

    collection: [],


    // ========================================================
    // 完整来源树
    //
    // 【当前UI暂时不用】
    // 【底层继续记录】
    // 【保留，不要删除】
    // ========================================================

    collectionOrigins: {},


    // ========================================================
    // 父系单线路径
    //
    // 【当前CollectionPanel使用】
    //
    // 每个数字可以有多条收藏路径。
    // ========================================================

    collectionPaths: {},


    // ========================================================
    // 最新一次收藏
    //
    // 【当前CollectionPanel使用】
    //
    // 例如：
    //
    // {
    //   value: 7,
    //   index: 3
    // }
    //
    // 表示：
    //
    // 最新收藏数字 = 7
    // 是7的第4条收藏记录
    //
    // index从0开始。
    //
    // 每产生新的收藏，
    // 这里自动覆盖成最新的一条。
    // ========================================================

    latestCollection:
      null,


    score: 0,

    steps: 0,

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
//
// 【当前使用】
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
//
// 【当前UI使用】
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
//
// 【当前UI使用】
// ============================================================

export function getCheckpointRequiredScore(
  state
) {


  return getRequiredScore(
    state.stepLimit
  );

}





// ============================================================
// checkpoint 结算
//
// 【当前核心使用】
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
//
// 【当前核心使用】
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
  // 到checkpoint但仍然有1
  //
  // 先处理1。
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
//
// 【当前核心使用】
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
// 获取两个数字棋盘前后顺序
//
// 【当前核心使用】
//
// front = 棋盘靠前
// back  = 棋盘靠后
//
// 当前同时决定：
//
// 1. 猫狗继承
// 2. 父系来源
//
// front = 父
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
// 合成
//
// 【当前核心使用】
//
// front = 父系
// back  = 另一来源
//
// 完整树保存双方。
// 玩家主路径只追front。
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



  const result =

    combineValue(
      a.value,
      b.value
    );



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



  const animal =

    combineAnimal(
      front,
      back
    );



  const newNumber = {

    id:
      state.nextId,

    value:
      result,

    animal,


    // ========================================================
    // 原有合成限制使用
    // ========================================================

    parents: [
      a.value,
      b.value
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
// 【当前核心使用】
//
// 只追踪这个数字自身历史。
//
// first只继承first。
// second只继承second。
//
// 参与约分的另一边数字
// 不进入来源。
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

            parents:
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
// 【当前核心使用】
//
// 消除1时：
//
// 1. 加入收藏
// 2. 保存完整来源
// 3. 保存父系主路径
// 4. 更新最新收藏
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
  // 收藏7。
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
  //
  // 【当前UI暂时不用】
  // 【保留】
  // ==========================================================

  let nextCollectionOrigins =
    state.collectionOrigins ?? {};


  // ==========================================================
  // 当前UI使用的父系主路径
  // ==========================================================

  let nextCollectionPaths =
    state.collectionPaths ?? {};


  // ==========================================================
  // 最新收藏
  //
  // 没有产生有效收藏时
  // 保留原来的最新收藏。
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
    //
    // 现在每个节点同时记录：
    //
    // value
    // fromType
    //
    // 用于区分：
    //
    // ← 约分
    // ⇐ 合成
    // ========================================================

    const mainLineage =

      getMainLineage(
        previousRecord
      );



    const oldPaths =

      nextCollectionPaths[
        discoveredValue
      ] ?? [];



    // ========================================================
    // 当前这一条收藏的index
    //
    // oldPaths.length就是追加前的位置。
    //
    // 例如原来有3条：
    //
    // oldPaths.length = 3
    //
    // 新记录index = 3
    //
    // UI中就是第4次。
    // ========================================================

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
    // 更新“最新一次收藏”
    //
    // 每次产生收藏都会覆盖。
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
  // 删除棋盘上的1
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
  // checkpoint期间
  // 删除最后一个1以后结算
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
// 【主UI暂时不直接调用】
//
// 【测试 / AI / 自动模拟使用】
//
// 保留，不要删除。
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
//
// 【主UI暂时不直接调用】
//
// 【测试 / AI / 自动模拟使用】
//
// 保留，不要删除。
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
//
// 【测试 / AI / 自动模拟使用】
//
// 保留。
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
//
// 【测试实验室 / AI / 自动模拟使用】
//
// 保留。
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
//
// 【测试实验室 / AI / 自动模拟使用】
//
// 保留。
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