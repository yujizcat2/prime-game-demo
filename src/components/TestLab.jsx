import {
  useState
} from "react";

import {
  runRandomExplorer
} from "../test/randomExplorer";

import {
  runSmartExplorer,
  SMART_AI_MODES
} from "../test/smartExplorer";

import "./TestLab.css";





// ============================================================
// 测试模式
// ============================================================

const TEST_MODES = {

  RANDOM:
    "random",

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection"

};





// ============================================================
// Random 可选局数
// ============================================================

const RANDOM_GAME_OPTIONS = [

  10,
  100,
  1000,
  10000,
  100000,
  500000,
  1000000

];





// ============================================================
// Smart AI 第一版
// ============================================================

const SMART_GAME_OPTIONS = [

  1,
  10

];





export default function TestLab({

  onBack

}) {


  // ==========================================================
  // 模式
  // ==========================================================

  const [
    mode,
    setMode
  ] = useState(
    TEST_MODES.RANDOM
  );



  // ==========================================================
  // 局数
  // ==========================================================

  const [
    games,
    setGames
  ] = useState(
    100
  );



  // ==========================================================
  // 是否运行
  // ==========================================================

  const [
    running,
    setRunning
  ] = useState(
    false
  );



  // ==========================================================
  // 进度
  // ==========================================================

  const [
    progress,
    setProgress
  ] = useState(
    null
  );



  // ==========================================================
  // 结果
  // ==========================================================

  const [
    result,
    setResult
  ] = useState(
    null
  );



  // ==========================================================
  // 错误
  // ==========================================================

  const [
    error,
    setError
  ] = useState(
    null
  );





  // ==========================================================
  // Smart 模式
  // ==========================================================

  const isSmartMode =

    mode !==
    TEST_MODES.RANDOM;





  // ==========================================================
  // 当前局数选项
  // ==========================================================

  const gameOptions =

    isSmartMode

      ?

      SMART_GAME_OPTIONS

      :

      RANDOM_GAME_OPTIONS;





  // ==========================================================
  // 切换模式
  // ==========================================================

  function changeMode(
    nextMode
  ){


    if(
      running
    ){

      return;

    }



    setMode(
      nextMode
    );


    setProgress(
      null
    );


    setResult(
      null
    );


    setError(
      null
    );



    if(
      nextMode ===
      TEST_MODES.RANDOM
    ){


      setGames(
        100
      );

    }
    else{


      setGames(
        1
      );

    }

  }





  // ==========================================================
  // 开始测试
  // ==========================================================

  async function runTest(){


    if(
      running
    ){

      return;

    }



    setRunning(
      true
    );


    setProgress(
      null
    );


    setResult(
      null
    );


    setError(
      null
    );



    try{


      let testResult;



      // ======================================================
      // Random
      // ======================================================

      if(
        mode ===
        TEST_MODES.RANDOM
      ){


        testResult =

          await runRandomExplorer({

            games,

            maxActionsPerGame:
              1000,

            batchSize:
              1000,


            onProgress:
              data => {


                setProgress(
                  data
                );

              }

          });

      }



      // ======================================================
      // 最长步数 AI
      // ======================================================

      else if(
        mode ===
        TEST_MODES.SURVIVAL
      ){


        testResult =

          await runSmartExplorer({

            mode:
              SMART_AI_MODES.SURVIVAL,

            games,

            depth:
              4,

            beamWidth:
              50,


            // =================================================
            // 循环检测存在以后，
            // 正常情况下不会真的跑到10000。
            //
            // 如果没有循环，
            // 10000仍然作为安全保护。
            // =================================================

            maxActionsPerGame:
              10000,


            onProgress:
              data => {


                setProgress(
                  data
                );

              }

          });

      }



      // ======================================================
      // 最多收藏 AI
      // ======================================================

      else{


        testResult =

          await runSmartExplorer({

            mode:
              SMART_AI_MODES.COLLECTION,

            games,

            depth:
              4,

            beamWidth:
              50,

            maxActionsPerGame:
              1000,


            onProgress:
              data => {


                setProgress(
                  data
                );

              }

          });

      }



      setResult(
        testResult
      );


    }
    catch(
      err
    ){


      console.error(
        err
      );


      setError(

        err?.message
        ?? "测试失败"

      );


    }
    finally{


      setRunning(
        false
      );

    }

  }





  // ==========================================================
  // 模式标题
  // ==========================================================

  function getModeTitle(){


    if(
      mode ===
      TEST_MODES.SURVIVAL
    ){


      return "最长步数 AI";

    }



    if(
      mode ===
      TEST_MODES.COLLECTION
    ){


      return "最多收藏 AI";

    }



    return "随机探路";

  }





  // ==========================================================
  // 模式说明
  // ==========================================================

  function getModeDescription(){


    if(
      mode ===
      TEST_MODES.SURVIVAL
    ){


      return (

        <>

          AI 会搜索未来局面，

          <br />

          尽可能让棋盘继续存活。

        </>

      );

    }



    if(
      mode ===
      TEST_MODES.COLLECTION
    ){


      return (

        <>

          AI 会搜索未来局面，

          <br />

          尽可能收藏更多不同数字。

        </>

      );

    }



    return (

      <>

        每一步从所有合法动作中随机选择。

        <br />

        一直运行到没有合法动作。

      </>

    );

  }





  return (

    <div
      className="
        test-lab-page
      "
    >


      <div
        className="
          test-lab-shell
        "
      >



        {/* =====================================================
            Header
        ===================================================== */}

        <header
          className="
            test-lab-header
          "
        >


          <div>


            <div
              className="
                test-lab-kicker
              "
            >

              DEVELOPMENT TOOL

            </div>


            <h1>

              探路实验室

            </h1>


          </div>



          <button

            type="button"

            className="
              test-lab-back
            "

            onClick={
              onBack
            }

            disabled={
              running
            }

          >

            ← 返回

          </button>


        </header>





        {/* =====================================================
            模式选择
        ===================================================== */}

        <section
          className="
            test-lab-control
          "
        >


          <div
            className="
              test-lab-label
            "
          >

            测试模式

          </div>



          <div
            className="
              test-lab-options
            "
          >


            <button

              type="button"

              className={

                mode ===
                TEST_MODES.RANDOM

                  ?

                  "test-lab-option is-active"

                  :

                  "test-lab-option"

              }

              disabled={
                running
              }

              onClick={() =>

                changeMode(
                  TEST_MODES.RANDOM
                )

              }

            >

              随机探路

            </button>



            <button

              type="button"

              className={

                mode ===
                TEST_MODES.SURVIVAL

                  ?

                  "test-lab-option is-active"

                  :

                  "test-lab-option"

              }

              disabled={
                running
              }

              onClick={() =>

                changeMode(
                  TEST_MODES.SURVIVAL
                )

              }

            >

              最长步数 AI

            </button>



            <button

              type="button"

              className={

                mode ===
                TEST_MODES.COLLECTION

                  ?

                  "test-lab-option is-active"

                  :

                  "test-lab-option"

              }

              disabled={
                running
              }

              onClick={() =>

                changeMode(
                  TEST_MODES.COLLECTION
                )

              }

            >

              最多收藏 AI

            </button>


          </div>


        </section>





        {/* =====================================================
            模式说明
        ===================================================== */}

        <div
          className="
            test-lab-description
          "
        >


          <strong>

            {
              getModeTitle()
            }

          </strong>


          <br />


          {
            getModeDescription()
          }


          <br />


          处理 1 不计游戏步数。


          {

            isSmartMode &&

            <>

              <br />

              Depth 4 · Beam 50

            </>

          }


        </div>





        {/* =====================================================
            测试控制
        ===================================================== */}

        <section
          className="
            test-lab-control
          "
        >


          <div
            className="
              test-lab-label
            "
          >

            测试局数

          </div>



          <div
            className="
              test-lab-options
            "
          >


            {

              gameOptions.map(

                value => (

                  <button

                    key={
                      value
                    }

                    type="button"

                    className={

                      games ===
                      value

                        ?

                        "test-lab-option is-active"

                        :

                        "test-lab-option"

                    }

                    disabled={
                      running
                    }

                    onClick={() =>

                      setGames(
                        value
                      )

                    }

                  >

                    {
                      value.toLocaleString()
                    }

                  </button>

                )

              )

            }


          </div>



          <button

            type="button"

            className="
              test-lab-run
            "

            disabled={
              running
            }

            onClick={
              runTest
            }

          >

            {

              running

                ?

                "测试中..."

                :

                "开始测试"

            }

          </button>





          {/* ===================================================
              运行进度
          =================================================== */}

          {

            running &&
            progress &&

            <div
              className="
                test-lab-progress
              "
            >


              <div>

                已完成：

                {" "}

                {
                  progress.completed
                  ?.toLocaleString?.()
                  ?? progress.completed
                }

                {" / "}

                {
                  progress.total
                  ?.toLocaleString?.()
                  ?? progress.total
                }

              </div>



              {

                isSmartMode &&
                progress.currentGame &&

                <>


                  <div>

                    当前：

                    {" "}

                    第 {
                      progress.currentGame
                    } 局

                  </div>


                  <div>

                    当前局操作：

                    {" "}

                    {
                      progress.currentActions
                    }

                  </div>


                  <div>

                    当前局步数：

                    {" "}

                    {
                      progress.currentSteps
                    }

                  </div>


                  <div>

                    当前局收藏：

                    {" "}

                    {
                      progress.currentCollection
                    }

                  </div>


                  {

                    progress.currentVisitedStates !==
                    undefined &&

                    <div>

                      已访问状态：

                      {" "}

                      {
                        progress.currentVisitedStates
                      }

                    </div>

                  }


                </>

              }



              <div>

                当前最长步数：

                {" "}

                {
                  progress.maxSteps
                }

              </div>


              <div>

                当前最多收藏：

                {" "}

                {
                  progress.maxCollection
                }

              </div>


              <div>

                达到保护上限：

                {" "}

                {
                  progress.hitLimitCount
                }

              </div>


              {

                isSmartMode &&
                progress.cycleCount !==
                undefined &&

                <div>

                  已检测循环：

                  {" "}

                  {
                    progress.cycleCount
                  }

                </div>

              }


            </div>

          }





          {/* ===================================================
              Error
          =================================================== */}

          {

            error &&

            <div
              className="
                test-lab-error
              "
            >

              测试失败：

              {" "}

              {
                error
              }

            </div>

          }


        </section>





        {/* =====================================================
            最终结果
        ===================================================== */}

        {

          result &&

          <section
            className="
              test-lab-results
            "
          >


            <div
              className="
                test-lab-result-title
              "
            >

              测试结果

            </div>



            {

              isSmartMode &&

              <div
                className="
                  test-lab-description
                "
              >

                {
                  getModeTitle()
                }

                {" · "}

                Depth {
                  result.depth
                }

                {" · "}

                Beam {
                  result.beamWidth
                }

              </div>

            }





            {/* =================================================
                基础统计
            ================================================= */}

            <div
              className="
                test-lab-result-grid
              "
            >


              <ResultItem

                label="测试局数"

                value={
                  result.games.toLocaleString()
                }

              />


              <ResultItem

                label="平均步数"

                value={
                  result.averageSteps.toFixed(
                    2
                  )
                }

              />


              <ResultItem

                label="最长步数"

                value={
                  result.maxSteps
                }

                highlight

              />


              <ResultItem

                label="平均收藏"

                value={
                  result.averageCollection.toFixed(
                    2
                  )
                }

              />


              <ResultItem

                label="最多收藏"

                value={
                  result.maxCollection
                }

                highlight

              />


              <ResultItem

                label="达到保护上限"

                value={
                  result.hitLimitCount
                }

              />


              {

                isSmartMode &&

                <ResultItem

                  label="检测到循环"

                  value={
                    result.cycleCount
                    ?? 0
                  }

                  highlight={
                    (
                      result.cycleCount
                      ?? 0
                    ) > 0
                  }

                />

              }


            </div>





            {/* =================================================
                循环检测结果
            ================================================= */}

            {

              isSmartMode &&
              result.firstCycle &&

              <CycleCard
                cycleGame={
                  result.firstCycle
                }
              />

            }





            {/* =================================================
                最长步数纪录
            ================================================= */}

            {

              result.bestStepGame &&

              <RecordCard

                title="最长步数纪录"

                game={
                  result.bestStepGame
                }

              />

            }





            {/* =================================================
                最多收藏纪录
            ================================================= */}

            {

              result.bestCollectionGame &&

              <RecordCard

                title="最多收藏纪录"

                game={
                  result.bestCollectionGame
                }

              />

            }


          </section>

        }


      </div>


    </div>

  );

}





