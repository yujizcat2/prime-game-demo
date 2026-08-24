import {
  createSimulationState,
  cloneSimulationState,
  getSimulationLegalActions,
  applySimulationAction
} from "./simulationEngine";





// ============================================================
// Smart AI 模式
// ============================================================

export const SMART_AI_MODES = {

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection"

};





// ============================================================
// 随机开局
// ============================================================

function createRandomInitialValues(){


  const pool = [

    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9

  ];



  for(
    let i = pool.length - 1;
    i > 0;
    i--
  ){


    const j =

      Math.floor(

        Math.random() *
        (
          i + 1
        )

      );



    const temp =
      pool[i];


    pool[i] =
      pool[j];


    pool[j] =
      temp;

  }



  return pool.slice(
    0,
    3
  );

}





// ============================================================
// 浏览器让步
// ============================================================

function yieldToBrowser(){


  return new Promise(

    resolve => {

      window.setTimeout(
        resolve,
        0
      );

    }

  );

}





// ============================================================
// 分析当前局面
// ============================================================

function analyzeState(
  state
){


  let boardCount =
    0;


  let ones =
    0;


  let empty =
    0;



  for(
    const piece
    of state.board
  ){


    if(
      !piece
    ){


      empty++;

      continue;

    }



    boardCount++;



    if(
      piece.value === 1
    ){


      ones++;

    }

  }





  const legalActions =

    getSimulationLegalActions(
      state
    );





  let combineCount =
    0;


  let reduceCount =
    0;


  let removeCount =
    0;



  for(
    const action
    of legalActions
  ){


    if(
      action.type ===
      "combine"
    ){


      combineCount++;

    }
    else if(
      action.type ===
      "reduce"
    ){


      reduceCount++;

    }
    else if(
      action.type ===
      "remove"
    ){


      removeCount++;

    }

  }





  return {

    boardCount,

    empty,

    ones,

    legalActions,

    legalCount:
      legalActions.length,

    combineCount,

    reduceCount,

    removeCount

  };

}





// ============================================================
// 最长步数 AI 评分
// ============================================================

function scoreSurvivalState(
  state
){


  const info =

    analyzeState(
      state
    );



  if(
    info.legalCount === 0
  ){


    return (

      state.steps *
      1000

      -

      100000

    );

  }



  return (

    state.steps *
    1000

    +

    info.legalCount *
    35

    +

    info.reduceCount *
    30

    +

    info.combineCount *
    12

    +

    info.empty *
    40

    +

    info.ones *
    80

  );

}





// ============================================================
// 最多收藏 AI 评分
// ============================================================

function scoreCollectionState(
  state
){


  const info =

    analyzeState(
      state
    );



  let score =

    state.collection.size *
    100000

    +

    info.legalCount *
    40

    +

    info.reduceCount *
    35

    +

    info.empty *
    30

    +

    info.ones *
    60

    +

    state.steps *
    5;



  if(
    info.legalCount === 0
  ){


    score -=
      5000;

  }



  return score;

}





// ============================================================
// 统一评分
// ============================================================

function scoreState(
  state,
  mode
){


  if(
    mode ===
    SMART_AI_MODES.COLLECTION
  ){


    return scoreCollectionState(
      state
    );

  }



  return scoreSurvivalState(
    state
  );

}





// ============================================================
// Beam Search 状态签名
// ============================================================

function createStateKey(
  state
){


  const boardKey =

    state.board
      .map(

        piece => {


          if(
            !piece
          ){


            return "_";

          }



          const parents =

            piece.parents

              ?

              piece.parents.join(
                ","
              )

              :

              "-";



          return [

            piece.value,

            piece.foodType,

            piece.purity
            ?? "-",

            parents,

            piece.previousValue
            ?? "-"

          ].join(
            ":"
          );

        }

      )
      .join(
        "|"
      );





  const collectionKey =

    Array.from(
      state.collection
    )
      .sort(
        (
          a,
          b
        ) =>
          a - b
      )
      .join(
        ","
      );





  return (

    boardKey

    +

    "#"

    +

    collectionKey

  );

}





// ============================================================
// 循环检测完整状态指纹
//
// 包含所有影响未来规则的数据。
// 不包含 steps / actions。
// ============================================================

