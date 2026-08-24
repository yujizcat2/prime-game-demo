import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  getMainLineage
} from "./numberOrigin";





// ============================================================
// Collection Rules
//
// V0 Unified
//
// 同时兼容：
//
// 1. 正式 Game Engine
//
//    collection = Array
//    来源 = piece.origin.parent
//
// 2. Simulation Engine
//
//    collection = Set
//    来源 = piece.previousValue
//
// ------------------------------------------------------------
//
// 当前版本只统一架构。
// 不改变任何收藏规则。
// ============================================================





// ============================================================
// 是否为正式游戏收藏状态
// ============================================================

function isGameCollectionState(
  state
){


  return Array.isArray(
    state?.collection
  );

}





// ============================================================
// 是否为 Simulation 收藏状态
// ============================================================

function isSimulationCollectionState(
  state
){


  return (

    state?.collection
    instanceof Set

  );

}





// ============================================================
// 获取正式游戏收藏来源记录
//
// 正式游戏：
//
// 1
// ↓
// origin.type === "reduce"
// ↓
// origin.parent
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
// 获取收藏值
//
// 同时兼容：
//
// 正式游戏
// origin.parent.value
//
// Simulation
// previousValue
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





  // ==========================================================
  // 正式游戏
  // ==========================================================

  const record =

    getCollectionRecord(
      piece
    );



  if(
    record?.value != null
  ){


    return record.value;

  }





  // ==========================================================
  // Simulation
  // ==========================================================

  if(
    piece.previousValue != null
  ){


    return piece.previousValue;

  }





  return null;

}





// ============================================================
// 是否能够形成收藏
//
// V0 不增加任何新资格。
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



  return (

    getCollectionValue(
      piece
    )

    != null

  );

}





// ============================================================
// Simulation 收藏
//
// Simulation Engine 本身使用可变 state。
//
// 所以这里保持原行为：
//
// state.collection.add(value)
//
// 返回同一个 state。
// ============================================================

function applySimulationCollection(
  state,
  piece
){


  const value =

    getCollectionValue(
      piece
    );



  if(
    value == null
  ){


    return state;

  }



  state.collection.add(
    value
  );



  return state;

}





// ============================================================
// 正式游戏收藏
//
// 保持原 gameEngine removeOne() 的完整行为：
//
// collection
// collectionOrigins
// collectionPaths
// latestCollection
// score
// ============================================================

function applyGameCollection(
  state,
  piece
){


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


  let nextLatestCollection =

    state.latestCollection

    ??

    null;





  // ==========================================================
  // 是否首次收藏
  // ==========================================================

  const isFirstTime =

    !state.collection.includes(
      discoveredValue
    );





  // ==========================================================
  // 收藏来源
  // ==========================================================

  const oldOrigins =

    nextCollectionOrigins[
      discoveredValue
    ]

    ??

    [];



  nextCollectionOrigins = {

    ...nextCollectionOrigins,

    [discoveredValue]: [

      ...oldOrigins,

      previousRecord

    ]

  };





  // ==========================================================
  // 收藏路径
  // ==========================================================

  const mainLineage =

    getMainLineage(
      previousRecord
    );



  const oldPaths =

    nextCollectionPaths[
      discoveredValue
    ]

    ??

    [];



  const latestPathIndex =
    oldPaths.length;



  nextCollectionPaths = {

    ...nextCollectionPaths,

    [discoveredValue]: [

      ...oldPaths,

      mainLineage

    ]

  };





  // ==========================================================
  // 最新收藏
  // ==========================================================

  nextLatestCollection = {

    value:
      discoveredValue,

    index:
      latestPathIndex

  };





  // ==========================================================
  // 首次收藏
  // ==========================================================

  if(
    isFirstTime
  ){


    const newNumberCount =

      state.collection.length + 1;



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
  // 重复收藏
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

    collectionOrigins:
      nextCollectionOrigins,

    collectionPaths:
      nextCollectionPaths,

    latestCollection:
      nextLatestCollection,

    score:
      nextScore

  };

}





// ============================================================
// 应用收藏
//
// 自动判断当前属于：
//
// 正式游戏
//
// 或
//
// Simulation
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





  // ==========================================================
  // Simulation
  // ==========================================================

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





  // ==========================================================
  // 正式游戏
  // ==========================================================

  if(
    isGameCollectionState(
      state
    )
  ){


    return applyGameCollection(

      state,

      piece

    );

  }





  return state;

}