// ============================================================
// 数字来源系统
//
// 核心规则：
//
// 1. 开局最初3个数字
//
//    origin = null
//
//    当前分别为：
//
//    荤
//    素
//    调料
//
//    且默认都是 pure。
//
//
//
// 2. 合成
//
//    A + B = C
//
//    底层保存A、B完整来源。
//
//    同时指定一个mainParent
//    作为玩家默认看到的“父系”。
//
//    当前规则：
//
//    棋盘位置靠前的一方 = 父。
//
//
//
// 3. 约分
//
//    A → B
//
//    B只继承A自身的历史。
//
//    另一边参与约分的数字
//    不进入B的主路径。
//
//
//
// 4. 玩家默认只查看一条主线
//
//    例如：
//
//    19 ← 38 ⇐ 20 ← 5
//
//    其中：
//
//    ←  = 约分
//    ⇐  = 合成
//
//
//
// 5. 完整父母树仍然保留
//
//    当前UI暂时不显示完整树，
//    但底层数据继续保存。
//
//
//
// 6. 每一个历史节点同时保存：
//
//    value
//    foodType
//    purity
//    origin
//
//    因此未来可以完整恢复：
//
//    数字
//    类型
//    纯度
//    历史来源。
// ============================================================





// ============================================================
// 创建数字快照
//
// 保存当前数字：
//
// value
// foodType
// purity
// origin
//
// 防止之后数字继续变化时
// 影响已经记录的旧历史。
//
//
// 例如：
//
// {
//   value: 40,
//   foodType: "meat",
//   purity: "mixed",
//   origin: ...
// }
//
// ============================================================

export function createOriginSnapshot(
  number
){


  if(
    !number
  ){

    return null;

  }



  return {

    value:
      number.value,


    foodType:
      number.foodType ?? null,


    purity:
      number.purity ?? null,


    origin:

      cloneOrigin(
        number.origin
      )

  };

}





// ============================================================
// 创建合成来源
//
// resultValue：
// 合成后的新数字
//
// father：
// 父系来源
//
// otherParent：
// 另一来源
//
// ------------------------------------------------------------
//
// 例如：
//
// 20 + 18 = 38
//
// 如果20是棋盘靠前的一方：
//
// 38的mainParent = 20
//
// 玩家默认主线：
//
// 38 ⇐ 20
//
// 18仍然完整保存在parents中。
//
//
// ------------------------------------------------------------
// 类型 / 纯度
//
// father和otherParent的快照
// 都会完整保存：
//
// value
// foodType
// purity
// origin
//
// 因此以后可以恢复完整料理族谱。
// ============================================================

export function createCombineOrigin(
  resultValue,
  father,
  otherParent
){


  const fatherSnapshot =

    createOriginSnapshot(
      father
    );



  const otherSnapshot =

    createOriginSnapshot(
      otherParent
    );



  return {

    type:
      "combine",


    value:
      resultValue,


    // ========================================================
    // 完整父母
    //
    // 【底层保留】
    //
    // 保存双方：
    //
    // value
    // foodType
    // purity
    // origin
    //
    // 当前简化UI暂时不全部展示。
    // ========================================================

    parents: [

      fatherSnapshot,

      otherSnapshot

    ],


    // ========================================================
    // 父系
    //
    // 当前玩家主路径只追这一边。
    // ========================================================

    mainParent:
      fatherSnapshot

  };

}





// ============================================================
// 创建约分来源
//
// resultValue：
// 约分后的数字
//
// previousNumber：
// 约分前的这个数字自己
//
// ------------------------------------------------------------
//
// 例如：
//
// 38 → 19
//
// 19来源：
//
// 19 ← 38
//
// 参与约分的另一边数字
// 不进入19的来源。
//
//
// ------------------------------------------------------------
// 类型 / 纯度
//
// previousNumber的：
//
// foodType
// purity
//
// 都会一起进入历史快照。
//
// 因此：
//
// 半纯肉38
// ↓约分
// 半纯肉19
//
// 历史仍然知道38也是半纯肉。
// ============================================================

export function createReduceOrigin(
  resultValue,
  previousNumber
){


  return {

    type:
      "reduce",


    value:
      resultValue,


    parent:

      createOriginSnapshot(
        previousNumber
      )

  };

}





// ============================================================
// 深复制来源
// ============================================================

export function cloneOrigin(
  origin
){


  if(
    !origin
  ){

    return null;

  }



  // ==========================================================
  // 合成
  // ==========================================================

  if(
    origin.type ===
    "combine"
  ){


    const parents =

      Array.isArray(
        origin.parents
      )

        ?

        origin.parents.map(

          parent =>
            cloneRecord(
              parent
            )

        )

        :

        [];



    // ========================================================
    // 父系也必须复制
    // ========================================================

    const mainParent =

      origin.mainParent

        ?

        cloneRecord(
          origin.mainParent
        )

        :

        parents[0] ?? null;



    return {

      type:
        "combine",


      value:
        origin.value,


      parents,


      mainParent

    };

  }



  // ==========================================================
  // 约分
  // ==========================================================

  if(
    origin.type ===
    "reduce"
  ){


    return {

      type:
        "reduce",


      value:
        origin.value,


      parent:

        origin.parent

          ?

          cloneRecord(
            origin.parent
          )

          :

          null

    };

  }



  return null;

}