// ============================================================
// 单个统计项
// ============================================================

function ResultItem({

  label,

  value,

  highlight = false

}){


  return (

    <div
      className={

        highlight

          ?

          "test-lab-result-item is-highlight"

          :

          "test-lab-result-item"

      }
    >


      <div
        className="
          test-lab-result-label
        "
      >

        {
          label
        }

      </div>


      <div
        className="
          test-lab-result-value
        "
      >

        {
          value
        }

      </div>


    </div>

  );

}





// ============================================================
// 判断一局结束原因
// ============================================================

function getEndReason(
  game
){


  if(
    game.cycleDetected
  ){


    return "检测到循环";

  }



  if(
    game.hitLimit
  ){


    return "达到保护上限";

  }



  if(
    game.endedNaturally
  ){


    return "自然结束";

  }



  return "未知";

}





// ============================================================
// 纪录卡
// ============================================================

function RecordCard({

  title,

  game

}){


  return (

    <div
      className="
        test-lab-record
      "
    >


      <div
        className="
          test-lab-record-title
        "
      >

        {
          title
        }

      </div>



      <div>

        第 {
          game.gameIndex
        } 局

      </div>



      <div>

        开局：

        {" "}

        {
          game.initialValues.join(
            " / "
          )
        }

      </div>



      <div>

        步数：

        {" "}

        {
          game.steps
        }

      </div>



      <div>

        实际选择次数：

        {" "}

        {
          game.actions
        }

      </div>



      <div>

        收藏：

        {" "}

        {
          game.collectionCount
        }

      </div>



      {

        game.cycleDetected !==
        undefined &&

        <div>

          结束原因：

          {" "}

          <strong>

            {
              getEndReason(
                game
              )
            }

          </strong>

        </div>

      }



      {

        game.visitedStates !==
        undefined &&

        <div>

          不同状态：

          {" "}

          {
            game.visitedStates
          }

        </div>

      }



      <div
        className="
          test-lab-record-collection
        "
      >

        {

          game.collection.length > 0

            ?

            game.collection.join(
              " · "
            )

            :

            "暂无收藏"

        }

      </div>



      {

        game.hitLimit &&

        <div
          className="
            test-lab-record-warning
          "
        >

          ⚠ 达到测试保护上限

        </div>

      }



      {

        game.cycleDetected &&

        <div
          className="
            test-lab-record-warning
          "
        >

          ↻ 测试因检测到重复状态而停止

        </div>

      }


    </div>

  );

}



