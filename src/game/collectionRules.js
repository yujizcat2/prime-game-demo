import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  getMainLineage
} from "./numberOrigin";





// ============================================================
// Collection Rules
//
// V1-B 基础阶段
//
// 当前仍保持原有收藏规则不变。
//
// 新增 / 更新：
//
// 1. collectionTypeHistory
// 2. 最近6个新收藏的三系平衡计算
//
// 三系：
//
// meat
// vegetable
// seasoning
//
// dessert 暂时作为特殊类型，
// 不参与三系计数。
//
// ------------------------------------------------------------
//
// 当前 balance 只是“状态指标”。
// 暂时不会：
//
// - 禁止收藏
// - 修改得分
// - 修改合法动作
// - 修改棋盘
//
// ============================================================





// ============================================================
// 三系平衡观察窗口
// ============================================================

export const COLLECTION_BALANCE_WINDOW =
  6;





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
// 正式游戏：
// origin.parent.value
//
// Simulation：
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
// 是否能够形成收藏
//
// V1-B 当前不增加额外收藏资格。
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
// 获取收藏类型历史
// ============================================================

export function getCollectionTypeHistory(
  state
){


  if(
    !Array.isArray(
      state?.collectionTypeHistory
    )
  ){


    return [];

  }



  return [

    ...state.collectionTypeHistory

  ];

}





// ============================================================
// 计算最近收藏的三系平衡状态
//
// ------------------------------------------------------------
//
// 最近6个首次新收藏。
//
// 统计：
//
// meat
// vegetable
// seasoning
//
// dessert：
//
// 会占据窗口位置，
// 但不计入三系数量。
//
// ------------------------------------------------------------
//
// imbalance：
//
// maxCount - minCount
//
// ------------------------------------------------------------
//
// 例1：
//
// meat       = 2
// vegetable  = 2
// seasoning  = 2
//
// imbalance = 0
//
// ------------------------------------------------------------
//
// 例2：
//
// meat       = 3
// vegetable  = 2
// seasoning  = 1
//
// imbalance = 2
//
// ------------------------------------------------------------
//
// 例3：
//
// dessert x6
//
// meat       = 0
// vegetable  = 0
// seasoning  = 0
//
// imbalance   = 0
// regularCount = 0
//
// 这不是“真正平衡”，
// 所以后续 AI / 防御规则必须同时看 regularCount。
// ============================================================

export function getCollectionBalanceState(
  state
){


  const history =

    getCollectionTypeHistory(
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


  let dessertCount =
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
      foodType ===
      "vegetable"
    ){


      vegetableCount++;

    }



    else if(
      foodType ===
      "seasoning"
    ){


      seasoningCount++;

    }



    else if(
      foodType ===
      "dessert"
    ){


      dessertCount++;

    }

  }





  const regularCount =

    meatCount

    +

    vegetableCount

    +

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





  // ==========================================================
  // 主导类型
  //
  // 如果存在并列最高，则 dominantType = null。
  // ==========================================================

  let dominantType =
    null;



  const maxTypes = [];



  if(
    meatCount ===
    maxCount
  ){


    maxTypes.push(
      "meat"
    );

  }



  if(
    vegetableCount ===
    maxCount
  ){


    maxTypes.push(
      "vegetable"
    );

  }



  if(
    seasoningCount ===
    maxCount
  ){


    maxTypes.push(
      "seasoning"
    );

  }



  if(
    maxTypes.length === 1
    &&
    maxCount > 0
  ){


    dominantType =
      maxTypes[0];

  }





  // ==========================================================
  // 三系参与率
  //
  // 0 ~ 1
  //
  // 6个窗口全部是常规三系：
  //
  // regularParticipation = 1
  //
  // 全甜：
  //
  // regularParticipation = 0
  // ==========================================================

  const regularParticipation =

    recent.length > 0

      ?

        regularCount /
        recent.length

      :

        0;





  return {

    windowSize:
      COLLECTION_BALANCE_WINDOW,

    recentCount:
      recent.length,

    recent,





    meatCount,

    vegetableCount,

    seasoningCount,

    dessertCount,





    regularCount,

    regularParticipation,





    maxCount,

    minCount,

    imbalance,

    dominantType

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



  if(
    value == null
  ){


    return state;

  }





  const isFirstTime =

    !state.collection.has(
      value
    );





  state.collection.add(
    value
  );





  // ==========================================================
  // 首次新收藏才记录真实类型
  // ==========================================================

  if(
    isFirstTime
  ){


    if(
      !Array.isArray(
        state.collectionTypeHistory
      )
    ){


      state.collectionTypeHistory =
        [];

    }



    state.collectionTypeHistory.push(

      piece.foodType

      ??

      null

    );

  }





  return state;

}





// ============================================================
// 正式游戏收藏
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


  let nextCollectionTypeHistory =

    getCollectionTypeHistory(
      state
    );





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





    // ========================================================
    // 首次收藏真实类型历史
    // ========================================================

    nextCollectionTypeHistory = [

      ...nextCollectionTypeHistory,

      piece.foodType

      ??

      null

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

    collectionTypeHistory:
      nextCollectionTypeHistory,

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


    return applyGameCollection(

      state,

      piece

    );

  }





  return state;

}