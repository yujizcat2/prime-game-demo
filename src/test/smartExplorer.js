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

import {
  FOOD_TYPES,
  getDessertMutationFoodType
} from "../game/rules";





export const SMART_AI_MODES = {

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection",

  MONEY:
    "money"

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


  if(typeof window === "undefined"){

    return Promise.resolve();

  }


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
// 分析某个 reduce 动作会自动收藏什么
//
// 新核心：
//
// result === 1
// → 自动收藏约分前的 value + foodType
//
//
// 返回：
//
// [
//   {
//     value,
//     foodType,
//     key,
//     alreadyCollected
//   }
// ]
//
// 最多两个。
// ============================================================

function analyzeReduceAutoCollections(
  state,
  action
){


  if(
    !state ||
    !action ||
    action.type !== "reduce"
  ){


    return [];

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


    return [];

  }



  const divisor =

    gcdSimple(
      a.value,
      b.value
    );



  if(
    divisor <= 1
  ){


    return [];

  }



  const nextA =

    a.value /
    divisor;



  const nextB =

    b.value /
    divisor;

  let aFoodType = a.foodType;
  let bFoodType = b.foodType;

  if(a.foodType === FOOD_TYPES.DESSERT && nextA === 1){
    bFoodType = getDessertMutationFoodType(b.foodType) ?? b.foodType;
  }

  if(b.foodType === FOOD_TYPES.DESSERT && nextB === 1){
    aFoodType = getDessertMutationFoodType(a.foodType) ?? a.foodType;
  }



  const events =
    [];



  if(
    nextA === 1
    &&
    isCollectibleFoodType(
      aFoodType
    )
  ){


    const key =

      getSimulationCollectionKey(

        a.value,

        aFoodType

      );



    if(
      key
    ){


      events.push({

        value:
          a.value,

        foodType:
          aFoodType,

        key,

        alreadyCollected:

          state.collection.has(
            key
          )

      });

    }

  }



  if(
    nextB === 1
    &&
    isCollectibleFoodType(
      bFoodType
    )
  ){


    const key =

      getSimulationCollectionKey(

        b.value,

        bFoodType

      );



    if(
      key
    ){


      events.push({

        value:
          b.value,

        foodType:
          bFoodType,

        key,

        alreadyCollected:

          state.collection.has(
            key
          )

      });

    }

  }



  return events;

}





// ============================================================
// 基础局面分析
// ============================================================

function analyzeState(
  state
){


  let empty =
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

    // ========================================================
    // 兼容旧评分字段。
    //
    // 新系统正常棋盘不存在1。
    // ========================================================

    ones:
      0,

    meatPieces,

    vegetablePieces,

    seasoningPieces,

    dessertPieces

  };

}





// ============================================================
// 生存 AI 评分
//
// 新版不再奖励棋盘上的1。
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

  );

}





// ============================================================
// 收藏潜力分析
//
// 新核心：
//
// “一步内自动收藏”
// 直接来自合法 reduce。
// ============================================================

function analyzeCollectionPotential(
  state,
  info
){


  // ==========================================================
  // 下一步可以获得多少个新槽
  // ==========================================================

  let directNewCollection =
    0;



  // ==========================================================
  // 有多少约分动作可以直接通向收藏
  // ==========================================================

  let oneReduceAway =
    0;

  let directRepeatCollection =
    0;



  const unseenSlots =
    new Set();


  const reducibleUnseenSlots =
    new Set();



  // ==========================================================
  // 当前棋盘上还未收藏的槽
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
      !isCollectibleFoodType(
        piece.foodType
      )
    ){


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





  // ==========================================================
  // 查看每个合法约分动作
  // ==========================================================

  for(
    const action
    of info.legalActions
  ){


    if(
      action.type !== "reduce"
    ){


      continue;

    }



    const autoCollections =

      analyzeReduceAutoCollections(
        state,
        action
      );



    let actionHasNewCollection =
      false;



    for(
      const event
      of autoCollections
    ){


      if(
        !event.alreadyCollected
      ){


        directNewCollection++;

        actionHasNewCollection =
          true;


        reducibleUnseenSlots.add(
          event.key
        );

      }

      else {

        directRepeatCollection++;

      }

    }



    if(
      actionHasNewCollection
    ){


      oneReduceAway++;

    }

  }



  return {

    directNewCollection,

    oneReduceAway,

    directRepeatCollection,

    unseenBoardValues:
      unseenSlots.size,

    unseenReducibleValues:
      reducibleUnseenSlots.size

  };

}





// ============================================================
// 收藏类型计数
// ============================================================

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





// ============================================================
// 收藏 AI 评分
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



  const ecology =

    scoreTypeEcology(
      state,
      info
    );



  const collectionScore =

    state.collection.size

    *

    COLLECTION_SCORE;



  // ==========================================================
  // 现在 directNewCollection 表示：
  //
  // 合法约分下一步能够自动获得的新槽数量。
  // ==========================================================

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



