// ============================================================
// 动物世界语言层
//
// 这里只负责把底层游戏状态
// 翻译成玩家看到的动物语言。
//
// 不参与：
// - 合成判断
// - 约分判断
// - 数值计算
// - animalType 规则
// ============================================================



// ============================================================
// 默认提示
// ============================================================

export function getEmptyText() {

  return "选择两只动物";

}





// ============================================================
// 只选择一只动物
// ============================================================

export function getSingleText(
  name
) {

  if(
    !name
  ){

    return "再选一只动物";

  }


  return (
    `已选择「${name}」，再选一只动物`
  );

}





// ============================================================
// 获得1
//
// 当前动物世界里：
// 数字1继续表现为“水”。
// ============================================================

export function getWaterText(
  sourceName
) {

  if(
    sourceName
  ){

    return (
      `从「${sourceName}」中处理出了水`
    );

  }


  return "处理出了水";

}





// ============================================================
// 可以组合
//
// 数学：
//
// A + B = C
//
// 动物世界：
//
// A、B、C形成固定组合关系。
//
// C不是A和B现实意义上的“后代”。
// ============================================================

export function getCombineText({

  firstName,

  secondName,

  resultName

}) {

  if(
    firstName &&
    secondName &&
    resultName
  ){

    return (
      `「${firstName}」＋「${secondName}」可组合出「${resultName}」`
    );

  }


  return (
    "这两只动物可以组合"
  );

}





// ============================================================
// 可以处理
//
// 数学底层：约分
//
// 动物世界：
// 两只动物一起处理，
// 分别得到新的动物状态。
// ============================================================

export function getReduceText({

  firstName,

  secondName,

  firstResultName,

  secondResultName

}) {

  if(
    firstName &&
    secondName &&
    firstResultName &&
    secondResultName
  ){

    return (
      `「${firstName}」与「${secondName}」可处理为「${firstResultName}」和「${secondResultName}」`
    );

  }


  return (
    "这两只动物可以一起处理"
  );

}





// ============================================================
// 既可以组合，也可以处理
// ============================================================

export function getCombineAndReduceText({

  firstName,

  secondName,

  combineResultName,

  firstReduceResultName,

  secondReduceResultName

}) {

  if(
    firstName &&
    secondName &&
    combineResultName &&
    firstReduceResultName &&
    secondReduceResultName
  ){

    return (
      `可组合出「${combineResultName}」，或处理为「${firstReduceResultName}」和「${secondReduceResultName}」`
    );

  }


  return (
    "可以组合，也可以一起处理"
  );

}





// ============================================================
// 组合失败原因
//
// 这里直接接收 actionStatus.js
// 当前返回的 reason。
// ============================================================

export function getCombineBlockedText({

  reason,

  firstName,

  secondName

}) {


  // ==========================================================
  // 棋盘已满
  // ==========================================================

  if(
    reason ===
    "没有空位，放不下新的数字"
  ){

    return (
      "棋盘已经放满了，先处理一些动物"
    );

  }





  // ==========================================================
  // 不能再和自己的直接来源组合
  // ==========================================================

  if(
    reason ===
    "它不能再和组成自己的数字合成"
  ){

    if(
      firstName &&
      secondName
    ){

      return (
        `「${firstName}」和「${secondName}」已有直接来源关系`
      );

    }


    return (
      "这两只动物已有直接来源关系"
    );

  }





  // ==========================================================
  // 这两个数字已经组合过
  // ==========================================================

  if(
    reason ===
    "这两个数字已经合成过一次"
  ){

    if(
      firstName &&
      secondName
    ){

      return (
        `「${firstName}」和「${secondName}」已经组合过了`
      );

    }


    return (
      "这个组合已经出现过了"
    );

  }





  // ==========================================================
  // 水不能参与普通组合
  // ==========================================================

  if(
    reason ===
    "1只能直接消除"
  ){

    return (
      "水不能参与组合"
    );

  }





  // ==========================================================
  // 普通规则限制
  // ==========================================================

  if(
    reason ===
    "这两个数字现在不能合成"
  ){

    if(
      firstName &&
      secondName
    ){

      return (
        `「${firstName}」和「${secondName}」目前无法组合`
      );

    }


    return (
      "这两只动物目前无法组合"
    );

  }





  // ==========================================================
  // 兜底
  // ==========================================================

  if(
    firstName &&
    secondName
  ){

    return (
      `「${firstName}」和「${secondName}」目前没有可用组合`
    );

  }


  return (
    "这两只动物目前没有可用组合"
  );

}





// ============================================================
// 不能组合，但还能处理
// ============================================================

export function getBlockedButReducibleText({

  blockedText,

  firstResultName,

  secondResultName

}) {


  if(
    blockedText &&
    firstResultName &&
    secondResultName
  ){

    return (
      `${blockedText}，但可以处理为「${firstResultName}」和「${secondResultName}」`
    );

  }


  if(
    blockedText
  ){

    return blockedText;

  }


  return (
    "不能组合，但可以一起处理"
  );

}