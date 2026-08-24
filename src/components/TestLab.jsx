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
// 局数
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


const SMART_GAME_OPTIONS = [

  1,
  10

];





export default function TestLab({

  onBack

}) {


  const [
    mode,
    setMode
  ] = useState(
    TEST_MODES.RANDOM
  );


  const [
    games,
    setGames
  ] = useState(
    100
  );


  const [
    running,
    setRunning
  ] = useState(
    false
  );


  const [
    progress,
    setProgress
  ] = useState(
    null
  );


  const [
    result,
    setResult
  ] = useState(
    null
  );


  const [
    error,
    setError
  ] = useState(
    null
  );





  // ==========================================================
  // 模式
  // ==========================================================

  const isSmartMode =

    mode !==
    TEST_MODES.RANDOM;


  const isCollectionMode =

    mode ===
    TEST_MODES.COLLECTION;


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


    setGames(

      nextMode ===
      TEST_MODES.RANDOM

        ?

          100

        :

          1

    );

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
      // 随机探路
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
              setProgress

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

            maxActionsPerGame:
              10000,

            onProgress:
              setProgress

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
              setProgress

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
  // 标题
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





  function getModeDescription(){


    if(
      mode ===
      TEST_MODES.SURVIVAL
    ){


      return (

        <>

          AI 搜索未来局面，

          <br />

          尽可能延长棋盘生存时间。

        </>

      );

    }


    if(
      mode ===
      TEST_MODES.COLLECTION
    ){


      return (

        <>

          AI 搜索未来局面，

          <br />

          尽可能发现更多不同收藏，

          <br />

          并记录收藏发现时间线。

        </>

      );

    }


    return (

      <>

        每一步随机选择合法动作，

        <br />

        直到自然结束。

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

            disabled={
              running
            }

            onClick={
              onBack
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


            <ModeButton

              active={
                mode ===
                TEST_MODES.RANDOM
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

            </ModeButton>



            <ModeButton

              active={
                mode ===
                TEST_MODES.SURVIVAL
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

            </ModeButton>



            <ModeButton

              active={
                mode ===
                TEST_MODES.COLLECTION
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

            </ModeButton>


          </div>


        </section>





        {/* =====================================================
            说明
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


          处理 1 不增加正式步数。


          {

            isSmartMode &&

            <>

              <br />

              Depth 4 · Beam 50 · 最大 10,000 操作

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

                      games === value

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
              进度
              =================================================== */}

          {

            running &&
            progress &&

            <ProgressPanel

              progress={
                progress
              }

              smart={
                isSmartMode
              }

              collectionMode={
                isCollectionMode
              }

            />

          }





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
                总体数据
                ================================================= */}

            <ResultGrid

              result={
                result
              }

              smart={
                isSmartMode
              }

            />





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

              <>

                <RecordCard

                  title="最多收藏纪录"

                  game={
                    result.bestCollectionGame
                  }

                />



                {/* =============================================
                    收藏研究核心
                    ============================================= */}

                {

                  isCollectionMode &&

                  <CollectionTimelineCard

                    game={
                      result.bestCollectionGame
                    }

                  />

                }



                {/* =============================================
                    回转只保留轻量摘要
                    ============================================= */}

                {

                  isSmartMode &&

                  <MazeTurnSummary

                    game={
                      result.bestCollectionGame
                    }

                  />

                }


              </>

            }


          </section>

        }


      </div>


    </div>

  );

}





// ============================================================
// 模式按钮
// ============================================================

function ModeButton({

  active,

  disabled,

  onClick,

  children

}){


  return (

    <button

      type="button"

      className={

        active

          ?

            "test-lab-option is-active"

          :

            "test-lab-option"

      }

      disabled={
        disabled
      }

      onClick={
        onClick
      }

    >

      {
        children
      }

    </button>

  );

}





// ============================================================
// 运行进度
// ============================================================

function ProgressPanel({

  progress,

  smart,

  collectionMode

}){


  return (

    <div
      className="
        test-lab-progress
      "
    >


      <div>

        已完成：

        {" "}

        {
          formatNumber(
            progress.completed
          )
        }

        {" / "}

        {
          formatNumber(
            progress.total
          )
        }

      </div>





      {

        smart &&
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
              formatNumber(
                progress.currentActions
              )
            }

          </div>



          <div>

            当前局步数：

            {" "}

            {
              formatNumber(
                progress.currentSteps
              )
            }

          </div>



          <div>

            当前局收藏：

            {" "}

            <strong>

              {
                progress.currentCollection
              }

            </strong>

          </div>





          {/* ===============================================
              Collection模式实时最新收藏
              =============================================== */}

          {

            collectionMode &&
            progress.currentLastCollection &&

            <>


              <div>

                最新收藏：

                {" "}

                <strong>

                  #{
                    progress.currentLastCollection.order
                  }

                  {" · "}

                  {
                    progress.currentLastCollection.value
                  }

                </strong>

              </div>



              <div>

                发现于：

                {" "}

                第 {
                  formatNumber(
                    progress
                      .currentLastCollection
                      .actionNumber
                  )
                } 次操作

                {" · "}

                Step {
                  formatNumber(
                    progress
                      .currentLastCollection
                      .steps
                  )
                }

              </div>



              {

                progress
                  .currentLastCollection
                  .order > 1 &&

                <div>

                  距上个收藏：

                  {" "}

                  +{
                    formatNumber(
                      progress
                        .currentLastCollection
                        .actionsSincePrevious
                    )
                  } 操作

                  {" · "}

                  +{
                    formatNumber(
                      progress
                        .currentLastCollection
                        .stepsSincePrevious
                    )
                  } 步

                </div>

              }


            </>

          }



          <div>

            已访问状态：

            {" "}

            {
              formatNumber(
                progress.currentVisitedStates
              )
            }

          </div>



          <div>

            当前局回转：

            {" "}

            {
              progress.currentMazeTurns
              ?? 0
            }

          </div>


        </>

      }





      <div>

        当前最长步数：

        {" "}

        {
          formatNumber(
            progress.maxSteps
          )
        }

      </div>



      <div>

        当前最多收藏：

        {" "}

        {
          progress.maxCollection
          ?? 0
        }

      </div>



      {

        smart &&

        <div>

          当前最多回转：

          {" "}

          {
            progress.maxMazeTurns
            ?? 0
          }

        </div>

      }



      <div>

        达到保护上限：

        {" "}

        {
          progress.hitLimitCount
          ?? 0
        }

      </div>


    </div>

  );

}