// ============================================================
// Collection mode uses a lexicographic objective. This prevents a long route
// of small repeat rewards from overtaking a route that actually adds a slot.
// ============================================================

function getRepeatedTypeStreak(state){

  const history = state.collectionEventHistory ?? [];
  const last = history[history.length - 1];

  if(!last || !last.repeated){
    return 0;
  }

  let length = 0;

  for(let index = history.length - 1; index >= 0; index--){
    const event = history[index];

    if(!event.repeated || event.foodType !== last.foodType){
      break;
    }

    length++;
  }

  return length;
}



function getTypeScarcityGain(state, rootState){

  const rootCounts = getGlobalTypeImbalance(rootState).counts;
  const minimum = Math.min(
    rootCounts.meat,
    rootCounts.vegetable,
    rootCounts.seasoning
  );

  let gain = 0;

  for(const key of state.collection){
    if(rootState.collection.has(key)){
      continue;
    }

    const slot = parseCollectionKey(key);

    if(slot){
      gain += Math.max(0, minimum + 1 - rootCounts[slot.foodType]);
    }
  }

  return gain;
}



function createCollectionRank(state, rootState){

  const info = analyzeState(state);
  const potential = analyzeCollectionPotential(state, info);
  const newSlots = state.collection.size - rootState.collection.size;
  const alive = info.legalCount > 0 ? 1 : 0;
  const repeatDelta =
    (state.repeatCollectionCount ?? 0) -
    (rootState.repeatCollectionCount ?? 0);

  // A slot that immediately ends the route is not treated as progress over a
  // living route that can still reach one. The raw gain remains the next key.
  const sustainableNewSlots = Math.max(
    0,
    newSlots - (alive ? 0 : 1)
  );

  return [
    sustainableNewSlots,
    newSlots,
    potential.directNewCollection,
    potential.unseenReducibleValues,
    potential.unseenBoardValues,
    getTypeScarcityGain(state, rootState),
    alive,
    -repeatDelta,
    -potential.directRepeatCollection,
    -getRepeatedTypeStreak(state),
    scoreCollection(state)
  ];
}


function createMoneyRank(state){
  const info = analyzeState(state);
  const potential = analyzeCollectionPotential(state, info);

  return [
    state.money ?? 0,
    potential.directNewCollection,
    potential.unseenReducibleValues,
    info.legalCount > 0 ? 1 : 0,
    info.reduceCount,
    info.empty
  ];
}



function compareRanks(left, right){

  const length = Math.max(left.length, right.length);

  for(let index = 0; index < length; index++){
    const difference = (right[index] ?? 0) - (left[index] ?? 0);

    if(difference !== 0){
      return difference;
    }
  }

  return 0;
}



function createNodeScore(state, mode, rootState){

  if(mode === SMART_AI_MODES.MONEY){
    return createMoneyRank(state);
  }

  return mode === SMART_AI_MODES.COLLECTION
    ? createCollectionRank(state, rootState)
    : [scoreSurvival(state)];
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

    +

    `#${state.money ?? 0}:${state.previousCollection ?? ""}:${state.trend ?? 1}`

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

        createNodeScore(
          nextState,
          mode,
          state
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

      compareRanks(a.score, b.score)

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

            createNodeScore(
              nextState,
              mode,
              state
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

        compareRanks(a.score, b.score)

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

      compareRanks(a.score, b.score)

  );



  return (

    beam[0]?.firstAction

    ??

    rootActions[0]

  );

}



export const collectionAITestUtils = {
  analyzeReduceAutoCollections,
  createCollectionRank,
  compareRanks,
  chooseSmartAction,
  createMoneyRank
};





// ============================================================
// 棋盘 Snapshot
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
          ?? null,

        sourceKey:
          piece.sourceKey
          ?? null

      };

    }

  );

}





// ============================================================
// 动作说明
//
// 新版 reduce 会把自动收藏直接写在同一动作。
// ============================================================

function describeAction(
  state,
  action
){


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



  const autoCollections =

    analyzeReduceAutoCollections(
      state,
      action
    );



  const autoText =

    autoCollections.length > 0

      ?

        " · 自动收藏 "

        +

        autoCollections
          .map(

            event =>

              `${event.value}:${event.foodType}`

          )
          .join(
            " / "
          )

      :

        "";



  return {

    type:
      "reduce",

    text:

      `约分：格${aIndex + 1} ${a?.value}`

      +

      ` ↔ 格${bIndex + 1} ${b?.value}`

      +

      autoText

  };

}





