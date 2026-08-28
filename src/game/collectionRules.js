import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  getMainLineage
} from "./numberOrigin";

import {
  getBasePrice,
  getCurrentPrice,
  getLiquidity,
  getRepeatPenalty,
  getTrend
} from "./price";

import {
  getFatiguedFirstReward,
  getFatiguedRepeatPenalty
} from "./actionFatigue";
import { getFoodName } from "../data/food/foodRegistry";


export function settleMoneyChanges(startingMoney, intendedChanges) {
  let available = startingMoney + intendedChanges.reduce(
    (sum, change) => sum + Math.max(0, change),
    0
  );

  const actualChanges = intendedChanges.map(change => {
    if(change >= 0){
      return change;
    }

    const deduction = Math.min(available, Math.abs(change));
    available -= deduction;
    return -deduction;
  });

  return {
    actualChanges,
    money: Math.max(0, startingMoney + actualChanges.reduce((sum, change) => sum + change, 0))
  };
}





// ============================================================
// 正式收藏食物类型
// ============================================================

export const COLLECTIBLE_FOOD_TYPES = [
  "land", "aquatic", "vegetable", "grainBean", "dairyEgg",
  "fruit", "seasoning", "spice", "drink", "meat"

];





export const COLLECTION_BALANCE_WINDOW =
  6;





// ============================================================
// 类型判断
// ============================================================

export function isCollectibleFoodType(
  foodType
){


  return COLLECTIBLE_FOOD_TYPES.includes(
    foodType
  );

}





// ============================================================
// Simulation 收藏 Key
// ============================================================

export function getSimulationCollectionKey(
  value,
  foodType
){


  if(
    value == null ||
    !isCollectibleFoodType(
      foodType
    )
  ){


    return null;

  }



  return `${value}:${foodType}`;

}





// ============================================================
// 正式游戏 / Simulation 状态判断
// ============================================================

function isGameCollectionState(
  state
){


  return Array.isArray(
    state?.collection
  );

}





function isSimulationCollectionState(
  state
){


  return (

    state?.collection
    instanceof Set

  );

}





// ============================================================
// 获取正式收藏来源
// ============================================================

export function getCollectionRecord(
  piece
){


  if(
    !piece ||
    piece.value !== 1
  ){


    return null;

  }



  if(
    piece.origin?.type !==
    "reduce"
  ){


    return null;

  }



  return (

    piece.origin.parent

    ??

    null

  );

}





// ============================================================
// 获取收藏数字
// ============================================================

export function getCollectionValue(
  piece
){


  if(
    !piece ||
    piece.value !== 1
  ){


    return null;

  }



  const record =

    getCollectionRecord(
      piece
    );



  if(
    record?.value != null
  ){


    return record.value;

  }



  if(
    piece.previousValue != null
  ){


    return piece.previousValue;

  }



  return null;

}





// ============================================================
// 是否允许收藏
// ============================================================

export function canCollect(
  state,
  piece
){


  if(
    !state
  ){


    return false;

  }



  if(
    !isGameCollectionState(
      state
    )
    &&
    !isSimulationCollectionState(
      state
    )
  ){


    return false;

  }



  if(
    !isCollectibleFoodType(
      piece?.foodType
    )
  ){


    return false;

  }



  return (

    getCollectionValue(
      piece
    )

    != null

  );

}





// ============================================================
// 收藏类型历史
// ============================================================

export function getCollectionFoodTypeHistory(
  state
){


  if(
    !Array.isArray(
      state?.collectionFoodTypeHistory
    )
  ){


    return [];

  }



  return [

    ...state.collectionFoodTypeHistory

  ];

}





// ============================================================
// 获取路径槽
// ============================================================

export function getCollectionSlots(
  state,
  value
){


  const slots =

    state?.collectionPaths?.[
      value
    ];



  if(
    !slots ||
    Array.isArray(
      slots
    )
  ){


    return {

      meat:
        null,

      vegetable:
        null,

      seasoning:
        null

    };

  }



  return {

    meat:
      slots.meat
      ?? null,

    vegetable:
      slots.vegetable
      ?? null,

    seasoning:
      slots.seasoning
      ?? null

  };

}





