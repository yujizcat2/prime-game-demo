// ============================================================
// 料理迷宫
//
// mazeHistory.js
//
// 负责：
//
// 1. 定义“第二层规则状态”
// 2. 生成规则状态 Key
// 3. 创建本局迷宫历史
// 4. 判断某个规则状态是否曾经出现
// 5. 记录规则状态
// 6. 返回重复状态的信息
//
// ------------------------------------------------------------
//
// 重要原则：
//
// 迷宫历史只关心：
//
// “从现在这个状态继续玩，
//  哪些当前数据会影响未来规则？”
//
// 不追踪完整祖先历史。
//
// ------------------------------------------------------------
//
// 包含：
//
// board position
// value
// foodType
// purity
// parents
// parentFoods
// 当前1的待收藏来源
// collection
// 最近6个首次收藏食物类型
//
// ------------------------------------------------------------
//
// 不包含：
//
// id
// nextId
// steps
// score
// actions
// UI状态
// 动画状态
// latestCollection
// collectionOrigins
// collectionPaths
// 完整 origin 祖先树
//
// ============================================================





// ============================================================
// 收藏食物类型状态窗口
//
// 必须和 collectionRules.js 当前 V1 保持一致。
//
// 当前 V1：
//
// 最近6个首次新收藏
//
// 用于未来三系失衡判断。
// ============================================================

const COLLECTION_FOOD_TYPE_HISTORY_WINDOW =
  6;





// ============================================================
// 获取 collection 数组
//
// 正式 gameEngine：Array
//
// Simulation / 测试中有可能使用：Set
//
// 因此这里统一兼容。
// ============================================================

function normalizeCollection(
  collection
){


  if(
    Array.isArray(
      collection
    )
  ){


    return [
      ...collection
    ];

  }



  if(
    collection instanceof Set
  ){


    return Array.from(
      collection
    );

  }



  return [];

}





// ============================================================
// 排序收藏
//
// collection 的顺序不影响未来规则。
// ============================================================

function createCollectionSnapshot(
  collection
){


  return normalizeCollection(
    collection
  )
    .sort(
      (
        a,
        b
      ) =>
        a - b
    );

}





// ============================================================
// 创建收藏食物类型历史快照
//
// 当前 V1 只关心：
//
// 最近6个首次新收藏类型。
// ============================================================

function createCollectionFoodTypeHistorySnapshot(
  history
){


  if(
    !Array.isArray(
      history
    )
  ){


    return [];

  }



  return history.slice(
    -COLLECTION_FOOD_TYPE_HISTORY_WINDOW
  );

}





// ============================================================
// 获取一个1当前“待处理的收藏来源”
// ============================================================

function getPendingDiscoveryValue(
  piece
){


  if(
    !piece
  ){


    return null;

  }



  if(
    piece.value !== 1
  ){


    return null;

  }



  if(
    piece.origin?.type !==
    "reduce"
  ){


    return (

      piece.previousValue
      ?? null

    );

  }



  return (

    piece.origin
      ?.parent
      ?.value

    ??

    piece.previousValue

    ??

    null

  );

}





// ============================================================
// 标准化 parents
// ============================================================

function createParentsSnapshot(
  piece
){


  if(
    !Array.isArray(
      piece?.parents
    )
  ){


    return null;

  }



  return [

    ...piece.parents

  ];

}





// ============================================================
// 标准化 parentFoods
//
// parentFoods 会参与：
//
// 不能与自己的真正父母再次组合
// 已存在同父母孩子禁止再次生成
//
// 当前规则判断食物身份主要使用：
//
// value
// foodType
//
// purity 当前虽然不参与身份判断，
// 但保留以便以后规则扩展。
// ============================================================

function createParentFoodsSnapshot(
  piece
){


  if(
    !Array.isArray(
      piece?.parentFoods
    )
  ){


    return null;

  }



  return piece.parentFoods.map(

    food => {


      if(
        !food
      ){


        return null;

      }



      return {

        value:
          food.value
          ?? null,

        foodType:
          food.foodType
          ?? null,

        purity:
          food.purity
          ?? null

      };

    }

  );

}





// ============================================================
// 创建单个棋子的第二层规则快照
// ============================================================

export function createMazePieceSnapshot(
  piece,
  index
){


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
      piece.foodType
      ?? null,

    drinkOriginValue:
      piece.drinkOriginValue
      ?? null,


    purity:
      piece.purity
      ?? null,


    sourceKey:
      piece.sourceKey
      ?? null,


    parents:

      createParentsSnapshot(
        piece
      ),


    parentFoods:

      createParentFoodsSnapshot(
        piece
      ),


    pendingDiscoveryValue:

      getPendingDiscoveryValue(
        piece
      ),

    specialOne: piece.specialOne ? {
      kind: piece.specialOne.kind,
      keyType: piece.specialOne.keyType ?? null,
      identity: piece.specialOne.identity,
      sourceTypes: [...(piece.specialOne.sourceTypes ?? [])]
    } : null

  };

}





// ============================================================
// 创建整个棋盘的第二层规则快照
// ============================================================

export function createMazeBoardSnapshot(
  board
){


  if(
    !Array.isArray(
      board
    )
  ){


    return [];

  }



  return board.map(

    (
      piece,
      index
    ) =>

      createMazePieceSnapshot(

        piece,

        index

      )

  );

}





// ============================================================
// 创建完整第二层规则状态
//
// 这是「迷宫回转」真正比较的对象。
// ============================================================

