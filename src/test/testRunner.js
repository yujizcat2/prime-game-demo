import {
  createGameState,
  getLegalActions,
  applyAction
} from "../game/gameEngine";



// ============================================================
// 随机选择一个元素
// ============================================================

function randomChoice(list) {

  if(
    !list ||
    list.length === 0
  ){
    return null;
  }


  const index =

    Math.floor(
      Math.random() * list.length
    );


  return list[index];
}





// ============================================================
// 获取当前棋盘最大数字
// ============================================================

function getMaxNumber(numbers) {

  if(
    !numbers ||
    numbers.length === 0
  ){
    return null;
  }


  return Math.max(

    ...numbers.map(
      item => item.value
    )

  );
}





// ============================================================
// 获取当前棋盘最小数字
// ============================================================

function getMinNumber(numbers) {

  if(
    !numbers ||
    numbers.length === 0
  ){
    return null;
  }


  return Math.min(

    ...numbers.map(
      item => item.value
    )

  );
}





// ============================================================
// 随机执行一局
// ============================================================

export function runSingleRandomGame(
  initialValues,
  options = {}
){

  const {

    // 防止异常情况下无限循环
    maxActions = 100000,

    // 是否记录完整操作历史
    recordHistory = false

  } = options;



  // ==========================================================
  // 创建初始状态
  // ==========================================================

  let state =

    createGameState(
      initialValues
    );



  // ==========================================================
  // 操作统计
  // ==========================================================

  let actionCount = 0;

  let combineCount = 0;

  let reduceCount = 0;

  let removeCount = 0;

  let endReason = null;



  // ==========================================================
  // 记录整局出现过的最大数字
  // ==========================================================

  let maxNumberEver =

    getMaxNumber(
      state.numbers
    );



  // ==========================================================
  // 历史记录
  //
  // 默认关闭
  // 大量测试不要开启
  // ==========================================================

  const history =

    recordHistory
      ? []
      : null;



  // ==========================================================
  // 游戏循环
  // ==========================================================

  while(
    !state.gameOver
  ){



    // ========================================================
    // 安全上限
    // ========================================================

    if(
      actionCount >= maxActions
    ){

      endReason =
        "safety_limit";

      break;

    }



    // ========================================================
    // 获取所有合法操作
    // ========================================================

    const actions =

      getLegalActions(
        state
      );



    // ========================================================
    // 无合法操作
    // ========================================================

    if(
      actions.length === 0
    ){

      endReason =
        "no_action";

      break;

    }



    // ========================================================
    // Random
    // ========================================================

    const action =

      randomChoice(
        actions
      );



    if(
      !action
    ){

      endReason =
        "no_action";

      break;

    }



    // ========================================================
    // 操作前状态
    // ========================================================

    const beforeState =
      state;



    // ========================================================
    // 执行
    // ========================================================

    state =

      applyAction(
        state,
        action
      );



    // ========================================================
    // 如果合法Action没有改变状态
    //
    // 说明 getLegalActions
    // 和 applyAction 之间存在逻辑不一致
    // ========================================================

    if(
      state === beforeState
    ){

      endReason =
        "invalid_action";

      break;

    }



    // ========================================================
    // 操作数量
    // ========================================================

    actionCount += 1;



    if(
      action.type === "combine"
    ){

      combineCount += 1;

    }


    else if(
      action.type === "reduce"
    ){

      reduceCount += 1;

    }


    else if(
      action.type === "remove"
    ){

      removeCount += 1;

    }



    // ========================================================
    // 最大数字
    // ========================================================

    const currentMax =

      getMaxNumber(
        state.numbers
      );



    if(
      currentMax !== null
    ){

      if(
        maxNumberEver === null ||
        currentMax > maxNumberEver
      ){

        maxNumberEver =
          currentMax;

      }

    }



    // ========================================================
    // Debug历史
    // ========================================================

    if(
      recordHistory
    ){

      history.push({

        actionNumber:
          actionCount,

        action,

        steps:
          state.steps,

        score:
          state.score,

        stepLimit:
          state.stepLimit,

        checkpointPending:
          state.checkpointPending,

        numbers:

          state.numbers.map(

            item => ({

              id:
                item.id,

              value:
                item.value,

              parents:
                item.parents,

              reduceFrom:
                item.reduceFrom

            })

          ),

        collection:
          [...state.collection]

      });

    }

  }



  // ==========================================================
  // gameOver
  //
  // 当前 Engine 中：
  // gameOver = checkpoint积分不足
  // ==========================================================

  if(
    !endReason &&
    state.gameOver
  ){

    endReason =
      "checkpoint_failed";

  }



  // ==========================================================
  // 返回单局结果
  // ==========================================================

  return {

    initialValues:
      [...initialValues],



    // --------------------------------------------------------
    // 结束原因
    // --------------------------------------------------------

    endReason,



    // --------------------------------------------------------
    // 核心结果
    // --------------------------------------------------------

    steps:
      state.steps,

    score:
      state.score,

    stepLimit:
      state.stepLimit,



    // --------------------------------------------------------
    // 操作数量
    // --------------------------------------------------------

    actionCount,

    combineCount,

    reduceCount,

    removeCount,



    // --------------------------------------------------------
    // 收藏
    // --------------------------------------------------------

    collectionSize:
      state.collection.length,

    collection:
      [...state.collection],



    // --------------------------------------------------------
    // 棋盘
    // --------------------------------------------------------

    finalNumberCount:
      state.numbers.length,

    finalNumbers:

      state.numbers.map(
        item => item.value
      ),

    finalMaxNumber:

      getMaxNumber(
        state.numbers
      ),

    finalMinNumber:

      getMinNumber(
        state.numbers
      ),

    maxNumberEver,



    // --------------------------------------------------------
    // 最终完整状态
    // --------------------------------------------------------

    finalState:
      state,



    // --------------------------------------------------------
    // Debug历史
    // --------------------------------------------------------

    history

  };

}