// ============================================================
// 是否已有某槽
// ============================================================

export function hasCollectionSlot(
  state,
  value,
  foodType
){


  if(
    !isCollectibleFoodType(
      foodType
    )
  ){


    return false;

  }



  const slots =

    getCollectionSlots(
      state,
      value
    );



  return Boolean(
    slots[foodType]
  );

}





// ============================================================
// 已收藏槽数量
// ============================================================

export function getCollectionSlotCount(
  state,
  value
){


  const slots =

    getCollectionSlots(
      state,
      value
    );



  let count =
    0;



  if(
    slots.meat
  ){
    count++;
  }



  if(
    slots.vegetable
  ){
    count++;
  }



  if(
    slots.seasoning
  ){
    count++;
  }



  return count;

}





export function isCollectionComplete(
  state,
  value
){


  return (

    getCollectionSlotCount(
      state,
      value
    )

    ===

    3

  );

}





export function getTotalCollectionSlotCount(
  state
){


  if(
    !Array.isArray(
      state?.collection
    )
  ){


    return 0;

  }



  let total =
    0;



  for(
    const value
    of state.collection
  ){


    total +=

      getCollectionSlotCount(
        state,
        value
      );

  }



  return total;

}





export function getCompletedCollectionCount(
  state
){


  if(
    !Array.isArray(
      state?.collection
    )
  ){


    return 0;

  }



  let total =
    0;



  for(
    const value
    of state.collection
  ){


    if(
      isCollectionComplete(
        state,
        value
      )
    ){


      total++;

    }

  }



  return total;

}





// ============================================================
// 三系平衡
// ============================================================

export function getCollectionBalanceState(
  state
){


  const history =

    getCollectionFoodTypeHistory(
      state
    );



  const recent =

    history.slice(
      -COLLECTION_BALANCE_WINDOW
    );



  let meatCount =
    0;


  let vegetableCount =
    0;


  let seasoningCount =
    0;



  for(
    const foodType
    of recent
  ){


    if(
      foodType === "meat"
    ){
      meatCount++;
    }


    else if(
      foodType === "vegetable"
    ){
      vegetableCount++;
    }


    else if(
      foodType === "seasoning"
    ){
      seasoningCount++;
    }

  }





  const regularCount =

    meatCount +
    vegetableCount +
    seasoningCount;



  const counts = [

    meatCount,

    vegetableCount,

    seasoningCount

  ];



  const maxCount =

    Math.max(
      ...counts
    );



  const minCount =

    Math.min(
      ...counts
    );



  const imbalance =

    maxCount -
    minCount;



  let dominantFoodType =
    null;



  const maxTypes =
    [];



  if(
    meatCount === maxCount
  ){
    maxTypes.push("meat");
  }



  if(
    vegetableCount === maxCount
  ){
    maxTypes.push("vegetable");
  }



  if(
    seasoningCount === maxCount
  ){
    maxTypes.push("seasoning");
  }



  if(
    maxTypes.length === 1 &&
    maxCount > 0
  ){


    dominantFoodType =
      maxTypes[0];

  }



  return {

    windowSize:
      COLLECTION_BALANCE_WINDOW,

    recentCount:
      recent.length,

    recent,

    meatCount,

    vegetableCount,

    seasoningCount,

    dessertCount:
      0,

    regularCount,

    regularParticipation:

      recent.length > 0

        ? regularCount /
          recent.length

        : 0,

    maxCount,

    minCount,

    imbalance,

    dominantFoodType

  };

}





// ============================================================
// Simulation 收藏
// ============================================================

