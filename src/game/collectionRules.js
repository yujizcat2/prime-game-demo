import {
  SCORE_CONFIG
} from "./scoreConfig";

import {
  getMainLineage
} from "./numberOrigin";





// ============================================================
// 正式收藏动物类型
// ============================================================

export const COLLECTIBLE_ANIMAL_TYPES = [

  "dog",

  "cat",

  "mammal"

];





export const COLLECTION_BALANCE_WINDOW =
  6;





// ============================================================
// 类型判断
// ============================================================

export function isCollectibleAnimalType(
  animalType
){


  return COLLECTIBLE_ANIMAL_TYPES.includes(
    animalType
  );

}





// ============================================================
// Simulation 收藏 Key
// ============================================================

export function getSimulationCollectionKey(
  value,
  animalType
){


  if(
    value == null ||
    !isCollectibleAnimalType(
      animalType
    )
  ){


    return null;

  }



  return `${value}:${animalType}`;

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
    !isCollectibleAnimalType(
      piece?.animalType
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

export function getCollectionAnimalTypeHistory(
  state
){


  if(
    !Array.isArray(
      state?.collectionAnimalTypeHistory
    )
  ){


    return [];

  }



  return [

    ...state.collectionAnimalTypeHistory

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

      dog:
        null,

      cat:
        null,

      mammal:
        null

    };

  }



  return {

    dog:
      slots.dog
      ?? null,

    cat:
      slots.cat
      ?? null,

    mammal:
      slots.mammal
      ?? null

  };

}





// ============================================================
// 是否已有某槽
// ============================================================

export function hasCollectionSlot(
  state,
  value,
  animalType
){


  if(
    !isCollectibleAnimalType(
      animalType
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
    slots[animalType]
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
    slots.dog
  ){
    count++;
  }



  if(
    slots.cat
  ){
    count++;
  }



  if(
    slots.mammal
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

    getCollectionAnimalTypeHistory(
      state
    );



  const recent =

    history.slice(
      -COLLECTION_BALANCE_WINDOW
    );



  let dogCount =
    0;


  let catCount =
    0;


  let mammalCount =
    0;



  for(
    const animalType
    of recent
  ){


    if(
      animalType === "dog"
    ){
      dogCount++;
    }


    else if(
      animalType === "cat"
    ){
      catCount++;
    }


    else if(
      animalType === "mammal"
    ){
      mammalCount++;
    }

  }





  const regularCount =

    dogCount +
    catCount +
    mammalCount;



  const counts = [

    dogCount,

    catCount,

    mammalCount

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



  let dominantAnimalType =
    null;



  const maxTypes =
    [];



  if(
    dogCount === maxCount
  ){
    maxTypes.push("dog");
  }



  if(
    catCount === maxCount
  ){
    maxTypes.push("cat");
  }



  if(
    mammalCount === maxCount
  ){
    maxTypes.push("mammal");
  }



  if(
    maxTypes.length === 1 &&
    maxCount > 0
  ){


    dominantAnimalType =
      maxTypes[0];

  }



  return {

    windowSize:
      COLLECTION_BALANCE_WINDOW,

    recentCount:
      recent.length,

    recent,

    dogCount,

    catCount,

    mammalCount,

    birdCount:
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

    dominantAnimalType

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



  const animalType =

    piece?.animalType

    ??

    null;



  if(
    value == null ||
    !isCollectibleAnimalType(
      animalType
    )
  ){


    return state;

  }



  const key =

    getSimulationCollectionKey(

      value,

      animalType

    );



  if(
    !key
  ){


    return state;

  }



  if(
    state.collection.has(
      key
    )
  ){


    return state;

  }



  state.collection.add(
    key
  );



  if(
    !Array.isArray(
      state.collectionAnimalTypeHistory
    )
  ){


    state.collectionAnimalTypeHistory =
      [];

  }



  state.collectionAnimalTypeHistory.push(
    animalType
  );



  return state;

}





// ============================================================
// 父母快照
//
// 注意：
//
// 收藏数字本身是 previousRecord。
// 所以父母应读取 previousRecord.parents / parentAnimals，
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

      parentAnimals:
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



  const parentAnimals =

    Array.isArray(
      previousRecord.parentAnimals
    )

      ? previousRecord.parentAnimals.map(

          parent => ({

            value:
              parent.value,

            animalType:
              parent.animalType
              ?? null,

            purity:
              parent.purity
              ?? null

          })

        )

      : null;



  return {

    parents,

    parentAnimals

  };

}





// ============================================================
// 正式游戏收藏
// ============================================================

function applyGameCollection(
  state,
  piece
){


  const animalType =

    piece?.animalType

    ??

    null;



  if(
    !isCollectibleAnimalType(
      animalType
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
    normalizedPaths[
      animalType
    ]
  ){


    return {

      ...state,

      score:

        state.score

        +

        SCORE_CONFIG.REPEAT_SCORE

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



  let nextCollectionAnimalTypeHistory =

    getCollectionAnimalTypeHistory(
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

      [animalType]:
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

      [animalType]:
        mainLineage

    }

  };





  // ==========================================================
  // 父母槽
  //
  // 每个 animalType 独立保存第一次收藏的父母。
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

      [animalType]:
        parentSnapshot

    }

  };





  // ==========================================================
  // 最新新槽
  // ==========================================================

  const nextLatestCollection = {

    value:
      discoveredValue,

    animalType

  };





  // ==========================================================
  // 新槽历史
  // ==========================================================

  nextCollectionAnimalTypeHistory = [

    ...nextCollectionAnimalTypeHistory,

    animalType

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

    collectionAnimalTypeHistory:
      nextCollectionAnimalTypeHistory,

    collectionOrigins:
      nextCollectionOrigins,

    collectionPaths:
      nextCollectionPaths,

    collectionParents:
      nextCollectionParents,

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