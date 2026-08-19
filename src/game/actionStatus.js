import {
  gcd
} from "../utils/math";

import {
  canReduce,
  canCombine,
  combineValue,
  hasSameParents
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
// 判断是否存在“来源关系”
//
// 例如：
// 6 + 8 -> 14
//
// 14 的 parents = [6, 8]
//
// 那么：
// 14 不能再和 6 合成
// 14 不能再和 8 合成
// ============================================================

function hasParentRelation(
  first,
  second
){


  if(
    first.parents &&
    first.parents.includes(
      second.value
    )
  ){

    return true;

  }



  if(
    second.parents &&
    second.parents.includes(
      first.value
    )
  ){

    return true;

  }



  return false;

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
  // 1不能参与普通合成
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      allowed: false,

      result: null,

      reason:
        "1只能直接消除"

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

      allowed: false,

      result: null,

      reason:
        "没有空位，放不下新的数字"

    };

  }





  // ==========================================================
  // 和组成自己的数字再次合成
  //
  // 例如：
  // 6 + 8 -> 14
  //
  // 14 和 6
  // 14 和 8
  //
  // 都不能继续合成
  // ==========================================================

  if(
    hasParentRelation(
      first,
      second
    )
  ){

    return {

      allowed: false,

      result: null,

      reason:
        "它不能再和组成自己的数字合成"

    };

  }





  // ==========================================================
  // 这两个数字已经合成过一次
  //
  // 例如：
  // 6 + 8 已经生成过一个结果
  //
  // 那么原来的 6 和 8
  // 不能再次重复生成
  // ==========================================================

  if(
    hasSameParents(
      numbers,
      first.value,
      second.value
    )
  ){

    return {

      allowed: false,

      result: null,

      reason:
        "这两个数字已经合成过一次"

    };

  }





  // ==========================================================
  // 最终交给真实规则检查
  // ==========================================================

  if(
    !canCombine(
      first,
      second,
      numbers
    )
  ){

    return {

      allowed: false,

      result: null,

      reason:
        "这两个数字现在不能合成"

    };

  }





  // ==========================================================
  // 可以合成
  // ==========================================================

  const result =

    combineValue(
      first.value,
      second.value
    );



  return {

    allowed: true,

    result,

    reason:
      `可以合成 ${result}`

  };

}





// ============================================================
// 获取约分状态
// ============================================================

function getReduceStatus(
  first,
  second
){


  // ==========================================================
  // 1不能参与普通约分
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      allowed: false,

      firstResult: null,

      secondResult: null,

      reason:
        "1只能直接消除"

    };

  }





  // ==========================================================
  // 是否允许约分
  // ==========================================================

  const allowed =

    canReduce(
      first,
      second
    );



  // ==========================================================
  // 不能约分
  // ==========================================================

  if(
    !allowed
  ){

    return {

      allowed: false,

      firstResult: null,

      secondResult: null,

      reason:
        "这两个数字现在不能一起变小"

    };

  }





  // ==========================================================
  // 可以约分
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



  return {

    allowed: true,

    firstResult,

    secondResult,

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
    // 选中了1
    // ========================================================

    if(
      item.value === 1
    ){

      return {

        type:
          "one",

        item,

        message:
          "消除它，获得奖励"

      };

    }





    // ========================================================
    // 普通数字
    // ========================================================

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
  // 安全保护
  //
  // 正常情况下 useGame 已经不会让1
  // 和其他数字同时处于选中状态
  // ==========================================================

  if(
    first.value === 1 ||
    second.value === 1
  ){

    return {

      type:
        "one",

      item:

        first.value === 1

          ? first

          : second,

      message:
        "消除它，获得奖励"

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
      second
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