function applySimulationCollection(
  state,
  piece
){


  const value =

    getCollectionValue(
      piece
    );



  const foodType =

    piece?.foodType

    ??

    null;



  if(
    value == null ||
    !isCollectibleFoodType(
      foodType
    )
  ){


    return state;

  }



  const key =

    getSimulationCollectionKey(

      value,

      foodType

    );



  if(
    !key
  ){


    return state;

  }



  if(
    state.forceSameSourceRepeat
    ||
    state.collection.has(key)
  ){

    const sameSourceRepeat = state.forceSameSourceRepeat === true;

    const currentPrice = getCurrentPrice(
      value,
      state.collectionPricingBoard ?? state.board,
      state.collectionPricingTrend ?? state.trend ?? 1
    );
    const fatigueCount = state.actionFatigue?.fatigueCount ?? 0;
    const fatigueRate = state.actionFatigue?.fatigueRate ?? 0;
    const penalty = getFatiguedRepeatPenalty(currentPrice, fatigueRate);
    const fatigueExtraLoss = penalty - getRepeatPenalty(currentPrice);
    const actualPenalty = state.deferCollectionMoney
      ? penalty
      : Math.min(state.money ?? 0, penalty);

    if(state.deferCollectionMoney){
      state.deferredMoneyChanges.push(-penalty);
    }
    else{
      state.money = Math.max(0, (state.money ?? 0) - penalty);
    }


    state.latestCollectionReward =
      -actualPenalty;

    state.lastCollectionEvents?.push({
      value,
      foodType,
      sourceKey: piece?.sourceKey ?? null,
      sameSource: state.collectionBatchSameSource === true,
      reward: -actualPenalty,
      first: false,
      sameSourceRepeat,
      price: currentPrice,
      penalty,
      actionSignature: state.actionFatigue?.signature ?? null,
      fatigueCount,
      fatigueRate,
      fatigueExtraLoss,
      trendBefore: state.collectionPricingTrend ?? state.trend ?? 1,
      trendAfter: state.collectionPricingTrend ?? state.trend ?? 1
    });


    return state;

  }



  const isFirstNumber =
    !(state.collectionNumbers ?? new Set()).has(value);


  const currentPrice =
    getCurrentPrice(
      value,
      state.collectionPricingBoard ?? state.board,
      state.collectionPricingTrend ?? state.trend ?? 1
    );

  const fatigueCount = state.actionFatigue?.fatigueCount ?? 0;
  const fatigueRate = state.actionFatigue?.fatigueRate ?? 0;
  const reward = getFatiguedFirstReward(currentPrice, fatigueRate);


  const trendBefore =
    state.collectionPricingTrend ?? state.trend ?? 1;


  if(state.deferCollectionMoney){
    state.deferredMoneyChanges.push(reward);
  }
  else{
    state.money = (state.money ?? 0) + reward;
  }


  state.latestCollectionReward =
    reward;


  if(!(state.collectionNumbers instanceof Set)){
    state.collectionNumbers = new Set();
  }


  if(isFirstNumber){
    state.collectionNumbers.add(value);

    if(state.deferCollectionTrend){
      state.deferredFirstCollections.push(value);
    }
    else{
      state.trend = getTrend(state.previousCollection, value);
      state.previousCollection = value;
    }
  }


  state.lastCollectionEvents?.push({
    value,
    foodType,
    sourceKey: piece?.sourceKey ?? null,
    sameSource: state.collectionBatchSameSource === true,
    reward,
    first: true,
    base: getBasePrice(value),
    liquidity: getLiquidity(value, state.collectionPricingBoard ?? state.board),
    trendBefore,
    trendAfter: state.trend ?? 1,
    price: currentPrice,
    actionSignature: state.actionFatigue?.signature ?? null,
    fatigueCount,
    fatigueRate,
    fatigueExtraLoss: currentPrice - reward
  });


  state.collection.add(
    key
  );



  if(
    !Array.isArray(
      state.collectionFoodTypeHistory
    )
  ){


    state.collectionFoodTypeHistory =
      [];

  }



  state.collectionFoodTypeHistory.push(
    foodType
  );



  return state;

}





// ============================================================
// 父母快照
//
// 注意：
//
// 收藏数字本身是 previousRecord。
// 所以父母应读取 previousRecord.parents / parentFoods，
// 而不是读取已经变成1的 piece.parents。
// ============================================================

function createCollectionParentSnapshot(
  previousRecord
){


  if(
    !previousRecord
  ){


    return {

      parents:
        null,

      parentFoods:
        null

    };

  }



  const parents =

    Array.isArray(
      previousRecord.parents
    )

      ? [
          ...previousRecord.parents
        ]

      : null;



  const parentFoods =

    Array.isArray(
      previousRecord.parentFoods
    )

      ? previousRecord.parentFoods.map(

          parent => ({

            value:
              parent.value,

            foodType:
              parent.foodType
              ?? null,

            purity:
              parent.purity
              ?? null

          })

        )

      : null;



  return {

    parents,

    parentFoods

  };

}