function createCycleStateKey(
  state
){


  const boardKey =

    state.board
      .map(

        piece => {


          if(
            !piece
          ){


            return "_";

          }





          const parentsKey =

            piece.parents

              ?

              piece.parents.join(
                ","
              )

              :

              "-";





          const parentFoodsKey =

            piece.parentFoods

              ?

              piece.parentFoods
                .map(

                  food => [

                    food.value,

                    food.foodType,

                    food.purity
                    ?? "-"

                  ].join(
                    ","
                  )

                )
                .join(
                  ";"
                )

              :

              "-";





          return [

            piece.value,

            piece.foodType,

            piece.purity
            ?? "-",

            parentsKey,

            parentFoodsKey,

            piece.previousValue
            ?? "-"

          ].join(
            ":"
          );

        }

      )
      .join(
        "|"
      );





  const collectionKey =

    Array.from(
      state.collection
    )
      .sort(
        (
          a,
          b
        ) =>
          a - b
      )
      .join(
        ","
      );





  return (

    boardKey

    +

    "#"

    +

    collectionKey

  );

}





// ============================================================
// 棋盘快照
//
// 专门用于循环调试。
// ============================================================

function createBoardSnapshot(
  state
){


  return state.board.map(

    (
      piece,
      index
    ) => {


      if(
        !piece
      ){


        return {

          index,

          empty:
            true

        };

      }



      return {

        index,

        empty:
          false,

        value:
          piece.value,

        foodType:
          piece.foodType,

        purity:
          piece.purity
          ?? null,

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
                  ?? null

              })

            )

            :

            null,

        previousValue:
          piece.previousValue
          ?? null

      };

    }

  );

}





// ============================================================
// 动作描述
//
// 必须在执行动作之前调用。
// ============================================================

function describeAction(
  state,
  action
){


  if(
    !action
  ){


    return {

      type:
        "unknown",

      text:
        "未知动作"

    };

  }





  // ==========================================================
  // 合成
  // ==========================================================

  if(
    action.type ===
    "combine"
  ){


    const [
      indexA,
      indexB
    ] =
      action.indexes;



    const a =
      state.board[indexA];


    const b =
      state.board[indexB];



    return {

      type:
        "combine",

      indexes: [

        indexA,

        indexB

      ],

      beforeValues: [

        a?.value
        ?? null,

        b?.value
        ?? null

      ],

      text:

        `合成：格${indexA + 1} ${a?.value ?? "?"}`

        +

        ` + 格${indexB + 1} ${b?.value ?? "?"}`

    };

  }





  // ==========================================================
  // 约分
  // ==========================================================

  if(
    action.type ===
    "reduce"
  ){


    const [
      indexA,
      indexB
    ] =
      action.indexes;



    const a =
      state.board[indexA];


    const b =
      state.board[indexB];



    return {

      type:
        "reduce",

      indexes: [

        indexA,

        indexB

      ],

      beforeValues: [

        a?.value
        ?? null,

        b?.value
        ?? null

      ],

      text:

        `约分：格${indexA + 1} ${a?.value ?? "?"}`

        +

        ` ↔ 格${indexB + 1} ${b?.value ?? "?"}`

    };

  }





  // ==========================================================
  // 处理1
  // ==========================================================

  if(
    action.type ===
    "remove"
  ){


    const index =
      action.index;



    const target =
      state.board[index];



    return {

      type:
        "remove",

      index,

      beforeValue:
        target?.value
        ?? null,

      discoveredValue:
        target?.previousValue
        ?? null,

      text:

        `处理1：格${index + 1}`

        +

        (

          target?.previousValue != null

            ?

            ` · 收藏来源 ${target.previousValue}`

            :

            ""

        )

    };

  }





  return {

    type:
      action.type,

    text:
      action.type

  };

}





// ============================================================
// Beam Search
// ============================================================

