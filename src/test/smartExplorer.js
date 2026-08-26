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

import {
  getCollectionBalanceState,
  getSimulationCollectionKey,
  isCollectibleFoodType
} from "../game/collectionRules";





export const SMART_AI_MODES = {

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection"

};





const COLLECTION_SCORE =
  1000000;


const RECENT_BALANCE_WEIGHT =
  45000;


const GLOBAL_BALANCE_WEIGHT =
  12000;


const SAME_TYPE_STREAK_WEIGHT =
  30000;


const MISSING_TYPE_WEIGHT =
  60000;


const RECOVERY_POTENTIAL_WEIGHT =
  40000;


const ALL_TYPES_PRESENT_BONUS =
  50000;


const PERFECT_RECENT_BALANCE_BONUS =
  70000;





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





function yieldToBrowser(){


  return new Promise(

    resolve =>

      window.setTimeout(
        resolve,
        0
      )

  );

}





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
// 收藏槽辅助
// ============================================================

function hasCollectionSlot(
  state,
  value,
  foodType
){


  const key =

    getSimulationCollectionKey(

      value,

      foodType

    );



  if(
    !key
  ){


    return false;

  }



  return state.collection.has(
    key
  );

}





function parseCollectionKey(
  key
){


  if(
    typeof key !==
    "string"
  ){


    return null;

  }



  const separatorIndex =

    key.lastIndexOf(
      ":"
    );



  if(
    separatorIndex <= 0
  ){


    return null;

  }



  const value =

    Number(

      key.slice(
        0,
        separatorIndex
      )

    );



  const foodType =

    key.slice(
      separatorIndex + 1
    );



  if(
    !Number.isFinite(
      value
    )
    ||
    !isCollectibleFoodType(
      foodType
    )
  ){


    return null;

  }



  return {

    value,

    foodType

  };

}





// ============================================================
// 基础局面分析
// ============================================================

function analyzeState(
  state
){


  let empty =
    0;


  let ones =
    0;


  let meatPieces =
    0;


  let vegetablePieces =
    0;


  let seasoningPieces =
    0;


  let dessertPieces =
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



    if(
      piece.value === 1
    ){


      ones++;

    }



    if(
      piece.foodType === "meat"
    ){


      meatPieces++;

    }


    else if(
      piece.foodType === "vegetable"
    ){


      vegetablePieces++;

    }


    else if(
      piece.foodType === "seasoning"
    ){


      seasoningPieces++;

    }


    else if(
      piece.foodType === "dessert"
    ){


      dessertPieces++;

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
      action.type === "combine"
    ){


      combineCount++;

    }


    else if(
      action.type === "reduce"
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

    ones,

    meatPieces,

    vegetablePieces,

    seasoningPieces,

    dessertPieces

  };

}





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
// 新版所有判断都按：
//
// value + foodType
//
// 而不是只按 value。
// ============================================================

