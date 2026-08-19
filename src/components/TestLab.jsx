import {
  useState
} from "react";

import {
  runRandomTests,
  summarizeRandomResults
} from "../test/testRunner";

import {
  runScoreBeamTests,
  summarizeScoreBeamResults
} from "../test/scoreBeamRunner";



export default function TestLab({
  onBack
}){


  // ==========================================================
  // 初始数字输入
  // ==========================================================

  const [
    initialInput,
    setInitialInput
  ] = useState(
    "2,3,5,7"
  );



  // ==========================================================
  // 测试次数
  // ==========================================================

  const [
    testCount,
    setTestCount
  ] = useState(
    1000
  );



  // ==========================================================
  // AI策略
  // ==========================================================

  const [
    strategy,
    setStrategy
  ] = useState(
    "random"
  );



  // ==========================================================
  // Score Beam 参数
  // ==========================================================

  const [
    beamDepth,
    setBeamDepth
  ] = useState(
    4
  );


  const [
    beamWidth,
    setBeamWidth
  ] = useState(
    50
  );



  // ==========================================================
  // 测试结果
  // ==========================================================

  const [
    summary,
    setSummary
  ] = useState(
    null
  );



  // ==========================================================
  // 状态
  // ==========================================================

  const [
    running,
    setRunning
  ] = useState(
    false
  );


  const [
    error,
    setError
  ] = useState(
    ""
  );





  // ==========================================================
  // 解析初始数字
  // ==========================================================

  function parseInitialValues(){


    const values =

      initialInput

        .split(",")

        .map(

          item =>
            Number(
              item.trim()
            )

        )

        .filter(

          value =>
            !Number.isNaN(value)

        );


    return values;

  }





  // ==========================================================
  // 开始测试
  // ==========================================================

  function handleRunTest(){


    setError("");


    setSummary(null);



    const initialValues =
      parseInitialValues();



    // ========================================================
    // 初始数字检查
    // ========================================================

    if(
      initialValues.length < 2
    ){


      setError(
        "至少需要输入两个数字"
      );


      return;

    }



    if(
      initialValues.some(

        value =>
          value < 2 ||
          value > 101

      )
    ){


      setError(
        "数字范围必须在 2 ～ 101"
      );


      return;

    }



    // ========================================================
    // 测试次数检查
    // ========================================================

    const count =

      Math.floor(

        Number(
          testCount
        )

      );



    if(
      !count ||
      count <= 0
    ){


      setError(
        "测试次数必须大于 0"
      );


      return;

    }



    // ========================================================
    // Beam 参数
    // ========================================================

    const depth =

      Math.max(

        1,

        Math.floor(
          Number(
            beamDepth
          ) || 1
        )

      );


    const width =

      Math.max(

        1,

        Math.floor(
          Number(
            beamWidth
          ) || 1
        )

      );



    // ========================================================
    // 开始测试
    // ========================================================

    setRunning(
      true
    );



    try{


      let results;

      let resultSummary;



      // ======================================================
      // Random
      // ======================================================

      if(
        strategy === "random"
      ){


        results =

          runRandomTests(

            initialValues,

            count

          );



        resultSummary =

          summarizeRandomResults(
            results
          );

      }



      // ======================================================
      // Score Beam
      // ======================================================

      else if(
        strategy === "score_beam"
      ){


        results =

          runScoreBeamTests(

            initialValues,

            count,

            {
              depth,
              beamWidth:
                width
            }

          );



        resultSummary =

          summarizeScoreBeamResults(
            results
          );

      }



      // ======================================================
      // 未知策略
      // ======================================================

      else{


        throw new Error(
          "未知AI策略"
        );

      }



      // ======================================================
      // 写入结果
      // ======================================================

      setSummary(
        resultSummary
      );


    }


    catch(err){


      console.error(
        err
      );


      setError(

        err?.message ||
        "测试发生错误"

      );


    }


    finally{


      setRunning(
        false
      );


    }

  }





  // ==========================================================
  // 格式化数字
  // ==========================================================

  function formatNumber(
    value,
    digits = 2
  ){


    if(
      value === null ||
      value === undefined ||
      Number.isNaN(value)
    ){

      return "-";

    }


    return Number(
      value
    ).toFixed(
      digits
    );

  }





  // ==========================================================
  // 策略名称
  // ==========================================================

  function formatStrategyName(){


    if(
      strategy === "score_beam"
    ){

      return "Score Beam";

    }


    return "Random";

  }





  // ==========================================================
  // 页面
  // ==========================================================

  return (

    <div
      className="
        min-h-screen
        bg-gray-50
        p-8
      "
    >


      <div
        className="
          max-w-4xl
          mx-auto
        "
      >



        {/* ================================================== */}
        {/* 返回 */}
        {/* ================================================== */}

        {
          onBack &&
          (

            <button

              onClick={
                onBack
              }

              className="
                mb-6
                text-sm
                text-gray-500
                hover:text-black
              "

            >

              ← 返回游戏

            </button>

          )
        }





        {/* ================================================== */}
        {/* 标题 */}
        {/* ================================================== */}

        <h1
          className="
            text-3xl
            font-bold
            mb-8
          "
        >

          质数游戏测试实验室

        </h1>





        {/* ================================================== */}
        {/* 输入区域 */}
        {/* ================================================== */}

        <div
          className="
            bg-white
            border
            rounded-xl
            p-6
            mb-8
            shadow-sm
          "
        >



          {/* 初始数字 */}

          <div
            className="
              mb-6
            "
          >

            <label
              className="
                block
                font-medium
                mb-2
              "
            >

              初始数字

            </label>


            <input

              type="text"

              value={
                initialInput
              }

              onChange={

                event =>
                  setInitialInput(
                    event.target.value
                  )

              }

              placeholder="例如：2,3,5,7"

              className="
                w-full
                border
                rounded-lg
                px-4
                py-3
              "

            />


            <div
              className="
                text-sm
                text-gray-500
                mt-2
              "
            >

              使用英文逗号分隔，例如：
              2,3,5,7

            </div>

          </div>





          {/* 测试次数 */}

          <div
            className="
              mb-6
            "
          >

            <label
              className="
                block
                font-medium
                mb-2
              "
            >

              测试次数

            </label>


            <input

              type="number"

              min="1"

              value={
                testCount
              }

              onChange={

                event =>
                  setTestCount(
                    event.target.value
                  )

              }

              className="
                w-full
                border
                rounded-lg
                px-4
                py-3
              "

            />

          </div>





          {/* ================================================== */}
          {/* AI策略 */}
          {/* ================================================== */}

          <div
            className="
              mb-6
            "
          >

            <label
              className="
                block
                font-medium
                mb-2
              "
            >

              AI策略

            </label>


            <select

              value={
                strategy
              }

              onChange={

                event => {

                  const nextStrategy =
                    event.target.value;


                  setStrategy(
                    nextStrategy
                  );


                  setSummary(
                    null
                  );


                  setError(
                    ""
                  );


                  // Beam 是确定性算法
                  // 默认先测试1局

                  if(
                    nextStrategy ===
                    "score_beam"
                  ){

                    setTestCount(
                      1
                    );

                  }

                }

              }

              className="
                w-full
                border
                rounded-lg
                px-4
                py-3
                bg-white
              "

            >

              <option
                value="random"
              >
                Random
              </option>


              <option
                value="score_beam"
              >
                Score Beam
              </option>

            </select>

          </div>





          {/* ================================================== */}
          {/* Score Beam参数 */}
          {/* ================================================== */}

          {
            strategy === "score_beam" &&
            (

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-4
                  mb-6
                "
              >



                {/* Depth */}

                <div>


                  <label
                    className="
                      block
                      font-medium
                      mb-2
                    "
                  >

                    Depth

                  </label>


                  <input

                    type="number"

                    min="1"

                    value={
                      beamDepth
                    }

                    onChange={

                      event =>
                        setBeamDepth(
                          event.target.value
                        )

                    }

                    className="
                      w-full
                      border
                      rounded-lg
                      px-4
                      py-3
                    "

                  />


                  <div
                    className="
                      text-sm
                      text-gray-500
                      mt-2
                    "
                  >

                    每一步向未来搜索多少层

                  </div>


                </div>





                {/* Beam Width */}

                <div>


                  <label
                    className="
                      block
                      font-medium
                      mb-2
                    "
                  >

                    Beam Width

                  </label>


                  <input

                    type="number"

                    min="1"

                    value={
                      beamWidth
                    }

                    onChange={

                      event =>
                        setBeamWidth(
                          event.target.value
                        )

                    }

                    className="
                      w-full
                      border
                      rounded-lg
                      px-4
                      py-3
                    "

                  />


                  <div
                    className="
                      text-sm
                      text-gray-500
                      mt-2
                    "
                  >

                    每层最多保留多少个高评价状态

                  </div>


                </div>


              </div>

            )
          }





          {/* Beam提示 */}

          {
            strategy === "score_beam" &&
            (

              <div
                className="
                  mb-6
                  p-4
                  bg-gray-50
                  border
                  rounded-lg
                  text-sm
                  text-gray-600
                "
              >

                Score Beam 当前是确定性搜索。
                相同初始数字、Depth 和 Beam Width
                通常会得到相同结果，因此建议先测试 1 局。

              </div>

            )
          }





          {/* ================================================== */}
          {/* 开始按钮 */}
          {/* ================================================== */}

          <button

            onClick={
              handleRunTest
            }

            disabled={
              running
            }

            className="
              px-6
              py-3
              bg-black
              text-white
              rounded-lg
              disabled:opacity-50
            "

          >

            {

              running

                ? "测试中..."

                : strategy === "score_beam"

                  ? "开始 Score Beam 测试"

                  : "开始 Random 测试"

            }

          </button>





          {/* Error */}

          {
            error &&
            (

              <div
                className="
                  mt-4
                  text-red-600
                "
              >

                {error}

              </div>

            )
          }


        </div>





        {/* ================================================== */}
        {/* 测试结果 */}
        {/* ================================================== */}

        {
          summary &&
          (

            <div
              className="
                bg-white
                border
                rounded-xl
                p-6
                shadow-sm
              "
            >



              <h2
                className="
                  text-2xl
                  font-bold
                  mb-2
                "
              >

                测试结果

              </h2>



              {/* 当前策略 */}

              <div
                className="
                  text-sm
                  text-gray-500
                  mb-6
                "
              >

                当前策略：

                <span
                  className="
                    ml-2
                    font-semibold
                    text-gray-900
                  "
                >

                  {
                    formatStrategyName()
                  }

                </span>


                {
                  strategy === "score_beam" &&
                  (

                    <span
                      className="
                        ml-3
                      "
                    >

                      Depth:
                      {" "}
                      {beamDepth}

                      {" / "}

                      Width:
                      {" "}
                      {beamWidth}

                    </span>

                  )
                }

              </div>





              {/* ============================================ */}
              {/* 核心数据 */}
              {/* ============================================ */}

              <div
                className="
                  grid
                  grid-cols-2
                  md:grid-cols-3
                  gap-4
                  mb-8
                "
              >


                <StatBox
                  label="测试局数"
                  value={
                    summary.games
                  }
                />


                <StatBox
                  label="平均步数"
                  value={
                    formatNumber(
                      summary.averageSteps
                    )
                  }
                />


                <StatBox
                  label="最大步数"
                  value={
                    summary.maxSteps
                  }
                />


                <StatBox
                  label="最小步数"
                  value={
                    summary.minSteps
                  }
                />


                <StatBox
                  label="平均积分"
                  value={
                    formatNumber(
                      summary.averageScore
                    )
                  }
                />


                <StatBox
                  label="最高积分"
                  value={
                    summary.maxScore
                  }
                />


                <StatBox
                  label="最低积分"
                  value={
                    summary.minScore
                  }
                />


                <StatBox
                  label="平均收藏数"
                  value={
                    formatNumber(
                      summary.averageCollectionSize
                    )
                  }
                />


                <StatBox
                  label="最大收藏数"
                  value={
                    summary.maxCollectionSize
                  }
                />


                <StatBox
                  label="全局发现收藏种类"
                  value={
                    summary.discoveredCollectionTypes
                  }
                />


                <StatBox
                  label="平均最终数字数"
                  value={
                    formatNumber(
                      summary.averageFinalNumberCount
                    )
                  }
                />


                <StatBox
                  label="测试中最大数字"
                  value={
                    summary.maxNumberEver
                  }
                />


                <StatBox
                  label="平均操作数"
                  value={
                    formatNumber(
                      summary.averageActions
                    )
                  }
                />


              </div>





              {/* ============================================ */}
              {/* 操作统计 */}
              {/* ============================================ */}

              <h3
                className="
                  text-xl
                  font-semibold
                  mb-4
                "
              >

                平均操作

              </h3>



              <div
                className="
                  grid
                  grid-cols-3
                  gap-4
                  mb-8
                "
              >


                <StatBox
                  label="合成"
                  value={
                    formatNumber(
                      summary.averageCombine
                    )
                  }
                />


                <StatBox
                  label="约分"
                  value={
                    formatNumber(
                      summary.averageReduce
                    )
                  }
                />


                <StatBox
                  label="消除1"
                  value={
                    formatNumber(
                      summary.averageRemove
                    )
                  }
                />


              </div>





              {/* ============================================ */}
              {/* 结束原因 */}
              {/* ============================================ */}

              <h3
                className="
                  text-xl
                  font-semibold
                  mb-4
                "
              >

                结束原因

              </h3>



              <div
                className="
                  space-y-3
                "
              >

                {

                  Object.entries(
                    summary.endReasons || {}
                  ).map(

                    ([
                      reason,
                      count
                    ]) => {


                      const percentage =

                        summary
                          .endReasonPercentages?.[
                            reason
                          ];


                      return (

                        <div

                          key={
                            reason
                          }

                          className="
                            flex
                            justify-between
                            border-b
                            pb-2
                          "

                        >


                          <span>

                            {
                              formatEndReason(
                                reason
                              )
                            }

                          </span>


                          <span>

                            {count}

                            {" "}

                            (

                            {
                              formatNumber(
                                percentage
                              )
                            }

                            %)

                          </span>


                        </div>

                      );

                    }

                  )

                }

              </div>





              {/* ============================================ */}
              {/* Score Beam 最佳局 */}
              {/* ============================================ */}

              {
                strategy === "score_beam" &&
                summary.bestScoreGame &&
                (

                  <div
                    className="
                      mt-10
                    "
                  >


                    <h3
                      className="
                        text-xl
                        font-semibold
                        mb-4
                      "
                    >

                      Score Beam 最佳结果

                    </h3>



                    <div
                      className="
                        grid
                        grid-cols-2
                        md:grid-cols-3
                        gap-4
                        mb-4
                      "
                    >


                      <StatBox
                        label="最佳积分"
                        value={
                          summary.bestScoreGame.score
                        }
                      />


                      <StatBox
                        label="步数"
                        value={
                          summary.bestScoreGame.steps
                        }
                      />


                      <StatBox
                        label="收藏数"
                        value={
                          summary.bestScoreGame.collectionSize
                        }
                      />


                    </div>



                    <div
                      className="
                        border
                        rounded-lg
                        p-4
                      "
                    >


                      <div
                        className="
                          text-sm
                          text-gray-500
                          mb-2
                        "
                      >

                        收藏内容

                      </div>


                      <div
                        className="
                          font-medium
                          break-words
                        "
                      >

                        {
                          summary
                            .bestScoreGame
                            .collection
                            .join(", ")
                        }

                      </div>


                    </div>


                  </div>

                )
              }





              {/* ============================================ */}
              {/* 收藏频率 */}
              {/* ============================================ */}

              <h3
                className="
                  text-xl
                  font-semibold
                  mt-10
                  mb-2
                "
              >

                收藏频率

              </h3>


              <div
                className="
                  text-sm
                  text-gray-500
                  mb-4
                "
              >

                表示某个数字在多少局游戏中至少被收藏过一次

              </div>





              {/* ============================================ */}
              {/* collectionFrequencyList */}
              {/* ============================================ */}

              {
                summary.collectionFrequencyList &&
                summary.collectionFrequencyList.length > 0

                  ? (

                    <div
                      className="
                        border
                        rounded-lg
                        overflow-hidden
                      "
                    >



                      {/* 表头 */}

                      <div
                        className="
                          grid
                          grid-cols-3
                          gap-4
                          px-4
                          py-3
                          bg-gray-100
                          font-semibold
                        "
                      >


                        <div>
                          收藏数字
                        </div>


                        <div>
                          出现局数
                        </div>


                        <div>
                          出现率
                        </div>


                      </div>





                      {/* 收藏数据 */}

                      {

                        summary
                          .collectionFrequencyList
                          .map(

                            item => (

                              <div

                                key={
                                  item.value
                                }

                                className="
                                  grid
                                  grid-cols-3
                                  gap-4
                                  px-4
                                  py-3
                                  border-t
                                "

                              >


                                <div
                                  className="
                                    font-bold
                                  "
                                >

                                  {
                                    item.value
                                  }

                                </div>



                                <div>

                                  {
                                    item.count
                                  }

                                </div>



                                <div>

                                  {
                                    formatNumber(
                                      item.percentage
                                    )
                                  }

                                  %

                                </div>


                              </div>

                            )

                          )

                      }


                    </div>

                  )


                  : (

                    <div
                      className="
                        text-gray-500
                        border
                        rounded-lg
                        p-4
                      "
                    >

                      本次测试没有发现收藏数字

                    </div>

                  )
              }


            </div>

          )
        }


      </div>

    </div>

  );

}





// ============================================================
// 小统计卡片
// ============================================================

function StatBox({
  label,
  value
}){


  return (

    <div
      className="
        border
        rounded-lg
        p-4
      "
    >


      <div
        className="
          text-sm
          text-gray-500
          mb-1
        "
      >

        {label}

      </div>


      <div
        className="
          text-xl
          font-bold
        "
      >

        {value}

      </div>


    </div>

  );

}





// ============================================================
// 结束原因中文
// ============================================================

function formatEndReason(
  reason
){


  switch(
    reason
  ){


    case "checkpoint_failed":

      return "检查点积分不足";


    case "no_action":

      return "无合法操作";


    case "safety_limit":

      return "达到安全操作上限";


    case "invalid_action":

      return "测试器发现非法操作";


    default:

      return reason;

  }

}