// ============================================================
// 总体统计
// ============================================================

function ResultGrid({

  result,

  smart

}){


  return (

    <div
      className="
        test-lab-result-grid
      "
    >


      <ResultItem

        label="测试局数"

        value={
          formatNumber(
            result.games
          )
        }

      />


      <ResultItem

        label="平均步数"

        value={
          Number(
            result.averageSteps
            ?? 0
          )
            .toFixed(
              2
            )
        }

      />


      <ResultItem

        label="最长步数"

        value={
          formatNumber(
            result.maxSteps
          )
        }

        highlight

      />


      <ResultItem

        label="平均收藏"

        value={
          Number(
            result.averageCollection
            ?? 0
          )
            .toFixed(
              2
            )
        }

      />


      <ResultItem

        label="最多收藏"

        value={
          result.maxCollection
          ?? 0
        }

        highlight

      />


      <ResultItem

        label="达到保护上限"

        value={
          result.hitLimitCount
          ?? 0
        }

        highlight={
          (
            result.hitLimitCount
            ?? 0
          ) > 0
        }

      />





      {

        smart &&

        <>


          <ResultItem

            label="发生回转局数"

            value={
              result.mazeTurnGameCount
              ?? 0
            }

          />


          <ResultItem

            label="总回转次数"

            value={
              result.totalMazeTurns
              ?? 0
            }

          />


          <ResultItem

            label="最多回转"

            value={
              result.maxMazeTurns
              ?? 0
            }

          />


        </>

      }


    </div>

  );

}





// ============================================================
// 单统计项
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

        <strong>

          {
            game.initialValues.join(
              " / "
            )
          }

        </strong>

      </div>



      <div>

        步数：

        {" "}

        <strong>

          {
            formatNumber(
              game.steps
            )
          }

        </strong>

      </div>



      <div>

        实际选择次数：

        {" "}

        {
          formatNumber(
            game.actions
          )
        }

      </div>



      <div>

        收藏：

        {" "}

        <strong>

          {
            game.collectionCount
          }

        </strong>

      </div>



      {

        game.mazeTurnCount !==
        undefined &&

        <div>

          迷宫回转：

          {" "}

          {
            game.mazeTurnCount
            ?? 0
          }

        </div>

      }



      {

        game.visitedStates !==
        undefined &&

        <div>

          已访问规则状态：

          {" "}

          {
            formatNumber(
              game.visitedStates
            )
          }

        </div>

      }



      {

        game.endedNaturally !==
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

        game.hitLimit &&

        <div
          className="
            test-lab-record-warning
          "
        >

          ⚠ 达到测试保护上限，
          当前路线尚未自然结束。

        </div>

      }


    </div>

  );

}





// ============================================================
// 收藏时间线
// ============================================================