export function createMazeRuleState(
  state
){


  return {

    board:

      createMazeBoardSnapshot(
        state?.board
      ),


    collection:

      createCollectionSnapshot(
        state?.collection
      ),


    collectionFoodTypeHistory:

      createCollectionFoodTypeHistorySnapshot(

        state?.collectionFoodTypeHistory

      ),

    usedCombinationPairs:
      [...(state?.usedCombinationPairs??[])].sort(),

    usedKeyTriggerValues:
      [...(state?.usedKeyTriggerValues??[])].sort((a,b)=>a-b),

    combineHistoryKeys:
      Object.keys(state?.combineHistoryKeys ?? {}).sort(),

    eightPalaceKeys:
      Object.keys(state?.eightPalaceKeys ?? {})
        .filter(foodType => Boolean(state.eightPalaceKeys[foodType]))
        .sort()

  };

}





// ============================================================
// 生成第二层规则状态 Key
// ============================================================

export function createMazeStateKey(
  state
){


  return JSON.stringify(

    createMazeRuleState(
      state
    )

  );

}





// ============================================================
// 比较两个状态
// ============================================================

export function isSameMazeState(
  stateA,
  stateB
){


  return (

    createMazeStateKey(
      stateA
    )

    ===

    createMazeStateKey(
      stateB
    )

  );

}





// ============================================================
// 创建一条迷宫历史记录
// ============================================================

export function createMazeHistoryEntry(

  state,

  {

    sequence = 0,

    steps = null,

    reason = "normal"

  } = {}

){


  return {

    key:

      createMazeStateKey(
        state
      ),


    sequence,


    steps:

      steps
      ?? state?.steps
      ?? 0,


    reason

  };

}





// ============================================================
// 创建迷宫历史
//
// 初始状态必须立即记录。
// ============================================================

export function createMazeHistory(
  initialState
){


  if(
    !initialState
  ){


    return {

      entries:
        [],

      nextSequence:
        0,

      turnCount:
        0

    };

  }



  const firstEntry =

    createMazeHistoryEntry(

      initialState,

      {

        sequence:
          0,

        reason:
          "initial"

      }

    );



  return {

    entries: [

      firstEntry

    ],

    nextSequence:
      1,

    turnCount:
      0

  };

}





// ============================================================
// 防御性读取 entries
// ============================================================

function getHistoryEntries(
  history
){


  if(
    !history ||
    !Array.isArray(
      history.entries
    )
  ){


    return [];

  }



  return history.entries;

}





// ============================================================
// 根据 Key 查找曾经访问的状态
// ============================================================

export function findMazeHistoryEntryByKey(
  history,
  key
){


  if(
    !key
  ){


    return null;

  }



  return (

    getHistoryEntries(
      history
    )
      .find(

        entry =>

          entry?.key ===
          key

      )

    ??

    null

  );

}





// ============================================================
// 查找当前状态是否曾经访问
// ============================================================

export function findVisitedMazeState(
  history,
  state
){


  if(
    !state
  ){


    return null;

  }



  const key =

    createMazeStateKey(
      state
    );



  return findMazeHistoryEntryByKey(

    history,

    key

  );

}





// ============================================================
// 当前状态是否曾经出现
// ============================================================

export function hasVisitedMazeState(
  history,
  state
){


  return (

    findVisitedMazeState(
      history,
      state
    )

    !==

    null

  );

}





// ============================================================
// 记录一个新的规则状态
// ============================================================

export function recordMazeState(

  history,

  state,

  {

    reason = "normal"

  } = {}

){


  if(
    !state
  ){


    return history;

  }



  const safeHistory =

    history

    ?? {

      entries:
        [],

      nextSequence:
        0,

      turnCount:
        0

    };



  const entries =

    getHistoryEntries(
      safeHistory
    );



  const sequence =

    safeHistory.nextSequence
    ?? entries.length;



  const entry =

    createMazeHistoryEntry(

      state,

      {

        sequence,

        reason

      }

    );



  return {

    ...safeHistory,

    entries: [

      ...entries,

      entry

    ],

    nextSequence:
      sequence + 1

  };

}





// ============================================================
// 记录迷宫回转次数
// ============================================================

export function incrementMazeTurnCount(
  history
){


  const safeHistory =

    history

    ?? {

      entries:
        [],

      nextSequence:
        0,

      turnCount:
        0

    };



  return {

    ...safeHistory,

    turnCount:

      (
        safeHistory.turnCount
        ?? 0
      )

      +

      1

  };

}





// ============================================================
// 检查当前状态是否触发迷宫回转
// ============================================================

export function checkMazeReturn(
  history,
  state
){


  if(
    !state
  ){


    return {

      repeated:
        false,

      key:
        null,

      previous:
        null

    };

  }



  const key =

    createMazeStateKey(
      state
    );



  const previous =

    findMazeHistoryEntryByKey(

      history,

      key

    );



  return {

    repeated:

      previous !==
      null,

    key,

    previous

  };

}





// ============================================================
// 获取迷宫已记录状态数量
// ============================================================

export function getMazeHistorySize(
  history
){


  return getHistoryEntries(
    history
  ).length;

}





// ============================================================
// 获取迷宫回转次数
// ============================================================

export function getMazeTurnCount(
  history
){


  return (

    history?.turnCount
    ?? 0

  );

}





// ============================================================
// 清空并重新建立迷宫历史
// ============================================================

export function resetMazeHistory(
  state
){


  return createMazeHistory(
    state
  );

}





// ============================================================
// 调试：取得所有已访问 Key
// ============================================================

export function getMazeHistoryKeys(
  history
){


  return getHistoryEntries(
    history
  )
    .map(

      entry =>
        entry.key

    );

}
