import {
  createGameState,
  getLegalActions,
  applyAction
} from "../game/gameEngine";

import {
  chooseScoreBeamAction
} from "../ai/scoreBeamAI";



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
// 单局 Score Beam AI
// ============================================================

export function runSingleScoreBeamGame(
  initialValues,
  options = {}
){

  const {

    // Beam参数
    depth = 4,

    beamWidth = 50,

    // 防止异常死循环
    maxActions = 100000,

    // 是否记录完整历史
    recordHistory = false

  } = options;



  // ==========================================================
  // 初始状态
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
  // 整局最大数字
  // ==========================================================

  let maxNumberEver =

    getMaxNumber(
      state.numbers
    );



  // ==========================================================
  // Debug历史
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
    // 当前是否已经无合法操作
    // ========================================================

    const legalActions =

      getLegalActions(
        state
      );


    if(
      legalActions.length === 0
    ){

      endReason =
        "no_action";

      break;

    }



    // ========================================================
    // Beam AI选择操作
    // ========================================================

    const action =

      chooseScoreBeamAction(
        state,
        {
          depth,
          beamWidth
        }
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
    // 执行操作
    // ========================================================

    state =

      applyAction(
        state,
        action
      );



    // ========================================================
    // AI选出来的操作理论上必须能执行
    // ========================================================

    if(
      state === beforeState
    ){

      endReason =
        "invalid_action";

      break;

    }



    // ========================================================
    // 操作统计
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
      currentMax !== null &&
      (
        maxNumberEver === null ||
        currentMax > maxNumberEver
      )
    ){

      maxNumberEver =
        currentMax;

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
  // checkpoint失败
  // ==========================================================

  if(
    !endReason &&
    state.gameOver
  ){

    endReason =
      "checkpoint_failed";

  }



  // ==========================================================
  // 单局结果
  // ==========================================================

  return {

    strategy:
      "score_beam",

    initialValues:
      [...initialValues],



    // --------------------------------------------------------
    // AI参数
    // --------------------------------------------------------

    depth,

    beamWidth,



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
    // 操作
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
    // 最终棋盘
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
    // 最终状态
    // --------------------------------------------------------

    finalState:
      state,



    // --------------------------------------------------------
    // Debug
    // --------------------------------------------------------

    history

  };

}





// ============================================================
// 批量 Score Beam 测试
// ============================================================

export function runScoreBeamTests(
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

      runSingleScoreBeamGame(
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
// 汇总 Score Beam 结果
// ============================================================

export function summarizeScoreBeamResults(
  results
){

  if(
    !results ||
    results.length === 0
  ){

    return {

      strategy:
        "score_beam",

      games:
        0,

      collectionFrequency:
        {},

      collectionFrequencyList:
        [],

      discoveredCollectionTypes:
        0

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
  // ==========================================================

  const collectionFrequency = {};



  // ==========================================================
  // 最佳单局
  // ==========================================================

  let bestScoreGame =
    null;

  let deepestGame =
    null;

  let bestCollectionGame =
    null;



  // ==========================================================
  // 遍历
  // ==========================================================

  for(
    const result of results
  ){


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
    // Collection
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
    // 最大数字
    // ========================================================

    if(
      result.maxNumberEver !== null &&
      (
        maxNumberEver === null ||
        result.maxNumberEver >
        maxNumberEver
      )
    ){

      maxNumberEver =
        result.maxNumberEver;

    }



    // ========================================================
    // 结束原因
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



    // ========================================================
    // 最佳积分局
    // ========================================================

    if(
      !bestScoreGame ||
      result.score >
      bestScoreGame.score
    ){

      bestScoreGame =
        result;

    }



    // ========================================================
    // 最深局
    // ========================================================

    if(
      !deepestGame ||
      result.steps >
      deepestGame.steps
    ){

      deepestGame =
        result;

    }



    // ========================================================
    // 最大收藏局
    // ========================================================

    if(
      !bestCollectionGame ||
      result.collectionSize >
      bestCollectionGame.collectionSize
    ){

      bestCollectionGame =
        result;

    }

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

        if(
          b.count !== a.count
        ){

          return (
            b.count -
            a.count
          );

        }


        return (
          a.value -
          b.value
        );

      }

    );



  const discoveredCollectionTypes =
    collectionFrequencyList.length;



  // ==========================================================
  // 返回汇总
  // ==========================================================

  return {

    strategy:
      "score_beam",

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

    collectionFrequency,

    collectionFrequencyList,

    discoveredCollectionTypes,



    // --------------------------------------------------------
    // 棋盘
    // --------------------------------------------------------

    averageFinalNumberCount:

      totalFinalNumberCount /
      games,

    maxNumberEver,



    // --------------------------------------------------------
    // 结束原因
    // --------------------------------------------------------

    endReasons,

    endReasonPercentages,



    // --------------------------------------------------------
    // 最佳单局
    // --------------------------------------------------------

    bestScoreGame,

    deepestGame,

    bestCollectionGame

  };

}