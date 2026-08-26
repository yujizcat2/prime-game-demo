import {
  gcd
} from "../utils/math";


import {
  FOOD_TYPES,
  canReduce,
  canCombine,
  combineValue,
  hasSameParents,
  hasParentFood,
  getReduceExtractFoodType
} from "./rules";


import {
  GAME_CONFIG
} from "./config";





// ============================================================
// 找到两个选中的数字
// ============================================================

function getSelectedPair(
  numbers,
  selected
){


  if(
    selected.length !== 2
  ){

    return null;

  }



  const list =

    numbers.filter(

      item =>
        selected.includes(
          item.id
        )

    );



  if(
    list.length !== 2
  ){

    return null;

  }



  return {

    first:
      list[0],

    second:
      list[1]

  };

}





// ============================================================
// 判断是否存在直接父母关系
//
// value + foodType
// 必须都相同才算真正父母。
// ============================================================

function hasParentRelation(
  first,
  second
){


  if(
    hasParentFood(
      first,
      second
    )
  ){

    return true;

  }



  if(
    hasParentFood(
      second,
      first
    )
  ){

    return true;

  }



  return false;

}





// ============================================================
// 判断本次约分是否会析出 gcd
//
// 普通三系 + 异值
// → 析出 gcd
//
// 同值
// → 不析出
//
// 甜食
// → 暂时不进入 gcd 提取体系
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



  return Boolean(

    getReduceExtractFoodType(
      first,
      second
    )

  );

}





// ============================================================
// 获取合成状态
// ============================================================

function getCombineStatus(
  first,
  second,
  numbers
){


  // ==========================================================
  // 新规则正常情况下不会存在正式1。
  // 这里仅作为旧状态保护。
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      allowed:
        false,

      result:
        null,

      reason:
        "1不能参与组合"

    };

  }





  // ==========================================================
  // 棋盘没有空位
  // ==========================================================

  if(
    numbers.length >=
    GAME_CONFIG.MAX_NUMBERS
  ){

    return {

      allowed:
        false,

      result:
        null,

      reason:
        "没有空位，放不下新的数字"

    };

  }





  // ==========================================================
  // 直接父母关系
  // ==========================================================

  if(
    hasParentRelation(
      first,
      second
    )
  ){

    return {

      allowed:
        false,

      result:
        null,

      reason:
        "它不能再和组成自己的数字组合"

    };

  }





  // ==========================================================
  // 已经组合过
  // ==========================================================

  if(
    hasSameParents(
      numbers,
      first,
      second
    )
  ){

    return {

      allowed:
        false,

      result:
        null,

      reason:
        "这两个数字已经组合过一次"

    };

  }





  // ==========================================================
  // 最终真实规则检查
  // ==========================================================

  if(
    !canCombine(
      first,
      second,
      numbers
    )
  ){

    return {

      allowed:
        false,

      result:
        null,

      reason:
        "这两个数字现在不能组合"

    };

  }





  const result =

    combineValue(
      first.value,
      second.value
    );



  return {

    allowed:
      true,

    result,

    reason:
      `可以组合 ${result}`

  };

}





// ============================================================
// 获取约分状态
//
// 新核心：
//
// 约分结果为1
// → 不落盘
// → 自动加入收藏
// → 自动释放当前位置
//
// 所以容量判断不能再只是：
//
// numbers.length >= MAX
//
// 而应该计算：
//
// 当前空格
// +
// 本次自动收藏释放的格子
// >=
// 析出 gcd 所需要的格子
// ============================================================

