export const CHECKPOINT_CONFIG = {


  // =========================
  // 每个阶段多少步
  // =========================

  // 10 = 每10步检查一次

  STEP_INTERVAL: 10,



  // =========================
  // 检查点最低分
  // =========================

  // 这里只是测试数值
  // 后续通过 AI / 玩家测试不断调整
  //
  // ...

  REQUIRED_SCORES: [

    30,      // 10步
    100,     // 20步
    200,     // 30步
    300,     // 40步
    400,     // 50步
    500,     // 60步
    600,    // 70步
    700,    // 80步
    800,    // 90步
    1000     // 100步

  ],



  // =========================
  // 超出表格后的临时算法
  // =========================

  // 以后可以重新设计
  //
  // 防止玩家超过 REQUIRED_SCORES
  // 后没有检查标准

  EXTRA_SCORE_GROWTH: 200

};





// =========================
// 获取某个检查点需要的分数
// =========================

export function getRequiredScore(
  stepLimit
){


  const checkpointNumber =

    Math.floor(
      stepLimit /
      CHECKPOINT_CONFIG.STEP_INTERVAL
    );


  const index =
    checkpointNumber - 1;



  // 配置表里存在

  if(
    index >= 0 &&
    index <
    CHECKPOINT_CONFIG
      .REQUIRED_SCORES
      .length
  ){

    return (
      CHECKPOINT_CONFIG
        .REQUIRED_SCORES[index]
    );

  }



  // 超出表格后
  // 临时使用线性增长

  const lastScore =

    CHECKPOINT_CONFIG
      .REQUIRED_SCORES[
        CHECKPOINT_CONFIG
          .REQUIRED_SCORES
          .length - 1
      ];


  const extraLevels =

    checkpointNumber
    -
    CHECKPOINT_CONFIG
      .REQUIRED_SCORES
      .length;


  return (

    lastScore
    +
    extraLevels
    *
    CHECKPOINT_CONFIG
      .EXTRA_SCORE_GROWTH

  );

}