// ============================================================
// 正式游戏收藏
// ============================================================

function applyGameCollection(
  state,
  piece
){


  const foodType =

    piece?.foodType

    ??

    null;



  if(
    !isCollectibleFoodType(
      foodType
    )
  ){


    return state;

  }



  const previousRecord =

    getCollectionRecord(
      piece
    );



  if(
    !previousRecord
  ){


    return state;

  }



  const discoveredValue =

    previousRecord.value

    ??

    null;



  if(
    discoveredValue === null
  ){


    return state;

  }





  // ==========================================================
  // 当前数字是否首次出现
  // ==========================================================

  const isFirstNumber =

    !state.collection.includes(
      discoveredValue
    );





  // ==========================================================
  // 当前路径槽
  // ==========================================================

  const existingPaths =

    state.collectionPaths?.[
      discoveredValue
    ]

    ??

    {};



  const normalizedPaths =

    existingPaths &&
    !Array.isArray(
      existingPaths
    )

      ? existingPaths

      : {};





  // ==========================================================
  // 同数字 + 同类型已经收藏
  //
  // 不覆盖任何首次数据。
  // ==========================================================

  if(
    state.forceSameSourceRepeat
    ||
    normalizedPaths[foodType]
  ){

    const sameSourceRepeat = state.forceSameSourceRepeat === true;

    const currentPrice = getCurrentPrice(
      discoveredValue,
      state.collectionPricingBoard ?? state.board,
      state.collectionPricingTrend ?? state.trend ?? 1
    );
    const fatigueCount = state.actionFatigue?.fatigueCount ?? 0;
    const fatigueRate = state.actionFatigue?.fatigueRate ?? 0;
    const penalty = getFatiguedRepeatPenalty(currentPrice, fatigueRate);
    const actualPenalty = state.deferCollectionMoney
      ? penalty
      : Math.min(state.money ?? 0, penalty);


    return {

      ...state,

      score:

        state.score

        +

        SCORE_CONFIG.REPEAT_SCORE,

      latestCollection: {
        value: discoveredValue,
        foodType,
        reward: -actualPenalty,
        isFirstNumber: false,
        sameSourceRepeat,
        actionSignature: state.actionFatigue?.signature ?? null,
        fatigueCount,
        fatigueRate,
        fatigueExtraLoss: penalty - getRepeatPenalty(currentPrice),
        trendFrom: null,
        eventId: (state.collectionEventId ?? 0) + 1
      },

      collectionEventId:
        (state.collectionEventId ?? 0) + 1,

      money:
        state.deferCollectionMoney
          ? (state.money ?? 0)
          : Math.max(0, (state.money ?? 0) - penalty),

      deferredMoneyChanges:
        state.deferCollectionMoney
          ? [...(state.deferredMoneyChanges ?? []), -penalty]
          : (state.deferredMoneyChanges ?? [])

    };

  }





  let nextScore =
    state.score;



  let nextCollection =
    state.collection;



  let nextCollectionOrigins =

    state.collectionOrigins

    ??

    {};



  let nextCollectionPaths =

    state.collectionPaths

    ??

    {};



  let nextCollectionParents =

    state.collectionParents

    ??

    {};



  let nextCollectionFoodTypeHistory =

    getCollectionFoodTypeHistory(
      state
    );





  // ==========================================================
  // 来源槽
  // ==========================================================

  const oldOrigins =

    nextCollectionOrigins[
      discoveredValue
    ];



  const normalizedOrigins =

    oldOrigins &&
    !Array.isArray(
      oldOrigins
    )

      ? oldOrigins

      : {};





  nextCollectionOrigins = {

    ...nextCollectionOrigins,

    [discoveredValue]: {

      ...normalizedOrigins,

      [foodType]:
        previousRecord

    }

  };





  // ==========================================================
  // 路径槽
  // ==========================================================

  const mainLineage =

    getMainLineage(
      previousRecord
    );



  nextCollectionPaths = {

    ...nextCollectionPaths,

    [discoveredValue]: {

      ...normalizedPaths,

      [foodType]:
        mainLineage

    }

  };





  // ==========================================================
  // 父母槽
  //
  // 每个 foodType 独立保存第一次收藏的父母。
  // ==========================================================

  const oldParents =

    nextCollectionParents[
      discoveredValue
    ];



  const normalizedParents =

    oldParents &&
    !Array.isArray(
      oldParents
    )

      ? oldParents

      : {};



  const parentSnapshot =

    createCollectionParentSnapshot(
      previousRecord
    );



  nextCollectionParents = {

    ...nextCollectionParents,

    [discoveredValue]: {

      ...normalizedParents,

      [foodType]:
        parentSnapshot

    }

  };





  // ==========================================================
  // 最新新槽
  // ==========================================================

  const currentPrice =
    getCurrentPrice(
      discoveredValue,
      state.collectionPricingBoard ?? state.board,
      state.collectionPricingTrend ?? state.trend ?? 1
    );

  const fatigueCount = state.actionFatigue?.fatigueCount ?? 0;
  const fatigueRate = state.actionFatigue?.fatigueRate ?? 0;

  const nextLatestCollection = {

    value:
      discoveredValue,

    foodType,

    reward:
      getFatiguedFirstReward(currentPrice, fatigueRate),

    price:
      currentPrice,

    actionSignature:
      state.actionFatigue?.signature ?? null,

    fatigueCount,

    fatigueRate,

    fatigueExtraLoss:
      currentPrice - getFatiguedFirstReward(currentPrice, fatigueRate),

    isFirstNumber,

    trendFrom:
      isFirstNumber &&
      state.previousCollection != null &&
      discoveredValue < state.previousCollection
        ? state.previousCollection
        : null,

    eventId:
      (state.collectionEventId ?? 0) + 1

  };





  // ==========================================================
  // 新槽历史
  // ==========================================================

  nextCollectionFoodTypeHistory = [

    ...nextCollectionFoodTypeHistory,

    foodType

  ];





  // ==========================================================
  // 第一次发现这个数字
  // ==========================================================

  if(
    isFirstNumber
  ){


    const newNumberCount =

      state.collection.length

      +

      1;



    const discoveryScore =

      newNumberCount

      *

      SCORE_CONFIG.NEW_NUMBER_GROWTH;



    nextScore =

      state.score

      +

      discoveryScore;



    nextCollection = [

      ...state.collection,

      discoveredValue

    ];

  }





  // ==========================================================
  // 同数字的新类型槽
  // ==========================================================

  else{


    nextScore =

      state.score

      +

      SCORE_CONFIG.REPEAT_SCORE;

  }





  return {

    ...state,

    collection:
      nextCollection,

    collectionFoodTypeHistory:
      nextCollectionFoodTypeHistory,

    collectionOrigins:
      nextCollectionOrigins,

    collectionPaths:
      nextCollectionPaths,

    collectionParents:
      nextCollectionParents,

    latestCollection:
      nextLatestCollection,

    collectionEventId:
      nextLatestCollection.eventId,

    score:
      nextScore,

    money:
      state.deferCollectionMoney
        ? (state.money ?? 0)
        : (state.money ?? 0) + nextLatestCollection.reward,

    deferredMoneyChanges:
      state.deferCollectionMoney
        ? [...(state.deferredMoneyChanges ?? []), nextLatestCollection.reward]
        : (state.deferredMoneyChanges ?? []),

    previousCollection:
      isFirstNumber && !state.deferCollectionTrend
        ? discoveredValue
        : (state.previousCollection ?? null),

    trend:
      isFirstNumber && !state.deferCollectionTrend
        ? getTrend(state.previousCollection, discoveredValue)
        : (state.trend ?? 1),

    deferredFirstCollections:
      isFirstNumber && state.deferCollectionTrend
        ? [...(state.deferredFirstCollections ?? []), discoveredValue]
        : (state.deferredFirstCollections ?? [])

  };

}