function getReduceStatus(
  first,
  second,
  numbers
){


  // ==========================================================
  // 旧状态保护
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      allowed:
        false,

      firstResult:
        null,

      secondResult:
        null,

      divisor:
        null,

      extract:
        false,

      extractValue:
        null,

      extractFoodType:
        null,

      autoCollectCount:
        0,

      firstAutoCollect:
        false,

      secondAutoCollect:
        false,

      reason:
        "1不能参与约分"

    };

  }





  // ==========================================================
  // 数学上能否约分
  // ==========================================================

  if(
    !canReduce(
      first,
      second
    )
  ){

    return {

      allowed:
        false,

      firstResult:
        null,

      secondResult:
        null,

      divisor:
        null,

      extract:
        false,

      extractValue:
        null,

      extractFoodType:
        null,

      autoCollectCount:
        0,

      firstAutoCollect:
        false,

      secondAutoCollect:
        false,

      reason:
        "这两个数字现在不能一起变小"

    };

  }





  // ==========================================================
  // 最大公约数
  // ==========================================================

  const divisor =

    gcd(
      first.value,
      second.value
    );



  const firstResult =

    first.value /
    divisor;



  const secondResult =

    second.value /
    divisor;





  // ==========================================================
  // 自动收藏状态
  // ==========================================================

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





  // ==========================================================
  // 是否析出 gcd
  // ==========================================================

  const extract =

    shouldExtractReduceDivisor(
      first,
      second
    );





  const extractFoodType =

    extract

      ?

        getReduceExtractFoodType(
          first,
          second
        )

      :

        null;





  // ==========================================================
  // 空间计算
  //
  // 当前空位：
  //
  // MAX - 当前棋子数
  //
  //
  // 本次约分可用空间：
  //
  // 当前空位
  // +
  // 自动收藏释放的格子
  //
  //
  // 析出物：
  //
  // extract === true
  // → 需要1格
  //
  // extract === false
  // → 不需要额外格
  // ==========================================================

  const currentEmptyCount =

    Math.max(

      0,

      GAME_CONFIG.MAX_NUMBERS -
      numbers.length

    );



  const availableAfterReduce =

    currentEmptyCount +
    autoCollectCount;



  const requiredExtraSpace =

    extract
      ? 1
      : 0;





  // ==========================================================
  // 空间不足
  //
  // 例如满盘：
  //
  // 12 / 18
  // → 2 / 3 + 6
  //
  // currentEmpty = 0
  // autoCollect = 0
  // available = 0
  // required = 1
  //
  // → 禁止
  // ==========================================================

  if(
    availableAfterReduce <
    requiredExtraSpace
  ){

    return {

      allowed:
        false,

      firstResult,

      secondResult,

      divisor,

      extract,

      extractValue:

        extract
          ? divisor
          : null,

      extractFoodType,

      autoCollectCount,

      firstAutoCollect,

      secondAutoCollect,

      reason:
        "没有空位，且本次约分不会释放足够的格子"

    };

  }





  // ==========================================================
  // 可以约分
  //
  // 根据结果给更准确的状态描述。
  // ==========================================================

  if(
    autoCollectCount === 2
  ){

    return {

      allowed:
        true,

      firstResult,

      secondResult,

      divisor,

      extract,

      extractValue:

        extract
          ? divisor
          : null,

      extractFoodType,

      autoCollectCount,

      firstAutoCollect,

      secondAutoCollect,

      reason:
        "可以约分，两边都会自动加入收藏"

    };

  }





  if(
    autoCollectCount === 1 &&
    extract
  ){

    return {

      allowed:
        true,

      firstResult,

      secondResult,

      divisor,

      extract:
        true,

      extractValue:
        divisor,

      extractFoodType,

      autoCollectCount,

      firstAutoCollect,

      secondAutoCollect,

      reason:
        `可以约分，自动收藏并析出 ${divisor}`

    };

  }





  if(
    autoCollectCount === 1
  ){

    return {

      allowed:
        true,

      firstResult,

      secondResult,

      divisor,

      extract:
        false,

      extractValue:
        null,

      extractFoodType:
        null,

      autoCollectCount,

      firstAutoCollect,

      secondAutoCollect,

      reason:
        "可以约分，其中一边会自动加入收藏"

    };

  }





  if(
    extract
  ){

    return {

      allowed:
        true,

      firstResult,

      secondResult,

      divisor,

      extract:
        true,

      extractValue:
        divisor,

      extractFoodType,

      autoCollectCount,

      firstAutoCollect,

      secondAutoCollect,

      reason:
        `可以约分，并析出 ${divisor}`

    };

  }





  return {

    allowed:
      true,

    firstResult,

    secondResult,

    divisor,

    extract:
      false,

    extractValue:
      null,

    extractFoodType:
      null,

    autoCollectCount,

    firstAutoCollect,

    secondAutoCollect,

    reason:
      "这两个数字可以一起变小"

  };

}





// ============================================================
// 对外：获取当前动作状态
// ============================================================

export function getActionStatus(
  numbers,
  selected
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



  if(
    !Array.isArray(
      selected
    )
  ){

    selected = [];

  }





  // ==========================================================
  // 没有选择
  // ==========================================================

  if(
    selected.length === 0
  ){

    return {

      type:
        "empty",

      message:
        "选择两个数字"

    };

  }





  // ==========================================================
  // 只选择一个
  // ==========================================================

  if(
    selected.length === 1
  ){


    const item =

      numbers.find(

        number =>
          number.id ===
          selected[0]

      );



    if(
      !item
    ){

      return {

        type:
          "empty",

        message:
          "选择两个数字"

      };

    }





    // ========================================================
    // 新系统理论上不会出现正式1。
    //
    // 如果旧热更新状态仍然存在，
    // 不再提示玩家手动消除。
    // ========================================================

    if(
      item.value === 1
    ){

      return {

        type:
          "legacy-one",

        item,

        message:
          "旧状态中的1不能继续操作"

      };

    }





    return {

      type:
        "single",

      item,

      message:
        "再选一个数字"

    };

  }





  // ==========================================================
  // 选择两个数字
  // ==========================================================

  const pair =

    getSelectedPair(
      numbers,
      selected
    );



  if(
    !pair
  ){

    return {

      type:
        "empty",

      message:
        "选择两个数字"

    };

  }





  const {

    first,

    second

  } = pair;





  // ==========================================================
  // 旧状态保护
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      type:
        "legacy-one",

      item:

        first.value === 1

          ? first

          : second,

      message:
        "旧状态中的1不能继续操作"

    };

  }





  // ==========================================================
  // 合成状态
  // ==========================================================

  const combine =

    getCombineStatus(
      first,
      second,
      numbers
    );





  // ==========================================================
  // 约分状态
  // ==========================================================

  const reduce =

    getReduceStatus(
      first,
      second,
      numbers
    );





  // ==========================================================
  // 返回
  // ==========================================================

  return {

    type:
      "pair",

    first,

    second,

    combine,

    reduce

  };

}