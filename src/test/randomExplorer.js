import {
  createSimulationState,
  getSimulationLegalActions,
  applySimulationAction
} from "./simulationEngine";





// ============================================================
// 随机生成开局
//
// 第1个 → 荤
// 第2个 → 素
// 第3个 → 调料
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
// 随机选择动作
// ============================================================

function randomChoice(
  actions
){


  const index =

    Math.floor(

      Math.random() *
      actions.length

    );



  return actions[
    index
  ];

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
// 解析收藏 Key
//
// 例如：
//
// "17:meat"
// "17:vegetable"
// "17:seasoning"
//
// →
//
// {
//   value: 17,
//   foodType: "meat"
// }
// ============================================================

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
  ){


    return null;

  }



  if(
    foodType !== "meat"
    &&
    foodType !== "vegetable"
    &&
    foodType !== "seasoning"
  ){


    return null;

  }



  return {

    value,

    foodType

  };

}





// ============================================================
// 分析收藏槽
//
// 返回：
//
// slotCount
//   总收藏槽数
//
// numberCount
//   至少拥有一个槽的数字数量
//
// completeNumberCount
//   荤 / 素 / 调料三个槽全部集齐的数字数量
//
// partialNumberCount
//   只收集了1～2槽的数字数量
// ============================================================

function analyzeCollection(
  collection
){


  const numberMap =
    new Map();



  for(
    const key
    of collection
  ){


    const parsed =

      parseCollectionKey(
        key
      );



    if(
      !parsed
    ){


      continue;

    }



    if(
      !numberMap.has(
        parsed.value
      )
    ){


      numberMap.set(

        parsed.value,

        new Set()

      );

    }



    numberMap
      .get(
        parsed.value
      )
      .add(
        parsed.foodType
      );

  }





  let completeNumberCount =
    0;


  let partialNumberCount =
    0;



  for(
    const types
    of numberMap.values()
  ){


    if(
      types.size === 3
    ){


      completeNumberCount++;

    }


    else if(
      types.size > 0
    ){


      partialNumberCount++;

    }

  }





  return {

    slotCount:
      collection.size,

    numberCount:
      numberMap.size,

    completeNumberCount,

    partialNumberCount

  };

}





// ============================================================
// 随机玩一局
// ============================================================

export function runRandomGame({

  maxActions = 1000

} = {}){


  const initialValues =

    createRandomInitialValues();



  const state =

    createSimulationState(
      initialValues
    );



  let actions =
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

      randomChoice(
        legalActions
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

  }





  const collection =

    Array.from(
      state.collection
    );



  const collectionStats =

    analyzeCollection(
      state.collection
    );





  return {

    initialValues,

    steps:
      state.steps,

    actions,



    // ========================================================
    // 原始收藏槽
    // ========================================================

    collection,



    // ========================================================
    // 收藏槽总数
    //
    // 17:meat + 17:vegetable = 2
    // ========================================================

    collectionCount:
      collectionStats.slotCount,



    // ========================================================
    // 已覆盖数字数量
    //
    // 17:meat + 17:vegetable = 1个数字
    // ========================================================

    collectionNumberCount:
      collectionStats.numberCount,



    // ========================================================
    // 三槽全部集齐的数字
    // ========================================================

    completeCollectionCount:
      collectionStats.completeNumberCount,



    // ========================================================
    // 尚未集齐三槽的数字
    // ========================================================

    partialCollectionCount:
      collectionStats.partialNumberCount,



    hitLimit:

      actions >=
      maxActions

  };

}





// ============================================================
// 批量随机探路
// ============================================================

export async function runRandomExplorer({

  games = 100,

  maxActionsPerGame = 1000,

  batchSize = 1000,

  onProgress = null

} = {}){


  const safeGames =

    Math.max(

      1,

      Math.floor(
        games
      )

    );



  const safeBatchSize =

    Math.max(

      1,

      Math.floor(
        batchSize
      )

    );





  let totalSteps =
    0;


  let totalCollection =
    0;


  let totalCollectionNumbers =
    0;


  let totalCompleteCollections =
    0;


  let totalPartialCollections =
    0;





  let maxSteps =
    0;


  let maxCollection =
    0;


  let maxCollectionNumbers =
    0;


  let maxCompleteCollections =
    0;





  let bestStepGame =
    null;


  let bestCollectionGame =
    null;


  let bestCompleteCollectionGame =
    null;





  let hitLimitCount =
    0;





  for(
    let gameIndex = 0;
    gameIndex < safeGames;
    gameIndex++
  ){


    const result =

      runRandomGame({

        maxActions:
          maxActionsPerGame

      });





    totalSteps +=
      result.steps;


    totalCollection +=
      result.collectionCount;


    totalCollectionNumbers +=
      result.collectionNumberCount;


    totalCompleteCollections +=
      result.completeCollectionCount;


    totalPartialCollections +=
      result.partialCollectionCount;





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





    if(
      result.collectionNumberCount >
      maxCollectionNumbers
    ){


      maxCollectionNumbers =
        result.collectionNumberCount;

    }





    if(
      result.completeCollectionCount >
      maxCompleteCollections
    ){


      maxCompleteCollections =
        result.completeCollectionCount;



      bestCompleteCollectionGame = {

        gameIndex:
          gameIndex + 1,

        ...result

      };

    }





    if(
      result.hitLimit
    ){


      hitLimitCount++;

    }





    const completed =
      gameIndex + 1;



    const shouldYield =

      completed %
      safeBatchSize === 0

      ||

      completed ===
      safeGames;



    if(
      shouldYield
    ){


      if(
        typeof onProgress ===
        "function"
      ){


        onProgress({

          completed,

          total:
            safeGames,

          maxSteps,

          maxCollection,

          maxCollectionNumbers,

          maxCompleteCollections,

          hitLimitCount

        });

      }



      await yieldToBrowser();

    }

  }





  return {

    games:
      safeGames,



    averageSteps:

      totalSteps /
      safeGames,

    maxSteps,



    // ========================================================
    // 槽数量
    // ========================================================

    averageCollection:

      totalCollection /
      safeGames,

    maxCollection,



    // ========================================================
    // 数字覆盖
    // ========================================================

    averageCollectionNumbers:

      totalCollectionNumbers /
      safeGames,

    maxCollectionNumbers,



    // ========================================================
    // 三槽完成
    // ========================================================

    averageCompleteCollections:

      totalCompleteCollections /
      safeGames,

    maxCompleteCollections,



    // ========================================================
    // 部分完成
    // ========================================================

    averagePartialCollections:

      totalPartialCollections /
      safeGames,



    hitLimitCount,



    bestStepGame,

    bestCollectionGame,

    bestCompleteCollectionGame

  };

}