import {
  getCheckpointRequiredScore
} from "../game/gameEngine";

import {
  canReduce
} from "../game/rules";

import {
  gcd
} from "../utils/math";

import {
  GAME_CONFIG
} from "../game/config";



// ============================================================
// 统计棋盘中的1
// ============================================================

function countOnes(state) {

  return state.numbers.filter(
    item =>
      item.value === 1
  ).length;
}



// ============================================================
// 统计可以约分的数字对
// ============================================================

function countReduciblePairs(state) {

  let count = 0;


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
        state.numbers[i].value;

      const b =
        state.numbers[j].value;


      if(
        canReduce(
          a,
          b
        )
      ){

        count += 1;

      }

    }

  }


  return count;
}



// ============================================================
// 统计“立即可以产生新收藏”的约分机会
//
// 例如：
//
// 37 和 74
//
// gcd = 37
//
// 37 / 37 = 1
//
// 那么就意味着可以收藏37
// ============================================================

function countNewDiscoveryOpportunities(
  state
){

  let count = 0;


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
        state.numbers[i].value;

      const b =
        state.numbers[j].value;


      const divisor =
        gcd(
          a,
          b
        );


      if(
        divisor <= 1
      ){

        continue;

      }


      const a2 =
        a / divisor;

      const b2 =
        b / divisor;



      // ======================================================
      // a会变成1
      // ======================================================

      if(
        a2 === 1 &&
        !state.collection.includes(a)
      ){

        count += 1;

      }



      // ======================================================
      // b会变成1
      // ======================================================

      if(
        b2 === 1 &&
        !state.collection.includes(b)
      ){

        count += 1;

      }

    }

  }


  return count;
}



// ============================================================
// 统计立即可以产生“重复收藏”的机会
// ============================================================

function countRepeatDiscoveryOpportunities(
  state
){

  let count = 0;


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
        state.numbers[i].value;

      const b =
        state.numbers[j].value;


      const divisor =
        gcd(
          a,
          b
        );


      if(
        divisor <= 1
      ){

        continue;

      }


      const a2 =
        a / divisor;

      const b2 =
        b / divisor;



      if(
        a2 === 1 &&
        state.collection.includes(a)
      ){

        count += 1;

      }


      if(
        b2 === 1 &&
        state.collection.includes(b)
      ){

        count += 1;

      }

    }

  }


  return count;
}



// ============================================================
// 剩余棋盘空间
// ============================================================

function getFreeSlots(state) {

  return Math.max(

    0,

    GAME_CONFIG.MAX_NUMBERS -
    state.numbers.length

  );
}



// ============================================================
// 距离checkpoint还有几步
// ============================================================

function getStepsToCheckpoint(state) {

  return Math.max(

    0,

    state.stepLimit -
    state.steps

  );
}



// ============================================================
// 状态评价函数
//
// 数值越大 = AI认为越好
// ============================================================

export function evaluateState(
  state
){

  // ==========================================================
  // checkpoint失败
  // ==========================================================

  if(
    state.gameOver
  ){

    return -1_000_000_000;

  }



  const requiredScore =

    getCheckpointRequiredScore(
      state
    );


  const scoreMargin =

    state.score -
    requiredScore;



  const stepsToCheckpoint =

    getStepsToCheckpoint(
      state
    );



  const reduciblePairs =

    countReduciblePairs(
      state
    );



  const newDiscoveryOpportunities =

    countNewDiscoveryOpportunities(
      state
    );



  const repeatDiscoveryOpportunities =

    countRepeatDiscoveryOpportunities(
      state
    );



  const oneCount =

    countOnes(
      state
    );



  const freeSlots =

    getFreeSlots(
      state
    );



  // ==========================================================
  // 基础评价
  // ==========================================================

  let value = 0;



  // ==========================================================
  // 1. 当前积分
  //
  // 最重要
  // ==========================================================

  value +=
    state.score * 100;



  // ==========================================================
  // 2. 收藏数量
  //
  // 收藏越多，未来新收藏价值越高
  // ==========================================================

  value +=
    state.collection.length * 500;



  // ==========================================================
  // 3. 新收藏机会
  //
  // 非常高价值
  // ==========================================================

  value +=
    newDiscoveryOpportunities * 1000;



  // ==========================================================
  // 4. 已经生成的1
  //
  // 说明马上可以拿分
  // ==========================================================

  value +=
    oneCount * 400;



  // ==========================================================
  // 5. 可约分关系
  //
  // 保持棋盘活性
  // ==========================================================

  value +=
    reduciblePairs * 30;



  // ==========================================================
  // 6. 重复收藏机会
  //
  // 有价值，但远低于新收藏
  // ==========================================================

  value +=
    repeatDiscoveryOpportunities * 5;



  // ==========================================================
  // 7. 空间
  //
  // 棋盘塞满后无法继续合成
  // ==========================================================

  value +=
    freeSlots * 20;



  // ==========================================================
  // 8. checkpoint安全性
  //
  // 越接近checkpoint，
  // 积分是否足够越重要
  // ==========================================================

  if(
    stepsToCheckpoint <= 3
  ){

    value +=
      scoreMargin * 30;

  }


  else if(
    stepsToCheckpoint <= 5
  ){

    value +=
      scoreMargin * 15;

  }


  else{

    value +=
      scoreMargin * 3;

  }



  // ==========================================================
  // 9. checkpointPending
  //
  // 如果已经到checkpoint但还有1，
  // 有机会继续通过remove拿分
  // ==========================================================

  if(
    state.checkpointPending
  ){

    value +=
      oneCount * 300;

  }



  return value;
}



// ============================================================
// Debug用
//
// 可以查看某个状态到底为什么得这个分
// ============================================================

export function explainEvaluation(
  state
){

  const requiredScore =
    getCheckpointRequiredScore(
      state
    );


  return {

    evaluation:
      evaluateState(state),

    score:
      state.score,

    collectionSize:
      state.collection.length,

    requiredScore,

    scoreMargin:
      state.score - requiredScore,

    steps:
      state.steps,

    stepLimit:
      state.stepLimit,

    stepsToCheckpoint:
      getStepsToCheckpoint(state),

    freeSlots:
      getFreeSlots(state),

    reduciblePairs:
      countReduciblePairs(state),

    newDiscoveryOpportunities:
      countNewDiscoveryOpportunities(state),

    repeatDiscoveryOpportunities:
      countRepeatDiscoveryOpportunities(state),

    ones:
      countOnes(state),

    gameOver:
      state.gameOver

  };
}