import {
  gcd
} from "../utils/math";


import {
  FOOD_TYPES,
  canCombine,
  canCombineRelation,
  canReduce,
  combineValue,
  getReduceExtractFoodType
} from "./rules";


import {
  isPrime
} from "./prime";


import {
  GAME_CONFIG
} from "./config";





// ============================================================
// 判断本次约分是否需要析出 gcd
//
// 普通三系 + 异值
// → 析出 gcd
//
// 同值
// → 不析出
//
// 甜食
// → 暂时不进入 gcd 析出系统
// ============================================================

function shouldExtractReduceDivisor(
  first,
  second
){


  if(
    !first ||
    !second
  ){

    return false;

  }



  // ==========================================================
  // 同值不析出
  // ==========================================================

  if(
    first.value ===
    second.value
  ){

    return false;

  }



  // ==========================================================
  // 甜食暂不析出
  // ==========================================================

  if(
    first.foodType ===
      FOOD_TYPES.DESSERT
    ||
    second.foodType ===
      FOOD_TYPES.DESSERT
  ){

    return false;

  }



  // ==========================================================
  // 必须能产生合法析出类型
  // ==========================================================

  return Boolean(

    getReduceExtractFoodType(
      first,
      second
    )

  );

}





// ============================================================
// 获取约分后的空间变化
//
// 这是新版容量规则的核心。
//
// 例如：
//
// 16 / 4
//
// gcd = 4
//
// → 4 / 1
//
// 其中1自动收藏：
//
// autoCollectCount = 1
//
// 同时异值普通约分：
//
// extractCount = 1
//
// 所以：
//
// 净空间变化 = +1释放 -1占用 = 0
//
// 即使原本满盘也可以执行。
// ============================================================

function getReduceSpaceInfo(
  first,
  second
){


  if(
    !first ||
    !second
  ){

    return {

      divisor:
        null,

      firstResult:
        null,

      secondResult:
        null,

      firstAutoCollect:
        false,

      secondAutoCollect:
        false,

      autoCollectCount:
        0,

      extract:
        false,

      extractCount:
        0

    };

  }



  const divisor =

    gcd(
      first.value,
      second.value
    );



  if(
    divisor <= 1
  ){

    return {

      divisor,

      firstResult:
        first.value,

      secondResult:
        second.value,

      firstAutoCollect:
        false,

      secondAutoCollect:
        false,

      autoCollectCount:
        0,

      extract:
        false,

      extractCount:
        0

    };

  }



  const firstResult =

    first.value /
    divisor;



  const secondResult =

    second.value /
    divisor;



  const firstAutoCollect =

    firstResult === 1;



  const secondAutoCollect =

    secondResult === 1;



  const autoCollectCount =

    (
      firstAutoCollect
        ? 1
        : 0
    )

    +

    (
      secondAutoCollect
        ? 1
        : 0
    );



  const extract =

    shouldExtractReduceDivisor(
      first,
      second
    );



  return {

    divisor,

    firstResult,

    secondResult,

    firstAutoCollect,

    secondAutoCollect,

    autoCollectCount,

    extract,

    extractCount:

      extract
        ? 1
        : 0

  };

}





// ============================================================
// 判断当前棋盘状态下
// 一对数字是否真的可以执行约分
//
// 新容量规则：
//
// 当前空位
// +
// 本次变成1自动收藏释放的格子
//
// 必须 >=
//
// 本次析出 gcd 需要的格子
//
//
// ------------------------------------------------------------
//
// 满盘 16 / 4：
//
// 空位 0
// 自动释放 1
// 析出需要 1
//
// 0 + 1 >= 1
//
// → 可以
//
//
// 满盘 12 / 18：
//
// 空位 0
// 自动释放 0
// 析出需要 1
//
// 0 + 0 < 1
//
// → 不可以
//
//
// 满盘 8 / 8：
//
// 空位 0
// 自动释放 2
// 析出需要 0
//
// → 可以
// ============================================================

function canReduceOnCurrentBoard(
  first,
  second,
  numbers
){


  if(
    !first ||
    !second
  ){

    return false;

  }



  // ==========================================================
  // 新规则正常情况下不会有正式1。
  // 这里作为旧状态保护。
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return false;

  }



  // ==========================================================
  // 数学上必须可以约分
  // ==========================================================

  if(
    !canReduce(
      first,
      second
    )
  ){

    return false;

  }



  const spaceInfo =

    getReduceSpaceInfo(
      first,
      second
    );



  // ==========================================================
  // 当前空格
  // ==========================================================

  const currentEmptyCount =

    Math.max(

      0,

      GAME_CONFIG.MAX_NUMBERS -
      numbers.length

    );



  // ==========================================================
  // 约分执行过程中实际可以使用的空间
  //
  // 当前空格
  // +
  // 自动收藏释放格
  // ==========================================================

  const availableSpace =

    currentEmptyCount +
    spaceInfo.autoCollectCount;



  // ==========================================================
  // 析出物需要占用的空间
  // ==========================================================

  const requiredSpace =

    spaceInfo.extractCount;



  return (

    availableSpace >=
    requiredSpace

  );

}