function analyzeCollectionPotential(
  state,
  info
){


  let directNewCollection =
    0;


  let oneReduceAway =
    0;



  const unseenSlots =
    new Set();


  const reducibleUnseenSlots =
    new Set();





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
      !isCollectibleFoodType(
        piece.foodType
      )
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
        !hasCollectionSlot(

          state,

          source,

          piece.foodType

        )
      ){


        directNewCollection++;

      }



      continue;

    }





    const boardKey =

      getSimulationCollectionKey(

        piece.value,

        piece.foodType

      );



    if(
      boardKey
      &&
      !state.collection.has(
        boardKey
      )
    ){


      unseenSlots.add(
        boardKey
      );

    }

  }





  for(
    const action
    of info.legalActions
  ){


    if(
      action.type !== "reduce"
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
      !a ||
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
      a.value / divisor;


    const nextB =
      b.value / divisor;





    if(
      isCollectibleFoodType(
        a.foodType
      )
    ){


      const keyA =

        getSimulationCollectionKey(

          a.value,

          a.foodType

        );



      if(
        nextA === 1
        &&
        keyA
        &&
        !state.collection.has(
          keyA
        )
      ){


        oneReduceAway++;

      }



      if(
        keyA
        &&
        !state.collection.has(
          keyA
        )
      ){


        reducibleUnseenSlots.add(
          keyA
        );

      }

    }





    if(
      isCollectibleFoodType(
        b.foodType
      )
    ){


      const keyB =

        getSimulationCollectionKey(

          b.value,

          b.foodType

        );



      if(
        nextB === 1
        &&
        keyB
        &&
        !state.collection.has(
          keyB
        )
      ){


        oneReduceAway++;

      }



      if(
        keyB
        &&
        !state.collection.has(
          keyB
        )
      ){


        reducibleUnseenSlots.add(
          keyB
        );

      }

    }

  }



  return {

    directNewCollection,

    oneReduceAway,

    unseenBoardValues:
      unseenSlots.size,

    unseenReducibleValues:
      reducibleUnseenSlots.size

  };

}





function countCollectionFoodTypes(
  history
){


  const counts = {

    meat:
      0,

    vegetable:
      0,

    seasoning:
      0,

    dessert:
      0

  };



  for(
    const foodType
    of history ?? []
  ){


    if(
      foodType === "meat"
    ){


      counts.meat++;

    }


    else if(
      foodType === "vegetable"
    ){


      counts.vegetable++;

    }


    else if(
      foodType === "seasoning"
    ){


      counts.seasoning++;

    }

  }



  return counts;

}





function getGlobalTypeImbalance(
  state
){


  const counts =

    countCollectionFoodTypes(

      state.collectionFoodTypeHistory

    );



  const regular = [

    counts.meat,

    counts.vegetable,

    counts.seasoning

  ];



  const max =

    Math.max(
      ...regular
    );


  const min =

    Math.min(
      ...regular
    );



  return {

    counts,

    imbalance:
      max - min

  };

}





function getSameTypeStreak(
  state
){


  const history =

    state.collectionFoodTypeHistory

    ??

    [];



  if(
    history.length === 0
  ){


    return {

      type:
        null,

      length:
        0

    };

  }



  const lastType =

    history[
      history.length - 1
    ];



  let length =
    1;



  for(
    let i = history.length - 2;
    i >= 0;
    i--
  ){


    if(
      history[i] !== lastType
    ){


      break;

    }



    length++;

  }



  return {

    type:
      lastType,

    length

  };

}





function analyzeBoardTypeCoverage(
  info
){


  const present = {

    meat:
      info.meatPieces > 0,

    vegetable:
      info.vegetablePieces > 0,

    seasoning:
      info.seasoningPieces > 0

  };



  let presentCount =
    0;



  if(
    present.meat
  ){


    presentCount++;

  }


  if(
    present.vegetable
  ){


    presentCount++;

  }


  if(
    present.seasoning
  ){


    presentCount++;

  }



  return {

    present,

    presentCount,

    missingCount:

      3 -
      presentCount

  };

}





function analyzeRecoveryPotential(
  info
){


  const hasMeat =
    info.meatPieces > 0;


  const hasVegetable =
    info.vegetablePieces > 0;


  const hasSeasoning =
    info.seasoningPieces > 0;



  let recoveryPotential =
    0;



  if(
    hasMeat &&
    hasVegetable
  ){


    recoveryPotential++;

  }



  if(
    hasVegetable &&
    hasSeasoning
  ){


    recoveryPotential++;

  }



  if(
    hasSeasoning &&
    hasMeat
  ){


    recoveryPotential++;

  }



  return recoveryPotential;

}