// ============================================================
// 应用收藏
// ============================================================

export function applyCollection(
  state,
  piece
){


  if(
    !canCollect(
      state,
      piece
    )
  ){


    return state;

  }



  if(
    isSimulationCollectionState(
      state
    )
  ){


    return applySimulationCollection(

      state,

      piece

    );

  }



  if(
    isGameCollectionState(
      state
    )
  ){


    const nextState = applyGameCollection(state, piece);
    const snapshot = getCollectionRecord(piece);
    if(!snapshot) return nextState;
    const eventId = nextState.collectionEventId ?? ((state.collectionEventId ?? 0) + 1);
    return {
      ...nextState,
      collectionTimeline: [
        ...(state.collectionTimeline ?? []),
        {
          ...structuredClone(snapshot),
          eventId,
          step: state.steps ?? null,
          name: getFoodName(snapshot.value, snapshot.foodType),
          reducePath: getMainLineage(snapshot)
        }
      ]
    };

  }



  return state;

}


// ============================================================
// 同一次操作产生的收藏统一结算
// ============================================================

export function applyCollections(
  state,
  pieces,
  pricingBoard = state?.board
){
  if(!state || !Array.isArray(pieces) || pieces.length === 0){
    return state;
  }

  const lockedTrend = state.trend ?? 1;
  const startingPrevious = state.previousCollection ?? null;
  const startingMoney = state.money ?? 0;

  let nextState = {
    ...state,
    collectionPricingBoard: pricingBoard,
    collectionPricingTrend: lockedTrend,
    deferCollectionTrend: true,
    deferredFirstCollections: [],
    deferCollectionMoney: true,
    deferredMoneyChanges: []
  };

  const sameSourceTwins =
    pieces.length === 2
    && getCollectionValue(pieces[0]) === getCollectionValue(pieces[1])
    && pieces[0]?.sourceKey != null
    && pieces[0].sourceKey === pieces[1]?.sourceKey;

  nextState.collectionBatchSameSource = sameSourceTwins;

  for(let index = 0; index < pieces.length; index++){
    const piece = pieces[index];
    nextState = {
      ...nextState,
      forceSameSourceRepeat: sameSourceTwins && index === 1
    };
    nextState = applyCollection(nextState, piece);
  }

  let nextPrevious = startingPrevious;
  let nextTrend = lockedTrend;

  for(const value of nextState.deferredFirstCollections ?? []){
    nextTrend = getTrend(nextPrevious, value);
    nextPrevious = value;
  }

  const moneySettlement = settleMoneyChanges(
    startingMoney,
    nextState.deferredMoneyChanges ?? []
  );

  if(Array.isArray(nextState.lastCollectionEvents)){
    nextState.lastCollectionEvents = nextState.lastCollectionEvents.map(
      (event, index) => {
        const actualReward = moneySettlement.actualChanges[index] ?? event.reward;
        const fatigueExtraLoss = event.first
          ? Math.max(0, (event.price ?? 0) - actualReward)
          : Math.max(0, Math.abs(actualReward) - getRepeatPenalty(event.price ?? 0));

        return {
          ...event,
          reward: actualReward,
          fatigueExtraLoss,
          trendAfter: nextTrend
        };
      }
    );
  }

  if(nextState.latestCollection && moneySettlement.actualChanges.length > 0){
    nextState.latestCollection = {
      ...nextState.latestCollection,
      reward: moneySettlement.actualChanges[moneySettlement.actualChanges.length - 1]
    };
  }

  if(moneySettlement.actualChanges.length > 0){
    nextState.latestCollectionReward =
      moneySettlement.actualChanges[moneySettlement.actualChanges.length - 1];
  }

  const {
    collectionPricingBoard: _pricingBoard,
    collectionPricingTrend: _pricingTrend,
    deferCollectionTrend: _deferTrend,
    deferredFirstCollections: _deferredFirstCollections,
    deferCollectionMoney: _deferMoney,
    deferredMoneyChanges: _deferredMoneyChanges,
    forceSameSourceRepeat: _forceSameSourceRepeat,
    collectionBatchSameSource: _collectionBatchSameSource,
    actionFatigue: _actionFatigue,
    ...settledState
  } = nextState;

  return {
    ...settledState,
    money: moneySettlement.money,
    previousCollection: nextPrevious,
    trend: nextTrend
  };
}
