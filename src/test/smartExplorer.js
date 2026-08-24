import {
  createSimulationState,
  cloneSimulationState,
  getSimulationLegalActions,
  applySimulationAction,
  getSimulationHistorySignature
} from "./simulationEngine";

import {
  createMazeStateKey
} from "../game/mazeHistory";





// ============================================================
// AI 模式
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



    [
      pool[i],
      pool[j]
    ] = [

      pool[j],
      pool[i]

    ];

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

    resolve =>

      window.setTimeout(

        resolve,

        0

      )

  );

}





// ============================================================
// 简单 gcd
//
// 只用于收藏启发式。
// ============================================================

function gcdSimple(
  a,
  b
){


  let x =

    Math.abs(
      a
    );


  let y =

    Math.abs(
      b
    );



  while(
    y !== 0
  ){


    const temp =
      x % y;


    x =
      y;


    y =
      temp;

  }



  return x;

}





// ============================================================
// 局面信息
// ============================================================

function analyzeState(
  state
){


  let empty =
    0;


  let ones =
    0;



  for(
    const piece
    of state.board
  ){


    if(
      !piece
    ){


      empty++;

    }


    else if(
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

  }



  return {

    legalActions,

    legalCount:
      legalActions.length,

    combineCount,

    reduceCount,

    empty,

    ones

  };

}





// ============================================================
// Survival 评分
// ============================================================

function scoreSurvival(
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
// 收藏潜力分析
//
// Collection AI V2
// ============================================================

function analyzeCollectionPotential(
  state,
  info
){


  const collected =
    state.collection;



  let directNewCollection =
    0;


  let oneReduceAway =
    0;



  const unseenValues =
    new Set();


  const reducibleUnseenValues =
    new Set();





  // ==========================================================
  // 当前棋盘
  // ==========================================================

  for(
    const piece
    of state.board
  ){


    if(
      !piece
    ){


      continue;

    }





    if(
      piece.value === 1
    ){


      const source =
        piece.previousValue;



      if(
        source != null
        &&
        !collected.has(
          source
        )
      ){


        directNewCollection++;

      }



      continue;

    }





    if(
      !collected.has(
        piece.value
      )
    ){


      unseenValues.add(
        piece.value
      );

    }

  }





  // ==========================================================
  // 扫描所有合法约分
  // ==========================================================

  for(
    const action
    of info.legalActions
  ){


    if(
      action.type !==
      "reduce"
    ){


      continue;

    }



    const [
      indexA,
      indexB
    ] =
      action.indexes;



    const a =
      state.board[indexA];


    const b =
      state.board[indexB];



    if(
      !a
      ||
      !b
    ){


      continue;

    }



    const divisor =

      gcdSimple(

        a.value,

        b.value

      );



    if(
      divisor <= 1
    ){


      continue;

    }



    const nextA =

      a.value /
      divisor;


    const nextB =

      b.value /
      divisor;





    if(
      nextA === 1
      &&
      !collected.has(
        a.value
      )
    ){


      oneReduceAway++;

    }





    if(
      nextB === 1
      &&
      !collected.has(
        b.value
      )
    ){


      oneReduceAway++;

    }





    if(
      !collected.has(
        a.value
      )
    ){


      reducibleUnseenValues.add(
        a.value
      );

    }



    if(
      !collected.has(
        b.value
      )
    ){


      reducibleUnseenValues.add(
        b.value
      );

    }

  }





  return {

    directNewCollection,

    oneReduceAway,

    unseenBoardValues:
      unseenValues.size,

    unseenReducibleValues:
      reducibleUnseenValues.size

  };

}





// ============================================================
// Collection 评分 V2
// ============================================================

function scoreCollection(
  state
){


  const info =

    analyzeState(
      state
    );



  const potential =

    analyzeCollectionPotential(

      state,

      info

    );



  const collectionScore =

    state.collection.size *
    1000000;



  const directScore =

    potential.directNewCollection *
    300000;



  const oneReduceScore =

    potential.oneReduceAway *
    100000;



  const reducibleUnseenScore =

    potential.unseenReducibleValues *
    8000;



  const unseenScore =

    potential.unseenBoardValues *
    1000;



  const boardScore =

    info.reduceCount *
    120

    +

    info.empty *
    60

    +

    info.legalCount *
    15

    +

    info.ones *
    10;



  const deadPenalty =

    info.legalCount === 0

      ?

        50000

      :

        0;



  return (

    collectionScore

    +

    directScore

    +

    oneReduceScore

    +

    reducibleUnseenScore

    +

    unseenScore

    +

    boardScore

    -

    deadPenalty

  );

}





// ============================================================
// 统一评分
// ============================================================

function scoreState(
  state,
  mode
){


  return (

    mode ===
    SMART_AI_MODES.COLLECTION

      ?

        scoreCollection(
          state
        )

      :

        scoreSurvival(
          state
        )

  );

}





// ============================================================
// Beam 去重 Key
// ============================================================

function createSearchKey(
  state
){


  return (

    createMazeStateKey(
      state
    )

    +

    "#"

    +

    getSimulationHistorySignature(
      state
    )

  );

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
    rootActions.length <=
    1
  ){


    return (

      rootActions[0]
      ?? null

    );

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



    if(
      !applySimulationAction(
        nextState,
        action
      )
    ){


      continue;

    }



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



  if(
    beam.length === 0
  ){


    return rootActions[0];

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
  // 未来层
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


      const actions =

        getSimulationLegalActions(
          candidate.state
        );



      if(
        actions.length === 0
      ){


        const key =

          createSearchKey(
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
        of actions
      ){


        const nextState =

          cloneSimulationState(
            candidate.state
          );



        if(
          !applySimulationAction(
            nextState,
            action
          )
        ){


          continue;

        }



        const key =

          createSearchKey(
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
// 棋盘快照
// ============================================================

function snapshotBoard(
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

        previousValue:
          piece.previousValue
          ?? null

      };

    }

  );

}





// ============================================================
// 动作描述
// ============================================================

function describeAction(
  state,
  action
){


  if(
    action.type ===
    "remove"
  ){


    const piece =

      state.board[
        action.index
      ];



    return {

      type:
        "remove",

      text:

        `处理1：格${action.index + 1}`

        +

        (

          piece?.previousValue != null

            ?

              ` · 收藏来源 ${piece.previousValue}`

            :

              ""

        )

    };

  }



  const [
    aIndex,
    bIndex
  ] =
    action.indexes;



  const a =
    state.board[aIndex];


  const b =
    state.board[bIndex];



  if(
    action.type ===
    "combine"
  ){


    return {

      type:
        "combine",

      text:

        `合成：格${aIndex + 1} ${a?.value}`

        +

        ` + 格${bIndex + 1} ${b?.value}`

    };

  }



  return {

    type:
      "reduce",

    text:

      `约分：格${aIndex + 1} ${a?.value}`

      +

      ` ↔ 格${bIndex + 1} ${b?.value}`

  };

}





// ============================================================
// 单局
// ============================================================

export async function runSmartGame({

  mode =
    SMART_AI_MODES.SURVIVAL,

  depth =
    4,

  beamWidth =
    50,

  maxActions =
    10000,

  yieldEvery =
    20,

  onProgress =
    null

} = {}){


  const initialValues =

    createRandomInitialValues();



  const state =

    createSimulationState(
      initialValues
    );



  let actions =
    0;



  // ==========================================================
  // 处理1统计
  // ==========================================================

  let totalRemoveActions =
    0;


  let repeatCollectionRemovals =
    0;


  let repeatRemovalsSincePreviousCollection =
    0;



  // ==========================================================
  // 回转记录
  // ==========================================================

  const mazeTurns =
    [];



  // ==========================================================
  // 收藏时间线
  // ==========================================================

  const collectionTimeline =
    [];



  // ==========================================================
  // 最近动作窗口
  // ==========================================================

  const recentActions =
    [];


  const ROUTE_WINDOW_SIZE =
    20;



  let previousCollection =

    new Set(
      state.collection
    );





  while(
    actions <
    maxActions
  ){


    const legalActions =

      getSimulationLegalActions(
        state
      );



    if(
      legalActions.length === 0
    ){


      break;

    }



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



    const description =

      describeAction(
        state,
        action
      );



    // ========================================================
    // 在执行 remove 前判断：
    //
    // 这次处理的是新收藏，
    // 还是已经收藏过的旧数字。
    // ========================================================

    let isRepeatCollectionRemoval =
      false;


    let removedSource =
      null;



    if(
      action.type ===
      "remove"
    ){


      const piece =

        state.board[
          action.index
        ];



      removedSource =

        piece?.previousValue

        ??

        null;



      totalRemoveActions++;



      if(
        removedSource != null
        &&
        state.collection.has(
          removedSource
        )
      ){


        isRepeatCollectionRemoval =
          true;

      }

    }





    const beforeTurnCount =
      state.mazeTurnCount;



    const beforeBoard =

      snapshotBoard(
        state
      );



    const applied =

      applySimulationAction(

        state,

        action

      );



    if(
      !applied
    ){


      break;

    }



    actions++;





    // ========================================================
    // 重复旧收藏处理统计
    // ========================================================

    if(
      isRepeatCollectionRemoval
    ){


      repeatCollectionRemovals++;

      repeatRemovalsSincePreviousCollection++;

    }





    // ========================================================
    // 收藏路线分析
    // ========================================================

    recentActions.push({

      actionNumber:
        actions,

      steps:
        state.steps,

      type:
        description.type,

      text:
        description.text,

      removedSource,

      repeatCollectionRemoval:
        isRepeatCollectionRemoval,

      beforeBoard,

      afterBoard:

        snapshotBoard(
          state
        )

    });



    if(
      recentActions.length >
      ROUTE_WINDOW_SIZE
    ){


      recentActions.shift();

    }





    // ========================================================
    // 收藏时间线
    // ========================================================

    if(
      state.collection.size >
      previousCollection.size
    ){


      for(
        const value
        of state.collection
      ){


        if(
          previousCollection.has(
            value
          )
        ){


          continue;

        }



        const previousTimelineEntry =

          collectionTimeline[
            collectionTimeline.length - 1
          ]

          ??

          null;



        collectionTimeline.push({

          order:
            collectionTimeline.length + 1,

          value,

          actionNumber:
            actions,

          steps:
            state.steps,

          mazeTurnCount:
            state.mazeTurnCount,





          // ====================================================
          // 距离上一个收藏
          // ====================================================

          actionsSincePrevious:

            previousTimelineEntry

              ?

                actions -
                previousTimelineEntry.actionNumber

              :

                actions,



          stepsSincePrevious:

            previousTimelineEntry

              ?

                state.steps -
                previousTimelineEntry.steps

              :

                state.steps,





          // ====================================================
          // 从上一个新收藏到现在，
          // 重复处理了多少次旧收藏。
          // ====================================================

          repeatRemovalsSincePrevious:

            repeatRemovalsSincePreviousCollection,





          // ====================================================
          // 真正触发收藏的动作
          // ====================================================

          triggerAction:

            recentActions[
              recentActions.length - 1
            ]

            ??

            null,





          // ====================================================
          // 收藏前一个动作
          // ====================================================

          previousAction:

            recentActions[
              recentActions.length - 2
            ]

            ??

            null,





          // ====================================================
          // 最近20步路线
          // ====================================================

          routeWindow:

            recentActions.map(

              item => ({

                actionNumber:
                  item.actionNumber,

                steps:
                  item.steps,

                type:
                  item.type,

                text:
                  item.text,

                removedSource:
                  item.removedSource,

                repeatCollectionRemoval:
                  item.repeatCollectionRemoval,

                beforeBoard:
                  item.beforeBoard,

                afterBoard:
                  item.afterBoard

              })

            )

        });





        // ======================================================
        // 新收藏已经形成。
        //
        // 下一段重新统计：
        // “为了下一个新收藏，
        //  中间用了多少旧收藏。”
        // ======================================================

        repeatRemovalsSincePreviousCollection =
          0;

      }



      previousCollection =

        new Set(
          state.collection
        );

    }





    // ========================================================
    // 迷宫回转
    // ========================================================

    if(
      state.mazeTurnCount >
      beforeTurnCount
    ){


      mazeTurns.push({

        turnNumber:
          state.mazeTurnCount,

        actionNumber:
          actions,

        actionText:
          description.text,

        triggerSteps:
          state.steps,

        previousSequence:

          state.lastMazeTurn
            ?.previousSequence

          ??

          null,

        previousSteps:

          state.lastMazeTurn
            ?.previousSteps

          ??

          null,

        beforeValues:

          state.lastMazeTurn
            ?.beforeValues

          ??

          [],

        afterValues:

          state.lastMazeTurn
            ?.afterValues

          ??

          [],

        beforeBoard,

        afterBoard:

          snapshotBoard(
            state
          )

      });

    }





    // ========================================================
    // 进度
    // ========================================================

    if(
      actions %
      yieldEvery ===
      0
    ){


      onProgress?.({

        actions,

        steps:
          state.steps,

        collectionCount:
          state.collection.size,

        lastCollection:

          collectionTimeline[
            collectionTimeline.length - 1
          ]

          ??

          null,

        visitedStates:
          state.mazeVisitedCount,

        mazeTurnCount:
          state.mazeTurnCount,

        totalRemoveActions,

        repeatCollectionRemovals

      });



      await yieldToBrowser();

    }

  }





  const finalActions =

    getSimulationLegalActions(
      state
    );



  const endedNaturally =

    finalActions.length === 0;





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





    // ========================================================
    // 处理1统计
    // ========================================================

    totalRemoveActions,

    repeatCollectionRemovals,

    averageRepeatRemovalsPerCollection:

      state.collection.size > 0

        ?

          repeatCollectionRemovals /
          state.collection.size

        :

          0,





    collectionTimeline,

    visitedStates:
      state.mazeVisitedCount,

    mazeTurnCount:
      state.mazeTurnCount,

    mazeTurns,

    firstMazeTurn:

      mazeTurns[0]

      ??

      null,

    lastMazeTurn:

      mazeTurns[
        mazeTurns.length - 1
      ]

      ??

      null,

    endedNaturally,

    hitLimit:

      !endedNaturally

      &&

      actions >=
      maxActions

  };

}





// ============================================================
// 批量测试
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



  let totalSteps =
    0;


  let totalCollection =
    0;


  let totalMazeTurns =
    0;


  let totalRemoveActions =
    0;


  let totalRepeatCollectionRemovals =
    0;



  let maxSteps =
    0;


  let maxCollection =
    0;


  let maxMazeTurns =
    0;


  let hitLimitCount =
    0;


  let mazeTurnGameCount =
    0;



  let bestStepGame =
    null;


  let bestCollectionGame =
    null;


  let mostMazeTurnGame =
    null;


  let firstMazeTurnGame =
    null;





  for(
    let i = 0;
    i < safeGames;
    i++
  ){


    const result =

      await runSmartGame({

        mode,

        depth,

        beamWidth,

        maxActions:
          maxActionsPerGame,

        onProgress:
          current => {


            onProgress?.({

              completed:
                i,

              total:
                safeGames,

              currentGame:
                i + 1,

              currentActions:
                current.actions,

              currentSteps:
                current.steps,

              currentCollection:
                current.collectionCount,

              currentLastCollection:
                current.lastCollection,

              currentVisitedStates:
                current.visitedStates,

              currentMazeTurns:
                current.mazeTurnCount,

              currentRemoveActions:
                current.totalRemoveActions,

              currentRepeatCollectionRemovals:
                current.repeatCollectionRemovals,

              maxSteps,

              maxCollection,

              maxMazeTurns,

              totalMazeTurns,

              mazeTurnGameCount,

              hitLimitCount

            });

          }

      });





    const game = {

      gameIndex:
        i + 1,

      ...result

    };





    // ========================================================
    // 总计
    // ========================================================

    totalSteps +=
      result.steps;


    totalCollection +=
      result.collectionCount;


    totalMazeTurns +=
      result.mazeTurnCount;


    totalRemoveActions +=
      result.totalRemoveActions;


    totalRepeatCollectionRemovals +=
      result.repeatCollectionRemovals;





    // ========================================================
    // 最长步数
    // ========================================================

    if(
      result.steps >
      maxSteps
    ){


      maxSteps =
        result.steps;


      bestStepGame =
        game;

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


      bestCollectionGame =
        game;

    }





    // ========================================================
    // 回转
    // ========================================================

    if(
      result.mazeTurnCount >
      0
    ){


      mazeTurnGameCount++;



      if(
        !firstMazeTurnGame
      ){


        firstMazeTurnGame =
          game;

      }

    }



    if(
      result.mazeTurnCount >
      maxMazeTurns
    ){


      maxMazeTurns =
        result.mazeTurnCount;


      mostMazeTurnGame =
        game;

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
    // 进度
    // ========================================================

    onProgress?.({

      completed:
        i + 1,

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

      currentLastCollection:
        null,

      currentVisitedStates:
        0,

      currentMazeTurns:
        0,

      currentRemoveActions:
        0,

      currentRepeatCollectionRemovals:
        0,

      maxSteps,

      maxCollection,

      maxMazeTurns,

      totalMazeTurns,

      mazeTurnGameCount,

      hitLimitCount

    });



    await yieldToBrowser();

  }





  return {

    mode,

    games:
      safeGames,

    depth,

    beamWidth,





    // ========================================================
    // 步数
    // ========================================================

    averageSteps:

      totalSteps /
      safeGames,

    maxSteps,





    // ========================================================
    // 收藏
    // ========================================================

    averageCollection:

      totalCollection /
      safeGames,

    maxCollection,





    // ========================================================
    // 处理1 / 重复旧收藏统计
    // ========================================================

    totalRemoveActions,

    totalRepeatCollectionRemovals,

    averageRepeatCollectionRemovalsPerGame:

      totalRepeatCollectionRemovals /
      safeGames,

    averageRepeatRemovalsPerCollection:

      totalCollection > 0

        ?

          totalRepeatCollectionRemovals /
          totalCollection

        :

          0,





    // ========================================================
    // 保护上限
    // ========================================================

    hitLimitCount,





    // ========================================================
    // 回转
    // ========================================================

    totalMazeTurns,

    averageMazeTurns:

      totalMazeTurns /
      safeGames,

    maxMazeTurns,

    mazeTurnGameCount,

    mazeTurnRate:

      mazeTurnGameCount /
      safeGames,





    // ========================================================
    // 纪录
    // ========================================================

    firstMazeTurnGame,

    mostMazeTurnGame,

    bestStepGame,

    bestCollectionGame

  };

}