// ============================================================
// 批量随机测试
// ============================================================

export function runRandomTests(
  initialValues,
  count,
  options = {}
){

  const results = [];


  const safeCount =

    Math.max(

      0,

      Math.floor(
        Number(count) || 0
      )

    );



  for(
    let i = 0;
    i < safeCount;
    i++
  ){

    const result =

      runSingleRandomGame(
        initialValues,
        options
      );


    results.push(
      result
    );

  }



  return results;
}





// ============================================================
// 汇总 Random 测试结果
// ============================================================

export function summarizeRandomResults(
  results
){

  if(
    !results ||
    results.length === 0
  ){

    return {

      games: 0,

      collectionFrequency: {},

      collectionFrequencyList: [],

      discoveredCollectionTypes: 0

    };

  }



  const games =
    results.length;



  // ==========================================================
  // 总和
  // ==========================================================

  let totalSteps = 0;

  let totalScore = 0;

  let totalActions = 0;

  let totalCombine = 0;

  let totalReduce = 0;

  let totalRemove = 0;

  let totalCollection = 0;

  let totalFinalNumberCount = 0;



  // ==========================================================
  // 极值
  // ==========================================================

  let maxSteps =
    -Infinity;

  let minSteps =
    Infinity;

  let maxScore =
    -Infinity;

  let minScore =
    Infinity;

  let maxCollection =
    -Infinity;

  let maxNumberEver =
    null;



  // ==========================================================
  // 结束原因
  // ==========================================================

  const endReasons = {};



  // ==========================================================
  // 收藏频率
  //
  // key   = 收藏数字
  // value = 有多少局收藏过它
  //
  // 注意：
  // collection本身没有重复值，
  // 所以这里统计的是：
  //
  // "这个数字在多少局中被发现过"
  //
  // 而不是：
  //
  // "这个数字总共被消除多少次"
  // ==========================================================

  const collectionFrequency = {};



  // ==========================================================
  // 遍历每一局
  // ==========================================================

  for(
    const result of results
  ){



    // ========================================================
    // 总和
    // ========================================================

    totalSteps +=
      result.steps;


    totalScore +=
      result.score;


    totalActions +=
      result.actionCount;


    totalCombine +=
      result.combineCount;


    totalReduce +=
      result.reduceCount;


    totalRemove +=
      result.removeCount;


    totalCollection +=
      result.collectionSize;


    totalFinalNumberCount +=
      result.finalNumberCount;



    // ========================================================
    // Steps
    // ========================================================

    if(
      result.steps > maxSteps
    ){

      maxSteps =
        result.steps;

    }


    if(
      result.steps < minSteps
    ){

      minSteps =
        result.steps;

    }



    // ========================================================
    // Score
    // ========================================================

    if(
      result.score > maxScore
    ){

      maxScore =
        result.score;

    }


    if(
      result.score < minScore
    ){

      minScore =
        result.score;

    }



    // ========================================================
    // Collection Size
    // ========================================================

    if(
      result.collectionSize >
      maxCollection
    ){

      maxCollection =
        result.collectionSize;

    }



    // ========================================================
    // 收藏频率
    // ========================================================

    for(
      const value of result.collection
    ){

      if(
        !collectionFrequency[value]
      ){

        collectionFrequency[value] = 0;

      }


      collectionFrequency[value] += 1;

    }



    // ========================================================
    // 最大出现数字
    // ========================================================

    if(
      result.maxNumberEver !== null
    ){

      if(
        maxNumberEver === null ||
        result.maxNumberEver >
        maxNumberEver
      ){

        maxNumberEver =
          result.maxNumberEver;

      }

    }



    // ========================================================
    // End Reason
    // ========================================================

    const reason =

      result.endReason ||
      "unknown";


    if(
      !endReasons[reason]
    ){

      endReasons[reason] = 0;

    }


    endReasons[reason] += 1;

  }



  // ==========================================================
  // 结束原因百分比
  // ==========================================================

  const endReasonPercentages = {};


  for(
    const [
      reason,
      amount
    ]
    of
    Object.entries(
      endReasons
    )
  ){

    endReasonPercentages[
      reason
    ] =

      (
        amount /
        games
      ) * 100;

  }



  // ==========================================================
  // 收藏频率列表
  //
  // 按出现局数从高到低排序
  // ==========================================================

  const collectionFrequencyList =

    Object.entries(
      collectionFrequency
    )

    .map(

      ([
        value,
        count
      ]) => ({

        value:
          Number(value),

        count,

        percentage:

          (
            count /
            games
          ) * 100

      })

    )

    .sort(

      (a, b) => {

        // 首先按照出现次数降序

        if(
          b.count !== a.count
        ){

          return (
            b.count - a.count
          );

        }


        // 次数相同按数字升序

        return (
          a.value - b.value
        );

      }

    );



  // ==========================================================
  // 全部测试中
  // 曾经发现过多少种不同收藏
  // ==========================================================

  const discoveredCollectionTypes =

    collectionFrequencyList.length;



  // ==========================================================
  // 返回统计
  // ==========================================================

  return {

    games,



    // --------------------------------------------------------
    // Steps
    // --------------------------------------------------------

    averageSteps:
      totalSteps / games,

    maxSteps,

    minSteps,



    // --------------------------------------------------------
    // Score
    // --------------------------------------------------------

    averageScore:
      totalScore / games,

    maxScore,

    minScore,



    // --------------------------------------------------------
    // Actions
    // --------------------------------------------------------

    averageActions:
      totalActions / games,

    averageCombine:
      totalCombine / games,

    averageReduce:
      totalReduce / games,

    averageRemove:
      totalRemove / games,



    // --------------------------------------------------------
    // Collection
    // --------------------------------------------------------

    averageCollectionSize:
      totalCollection / games,

    maxCollectionSize:
      maxCollection,



    // --------------------------------------------------------
    // 收藏频率
    // --------------------------------------------------------

    collectionFrequency,

    collectionFrequencyList,

    discoveredCollectionTypes,



    // --------------------------------------------------------
    // 最终棋盘
    // --------------------------------------------------------

    averageFinalNumberCount:

      totalFinalNumberCount /
      games,



    // --------------------------------------------------------
    // 全部测试最大数字
    // --------------------------------------------------------

    maxNumberEver,



    // --------------------------------------------------------
    // 结束原因
    // --------------------------------------------------------

    endReasons,

    endReasonPercentages

  };

}