function chooseSmartAction(
  state,
  mode,
  {

    depth = 4,

    beamWidth = 50

  } = {}
){


  const rootActions =

    getSimulationLegalActions(
      state
    );





  if(
    rootActions.length === 0
  ){


    return null;

  }





  if(
    rootActions.length === 1
  ){


    return rootActions[0];

  }





  let beam =
    [];





  // ==========================================================
  // 第一层
  // ==========================================================

  for(
    const action
    of rootActions
  ){


    const nextState =

      cloneSimulationState(
        state
      );



    applySimulationAction(

      nextState,

      action

    );



    beam.push({

      state:
        nextState,

      firstAction:
        action,

      score:

        scoreState(
          nextState,
          mode
        )

    });

  }





  beam.sort(

    (
      a,
      b
    ) =>
      b.score -
      a.score

  );



  beam =

    beam.slice(
      0,
      beamWidth
    );





  // ==========================================================
  // 继续向未来搜索
  // ==========================================================

  for(
    let level = 1;
    level < depth;
    level++
  ){


    const nextBeam =
      [];


    const seen =

      new Set();





    for(
      const candidate
      of beam
    ){


      const legalActions =

        getSimulationLegalActions(
          candidate.state
        );





      if(
        legalActions.length === 0
      ){


        const key =

          createStateKey(
            candidate.state
          );



        if(
          !seen.has(
            key
          )
        ){


          seen.add(
            key
          );


          nextBeam.push(
            candidate
          );

        }



        continue;

      }





      for(
        const action
        of legalActions
      ){


        const nextState =

          cloneSimulationState(
            candidate.state
          );



        applySimulationAction(

          nextState,

          action

        );





        const key =

          createStateKey(
            nextState
          );



        if(
          seen.has(
            key
          )
        ){


          continue;

        }



        seen.add(
          key
        );





        nextBeam.push({

          state:
            nextState,

          firstAction:
            candidate.firstAction,

          score:

            scoreState(
              nextState,
              mode
            )

        });

      }

    }





    if(
      nextBeam.length === 0
    ){


      break;

    }





    nextBeam.sort(

      (
        a,
        b
      ) =>
        b.score -
        a.score

    );



    beam =

      nextBeam.slice(
        0,
        beamWidth
      );

  }





  beam.sort(

    (
      a,
      b
    ) =>
      b.score -
      a.score

  );





  return (

    beam[0]?.firstAction

    ??

    rootActions[0]

  );

}





// ============================================================
// Smart AI 玩一局
//
// 包含：
//
// 真实动作记录
// 循环检测
// 循环动作抓取
// 棋盘快照
// ============================================================