// ============================================================
// 深复制一个来源记录
//
// 每一个来源记录现在保存：
//
// value
// foodType
// purity
// origin
// ============================================================

function cloneRecord(
  record
){


  if(
    !record
  ){

    return null;

  }



  return {

    value:
      record.value,


    foodType:
      record.foodType ?? null,


    purity:
      record.purity ?? null,


    origin:

      cloneOrigin(
        record.origin
      )

  };

}





// ============================================================
// 获取某个数字完整来源记录
//
// 【完整来源树接口】
//
// 当前简化UI暂时不直接使用。
//
// 未来完整族谱 / 高级详情
// 可以直接通过这里读取：
//
// value
// foodType
// purity
// origin
// ============================================================

export function getNumberOriginRecord(
  number
){


  return createOriginSnapshot(
    number
  );

}





// ============================================================
// 获取父系主路径
//
// 【当前CollectionPanel主要使用的数据来源】
//
// ------------------------------------------------------------
//
// 返回：
//
// [
//   {
//     value: 19,
//     foodType: "meat",
//     purity: "mixed",
//     fromType: "reduce"
//   },
//
//   {
//     value: 38,
//     foodType: "meat",
//     purity: "mixed",
//     fromType: "combine"
//   },
//
//   {
//     value: 20,
//     foodType: "vegetable",
//     purity: "pure",
//     fromType: null
//   }
// ]
//
//
// ------------------------------------------------------------
//
// fromType含义：
//
// 当前这个数字
// 是通过什么方式从“下一个历史数字”变来的。
//
//
// ------------------------------------------------------------
//
// 例如：
//
// 38 → 19
//
// 19：
//
// {
//   value: 19,
//   foodType: "meat",
//   purity: "mixed",
//   fromType: "reduce"
// }
//
// UI未来可以显示：
//
// 半纯肉19 ← 半纯肉38
//
//
// ------------------------------------------------------------
//
// 如果：
//
// 20 + 18 = 38
//
// 且20是父系：
//
// 38：
//
// {
//   value: 38,
//   foodType: "meat",
//   purity: "mixed",
//   fromType: "combine"
// }
//
// UI未来可以显示：
//
// 半纯肉38 ⇐ 纯素20
//
// ============================================================

export function getMainLineage(
  record
){


  if(
    !record
  ){

    return [];

  }



  const lineage = [];


  let current =
    record;



  while(
    current
  ){


    const origin =
      current.origin;



    // ========================================================
    // 原生数字
    //
    // 没有更早来源
    //
    // 所以fromType = null
    // ========================================================

    if(
      !origin
    ){


      lineage.push({

        value:
          current.value,


        foodType:
          current.foodType ?? null,


        purity:
          current.purity ?? null,


        fromType:
          null

      });


      break;

    }



    // ========================================================
    // 约分
    //
    // 当前数字是由parent约分得到
    //
    // UI：
    //
    // 当前 ← parent
    // ========================================================

    if(
      origin.type ===
      "reduce"
    ){


      lineage.push({

        value:
          current.value,


        foodType:
          current.foodType ?? null,


        purity:
          current.purity ?? null,


        fromType:
          "reduce"

      });



      current =
        origin.parent;


      continue;

    }



    // ========================================================
    // 合成
    //
    // 当前数字是由mainParent参与合成得到
    //
    // UI：
    //
    // 当前 ⇐ mainParent
    // ========================================================

    if(
      origin.type ===
      "combine"
    ){


      lineage.push({

        value:
          current.value,


        foodType:
          current.foodType ?? null,


        purity:
          current.purity ?? null,


        fromType:
          "combine"

      });



      current =
        origin.mainParent;


      continue;

    }



    // ========================================================
    // 未知来源类型保护
    // ========================================================

    lineage.push({

      value:
        current.value,


      foodType:
        current.foodType ?? null,


      purity:
        current.purity ?? null,


      fromType:
        null

    });


    break;

  }



  return lineage;

}





// ============================================================
// 获取完整合成父母
//
// 【当前简化UI暂时不用】
// 【保留，不要删除】
//
// 未来如果要查看完整族谱，
// 可以从这里取得双方来源。
//
// 每个parent都包含：
//
// value
// foodType
// purity
// origin
// ============================================================

export function getCombineParents(
  record
){


  if(
    !record?.origin ||
    record.origin.type !== "combine"
  ){

    return [];

  }



  return (
    record.origin.parents ?? []
  );

}