function scoreTypeEcology(
  state,
  info
){


  const recent =

    getCollectionBalanceState(
      state
    );



  const global =

    getGlobalTypeImbalance(
      state
    );



  const streak =

    getSameTypeStreak(
      state
    );



  const coverage =

    analyzeBoardTypeCoverage(
      info
    );



  const recoveryPotential =

    analyzeRecoveryPotential(
      info
    );



  const recentPenalty =

    recent.imbalance

    *

    RECENT_BALANCE_WEIGHT;



  const globalPenalty =

    Math.sqrt(
      global.imbalance
    )

    *

    GLOBAL_BALANCE_WEIGHT;



  const streakPenalty =

    streak.length <= 2

      ? 0

      : (
          streak.length - 2
        )

        *

        (
          streak.length - 2
        )

        *

        SAME_TYPE_STREAK_WEIGHT;



  const missingPenalty =

    coverage.missingCount

    *

    MISSING_TYPE_WEIGHT;



  const recoveryBonus =

    recoveryPotential

    *

    RECOVERY_POTENTIAL_WEIGHT;



  const allTypesBonus =

    coverage.presentCount === 3

      ? ALL_TYPES_PRESENT_BONUS

      : 0;



  const perfectRecentBonus =

    recent.imbalance === 0

    &&
    recent.meatCount > 0

    &&
    recent.vegetableCount > 0

    &&
    recent.seasoningCount > 0

      ? PERFECT_RECENT_BALANCE_BONUS

      : 0;



  return {

    recent,

    global,

    streak,

    coverage,

    recoveryPotential,

    score:

      recoveryBonus

      +

      allTypesBonus

      +

      perfectRecentBonus

      -

      recentPenalty

      -

      globalPenalty

      -

      streakPenalty

      -

      missingPenalty

  };

}





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



  const ecology =

    scoreTypeEcology(
      state,
      info
    );



  const collectionScore =

    state.collection.size

    *

    COLLECTION_SCORE;



  const directScore =

    potential.directNewCollection

    *

    320000;



  const oneReduceScore =

    potential.oneReduceAway

    *

    130000;



  const reducibleUnseenScore =

    potential.unseenReducibleValues

    *

    10000;



  const unseenScore =

    potential.unseenBoardValues

    *

    1500;



  const boardScore =

    info.reduceCount *
    150

    +

    info.empty *
    80

    +

    info.legalCount *
    20

    +

    info.ones *
    20;



  const deadPenalty =

    info.legalCount === 0

      ? 100000

      : 0;



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

    ecology.score

    +

    boardScore

    -

    deadPenalty

  );

}





function scoreState(
  state,
  mode
){


  return (

    mode ===
    SMART_AI_MODES.COLLECTION

      ? scoreCollection(
          state
        )

      : scoreSurvival(
          state
        )

  );

}





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
    rootActions.length <= 1
  ){


    return (

      rootActions[0]

      ??

      null

    );

  }



  let beam =
    [];



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





