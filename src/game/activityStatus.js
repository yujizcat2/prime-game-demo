import {
  canCombine,
  canCombineRelation,
  canReduce,
  combineValue
} from "./rules";

import {
  isPrime
} from "./prime";



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
// 9格       → 0.50
//
// 数字太少：
// 关系不足，活性低。
//
// 中间区域：
// 关系丰富，同时还有扩展空间，
// 活性最高。
//
// 接近满盘：
// 容量压力增大，活性下降。
// ============================================================

function getCapacityFactor(
  count
) {


  // ==========================================================
  // 0格 / 1格
  // 无法形成数字对
  // ==========================================================

  if(
    count <= 1
  ){

    return 0;

  }



  // ==========================================================
  // 2格
  // ==========================================================

  if(
    count === 2
  ){

    return 0.35;

  }



  // ==========================================================
  // 3格
  // ==========================================================

  if(
    count === 3
  ){

    return 0.55;

  }



  // ==========================================================
  // 4格
  // ==========================================================

  if(
    count === 4
  ){

    return 0.75;

  }



  // ==========================================================
  // 5格
  // ==========================================================

  if(
    count === 5
  ){

    return 0.95;

  }



  // ==========================================================
  // 6格
  //
  // 当前设定中的理想活跃区
  // ==========================================================

  if(
    count === 6
  ){

    return 1;

  }



  // ==========================================================
  // 7格
  // ==========================================================

  if(
    count === 7
  ){

    return 0.9;

  }



  // ==========================================================
  // 8格
  //
  // 警戒线
  // ==========================================================

  if(
    count === 8
  ){

    return 0.7;

  }



  // ==========================================================
  // 9格
  //
  // 高容量压力
  // ==========================================================

  return 0.5;

}



function interpolateScore(
  value,
  points
) {


  for(
    let index = 1;
    index < points.length;
    index++
  ){

    const [previousValue, previousScore] =
      points[index - 1];

    const [nextValue, nextScore] =
      points[index];

    if(
      value <= nextValue
    ){

      const progress =
        (value - previousValue) /
        (nextValue - previousValue);

      return previousScore +
        (nextScore - previousScore) * progress;

    }

  }


  return points[points.length - 1][1];

}



function getMoveScore(
  legalActions
) {

  return interpolateScore(
    legalActions,
    [
      [0, 0],
      [1, 15],
      [2, 30],
      [3, 42],
      [4, 52],
      [6, 65],
      [8, 74],
      [12, 85],
      [20, 100]
    ]
  );

}



function getSpaceScore(
  count
) {

  const scores = [
    100,
    100,
    100,
    100,
    95,
    85,
    70,
    50,
    25,
    0
  ];

  return scores[
    Math.max(
      0,
      Math.min(9, count)
    )
  ];

}



function getRescueScore(
  reduceLegal
) {

  return interpolateScore(
    reduceLegal,
    [
      [0, 0],
      [1, 30],
      [2, 55],
      [3, 70],
      [4, 82],
      [5, 90],
      [9, 100]
    ]
  );

}



export function getActivityText(
  activity
) {

  if(activity >= 85) return "非常宽松";
  if(activity >= 70) return "选择很多";
  if(activity >= 55) return "还有余地";
  if(activity >= 40) return "逐渐受限";
  if(activity >= 25) return "有些拥挤";
  if(activity >= 10) return "快没路了";
  if(activity > 0) return "只剩一线";

  return "无路可走";
}





// ============================================================
// 获取棋盘活动空间
//
// 最终百分比只由真正合法的动作、剩余格数和处理能力决定。
// ============================================================