export async function runSmartGame({

  mode =
    SMART_AI_MODES.SURVIVAL,

  depth =
    4,

  beamWidth =
    50,

  maxActions =
    1000,

  yieldEvery =
    10,

  onProgress =
    null

} = {}){


  // ==========================================================
  // 开局
  // ==========================================================

  const initialValues =

    createRandomInitialValues();



  const state =

    createSimulationState(
      initialValues
    );





  // ==========================================================
  // 实际选择次数
  // ==========================================================

  let actions =
    0;





  // ==========================================================
  // AI 真正执行过的动作历史
  // ==========================================================

  const actionHistory =
    [];





  // ==========================================================
  // 已出现状态
  // ==========================================================

  const seenStates =

    new Map();





  // ==========================================================
  // 循环结果
  // ==========================================================

  let cycleDetected =
    false;


  let cycleInfo =
    null;





  // ==========================================================
  // 初始状态
  // ==========================================================

  const initialStateKey =

    createCycleStateKey(
      state
    );



  seenStates.set(

    initialStateKey,

    {

      action:
        0,

      steps:
        state.steps,

      collectionCount:
        state.collection.size

    }

  );





  // ==========================================================
  // 开始真实游戏
  // ==========================================================

  while(
    actions <
    maxActions
  ){


    // ========================================================
    // 当前合法动作
    // ========================================================

    const legalActions =

      getSimulationLegalActions(
        state
      );





    // ========================================================
    // 自然结束
    // ========================================================

    if(
      legalActions.length === 0
    ){


      break;

    }





    // ========================================================
    // AI 选择动作
    // ========================================================

    const action =

      chooseSmartAction(

        state,

        mode,

        {

          depth,

          beamWidth

        }

      );





    if(
      !action
    ){


      break;

    }





    // ========================================================
    // 执行前记录动作
    // ========================================================

    const actionDescription =

      describeAction(
        state,
        action
      );





    // ========================================================
    // 执行前棋盘
    // ========================================================

    const beforeBoard =

      createBoardSnapshot(
        state
      );





    const beforeSteps =
      state.steps;


    const beforeCollection =
      state.collection.size;





    // ========================================================
    // 真正执行
    // ========================================================

    applySimulationAction(

      state,

      action

    );



    actions++;





    // ========================================================
    // 执行后棋盘
    // ========================================================

    const afterBoard =

      createBoardSnapshot(
        state
      );





    // ========================================================
    // 写入真实动作历史
    // ========================================================

    actionHistory.push({

      actionNumber:
        actions,

      ...actionDescription,

      beforeSteps,

      afterSteps:
        state.steps,

      stepDelta:

        state.steps -
        beforeSteps,

      beforeCollection,

      afterCollection:
        state.collection.size,

      collectionDelta:

        state.collection.size -
        beforeCollection,

      beforeBoard,

      afterBoard

    });





    // ========================================================
    // 当前完整状态
    // ========================================================

    const stateKey =

      createCycleStateKey(
        state
      );





    // ========================================================
    // 是否以前出现过
    // ========================================================

    const previous =

      seenStates.get(
        stateKey
      );





    // ========================================================
    // 检测到循环
    // ========================================================

    if(
      previous
    ){


      const cycleActions =

        actions -
        previous.action;



      const cycleSteps =

        state.steps -
        previous.steps;



      const cycleCollection =

        state.collection.size -
        previous.collectionCount;





      // ======================================================
      // 提取真正的循环动作
      //
      // 例如：
      //
      // firstAction  = 27
      // repeatAction = 39
      //
      // 循环动作：
      //
      // 28 ～ 39
      //
      // actionHistory下标：
      //
      // 27 ～ 38
      // ======================================================

      const cycleActionList =

        actionHistory.slice(

          previous.action,

          actions

        );





      cycleDetected =
        true;





      cycleInfo = {

        // ====================================================
        // 第一次出现
        // ====================================================

        firstAction:
          previous.action,

        firstSteps:
          previous.steps,

        firstCollection:
          previous.collectionCount,


        // ====================================================
        // 再次出现
        // ====================================================

        repeatAction:
          actions,

        repeatSteps:
          state.steps,

        repeatCollection:
          state.collection.size,


        // ====================================================
        // 循环统计
        // ====================================================

        cycleActions,

        cycleSteps,

        cycleCollection,


        // ====================================================
        // 是否增加正式步数
        // ====================================================

        increasesSteps:

          cycleSteps >
          0,


        // ====================================================
        // 完整循环动作
        // ====================================================

        actionList:
          cycleActionList,


        // ====================================================
        // 循环开始棋盘
        // ====================================================

        startBoard:

          cycleActionList[0]
            ?.beforeBoard

          ??

          null,


        // ====================================================
        // 循环结束棋盘
        // ====================================================

        endBoard:

          cycleActionList[
            cycleActionList.length - 1
          ]
            ?.afterBoard

          ??

          null

      };





      // ======================================================
      // 抓到循环后立即停止
      // ======================================================

      break;

    }





    // ========================================================
    // 第一次出现当前状态
    // ========================================================

    seenStates.set(

      stateKey,

      {

        action:
          actions,

        steps:
          state.steps,

        collectionCount:
          state.collection.size

      }

    );





    // ========================================================
    // UI进度
    // ========================================================

    if(
      actions %
      yieldEvery === 0
    ){


      if(
        typeof onProgress ===
        "function"
      ){


        onProgress({

          actions,

          steps:
            state.steps,

          collectionCount:
            state.collection.size,

          visitedStates:
            seenStates.size,

          cycleDetected

        });

      }



      await yieldToBrowser();

    }

  }





  // ==========================================================
  // 最终合法动作
  // ==========================================================

  const finalLegalActions =

    getSimulationLegalActions(
      state
    );





  // ==========================================================
  // 返回单局结果
  // ==========================================================

  return {

    mode,

    initialValues,

    depth,

    beamWidth,


    steps:
      state.steps,


    actions,


    collection:

      Array.from(
        state.collection
      ),


    collectionCount:
      state.collection.size,


    endedNaturally:

      !cycleDetected

      &&

      finalLegalActions.length === 0,


    hitLimit:

      !cycleDetected

      &&

      actions >=
      maxActions,


    cycleDetected,

    cycleInfo,


    visitedStates:
      seenStates.size,


    // ========================================================
    // 完整真实路线
    //
    // 目前主要用于开发调试。
    // ========================================================

    actionHistory

  };

}