// ============================================================
// 循环检测卡片
// ============================================================

function CycleCard({

  cycleGame

}){


  const info =
    cycleGame.cycleInfo;



  if(
    !info
  ){


    return null;

  }



  // ==========================================================
  // 是否构成正步数循环
  // ==========================================================

  const potentialUnbounded =

    info.increasesSteps ===
    true;



  return (

    <div
      className="
        test-lab-record
        test-lab-cycle
      "
    >


      <div
        className="
          test-lab-record-title
        "
      >

        循环检测

      </div>



      <div>

        检测结果：

        {" "}

        <strong>

          检测到重复状态

        </strong>

      </div>



      <div>

        所在测试：

        {" "}

        第 {
          cycleGame.gameIndex
        } 局

      </div>



      <div>

        开局：

        {" "}

        {
          cycleGame.initialValues.join(
            " / "
          )
        }

      </div>



      <div>

        首次出现：

        {" "}

        第 {
          info.firstAction
        } 次操作

        {" · "}

        {
          info.firstSteps
        } 步

      </div>



      <div>

        再次出现：

        {" "}

        第 {
          info.repeatAction
        } 次操作

        {" · "}

        {
          info.repeatSteps
        } 步

      </div>



      <div>

        循环长度：

        {" "}

        <strong>

          {
            info.cycleActions
          } 次操作

        </strong>

      </div>



      <div>

        循环增加步数：

        {" "}

        <strong>

          +{
            info.cycleSteps
          }

        </strong>

      </div>



      <div>

        循环收藏变化：

        {" "}

        {

          info.cycleCollection >= 0

            ?

            `+${info.cycleCollection}`

            :

            info.cycleCollection

        }

      </div>



      <div>

        循环前收藏：

        {" "}

        {
          info.firstCollection
        }

      </div>



      <div>

        循环后收藏：

        {" "}

        {
          info.repeatCollection
        }

      </div>



      <div>

        潜在无界步数循环：

        {" "}

        <strong>

          {

            potentialUnbounded

              ?

              "是"

              :

              "否"

          }

        </strong>

      </div>





      {/* =====================================================
          完整循环动作
      ===================================================== */}

      {

        Array.isArray(
          info.actionList
        )
        &&
        info.actionList.length > 0

        &&

        <div
          className="
            test-lab-cycle-actions
          "
        >


          <div
            className="
              test-lab-record-title
            "
          >

            完整循环步骤

          </div>



          {

            info.actionList.map(

              (
                action,
                index
              ) => (

                <div

                  key={
                    `${action.actionNumber}-${index}`
                  }

                  className="
                    test-lab-cycle-action
                  "

                >


                  <div>

                    <strong>

                      {
                        index + 1
                      }.

                    </strong>

                    {" "}

                    {
                      action.text
                    }

                  </div>



                  <div>

                    操作：

                    {" "}

                    第 {
                      action.actionNumber
                    } 次

                    {" · "}

                    Step {
                      action.beforeSteps
                    }

                    {" → "}

                    Step {
                      action.afterSteps
                    }

                  </div>



                  <div>

                    步数变化：

                    {" "}

                    <strong>

                      {

                        action.stepDelta > 0

                          ?

                          `+${action.stepDelta}`

                          :

                          "0（免费）"

                      }

                    </strong>

                  </div>



                  {

                    action.collectionDelta !== 0

                    &&

                    <div>

                      收藏变化：

                      {" "}

                      {

                        action.collectionDelta > 0

                          ?

                          `+${action.collectionDelta}`

                          :

                          action.collectionDelta

                      }

                    </div>

                  }


                </div>

              )

            )

          }


        </div>

      }





      {/* =====================================================
          循环起点棋盘
      ===================================================== */}

      {

        Array.isArray(
          info.startBoard
        )

        &&

        <BoardSnapshot

          title="循环开始棋盘"

          board={
            info.startBoard
          }

        />

      }





      {/* =====================================================
          循环终点棋盘
      ===================================================== */}

      {

        Array.isArray(
          info.endBoard
        )

        &&

        <BoardSnapshot

          title="循环结束棋盘"

          board={
            info.endBoard
          }

        />

      }





      {

        potentialUnbounded &&

        <div
          className="
            test-lab-record-warning
          "
        >

          ⚠ 相同规则状态重新出现，
          但正式步数已经增加。
          该路线需要进一步验证是否可以重复执行。

        </div>

      }


    </div>

  );

}