// ============================================================
// 单局 Smart AI
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
    null,

  initialValues:
    suppliedInitialValues = null

} = {}){


  const initialValues =

    suppliedInitialValues ?? createRandomInitialValues();



  const state =

    createSimulationState(
      initialValues
    );



  let actions =
    0;



  // ==========================================================
  // 新版统计
  // ==========================================================

  let totalAutoCollectionEvents =
    0;


  let repeatAutoCollections =
    0;


  let repeatAutoCollectionsSincePreviousCollection =
    0;



  const mazeTurns =
    [];


  const collectionTimeline =
    [];


  const recentActions =
    [];


  const actionHistory =
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



    // ========================================================
    // 在执行 reduce 前先判断：
    //
    // 本次会自动收藏哪些槽，
    // 其中哪些是重复旧槽。
    // ========================================================

    const autoCollectionEvents =

      analyzeReduceAutoCollections(
        state,
        action
      );



    let repeatAutoCollectionCount =
      0;



    for(
      const event
      of autoCollectionEvents
    ){


      totalAutoCollectionEvents++;



      if(
        event.alreadyCollected
      ){


        repeatAutoCollections++;

        repeatAutoCollectionCount++;

        repeatAutoCollectionsSincePreviousCollection++;

      }

    }



    const beforeTurnCount =
      state.mazeTurnCount;



    const beforeBoard =

      snapshotBoard(
        state
      );


    const moneyBefore =
      state.money ?? 0;


    const inputValues =
      action.indexes.map(index => state.board[index]?.value ?? null);


    const inputSourceKeys =
      action.indexes.map(index => state.board[index]?.sourceKey ?? null);



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


    const afterBoard =
      snapshotBoard(state);


    const resultValues =
      action.type === "reduce"
        ? (() => {
            const divisor = gcdSimple(inputValues[0], inputValues[1]);
            return inputValues.map(value => value / divisor);
          })()
        : afterBoard
            .filter((piece, index) => beforeBoard[index]?.empty && !piece.empty)
            .map(piece => piece.value);


    actionHistory.push({
      step: state.steps,
      actionNumber: actions,
      type: description.type,
      inputValues,
      inputSourceKeys,
      resultValues,
      boardAfter: afterBoard.filter(piece => !piece.empty).map(piece => piece.value),
      moneyBefore,
      money: state.money ?? 0,
      moneyGain: (state.money ?? 0) - moneyBefore,
      collections:
        action.type === "reduce"
          ? (state.lastCollectionEvents ?? []).map(event => ({...event}))
          : []
    });





    recentActions.push({

      actionNumber:
        actions,

      steps:
        state.steps,

      type:
        description.type,

      text:
        description.text,

      autoCollections:

        autoCollectionEvents.map(

          event => ({

            value:
              event.value,

            foodType:
              event.foodType,

            alreadyCollected:
              event.alreadyCollected

          })

        ),

      repeatAutoCollectionCount,

      // ======================================================
      // 旧字段兼容
      //
      // 等 TestLab 改完可以删除。
      // ======================================================

      removedSource:
        null,

      removedFoodType:
        null,

      repeatCollectionRemoval:

        repeatAutoCollectionCount > 0,

      beforeBoard,

      afterBoard:
        afterBoard

    });





    if(
      recentActions.length >
      ROUTE_WINDOW_SIZE
    ){


      recentActions.shift();

    }





    // ========================================================
    // 检测新增收藏槽
    //
    // 一次 reduce 可能同时新增两个槽。
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



          // ==================================================
          // 新字段
          // ==================================================

          repeatAutoCollectionsSincePrevious:

            repeatAutoCollectionsSincePreviousCollection,



          // ==================================================
          // 旧字段兼容
          // ==================================================

          repeatRemovalsSincePrevious:

            repeatAutoCollectionsSincePreviousCollection,



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

                autoCollections:
                  item.autoCollections,

                repeatAutoCollectionCount:
                  item.repeatAutoCollectionCount,

                // 兼容旧 TestLab
                removedSource:
                  null,

                removedFoodType:
                  null,

                repeatCollectionRemoval:
                  item.repeatCollectionRemoval

              })

            )

        });



        repeatAutoCollectionsSincePreviousCollection =
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





    // ========================================================
    // Progress
    // ========================================================

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

        money:
          state.money ?? 0,

        firstCollectionCount:
          state.collectionNumbers?.size ?? 0,

        lastCollection:

          collectionTimeline[
            collectionTimeline.length - 1
          ]

          ?? null,

        visitedStates:
          state.mazeVisitedCount,

        mazeTurnCount:
          state.mazeTurnCount,



        totalAutoCollectionEvents,

        repeatAutoCollections,



        // ====================================================
        // 旧字段兼容
        // ====================================================

        totalRemoveActions:
          totalAutoCollectionEvents,

        repeatCollectionRemovals:
          repeatAutoCollections,



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

    money:
      state.money ?? 0,

    firstCollectionCount:
      state.collectionNumbers?.size ?? 0,

    lastFirstCollection:
      state.previousCollection ?? null,

    finalTrend:
      state.trend ?? 1,



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

        ?

          totalCollectionImbalance /
          collectionBalanceSamples

        :

          0,



    // ========================================================
    // 新统计
    // ========================================================

    totalAutoCollectionEvents,

    repeatAutoCollections,

    averageRepeatAutoCollectionsPerCollection:

      state.collection.size > 0

        ?

          repeatAutoCollections /
          state.collection.size

        :

          0,



    // ========================================================
    // 旧字段兼容
    //
    // 等 TestLab.jsx 改完后可删除。
    // ========================================================

    totalRemoveActions:
      totalAutoCollectionEvents,

    repeatCollectionRemovals:
      repeatAutoCollections,

    averageRepeatRemovalsPerCollection:

      state.collection.size > 0

        ?

          repeatAutoCollections /
          state.collection.size

        :

          0,



    collectionTimeline,

    actionHistory,

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





