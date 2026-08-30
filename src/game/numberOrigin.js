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
// 2. 组合
//
//    A + B = C
//
//    底层保存 A、B 完整来源。
//
//    同时指定一个 mainParent
//    作为玩家默认看到的“父系”。
//
//    当前规则：
//
//    玩家先选的主料理 = 主来源。
//
//
//
// 3. 约分
//
//    A → B
//
//    B 只继承 A 自身的历史。
//
//    另一边参与约分的数字
//    不进入 B 的主路径。
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
//    ⇐  = 组合
//
//
//
// 5. 完整父母树仍然保留
//
//    当前 UI 暂时不显示完整树，
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
//    食物类型
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

    scoreValue:
      number.scoreValue ?? null,


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
// 创建组合来源
//
// resultValue：
// 组合后的新数字
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
// 如果玩家先选择 20 作为主料理：
//
// 38 的 mainParent = 20
//
// 玩家默认主线：
//
// 38 ⇐ 20
//
// 18 仍然完整保存在 parents 中。
//
//
// ------------------------------------------------------------
// 类型 / 纯度
//
// father 和 otherParent 的快照
// 都会完整保存：
//
// value
// foodType
// purity
// origin
//
// 因此以后可以恢复完整食物族谱。
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
    // 当前简化 UI 暂时不全部展示。
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
// 19 来源：
//
// 19 ← 38
//
// 参与约分的另一边数字
// 不进入 19 的来源。
//
//
// ------------------------------------------------------------
// 类型 / 纯度
//
// previousNumber 的：
//
// foodType
// purity
//
// 都会一起进入历史快照。
//
// 因此：
//
// 半纯荤38
// ↓约分
// 半纯荤19
//
// 历史仍然知道 38 也是半纯荤。
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
  // 组合
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
// 当前简化 UI 暂时不直接使用。
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
// 【当前 CollectionPanel 主要使用的数据来源】
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
// fromType 含义：
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
// UI 未来可以显示：
//
// 半纯荤19 ← 半纯荤38
//
//
// ------------------------------------------------------------
//
// 如果：
//
// 20 + 18 = 38
//
// 且 20 是父系：
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
// UI 未来可以显示：
//
// 半纯荤38 ⇐ 纯素20
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
    // 组合
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
// 获取完整组合父母
//
// 【当前简化 UI 暂时不用】
// 【保留，不要删除】
//
// 未来如果要查看完整族谱，
// 可以从这里取得双方来源。
//
// 每个 parent 都包含：
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