// ============================================================
// 调试棋盘快照
// ============================================================

function BoardSnapshot({

  title,

  board

}){


  return (

    <div
      className="
        test-lab-board-snapshot
      "
    >


      <div
        className="
          test-lab-record-title
        "
      >

        {
          title
        }

      </div>



      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, minmax(70px, 1fr))",

          gap:
            "6px",

          marginTop:
            "8px",

          maxWidth:
            "360px"

        }}
      >


        {

          board.map(

            (
              piece,
              index
            ) => (

              <div

                key={
                  index
                }

                style={{

                  minHeight:
                    "64px",

                  padding:
                    "8px",

                  border:
                    "1px solid rgba(255,255,255,0.15)",

                  borderRadius:
                    "8px"

                }}

              >


                <div>

                  格 {
                    index + 1
                  }

                </div>



                {

                  piece.empty

                    ?

                    <strong>

                      空

                    </strong>

                    :

                    <>

                      <strong>

                        {
                          piece.value
                        }

                      </strong>


                      <div>

                        {
                          piece.foodType
                        }

                      </div>


                      {

                        piece.purity != null

                        &&

                        <div>

                          纯度：

                          {
                            piece.purity
                          }

                        </div>

                      }


                    </>

                }


              </div>

            )

          )

        }


      </div>


    </div>

  );

}