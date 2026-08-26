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
//    棋盘位置靠前的一方 = 父。
//
//
//
// 3. 普通约分
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
// 4. 公约数提取
//
//    A / B
//
//    gcd = G
//
//    如果 A !== B：
//
//    A → A/G
//    B → B/G
//
//    同时额外产生：
//
//    G
//
//    G 的 origin:
//
//    type = "reduceExtract"
//
//    并完整保存：
//
//    A
//    B
//
//    两边的历史。
//
//
//
// 5. 玩家默认只查看一条主线
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
// 6. 完整父母树仍然保留
//
//    当前 UI 暂时不显示完整树，
//    但底层数据继续保存。
//
//
//
// 7. 每一个历史节点同时保存：
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
// 如果 20 是棋盘靠前的一方：
//
// 38 的 mainParent = 20
//
// 玩家默认主线：
//
// 38 ⇐ 20
//
// 18 仍然完整保存在 parents 中。
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


    parents: [

      fatherSnapshot,

      otherSnapshot

    ],


    mainParent:
      fatherSnapshot

  };

}





// ============================================================
// 创建普通约分来源
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
// 不进入 19 自己的主路径。
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
// 创建公约数提取来源
//
// resultValue：
// 被提取出的最大公约数
//
// firstNumber：
// 参与约分的第一个数字
//
// secondNumber：
// 参与约分的第二个数字
//
// ------------------------------------------------------------
//
// 例如：
//
// 荤12 + 素18
//
// gcd = 6
//
// → 荤2
// → 素3
// → 调料6
//
//
// 调料6的来源：
//
// {
//   type: "reduceExtract",
//   value: 6,
//   parents: [
//     荤12完整快照,
//     素18完整快照
//   ],
//   mainParent: 荤12完整快照
// }
//
// ------------------------------------------------------------
//
// reduceExtract 与普通 reduce 完全不同。
//
// 普通 reduce：
//
// 12 → 2
//
// 只描述一个数字自己的变化。
//
//
// reduceExtract：
//
// 12 / 18 → 提取6
//
// 描述两个数字共同拥有的结构。
// ============================================================

export function createReduceExtractOrigin(
  resultValue,
  firstNumber,
  secondNumber
){


  const firstSnapshot =

    createOriginSnapshot(
      firstNumber
    );



  const secondSnapshot =

    createOriginSnapshot(
      secondNumber
    );



  return {

    type:
      "reduceExtract",


    value:
      resultValue,


    // ========================================================
    // 完整双方来源
    // ========================================================

    parents: [

      firstSnapshot,

      secondSnapshot

    ],


    // ========================================================
    // 默认主线
    //
    // 暂时沿用第一方。
    //
    // 完整来源仍然保存在 parents。
    // ========================================================

    mainParent:
      firstSnapshot

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
  // 普通约分
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



  // ==========================================================
  // 公约数提取
  // ==========================================================

  if(
    origin.type ===
    "reduceExtract"
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
        "reduceExtract",


      value:
        origin.value,


      parents,


      mainParent

    };

  }



  return null;

}





// ============================================================
// 深复制一个来源记录
//
// 每一个来源记录保存：
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
// 当前支持：
//
// combine
// reduce
// reduceExtract
//
// ------------------------------------------------------------
//
// fromType 含义：
//
// 当前数字是通过什么方式
// 从后面的历史来源产生的。
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
    // 普通约分
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
    // 公约数提取
    // ========================================================

    if(
      origin.type ===
      "reduceExtract"
    ){


      lineage.push({

        value:
          current.value,


        foodType:
          current.foodType ?? null,


        purity:
          current.purity ?? null,


        fromType:
          "reduceExtract"

      });



      current =
        origin.mainParent;


      continue;

    }



    // ========================================================
    // 未知来源保护
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





// ============================================================
// 获取公约数提取的双方来源
//
// 例如：
//
// 调料6
//
// 来源：
//
// 荤12 / 素18
//
// 返回：
//
// [
//   荤12完整快照,
//   素18完整快照
// ]
// ============================================================

export function getReduceExtractParents(
  record
){


  if(
    !record?.origin ||
    record.origin.type !== "reduceExtract"
  ){

    return [];

  }



  return (
    record.origin.parents ?? []
  );

}