// ============================================================
// 容量活性系数
//
// 0格 / 1格 → 0.00
// 2格       → 0.35
// 3格       → 0.55
// 4格       → 0.75
// 5格       → 0.95
// 6格       → 1.00
// 7格       → 0.90
// 8格       → 0.70
// 满盘       → 0.50
// ============================================================

function getCapacityFactor(
  count
){


  if(
    count <= 1
  ){

    return 0;

  }



  if(
    count === 2
  ){

    return 0.35;

  }



  if(
    count === 3
  ){

    return 0.55;

  }



  if(
    count === 4
  ){

    return 0.75;

  }



  if(
    count === 5
  ){

    return 0.95;

  }



  if(
    count === 6
  ){

    return 1;

  }



  if(
    count === 7
  ){

    return 0.9;

  }



  if(
    count === 8
  ){

    return 0.7;

  }



  return 0.5;

}





// ============================================================
// 获取棋盘活性
//
// 新版正式动作只有：
//
// 1. combine
// 2. reduce
//
// “处理1”已经退出正式动作系统。
//
// 约分本身可以：
//
// - 改变两个数字
// - 自动收藏约成1的数字
// - 析出 gcd
//
// 因此约分的合法性必须使用新的净空间规则。
// ============================================================

export function getActivityStatus(
  numbers = [],
  primeDensity = 0
){


  // ==========================================================
  // 安全处理
  // ==========================================================

  if(
    !Array.isArray(
      numbers
    )
  ){

    numbers = [];

  }





  // ==========================================================
  // 质密
  // ==========================================================

  const density =

    Math.max(

      0,

      Math.min(

        100,

        Number(
          primeDensity
        ) || 0

      )

    );





  // ==========================================================
  // 质密系数
  // ==========================================================

  const densityFactor =

    1 -
    0.5 *
    (
      density /
      100
    );





  // ==========================================================
  // 动作权重
  // ==========================================================

  const normalCombineWeight =
    densityFactor;



  const primeCombineWeight =

    0.5 *
    densityFactor;



  const reduceWeight =

    0.8 +
    0.2 *
    densityFactor;





  // ==========================================================
  // 空棋盘
  // ==========================================================

  if(
    numbers.length === 0
  ){

    return {

      activity:
        0,

      activityScore:
        0,

      activityMax:
        0,

      potentialActivity:
        0,


      legal:
        0,

      total:
        0,


      combineLegal:
        0,

      combinePotential:
        0,

      combineTotal:
        0,

      combineActivity:
        0,


      combinePrimeLegal:
        0,

      combineNormalLegal:
        0,


      reduceLegal:
        0,

      reducePotential:
        0,

      reduceTotal:
        0,

      reduceActivity:
        0,


      // ======================================================
      // 兼容旧 UI。
      //
      // 新系统永远为0。
      // 后续 Legacy Cleanup 可以彻底删除。
      // ======================================================

      removeLegal:
        0,


      pairCount:
        0,


      primeDensity:
        density,

      densityFactor,

      capacityFactor:
        0,

      blockedCombineFactor:
        1,


      normalCombineWeight,

      primeCombineWeight,

      reduceWeight,


      dead:
        true

    };

  }





  // ==========================================================
  // 当前数字数量
  // ==========================================================

  const count =
    numbers.length;





  // ==========================================================
  // 是否满盘
  // ==========================================================

  const boardFull =

    count >=
    GAME_CONFIG.MAX_NUMBERS;





  // ==========================================================
  // 容量系数
  // ==========================================================

  const capacityFactor =

    getCapacityFactor(
      count
    );





  // ==========================================================
  // 满盘合成残余结构系数
  // ==========================================================

  const blockedCombineFactor =

    boardFull

      ? 0.15

      : 1;





  // ==========================================================
  // 数字对数量
  // ==========================================================

  const pairCount =

    count *
    (count - 1) /
    2;





  // ==========================================================
  // 理论动作数量
  // ==========================================================

  const combineTotal =
    pairCount;


  const reduceTotal =
    pairCount;


  const total =

    combineTotal +
    reduceTotal;





  // ==========================================================
  // 理论最大活性
  // ==========================================================

  const activityMax =

    pairCount *
    2;





  // ==========================================================
  // 当前真实合法动作
  // ==========================================================

  let combineLegal =
    0;


  let reduceLegal =
    0;





  // ==========================================================
  // 潜在关系
  // ==========================================================

  let combinePotential =
    0;


  let reducePotential =
    0;





  // ==========================================================
  // 合成结果分类
  // ==========================================================

  let combinePrimeLegal =
    0;


  let combineNormalLegal =
    0;





  // ==========================================================
  // 活性累计
  // ==========================================================

  let combineActivity =
    0;


  let reduceActivity =
    0;





  // ==========================================================
  // 遍历所有数字对
  // ==========================================================

  for(
    let i = 0;
    i < numbers.length;
    i++
  ){


    for(
      let j = i + 1;
      j < numbers.length;
      j++
    ){


      const first =
        numbers[i];


      const second =
        numbers[j];





      // ======================================================
      // 真实合法合成
      // ======================================================

      if(
        canCombine(
          first,
          second,
          numbers
        )
      ){

        combineLegal++;

      }





      // ======================================================
      // 潜在合成关系
      //
      // 不考虑当前空间。
      // ======================================================

      if(
        canCombineRelation(
          first,
          second,
          numbers
        )
      ){


        combinePotential++;



        const result =

          combineValue(
            first.value,
            second.value
          );



        if(
          isPrime(
            result
          )
        ){


          combinePrimeLegal++;


          combineActivity +=
            primeCombineWeight;

        }



        else{


          combineNormalLegal++;


          combineActivity +=
            normalCombineWeight;

        }

      }





      // ======================================================
      // 潜在约分关系
      //
      // 只判断数学关系。
      //
      // 不考虑容量。
      // ======================================================

      const hasReduceRelation =

        first.value !== 1

        &&

        second.value !== 1

        &&

        canReduce(
          first,
          second
        );



      if(
        hasReduceRelation
      ){

        reducePotential++;

      }





      // ======================================================
      // 当前真正可执行约分
      //
      // 新版考虑：
      //
      // - gcd
      // - 析出
      // - 自动收藏
      // - 自动释放格
      // - 当前剩余空间
      // ======================================================

      if(
        canReduceOnCurrentBoard(
          first,
          second,
          numbers
        )
      ){


        reduceLegal++;


        reduceActivity +=
          reduceWeight;

      }

    }

  }





  // ==========================================================
  // 手动处理1已经取消
  //
  // 暂时保留字段，
  // 防止 BoardStatus / TestLab 等旧 UI 立即报错。
  //
  // 后续 Legacy Cleanup 再彻底删除字段。
  // ==========================================================

  const removeLegal =
    0;





  // ==========================================================
  // 当前真实合法动作数量
  // ==========================================================

  const legal =

    combineLegal +
    reduceLegal;





  // ==========================================================
  // 潜在活性
  //
  // 合成：
  // 满盘时保留少量结构价值。
  //
  // 约分：
  // 只计算当前真正能执行的约分。
  // ==========================================================

  const potentialActivity =

    combineActivity *
    blockedCombineFactor

    +

    reduceActivity;





  // ==========================================================
  // 最终有效活性
  // ==========================================================

  const activityScore =

    potentialActivity *
    capacityFactor;





  // ==========================================================
  // 活性百分比
  // ==========================================================

  const activity =

    activityMax === 0

      ? 0

      :

        Math.round(

          (
            activityScore /
            activityMax *
            100
          )

          *

          10

        )

        /

        10;





  // ==========================================================
  // 死局
  //
  // 新系统：
  //
  // 只看 combine / reduce。
  //
  // 不再存在：
  //
  // remove 1
  //
  // ==========================================================

  const dead =

    combineLegal === 0

    &&

    reduceLegal === 0;





  // ==========================================================
  // 返回
  // ==========================================================

  return {

    // ========================
    // 最终活性
    // ========================

    activity,

    activityScore,

    activityMax,

    potentialActivity,


    // ========================
    // 当前真实动作
    // ========================

    legal,

    total,


    // ========================
    // 合成
    // ========================

    combineLegal,

    combinePotential,

    combineTotal,

    combineActivity,


    combinePrimeLegal,

    combineNormalLegal,


    // ========================
    // 约分
    // ========================

    reduceLegal,

    reducePotential,

    reduceTotal,

    reduceActivity,


    // ========================
    // 旧接口兼容
    // ========================

    removeLegal,


    // ========================
    // 棋盘
    // ========================

    pairCount,

    boardFull,


    // ========================
    // 环境系数
    // ========================

    primeDensity:
      density,

    densityFactor,

    capacityFactor,

    blockedCombineFactor,


    // ========================
    // 动作权重
    // ========================

    normalCombineWeight,

    primeCombineWeight,

    reduceWeight,


    // ========================
    // 死局
    // ========================

    dead

  };

}