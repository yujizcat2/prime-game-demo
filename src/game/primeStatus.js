import {
  isPrime
} from "./prime";


// ============================================================
// 棋盘质数状态
//
// 1. 质能 Prime Energy
//    当前棋盘所有质数的数值之和
//
// 2. 质密 Prime Density
//    当前棋盘质数的数量
//
// 3. 质态 Prime State
//    根据质能 + 质密生成文字状态
// ============================================================



// ============================================================
// 质能
// ============================================================

export function getPrimeEnergy(
  numbers
) {


  if(
    !Array.isArray(numbers)
  ){

    return 0;

  }


  return numbers.reduce(

    (
      total,
      item
    ) => {


      if(
        isPrime(
          item.value
        )
      ){

        return (
          total +
          item.value
        );

      }


      return total;

    },

    0

  );

}



// ============================================================
// 质密
// ============================================================

export function getPrimeDensity(
  numbers
) {


  if(
    !Array.isArray(numbers)
  ){

    return 0;

  }


  return numbers.reduce(

    (
      total,
      item
    ) => {


      if(
        isPrime(
          item.value
        )
      ){

        return (
          total +
          1
        );

      }


      return total;

    },

    0

  );

}



// ============================================================
// 质态
//
// 第一版临时阈值：
//
// 质密
// 0 - 2  = 低
// 3 - 4  = 中
// 5+     = 高
//
// 质能
// 0 - 49   = 低
// 50 - 119 = 中
// 120+     = 高
//
// 后续根据实际游戏数据重新调整
// ============================================================

export function getPrimeState(
  primeEnergy,
  primeDensity
) {


  // ==========================================================
  // 质能等级
  // ==========================================================

  let energyLevel =
    "low";


  if(
    primeEnergy >= 200
  ){

    energyLevel =
      "high";

  }
  else if(
    primeEnergy >= 100
  ){

    energyLevel =
      "medium";

  }



  // ==========================================================
  // 质密等级
  // ==========================================================

  let densityLevel =
    "low";


  if(
    primeDensity >= 7
  ){

    densityLevel =
      "high";

  }
  else if(
    primeDensity >= 3
  ){

    densityLevel =
      "medium";

  }



  // ==========================================================
  // 低质能
  // ==========================================================

  if(
    energyLevel === "low" &&
    densityLevel === "low"
  ){

    return "沉寂";

  }


  if(
    energyLevel === "low" &&
    densityLevel === "medium"
  ){

    return "微光";

  }


  if(
    energyLevel === "low" &&
    densityLevel === "high"
  ){

    return "繁生";

  }



  // ==========================================================
  // 中质能
  // ==========================================================

  if(
    energyLevel === "medium" &&
    densityLevel === "low"
  ){

    return "凝聚";

  }


  if(
    energyLevel === "medium" &&
    densityLevel === "medium"
  ){

    return "活跃";

  }


  if(
    energyLevel === "medium" &&
    densityLevel === "high"
  ){

    return "旺盛";

  }



  // ==========================================================
  // 高质能
  // ==========================================================

  if(
    energyLevel === "high" &&
    densityLevel === "low"
  ){

    return "聚能";

  }


  if(
    energyLevel === "high" &&
    densityLevel === "medium"
  ){

    return "强盛";

  }


  return "共鸣";

}