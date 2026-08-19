import { gcd } from "../utils/math";

import { GAME_CONFIG } from "./config";

import { SCORE_CONFIG } from "./scoreConfig";

import {
  CHECKPOINT_CONFIG,
  getRequiredScore
} from "./checkpointConfig";

import {
  combineValue,
  canReduce,
  canCombine
} from "./rules";

import {
  sortNumbers
} from "./sort";



// ============================================================
// 创建初始游戏状态
// ============================================================

export function createGameState(values) {


  const numbers =

    values.map(

      (value, index) => ({

        id: index + 1,

        value,

        parents: null,

        reduceFrom: null

      })

    );


  return {

    numbers:
      sortNumbers(numbers),

    collection: [],

    score: 0,

    steps: 0,

    stepLimit:
      GAME_CONFIG.START_STEP_LIMIT,

    checkpointPending: false,

    gameOver: false,

    nextId:
      values.length + 1

  };

}





// ============================================================
// 是否存在数字1
// ============================================================

export function hasOne(numbers) {


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
// checkpoint 结算
// ============================================================

export function resolveCheckpoint(
  state
) {


  const requiredScore =

    getRequiredScore(
      state.stepLimit
    );



  // ==========================================================
  // 达标
  // ==========================================================

  if(
    state.score >= requiredScore
  ){


    return {

      ...state,

      stepLimit:

        state.stepLimit +

        CHECKPOINT_CONFIG
          .STEP_INTERVAL,

      checkpointPending: false,

      gameOver: false

    };

  }



  // ==========================================================
  // 未达标
  // ==========================================================

  return {

    ...state,

    checkpointPending: false,

    gameOver: true

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

    GAME_CONFIG.STEP_COST;



  let nextState = {

    ...state,

    steps: nextStep

  };



  // ==========================================================
  // 未到 checkpoint
  // ==========================================================

  if(
    nextStep < state.stepLimit
  ){


    return nextState;

  }



  // ==========================================================
  // 到 checkpoint
  // ==========================================================


  // 有1

  if(
    hasOne(
      nextState.numbers
    )
  ){


    return {

      ...nextState,

      checkpointPending: true

    };

  }



  // ==========================================================
  // 没有1
  // 直接 checkpoint 结算
  // ==========================================================

  return resolveCheckpoint(
    nextState
  );

}





// ============================================================
// 获取某个数字
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
// 合成
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



  // ==========================================================
  // 最大容量
  // ==========================================================

  if(
    state.numbers.length >=
    GAME_CONFIG.MAX_NUMBERS
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



  const newNumber = {

    id:
      state.nextId,

    value:
      result,

    parents: [
      a.value,
      b.value
    ],

    reduceFrom: null

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



  const a =
    first.value;


  const b =
    second.value;



  if(
    !canReduce(
      a,
      b
    )
  ){

    return state;

  }



  const divisor =
    gcd(
      a,
      b
    );



  const a2 =
    a / divisor;


  const b2 =
    b / divisor;



  const nextNumbers =

    state.numbers.map(

      item => {


        // ====================================================
        // 第一个数字
        // ====================================================

        if(
          item.id === idA
        ){


          return {

            ...item,

            value:
              a2,

            parents:
              null,

            reduceFrom:

              a2 === 1
                ? a
                : null

          };

        }



        // ====================================================
        // 第二个数字
        // ====================================================

        if(
          item.id === idB
        ){


          return {

            ...item,

            value:
              b2,

            parents:
              null,

            reduceFrom:

              b2 === 1
                ? b
                : null

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



  const discoveredValue =
    target.reduceFrom;



  let nextScore =
    state.score;


  let nextCollection =
    state.collection;



  // ==========================================================
  // 这个1是约分产生的
  // ==========================================================

  if(
    discoveredValue !== null
  ){


    const isFirstTime =

      !state.collection.includes(
        discoveredValue
      );



    // ========================================================
    // 新发现
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
  // 删除1
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

    score:
      nextScore

  };



  // ==========================================================
  // checkpoint期间
  // 删除最后一个1之后结算
  // ==========================================================

  if(
    state.checkpointPending &&
    !hasOne(nextNumbers)
  ){


    nextState =
      resolveCheckpoint(
        nextState
      );

  }



  return nextState;

}





// ============================================================
// 所有合法合成
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
// 所有合法约分
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
          a.value,
          b.value
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
// 可以消除的1
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
// 获取所有合法操作
// ============================================================

export function getLegalActions(
  state
) {


  // ==========================================================
  // 游戏结束
  // ==========================================================

  if(
    state.gameOver
  ){

    return [];

  }



  // ==========================================================
  // checkpoint期间只能消除1
  // ==========================================================

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
// 执行一个标准Action
//
// 以后 TestLab / RandomAI 会直接使用这个函数
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