export function getActivityStatus(
  numbers = [],
  primeDensity = 0,
  steps = 0
) {


  // ==========================================================
  // 质密安全处理
  //
  // primeDensity 是九宫格中的对应料理数量（0～9），
  // 先换算为 0～1 的比例再参与计算。
  // ==========================================================

  const density =

    Math.max(
      0,
      Math.min(
        9,
        Number(
          primeDensity
        ) || 0
      )
    );



  // ==========================================================
  // 质密系数
  //
  // 质密 0 / 9
  // → 1.00
  //
  // 质密 9 / 9
  // → 0.50
  // ==========================================================

  const densityFactor =

    1 -
    0.5 *
    (
      density /
      9
    );



  // ==========================================================
  // 当前动作权重
  // ==========================================================

  // 普通合成
  const normalCombineWeight =
    densityFactor;


  // 合成后得到质数
  const primeCombineWeight =

    0.5 *
    densityFactor;


  // 约分
  //
  // 约分通常能够重新打开棋盘，
  // 因此受到质密的影响较小。
  const reduceWeight =

    0.8 +
    0.2 *
    densityFactor;



  // ==========================================================
  // 空棋盘
  // ==========================================================

  if(
    !Array.isArray(numbers) ||
    numbers.length === 0
  ){

    return {

      activity: 0,

      activityScore: 0,

      activityMax: 0,

      potentialActivity: 0,

      moveScore: 0,

      spaceScore: 100,

      rescueScore: 0,

      diversityBonus: 0,

      openingBoost: 0,


      legal: 0,

      total: 0,


      combineLegal: 0,

      combinePotential: 0,

      combineTotal: 0,

      combineActivity: 0,


      combinePrimeLegal: 0,

      combineNormalLegal: 0,


      reduceLegal: 0,

      reduceTotal: 0,

      reduceActivity: 0,


      removeLegal: 0,


      pairCount: 0,


      primeDensity:
        density,

      densityFactor,

      capacityFactor: 0,

      blockedCombineFactor: 1,


      normalCombineWeight,

      primeCombineWeight,

      reduceWeight,


      dead: true

    };

  }



  // ==========================================================
  // 当前数字数量
  // ==========================================================

  const count =
    numbers.length;



  // ==========================================================
  // 当前容量活性系数
  // ==========================================================

  const capacityFactor =

    getCapacityFactor(
      count
    );



  // ==========================================================
  // 满盘合成系数
  //
  // 未满盘：
  // 潜在合成关系正常计算。
  //
  // 9格满盘：
  // 实际合成无法执行，新增料理方向的潜力为0。
  // ==========================================================

  const blockedCombineFactor =

    count >= 9

      ? 0

      : 1;



  // ==========================================================
  // 数字对数量
  //
  // C(n,2)
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
  // 活动空间使用百分制。
  // ==========================================================

  const activityMax = 100;



  // ==========================================================
  // 当前真实合法动作
  // ==========================================================

  let combineLegal = 0;

  let reduceLegal = 0;



  // ==========================================================
  // 潜在合成关系
  // ==========================================================

  let combinePotential = 0;



  // ==========================================================
  // 合成结果分类
  // ==========================================================

  let combinePrimeLegal = 0;

  let combineNormalLegal = 0;



  // ==========================================================
  // 活性累计
  // ==========================================================

  let combineActivity = 0;

  let reduceActivity = 0;



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
      // 当前真实可执行合成
      //
      // 满9格时，
      // canCombine 应返回 false。
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
      // 不考虑棋盘是否满格。
      // ======================================================

      if(
        canCombineRelation(
          first,
          second,
          numbers
        )
      ){


        combinePotential++;



        // ====================================================
        // 合成结果
        // ====================================================

        const result =

          combineValue(
            first.value,
            second.value
          );



        // ====================================================
        // 合成后得到质数
        // ====================================================

        if(
          isPrime(
            result
          )
        ){


          combinePrimeLegal++;


          combineActivity +=
            primeCombineWeight;


        }



        // ====================================================
        // 合成后得到非质数
        // ====================================================

        else{


          combineNormalLegal++;


          combineActivity +=
            normalCombineWeight;


        }


      }



      // ======================================================
      // 约分
      // ======================================================

      if(
        canReduce(
          first,
          second
        )
      ){


        reduceLegal++;


        reduceActivity +=
          reduceWeight;


      }


    }

  }



  // ==========================================================
  // 当前棋盘上的1
  //
  // 消除1不参与活性计算，
  // 但参与死局判断。
  // ==========================================================

  const removeLegal = 0;



  // ==========================================================
  // 当前真实合法动作数量
  //
  // 不包含消除1。
  // ==========================================================

  const legal =

    combineLegal +
    reduceLegal;



  // ==========================================================
  // 潜在关系活性
  //
  // 未满盘：
  //
  // 合成活性
  // +
  // 约分活性
  //
  //
  // 满盘：
  //
  // 合成活性 × 0
  // +
  // 约分活性
  // ==========================================================

  const potentialActivity =

    combineActivity *
    blockedCombineFactor

    +

    reduceActivity;



  // ==========================================================
  // 活动空间的三个组成部分。
  // ==========================================================

  const moveScore =

    getMoveScore(
      legal
    );


  const spaceScore =

    getSpaceScore(
      count
    );


  const rescueScore =

    getRescueScore(
      reduceLegal
    );


  const diversityBonus =

    combineLegal > 0 &&
    reduceLegal > 0

      ? 5

      : 0;


  const activityScore =

    moveScore * 0.5 +
    spaceScore * 0.3 +
    rescueScore * 0.2 +
    diversityBonus;


  const openingBoost =

    Number(steps) <= 3 &&
    count >= 3 &&
    legal >= 4

      ? 15

      : 0;


  const boostedActivityScore =

    Math.min(
      95,
      activityScore + openingBoost
    );



  // ==========================================================
  // 拥挤状态封顶。
  // ==========================================================

  const activityCap =

    legal === 1

      ? 5

      : legal === 2

        ? 12

        : legal === 3

          ? 22

          : count >= 9

            ? 35

            : count === 8

              ? 60

              : 95;



  // ==========================================================
  // 死局
  //
  // 必须根据真实可执行动作判断。
  // ==========================================================

  const dead =

    combineLegal === 0 &&
    reduceLegal === 0;



  // 死局不因潜在关系保留活动空间。
  const activity =

    count <= 2 ||
    dead

      ? 0

      : Math.round(

          Math.max(
            0,
            Math.min(
              95,
              activityCap,
              boostedActivityScore
            )
          )

        );



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

    moveScore,

    spaceScore,

    rescueScore,

    diversityBonus,

    openingBoost,


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

    reduceTotal,

    reduceActivity,


    // ========================
    // 消除1
    // ========================

    removeLegal,


    // ========================
    // 棋盘
    // ========================

    pairCount,


    // ========================
    // 环境系数
    // ========================

    primeDensity:
      density,

    densityFactor,

    capacityFactor,

    blockedCombineFactor,


    // ========================
    // 当前动作权重
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