// ============================================================
// Smart AI 批量测试
// ============================================================

export async function runSmartExplorer({

  mode =
    SMART_AI_MODES.SURVIVAL,

  games =
    1,

  depth =
    4,

  beamWidth =
    50,

  maxActionsPerGame =
    1000,

  onProgress =
    null

} = {}){


  const safeGames =

    Math.max(

      1,

      Math.floor(
        games
      )

    );





  // ==========================================================
  // 总计
  // ==========================================================

  let totalSteps =
    0;


  let totalCollection =
    0;





  // ==========================================================
  // 极值
  // ==========================================================

  let maxSteps =
    0;


  let maxCollection =
    0;





  // ==========================================================
  // 纪录
  // ==========================================================

  let bestStepGame =
    null;


  let bestCollectionGame =
    null;





  // ==========================================================
  // 保护上限
  // ==========================================================

  let hitLimitCount =
    0;





  // ==========================================================
  // 循环统计
  // ==========================================================

  let cycleCount =
    0;


  let firstCycle =
    null;





  // ==========================================================
  // 开始批量测试
  // ==========================================================

  for(
    let gameIndex = 0;
    gameIndex < safeGames;
    gameIndex++
  ){


    const result =

      await runSmartGame({

        mode,

        depth,

        beamWidth,

        maxActions:
          maxActionsPerGame,


        onProgress:
          gameProgress => {


            if(
              typeof onProgress ===
              "function"
            ){


              onProgress({

                completed:
                  gameIndex,

                total:
                  safeGames,

                currentGame:
                  gameIndex + 1,

                currentActions:
                  gameProgress.actions,

                currentSteps:
                  gameProgress.steps,

                currentCollection:
                  gameProgress.collectionCount,

                currentVisitedStates:
                  gameProgress.visitedStates,

                currentCycleDetected:
                  gameProgress.cycleDetected,

                maxSteps,

                maxCollection,

                hitLimitCount,

                cycleCount

              });

            }

          }

      });





    // ========================================================
    // 总计
    // ========================================================

    totalSteps +=
      result.steps;


    totalCollection +=
      result.collectionCount;





    // ========================================================
    // 最长步数
    // ========================================================

    if(
      result.steps >
      maxSteps
    ){


      maxSteps =
        result.steps;



      bestStepGame = {

        gameIndex:
          gameIndex + 1,

        ...result

      };

    }





    // ========================================================
    // 最多收藏
    // ========================================================

    if(
      result.collectionCount >
      maxCollection
    ){


      maxCollection =
        result.collectionCount;



      bestCollectionGame = {

        gameIndex:
          gameIndex + 1,

        ...result

      };

    }





    // ========================================================
    // 保护上限
    // ========================================================

    if(
      result.hitLimit
    ){


      hitLimitCount++;

    }





    // ========================================================
    // 循环
    // ========================================================

    if(
      result.cycleDetected
    ){


      cycleCount++;



      if(
        !firstCycle
      ){


        firstCycle = {

          gameIndex:
            gameIndex + 1,

          ...result

        };

      }

    }





    // ========================================================
    // 更新 UI
    // ========================================================

    if(
      typeof onProgress ===
      "function"
    ){


      onProgress({

        completed:
          gameIndex + 1,

        total:
          safeGames,

        currentGame:
          null,

        currentActions:
          0,

        currentSteps:
          0,

        currentCollection:
          0,

        currentVisitedStates:
          0,

        currentCycleDetected:
          false,

        maxSteps,

        maxCollection,

        hitLimitCount,

        cycleCount

      });

    }





    await yieldToBrowser();

  }





  // ==========================================================
  // 最终统计
  // ==========================================================

  return {

    mode,

    games:
      safeGames,

    depth,

    beamWidth,


    averageSteps:

      totalSteps /
      safeGames,


    maxSteps,


    averageCollection:

      totalCollection /
      safeGames,


    maxCollection,


    hitLimitCount,


    cycleCount,

    firstCycle,


    bestStepGame,

    bestCollectionGame

  };

}