function describeAction(
  state,
  action
){


  if(
    action.type === "remove"
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

            ? ` · 收藏来源 ${piece.previousValue}`

            : ""
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
    action.type === "combine"
  ){


    return {

      type:
        "combine",

      text:

        `组合：格${aIndex + 1} ${a?.value}`

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



  let totalRemoveActions =
    0;


  let repeatCollectionRemovals =
    0;


  let repeatRemovalsSincePreviousCollection =
    0;



  const mazeTurns =
    [];


  const collectionTimeline =
    [];


  const recentActions =
    [];


  const ROUTE_WINDOW_SIZE =
    20;



  let previousCollection =

    new Set(
      state.collection
    );



  let maxCollectionImbalance =
    0;


  let totalCollectionImbalance =
    0;


  let collectionBalanceSamples =
    0;



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



    let isRepeatCollectionRemoval =
      false;


    let removedSource =
      null;


    let removedFoodType =
      null;



    if(
      action.type === "remove"
    ){


      const piece =

        state.board[
          action.index
        ];



      removedSource =

        piece?.previousValue
        ?? null;



      removedFoodType =

        piece?.foodType
        ?? null;



      totalRemoveActions++;





      if(
        removedSource != null
        &&
        isCollectibleFoodType(
          removedFoodType
        )
        &&
        hasCollectionSlot(

          state,

          removedSource,

          removedFoodType

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





    if(
      isRepeatCollectionRemoval
    ){


      repeatCollectionRemovals++;

      repeatRemovalsSincePreviousCollection++;

    }





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

      removedFoodType,

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
    // 检测首次新增收藏槽
    // ========================================================

    if(
      state.collection.size >
      previousCollection.size
    ){


      for(
        const collectionKey
        of state.collection
      ){


        if(
          previousCollection.has(
            collectionKey
          )
        ){


          continue;

        }





        const parsed =

          parseCollectionKey(
            collectionKey
          );



        if(
          !parsed
        ){


          continue;

        }



        const previousTimelineEntry =

          collectionTimeline[
            collectionTimeline.length - 1
          ]

          ?? null;



        const triggerAction =

          recentActions[
            recentActions.length - 1
          ]

          ?? null;



        const balanceState =

          getCollectionBalanceState(
            state
          );





        maxCollectionImbalance =

          Math.max(
            maxCollectionImbalance,
            balanceState.imbalance
          );



        totalCollectionImbalance +=
          balanceState.imbalance;


        collectionBalanceSamples++;





        collectionTimeline.push({

          order:
            collectionTimeline.length + 1,

          value:
            parsed.value,

          foodType:
            parsed.foodType,

          collectionKey,

          actionNumber:
            actions,

          steps:
            state.steps,

          mazeTurnCount:
            state.mazeTurnCount,



          balance: {

            meatCount:
              balanceState.meatCount,

            vegetableCount:
              balanceState.vegetableCount,

            seasoningCount:
              balanceState.seasoningCount,

            dessertCount:
              0,

            imbalance:
              balanceState.imbalance,

            dominantFoodType:
              balanceState.dominantFoodType,

            recent:

              [
                ...balanceState.recent
              ]

          },



          actionsSincePrevious:

            previousTimelineEntry

              ? actions -
                previousTimelineEntry.actionNumber

              : actions,



          stepsSincePrevious:

            previousTimelineEntry

              ? state.steps -
                previousTimelineEntry.steps

              : state.steps,



          repeatRemovalsSincePrevious:

            repeatRemovalsSincePreviousCollection,



          triggerAction,



          previousAction:

            recentActions[
              recentActions.length - 2
            ]

            ?? null,



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

                removedFoodType:
                  item.removedFoodType,

                repeatCollectionRemoval:
                  item.repeatCollectionRemoval

              })

            )

        });



        repeatRemovalsSincePreviousCollection =
          0;

      }



      previousCollection =

        new Set(
          state.collection
        );

    }





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

          ?? null,

        previousSteps:

          state.lastMazeTurn
            ?.previousSteps

          ?? null,

        beforeValues:

          state.lastMazeTurn
            ?.beforeValues

          ?? [],

        afterValues:

          state.lastMazeTurn
            ?.afterValues

          ?? [],

        beforeBoard,

        afterBoard:

          snapshotBoard(
            state
          )

      });

    }





    if(
      actions %
      yieldEvery === 0
    ){


      const balanceState =

        getCollectionBalanceState(
          state
        );



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

          ?? null,

        visitedStates:
          state.mazeVisitedCount,

        mazeTurnCount:
          state.mazeTurnCount,

        totalRemoveActions,

        repeatCollectionRemovals,

        collectionImbalance:
          balanceState.imbalance,

        collectionMeatCount:
          balanceState.meatCount,

        collectionVegetableCount:
          balanceState.vegetableCount,

        collectionSeasoningCount:
          balanceState.seasoningCount,

        collectionDessertCount:
          0

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



  const finalBalance =

    getCollectionBalanceState(
      state
    );



  const collectionFoodTypeCounts =

    countCollectionFoodTypes(

      state.collectionFoodTypeHistory

    );





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



    collectionFoodTypeHistory:

      [
        ...(
          state.collectionFoodTypeHistory
          ?? []
        )
      ],



    collectionFoodTypeCounts,



    collectionBalance: {

      meatCount:
        finalBalance.meatCount,

      vegetableCount:
        finalBalance.vegetableCount,

      seasoningCount:
        finalBalance.seasoningCount,

      dessertCount:
        0,

      imbalance:
        finalBalance.imbalance,

      dominantFoodType:
        finalBalance.dominantFoodType,

      recent:

        [
          ...finalBalance.recent
        ]

    },



    maxCollectionImbalance,



    averageCollectionImbalance:

      collectionBalanceSamples > 0

        ? totalCollectionImbalance /
          collectionBalanceSamples

        : 0,



    totalRemoveActions,

    repeatCollectionRemovals,



    averageRepeatRemovalsPerCollection:

      state.collection.size > 0

        ? repeatCollectionRemovals /
          state.collection.size

        : 0,



    collectionTimeline,

    visitedStates:
      state.mazeVisitedCount,

    mazeTurnCount:
      state.mazeTurnCount,

    mazeTurns,

    firstMazeTurn:

      mazeTurns[0]
      ?? null,

    lastMazeTurn:

      mazeTurns[
        mazeTurns.length - 1
      ]
      ?? null,

    endedNaturally,

    hitLimit:

      !endedNaturally

      &&

      actions >=
      maxActions

  };

}





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


  let totalCollectionImbalance =
    0;


  let maxCollectionImbalance =
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

              currentCollectionImbalance:
                current.collectionImbalance,

              currentCollectionMeatCount:
                current.collectionMeatCount,

              currentCollectionVegetableCount:
                current.collectionVegetableCount,

              currentCollectionSeasoningCount:
                current.collectionSeasoningCount,

              currentCollectionDessertCount:
                0,

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


    totalCollectionImbalance +=

      result.averageCollectionImbalance
      ?? 0;



    maxCollectionImbalance =

      Math.max(
        maxCollectionImbalance,
        result.maxCollectionImbalance
        ?? 0
      );



    if(
      result.steps >
      maxSteps
    ){


      maxSteps =
        result.steps;


      bestStepGame =
        game;

    }



    if(
      result.collectionCount >
      maxCollection
    ){


      maxCollection =
        result.collectionCount;


      bestCollectionGame =
        game;

    }



    if(
      result.mazeTurnCount > 0
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



    if(
      result.hitLimit
    ){


      hitLimitCount++;

    }



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

      currentCollectionImbalance:
        0,

      currentCollectionMeatCount:
        0,

      currentCollectionVegetableCount:
        0,

      currentCollectionSeasoningCount:
        0,

      currentCollectionDessertCount:
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



    averageSteps:

      totalSteps /
      safeGames,

    maxSteps,



    averageCollection:

      totalCollection /
      safeGames,

    maxCollection,



    averageCollectionImbalance:

      totalCollectionImbalance /
      safeGames,

    maxCollectionImbalance,



    totalRemoveActions,

    totalRepeatCollectionRemovals,

    averageRepeatCollectionRemovalsPerGame:

      totalRepeatCollectionRemovals /
      safeGames,

    averageRepeatRemovalsPerCollection:

      totalCollection > 0

        ? totalRepeatCollectionRemovals /
          totalCollection

        : 0,



    hitLimitCount,



    totalMazeTurns,

    averageMazeTurns:

      totalMazeTurns /
      safeGames,

    maxMazeTurns,

    mazeTurnGameCount,

    mazeTurnRate:

      mazeTurnGameCount /
      safeGames,



    firstMazeTurnGame,

    mostMazeTurnGame,

    bestStepGame,

    bestCollectionGame

  };

}