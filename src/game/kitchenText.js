// ============================================================
// 料理世界语言层
//
// 这里只负责把底层游戏状态
// 翻译成玩家看到的料理语言。
//
// 不参与：
// - 合成判断
// - 约分判断
// - 数值计算
// - foodType 规则
// ============================================================



// ============================================================
// 默认提示
// ============================================================

export function getEmptyText() {

  return "选择两道料理";

}





// ============================================================
// 只选择一道料理
// ============================================================

export function getSingleText(
  name
) {

  if(
    !name
  ){

    return "再选一道料理";

  }


  return (
    `已选择「${name}」，再选一道料理`
  );

}





// ============================================================
// 获得1
//
// 当前料理世界里：
// 数字1暂时表现为“原汁”
//
// 后续如果决定换成其他名称，
// 只需要修改这里的文字层。
// ============================================================

export function getWaterText(
  sourceName
) {

  if(
    sourceName
  ){

    return (
      `从「${sourceName}」中处理出了原汁`
    );

  }


  return "处理出了原汁";

}





// ============================================================
// 可以组成三拼
//
// 数学：
//
// A + B = C
//
// 料理世界：
//
// A、B、C形成一个固定三拼关系。
//
// C不是A和B“制作出来”的。
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
      `「${firstName}」＋「${secondName}」可与「${resultName}」组成三拼`
    );

  }


  return (
    "这两道料理可以组成一组三拼"
  );

}





// ============================================================
// 可以处理
//
// 数学底层：约分
//
// 料理世界：
// 两道料理一起处理，
// 分别得到新的料理状态。
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
    "这两道料理可以一起处理"
  );

}





// ============================================================
// 既可以组成三拼，也可以处理
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
      `可与「${combineResultName}」组成三拼，或处理为「${firstReduceResultName}」和「${secondReduceResultName}」`
    );

  }


  return (
    "可以组成三拼，也可以一起处理"
  );

}





// ============================================================
// 三拼失败原因
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
  // 主菜盘已满
  // ==========================================================

  if(
    reason ===
    "没有空位，放不下新的数字"
  ){

    return (
      "主菜盘已经放满了，先处理一些料理"
    );

  }





  // ==========================================================
  // 不能再和自己的直接来源组成新的三拼
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
        `「${firstName}」和「${secondName}」已有直接拼盘关系`
      );

    }


    return (
      "这两道料理已有直接拼盘关系"
    );

  }





  // ==========================================================
  // 这两个数字已经合成过
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
        `「${firstName}」和「${secondName}」的三拼已经搭配过了`
      );

    }


    return (
      "这组三拼已经搭配过了"
    );

  }





  // ==========================================================
  // 原汁不能参与普通料理
  // ==========================================================

  if(
    reason ===
    "1只能直接消除"
  ){

    return (
      "原汁不能参与三拼"
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
        `「${firstName}」和「${secondName}」目前无法组成三拼`
      );

    }


    return (
      "这两道料理目前无法组成三拼"
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
      `「${firstName}」和「${secondName}」目前没有可用的三拼`
    );

  }


  return (
    "这两道料理目前没有可用的三拼"
  );

}





// ============================================================
// 不能组成三拼，但还能处理
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
    "不能组成三拼，但可以一起处理"
  );

}