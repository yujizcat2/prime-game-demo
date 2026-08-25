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
  getCollectionBalanceState
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
// 基础局面分析
// ============================================================

function analyzeState(
  state
){


  let empty =
    0;


  let ones =
    0;


  let dogPieces =
    0;


  let catPieces =
    0;


  let mammalPieces =
    0;


  let birdPieces =
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
      piece.animalType === "dog"
    ){


      dogPieces++;

    }


    else if(
      piece.animalType === "cat"
    ){


      catPieces++;

    }


    else if(
      piece.animalType === "mammal"
    ){


      mammalPieces++;

    }


    else if(
      piece.animalType === "bird"
    ){


      birdPieces++;

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

    dogPieces,

    catPieces,

    mammalPieces,

    birdPieces

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





function countCollectionAnimalTypes(
  history
){


  const counts = {

    dog:
      0,

    cat:
      0,

    mammal:
      0,

    bird:
      0

  };



  for(
    const animalType
    of history ?? []
  ){


    if(
      animalType === "dog"
    ){


      counts.dog++;

    }


    else if(
      animalType === "cat"
    ){


      counts.cat++;

    }


    else if(
      animalType === "mammal"
    ){


      counts.mammal++;

    }


    else if(
      animalType === "bird"
    ){


      counts.bird++;

    }

  }



  return counts;

}





function getGlobalTypeImbalance(
  state
){


  const counts =

    countCollectionAnimalTypes(

      state.collectionAnimalTypeHistory

    );



  const regular = [

    counts.dog,

    counts.cat,

    counts.mammal

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

    state.collectionAnimalTypeHistory

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

    dog:
      info.dogPieces > 0,

    cat:
      info.catPieces > 0,

    mammal:
      info.mammalPieces > 0

  };



  let presentCount =
    0;



  if(
    present.dog
  ){


    presentCount++;

  }


  if(
    present.cat
  ){


    presentCount++;

  }


  if(
    present.mammal
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


  const hasDog =
    info.dogPieces > 0;


  const hasCat =
    info.catPieces > 0;


  const hasMammal =
    info.mammalPieces > 0;



  let recoveryPotential =
    0;



  if(
    hasDog &&
    hasCat
  ){


    recoveryPotential++;

  }



  if(
    hasCat &&
    hasMammal
  ){


    recoveryPotential++;

  }



  if(
    hasMammal &&
    hasDog
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
    recent.dogCount > 0

    &&
    recent.catCount > 0

    &&
    recent.mammalCount > 0

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

        animalType:
          piece.animalType,

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


    let removedAnimalType =
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



      removedAnimalType =

        piece?.animalType
        ?? null;



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

      removedAnimalType,

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

          value,

          animalType:

            triggerAction
              ?.removedAnimalType

            ?? null,

          actionNumber:
            actions,

          steps:
            state.steps,

          mazeTurnCount:
            state.mazeTurnCount,



          balance: {

            dogCount:
              balanceState.dogCount,

            catCount:
              balanceState.catCount,

            mammalCount:
              balanceState.mammalCount,

            birdCount:
              balanceState.birdCount,

            imbalance:
              balanceState.imbalance,

            dominantAnimalType:
              balanceState.dominantAnimalType,

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

                removedAnimalType:
                  item.removedAnimalType,

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

        collectionDogCount:
          balanceState.dogCount,

        collectionCatCount:
          balanceState.catCount,

        collectionMammalCount:
          balanceState.mammalCount,

        collectionBirdCount:
          balanceState.birdCount

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



  const collectionAnimalTypeCounts =

    countCollectionAnimalTypes(

      state.collectionAnimalTypeHistory

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



    collectionAnimalTypeHistory:

      [
        ...(
          state.collectionAnimalTypeHistory
          ?? []
        )
      ],



    collectionAnimalTypeCounts,



    collectionBalance: {

      dogCount:
        finalBalance.dogCount,

      catCount:
        finalBalance.catCount,

      mammalCount:
        finalBalance.mammalCount,

      birdCount:
        finalBalance.birdCount,

      imbalance:
        finalBalance.imbalance,

      dominantAnimalType:
        finalBalance.dominantAnimalType,

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

              currentCollectionDogCount:
                current.collectionDogCount,

              currentCollectionCatCount:
                current.collectionCatCount,

              currentCollectionMammalCount:
                current.collectionMammalCount,

              currentCollectionBirdCount:
                current.collectionBirdCount,

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

      currentCollectionDogCount:
        0,

      currentCollectionCatCount:
        0,

      currentCollectionMammalCount:
        0,

      currentCollectionBirdCount:
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