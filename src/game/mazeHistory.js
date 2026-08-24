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
// 因此：
//
// [2, 3, 5]
//
// 与
//
// [5, 2, 3]
//
// 在第二层规则状态中视为一样。
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
// 获取一个1当前“待处理的收藏来源”
//
// 正式规则：
//
// 只有 reduce 产生的 1
// 在处理时才可能形成收藏。
//
// removeOne() 实际读取：
//
// piece.origin.type
// piece.origin.parent.value
//
// 因此这部分会影响下一步结果，
// 必须进入第二层规则状态。
//
// ------------------------------------------------------------
//
// 注意：
//
// 我们只保存真正影响规则的：
//
// parent.value
//
// 不保存整棵 origin 历史树。
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


    // ========================================================
    // simulationEngine 当前可能使用 previousValue
    //
    // 这里顺便兼容测试模型。
    // ========================================================

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
//
// parents 当前只保存直接父母数字。
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
// 不能与自己的真正父母再次合成
// 已存在同父母孩子禁止再次生成
//
// 因此属于第二层规则状态。
//
// ------------------------------------------------------------
//
// 当前规则判断料理身份主要使用：
//
// value
// foodType
//
// purity 当前虽然不参与 isSameFoodIdentity，
// 但保留下来，避免未来纯度规则扩展后遗漏。
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


    // ========================================================
    // 当前数字
    // ========================================================

    value:
      piece.value,


    // ========================================================
    // 当前料理类型
    // ========================================================

    foodType:
      piece.foodType
      ?? null,


    // ========================================================
    // 当前纯度
    // ========================================================

    purity:
      piece.purity
      ?? null,


    // ========================================================
    // 当前直接父母
    // ========================================================

    parents:

      createParentsSnapshot(
        piece
      ),


    // ========================================================
    // 当前直接父母料理身份
    // ========================================================

    parentFoods:

      createParentFoodsSnapshot(
        piece
      ),


    // ========================================================
    // 如果当前是1：
    //
    // 下一次处理1时会收藏哪个来源。
    //
    // 非1统一为null。
    // ========================================================

    pendingDiscoveryValue:

      getPendingDiscoveryValue(
        piece
      )

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

    // ========================================================
    // 九宫格
    // ========================================================

    board:

      createMazeBoardSnapshot(
        state?.board
      ),


    // ========================================================
    // 收藏
    //
    // 收藏是否已有某数字，
    // 会影响下一次处理1是“首次收藏”还是“重复收藏”。
    //
    // 因此 collection 属于规则状态。
    // ========================================================

    collection:

      createCollectionSnapshot(
        state?.collection
      )

  };

}





// ============================================================
// 生成第二层规则状态 Key
//
// ------------------------------------------------------------
//
// JSON.stringify 在这里是有意使用的：
//
// createMazeRuleState() 输出字段顺序固定；
// collection 已排序；
// board 顺序固定为九宫格位置。
//
// 因此相同规则状态一定得到相同字符串。
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
//
// 只比较第二层规则状态。
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
//
// ------------------------------------------------------------
//
// key
// = 第二层状态指纹
//
// sequence
// = 本局第几个规则状态节点
//
// steps
// = 当时正式步数
//
// ------------------------------------------------------------
//
// steps 不参与状态比较。
// 这里只用于以后调试：
//
// 第12步第一次来这里
// 第35步再次回来
//
// ------------------------------------------------------------
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
//
// 否则：
//
// 开局 S0
// ↓
// 绕一圈
// ↓
// S0
//
// 将无法检测第一次回到开局。
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
//
// 返回第一次匹配。
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
//
// ------------------------------------------------------------
//
// 注意：
//
// 本函数本身不检查重复。
//
// 调用方应该：
//
// 1. 先检测
// 2. 如果没有重复 → record
// 3. 如果重复 → gameEngine触发迷宫回转
// 4. 回转后 → 再record新的状态
//
// ------------------------------------------------------------
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
//
// ------------------------------------------------------------
//
// mazeHistory只负责记录：
//
// “发生过一次回转”
//
// 它不负责真正执行全盘 +1。
//
// 全盘 +1 应由 gameEngine 完成。
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
//
// ------------------------------------------------------------
//
// 返回：
//
// {
//   repeated,
//   key,
//   previous
// }
//
// previous 包含第一次出现该状态时：
//
// sequence
// steps
// reason
//
// ------------------------------------------------------------
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
//
// 目前正式规则预计不会使用。
//
// 保留给：
//
// 新局
// 调试
// 测试
//
// ------------------------------------------------------------
//
// 正式「迷宫回转」触发时：
//
// 不应该调用这个函数。
//
// 因为我们已经确定：
//
// 回转以后，过去所有历史仍然保留。
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
//
// 不建议正式UI直接使用。
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