function CollectionTimelineCard({

  game

}){


  const timeline =

    Array.isArray(
      game?.collectionTimeline
    )

      ?

        game.collectionTimeline

      :

        [];



  if(
    timeline.length === 0
  ){


    return null;

  }



  const summary =

    analyzeCollectionTimeline(
      timeline
    );



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

        收藏时间线

      </div>



      <div
        style={{
          marginBottom:
            "12px"
        }}
      >

        共发现

        {" "}

        <strong>

          {
            timeline.length
          }

        </strong>

        {" "}

        种不同收藏

      </div>





      {/* =====================================================
          收藏墙摘要
          ===================================================== */}

      <div
        style={{

          padding:
            "10px",

          marginBottom:
            "12px",

          border:
            "1px solid rgba(90,110,96,.10)",

          borderRadius:
            "10px",

          background:
            "rgba(255,255,255,.30)",

          fontSize:
            "11px",

          lineHeight:
            1.7

        }}
      >


        <div>

          平均新增间隔：

          {" "}

          <strong>

            {
              summary.averageGapSteps.toFixed(
                1
              )
            } 步

          </strong>

          {" · "}

          {
            summary.averageGapActions.toFixed(
              1
            )
          } 操作

        </div>



        {

          summary.maxGapEntry &&

          <div>

            最大收藏墙：

            {" "}

            <strong>

              +{
                formatNumber(
                  summary.maxGapEntry
                    .stepsSincePrevious
                )
              } 步

            </strong>

            {" · "}

            +{
              formatNumber(
                summary.maxGapEntry
                  .actionsSincePrevious
              )
            } 操作

            {" · "}

            #{
              summary.maxGapEntry.order
            }

            {" · "}

            收藏 {
              summary.maxGapEntry.value
            }

          </div>

        }


      </div>





      {/* =====================================================
          时间线
          ===================================================== */}

      <div
        style={{

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "6px"

        }}
      >


        {

          timeline.map(

            entry => (

              <CollectionTimelineItem

                key={
                  `${entry.order}-${entry.value}`
                }

                entry={
                  entry
                }

              />

            )

          )

        }


      </div>


    </div>

  );

}





// ============================================================
// 单条收藏
// ============================================================

function CollectionTimelineItem({

  entry

}){


  return (

    <div
      style={{

        display:
          "grid",

        gridTemplateColumns:
          "44px 52px 1fr",

        gap:
          "8px",

        alignItems:
          "center",

        padding:
          "8px 10px",

        border:
          "1px solid rgba(90,110,96,.09)",

        borderRadius:
          "8px",

        background:
          "rgba(255,255,255,.24)"

      }}
    >


      <div
        style={{

          fontSize:
            "10px",

          opacity:
            0.5

        }}
      >

        #{
          entry.order
        }

      </div>



      <div
        style={{

          fontSize:
            "16px",

          fontWeight:
            900

        }}
      >

        {
          entry.value
        }

      </div>



      <div
        style={{

          fontSize:
            "11px",

          lineHeight:
            1.5

        }}
      >


        <div>

          第 {
            formatNumber(
              entry.actionNumber
            )
          } 次操作

          {" · "}

          Step {
            formatNumber(
              entry.steps
            )
          }

        </div>



        {

          entry.order > 1 &&

          <div
            style={{
              opacity:
                0.58
            }}
          >

            距上次：

            {" "}

            +{
              formatNumber(
                entry.actionsSincePrevious
              )
            } 操作

            {" · "}

            +{
              formatNumber(
                entry.stepsSincePrevious
              )
            } 步

          </div>

        }


      </div>


    </div>

  );

}





// ============================================================
// 收藏时间线统计
// ============================================================

function analyzeCollectionTimeline(
  timeline
){


  let totalSteps =
    0;


  let totalActions =
    0;


  let maxGapEntry =
    null;



  for(
    let i = 1;
    i < timeline.length;
    i++
  ){


    const entry =
      timeline[i];



    totalSteps +=
      entry.stepsSincePrevious;


    totalActions +=
      entry.actionsSincePrevious;



    if(
      !maxGapEntry
      ||
      entry.stepsSincePrevious >
      maxGapEntry.stepsSincePrevious
    ){


      maxGapEntry =
        entry;

    }

  }



  const count =

    Math.max(

      timeline.length - 1,

      1

    );



  return {

    averageGapSteps:

      totalSteps /
      count,

    averageGapActions:

      totalActions /
      count,

    maxGapEntry

  };

}





// ============================================================
// 迷宫回转摘要
//
// 现在只作为辅助诊断。
// ============================================================

function MazeTurnSummary({

  game

}){


  const turns =

    Array.isArray(
      game?.mazeTurns
    )

      ?

        game.mazeTurns

      :

        [];



  if(
    turns.length === 0
  ){


    return null;

  }



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

        迷宫回转摘要

      </div>



      <div>

        总次数：

        {" "}

        <strong>

          {
            turns.length
          }

        </strong>

      </div>



      <div
        style={{

          marginTop:
            "10px",

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "5px",

          fontSize:
            "11px"

        }}
      >


        {

          turns.map(

            turn => (

              <div
                key={
                  `${turn.turnNumber}-${turn.actionNumber}`
                }
              >

                ↻ #{
                  turn.turnNumber
                }

                {" · "}

                第 {
                  formatNumber(
                    turn.actionNumber
                  )
                } 次操作

                {" · "}

                Step {
                  formatNumber(
                    turn.triggerSteps
                  )
                }

              </div>

            )

          )

        }


      </div>


    </div>

  );

}





// ============================================================
// 结束原因
// ============================================================

function getEndReason(
  game
){


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
// 数字显示
// ============================================================

function formatNumber(
  value
){


  if(
    value ===
    null
    ||
    value ===
    undefined
  ){


    return 0;

  }



  return (

    value
      ?.toLocaleString
      ?.()

    ??

    value

  );

}