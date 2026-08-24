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
//
// 不只看：
//
// “已经收藏几个”
//
// 还看：
//
// 1. 是否已经存在可直接处理的新收藏1
// 2. 是否一次约分就能得到新收藏1
// 3. 未收藏数字是否已经进入可约分状态
// 4. 棋盘上是否存在尚未收藏的数字
//
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





    // ========================================================
    // 已经存在一个1
    //
    // previousValue 是处理它以后获得的收藏来源。
    // ========================================================

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





    // ========================================================
    // 当前棋盘上的未收藏数字
    // ========================================================

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
  //
  // 判断是否已经“一次约分即可收藏”。
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





    // ========================================================
    // A 一步直接约成1
    // ========================================================

    if(
      nextA === 1
      &&
      !collected.has(
        a.value
      )
    ){


      oneReduceAway++;

    }





    // ========================================================
    // B 一步直接约成1
    // ========================================================

    if(
      nextB === 1
      &&
      !collected.has(
        b.value
      )
    ){


      oneReduceAway++;

    }





    // ========================================================
    // 尚未收藏，而且已经能够参与合法约分
    //
    // 说明它正在进入“可加工”状态。
    // ========================================================

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
//
// 优先顺序：
//
// 1. 已经获得的新收藏
// 2. 可直接处理的新收藏1
// 3. 一步约分得到新收藏
// 4. 未收藏数字已经可以约分
// 5. 当前棋盘存在未收藏数字
// 6. 局面活性只做辅助
//
// ------------------------------------------------------------
//
// 重要变化：
//
// 删除 state.steps 奖励。
//
// 对 Collection AI 来说：
//
// 活很久 ≠ 做得好。
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





  // ==========================================================
  // 已经获得的不同收藏
  //
  // 绝对最高优先级。
  // ==========================================================

  const collectionScore =

    state.collection.size *
    1000000;





  // ==========================================================
  // 已经存在可直接处理的新收藏1
  // ==========================================================

  const directScore =

    potential.directNewCollection *
    300000;





  // ==========================================================
  // 一次约分即可产生新收藏1
  // ==========================================================

  const oneReduceScore =

    potential.oneReduceAway *
    100000;





  // ==========================================================
  // 未收藏数字已经进入可约分状态
  // ==========================================================

  const reducibleUnseenScore =

    potential.unseenReducibleValues *
    8000;





  // ==========================================================
  // 棋盘上存在未收藏数字
  //
  // 权重故意较低。
  //
  // 避免 AI 只喜欢囤陌生数字，
  // 却不真正加工它们。
  // ==========================================================

  const unseenScore =

    potential.unseenBoardValues *
    1000;





  // ==========================================================
  // 基础局面质量
  //
  // 只负责同等收藏潜力局面之间的细微排序。
  // ==========================================================

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





  // ==========================================================
  // 死局惩罚
  // ==========================================================

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
//
// 只在主路线发生回转时记录。
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
  // 回转记录
  // ==========================================================

  const mazeTurns =
    [];



  // ==========================================================
  // 收藏时间线
  // ==========================================================

  const collectionTimeline =
    [];



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

                state.steps

        });

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
          state.mazeTurnCount

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