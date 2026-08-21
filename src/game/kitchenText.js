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
// - animal 规则
// ============================================================



// ============================================================
// 默认提示
// ============================================================

export function getEmptyText() {

  return "选择两种食材";

}



// ============================================================
// 只选择一个普通食材
// ============================================================

export function getSingleText(
  name
) {

  if (
    !name
  ) {

    return "再选一种食材";

  }


  return (
    `已选择「${name}」，再选一种食材`
  );

}



// ============================================================
// 获得水
// ============================================================

export function getWaterText(
  sourceName
) {

  if (
    sourceName
  ) {

    return (
      `从「${sourceName}」中获得了水`
    );

  }


  return "获得了水";

}



// ============================================================
// 可以料理
// ============================================================

export function getCombineText({

  firstName,

  secondName,

  resultName

}) {

  if (
    firstName &&
    secondName &&
    resultName
  ) {

    return (
      `「${firstName}」＋「${secondName}」可用于料理「${resultName}」`
    );

  }


  return (
    "这两种食材可以搭配料理"
  );

}



// ============================================================
// 可以处理
// ============================================================

export function getReduceText({

  firstName,

  secondName,

  firstResultName,

  secondResultName

}) {

  if (
    firstName &&
    secondName &&
    firstResultName &&
    secondResultName
  ) {

    return (
      `「${firstName}」＋「${secondName}」可以处理成「${firstResultName}」和「${secondResultName}」`
    );

  }


  return (
    "这两种食材可以一起处理"
  );

}



// ============================================================
// 既可以料理，也可以处理
// ============================================================

export function getCombineAndReduceText({

  firstName,

  secondName,

  combineResultName,

  firstReduceResultName,

  secondReduceResultName

}) {

  if (
    firstName &&
    secondName &&
    combineResultName &&
    firstReduceResultName &&
    secondReduceResultName
  ) {

    return (
      `「${firstName}」＋「${secondName}」可用于料理「${combineResultName}」，也可以处理成「${firstReduceResultName}」和「${secondReduceResultName}」`
    );

  }


  return (
    "这两种食材可以料理，也可以一起处理"
  );

}



// ============================================================
// 料理失败原因
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
  // 操作台已满
  // ==========================================================

  if (
    reason ===
    "没有空位，放不下新的数字"
  ) {

    return (
      "操作台已经放满了，先处理一些食材"
    );

  }



  // ==========================================================
  // 和自己的来源再次搭配
  // ==========================================================

  if (
    reason ===
    "它不能再和组成自己的数字合成"
  ) {

    if (
      firstName &&
      secondName
    ) {

      return (
        `「${firstName}」和「${secondName}」已有直接料理关系，不能再次搭配`
      );

    }


    return (
      "这两种食材已有直接料理关系，不能再次搭配"
    );

  }



  // ==========================================================
  // 已经搭配过
  // ==========================================================

  if (
    reason ===
    "这两个数字已经合成过一次"
  ) {

    if (
      firstName &&
      secondName
    ) {

      return (
        `「${firstName}」＋「${secondName}」这份搭配已经做过了`
      );

    }


    return (
      "这份搭配已经做过了"
    );

  }



  // ==========================================================
  // 水不能参与普通料理
  // ==========================================================

  if (
    reason ===
    "1只能直接消除"
  ) {

    return (
      "水不能参与普通料理"
    );

  }



  // ==========================================================
  // 普通规则限制
  // ==========================================================

  if (
    reason ===
    "这两个数字现在不能合成"
  ) {

    if (
      firstName &&
      secondName
    ) {

      return (
        `「${firstName}」＋「${secondName}」目前不适合继续搭配`
      );

    }


    return (
      "这两种食材目前不适合继续搭配"
    );

  }



  // ==========================================================
  // 兜底
  // ==========================================================

  if (
    firstName &&
    secondName
  ) {

    return (
      `「${firstName}」＋「${secondName}」目前不能继续搭配`
    );

  }


  return (
    "这两种食材目前不能继续搭配"
  );

}



// ============================================================
// 不能料理，但还能处理
// ============================================================

export function getBlockedButReducibleText({

  blockedText,

  firstResultName,

  secondResultName

}) {


  if (
    blockedText &&
    firstResultName &&
    secondResultName
  ) {

    return (
      `${blockedText}，但可以处理成「${firstResultName}」和「${secondResultName}」`
    );

  }


  if (
    blockedText
  ) {

    return blockedText;

  }


  return (
    "不能继续搭配，但可以一起处理"
  );

}