// ============================================================
// 多局 Smart Explorer
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


  let totalMoney = 0;
  let totalFirstCollection = 0;
  let maxMoney = 0;
  let minMoney = Infinity;
  let maxFirstCollection = 0;
  let deadGameCount = 0;


  let totalCollection =
    0;


  let totalMazeTurns =
    0;


  let totalAutoCollectionEvents =
    0;


  let totalRepeatAutoCollections =
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


  let bestMoneyGame =
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

              currentMoney:
                current.money,

              currentFirstCollection:
                current.firstCollectionCount,

              currentLastCollection:
                current.lastCollection,

              currentVisitedStates:
                current.visitedStates,

              currentMazeTurns:
                current.mazeTurnCount,



              currentAutoCollectionEvents:
                current.totalAutoCollectionEvents,

              currentRepeatAutoCollections:
                current.repeatAutoCollections,



              // =================================================
              // 旧字段兼容
              // =================================================

              currentRemoveActions:
                current.totalAutoCollectionEvents,

              currentRepeatCollectionRemovals:
                current.repeatAutoCollections,



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


    totalMoney += result.money ?? 0;
    totalFirstCollection += result.firstCollectionCount ?? 0;
    minMoney = Math.min(minMoney, result.money ?? 0);
    maxFirstCollection = Math.max(maxFirstCollection, result.firstCollectionCount ?? 0);

    if((result.money ?? 0) > maxMoney || !bestMoneyGame){
      maxMoney = result.money ?? 0;
      bestMoneyGame = game;
    }

    if(result.endedNaturally){
      deadGameCount++;
    }


    totalCollection +=
      result.collectionCount;


    totalMazeTurns +=
      result.mazeTurnCount;


    totalAutoCollectionEvents +=
      result.totalAutoCollectionEvents;


    totalRepeatAutoCollections +=
      result.repeatAutoCollections;


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

      currentMoney:
        0,

      currentFirstCollection:
        0,

      currentLastCollection:
        null,

      currentVisitedStates:
        0,

      currentMazeTurns:
        0,

      currentAutoCollectionEvents:
        0,

      currentRepeatAutoCollections:
        0,

      // 旧字段
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

    averageMoney:
      totalMoney / safeGames,

    maxMoney,

    minMoney:
      Number.isFinite(minMoney) ? minMoney : 0,

    averageFirstCollection:
      totalFirstCollection / safeGames,

    maxFirstCollection,

    reachedStepLimitCount:
      hitLimitCount,

    deadGameCount,

    maxSteps,



    averageCollection:

      totalCollection /
      safeGames,

    maxCollection,



    averageCollectionImbalance:

      totalCollectionImbalance /
      safeGames,

    maxCollectionImbalance,



    // ========================================================
    // 新统计
    // ========================================================

    totalAutoCollectionEvents,

    totalRepeatAutoCollections,

    averageRepeatAutoCollectionsPerGame:

      totalRepeatAutoCollections /
      safeGames,

    averageRepeatAutoCollectionsPerCollection:

      totalCollection > 0

        ?

          totalRepeatAutoCollections /
          totalCollection

        :

          0,



    // ========================================================
    // 旧 TestLab 兼容
    // ========================================================

    totalRemoveActions:
      totalAutoCollectionEvents,

    totalRepeatCollectionRemovals:
      totalRepeatAutoCollections,

    averageRepeatCollectionRemovalsPerGame:

      totalRepeatAutoCollections /
      safeGames,

    averageRepeatRemovalsPerCollection:

      totalCollection > 0

        ?

          totalRepeatAutoCollections /
          totalCollection

        :

          0,



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

    bestCollectionGame,

    bestMoneyGame

  };

}
