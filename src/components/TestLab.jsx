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



const TEST_MODES = {

  RANDOM:
    "random",

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection"

};



const RANDOM_GAME_OPTIONS = [

  10,
  100,
  1000,
  10000,
  100000

];


const SMART_GAME_OPTIONS = [

  1,
  10

];



const SMART_DEPTH =
  4;


const SMART_BEAM_WIDTH =
  50;


const COLLECTION_MAX_ACTIONS =
  3000;


const SURVIVAL_MAX_ACTIONS =
  10000;



export default function TestLab({

  onBack

}){


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



  const isSmartMode =

    mode !==
    TEST_MODES.RANDOM;


  const isCollectionMode =

    mode ===
    TEST_MODES.COLLECTION;


  const gameOptions =

    isSmartMode

      ? SMART_GAME_OPTIONS

      : RANDOM_GAME_OPTIONS;



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


    setResult(
      null
    );


    setProgress(
      null
    );


    setError(
      null
    );


    setGames(

      nextMode ===
      TEST_MODES.RANDOM

        ? 100

        : 1

    );

  }





  async function runTest(){


    if(
      running
    ){

      return;

    }



    setRunning(
      true
    );


    setResult(
      null
    );


    setProgress(
      null
    );


    setError(
      null
    );



    try{


      let nextResult;



      if(
        mode ===
        TEST_MODES.RANDOM
      ){


        nextResult =

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



      else if(
        mode ===
        TEST_MODES.SURVIVAL
      ){


        nextResult =

          await runSmartExplorer({

            mode:
              SMART_AI_MODES.SURVIVAL,

            games,

            depth:
              SMART_DEPTH,

            beamWidth:
              SMART_BEAM_WIDTH,

            maxActionsPerGame:
              SURVIVAL_MAX_ACTIONS,

            onProgress:
              setProgress

          });

      }



      else{


        nextResult =

          await runSmartExplorer({

            mode:
              SMART_AI_MODES.COLLECTION,

            games,

            depth:
              SMART_DEPTH,

            beamWidth:
              SMART_BEAM_WIDTH,

            maxActionsPerGame:
              COLLECTION_MAX_ACTIONS,

            onProgress:
              setProgress

          });

      }



      setResult(
        nextResult
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

        ??

        "测试失败"

      );

    }
    finally{


      setRunning(
        false
      );

    }

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



        <div
          className="
            test-lab-description
          "
        >


          <strong>

            {
              getModeTitle(
                mode
              )
            }

          </strong>



          {

            isCollectionMode &&

            <>

              {" · "}

              三槽收藏

            </>

          }



          {

            isSmartMode &&

            <>

              <br />

              Depth {SMART_DEPTH}

              {" · "}

              Beam {SMART_BEAM_WIDTH}

              {" · "}

              最大 {

                isCollectionMode

                  ? formatNumber(
                      COLLECTION_MAX_ACTIONS
                    )

                  : formatNumber(
                      SURVIVAL_MAX_ACTIONS
                    )

              } 操作

            </>

          }


        </div>



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

                        ? "test-lab-option is-active"

                        : "test-lab-option"

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
                      formatNumber(
                        value
                      )
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
                ? "测试中..."
                : "开始测试"
            }

          </button>



          {

            running &&
            progress &&

            <ProgressPanel

              progress={
                progress
              }

              collectionMode={
                isCollectionMode
              }

              smart={
                isSmartMode
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

              {error}

            </div>

          }


        </section>



        {

          result &&

          <TestResults

            result={
              result
            }

            smart={
              isSmartMode
            }

            collectionMode={
              isCollectionMode
            }

          />

        }


      </div>


    </div>

  );

}





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

          ? "test-lab-option is-active"

          : "test-lab-option"

      }

      disabled={
        disabled
      }

      onClick={
        onClick
      }

    >

      {children}

    </button>

  );

}





function ProgressPanel({

  progress,

  smart,

  collectionMode

}){


  const meat =
    progress.currentCollectionMeatCount
    ?? 0;


  const vegetable =
    progress.currentCollectionVegetableCount
    ?? 0;


  const seasoning =
    progress.currentCollectionSeasoningCount
    ?? 0;



  return (

    <div
      className="
        test-lab-progress
      "
    >


      <div>

        {formatNumber(progress.completed)}

        {" / "}

        {formatNumber(progress.total)}

        {" 局"}

      </div>



      {

        smart &&
        progress.currentGame &&

        <>


          <div>

            操作{" "}

            {formatNumber(progress.currentActions)}

            {" · "}

            Step{" "}

            {formatNumber(progress.currentSteps)}

            {" · "}

            收藏槽{" "}

            <strong>

              {progress.currentCollection}

            </strong>

          </div>



          {

            collectionMode &&

            <>


              <div>

                荤 {meat}

                {" / "}

                素 {vegetable}

                {" / "}

                调料 {seasoning}

                {" · "}

                失衡 {
                  progress.currentCollectionImbalance
                  ?? 0
                }

              </div>



              <div>

                {
                  describeBalanceState({

                    meatCount:
                      meat,

                    vegetableCount:
                      vegetable,

                    seasoningCount:
                      seasoning

                  })
                }

              </div>


            </>

          }


        </>

      }


    </div>

  );

}





function TestResults({

  result,

  smart,

  collectionMode

}){


  const bestGame =

    result.bestCollectionGame

    ??

    result.bestStepGame;



  return (

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



      <ResultGrid

        result={
          result
        }

        smart={
          smart
        }

        collectionMode={
          collectionMode
        }

      />



      {

        bestGame &&

        <BestGameCard

          game={
            bestGame
          }

          collectionMode={
            collectionMode
          }

        />

      }



      {

        collectionMode &&
        result.bestCollectionGame &&

        <CollectionTimeline

          game={
            result.bestCollectionGame
          }

        />

      }



      {

        smart &&
        bestGame?.mazeTurnCount > 0 &&

        <MazeTurnSummary

          game={
            bestGame
          }

        />

      }


    </section>

  );

}





function ResultGrid({

  result,

  smart,

  collectionMode

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
          ).toFixed(
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
      />


      <ResultItem
        label="平均收藏槽"
        value={
          Number(
            result.averageCollection
            ?? 0
          ).toFixed(
            2
          )
        }
      />


      <ResultItem
        label="最多收藏槽"
        value={
          result.maxCollection
          ?? 0
        }
        highlight
      />



      {

        collectionMode &&

        <>


          <ResultItem
            label="平均三系失衡"
            value={
              Number(
                result.averageCollectionImbalance
                ?? 0
              ).toFixed(
                2
              )
            }
          />


          <ResultItem
            label="最大三系失衡"
            value={
              result.maxCollectionImbalance
              ?? 0
            }
          />


          <ResultItem
            label="重复旧槽"
            value={
              formatNumber(
                result.totalRepeatCollectionRemovals
                ?? 0
              )
            }
          />


          <ResultItem
            label="每新槽平均重复"
            value={
              Number(
                result.averageRepeatRemovalsPerCollection
                ?? 0
              ).toFixed(
                2
              )
            }
          />


        </>

      }



      <ResultItem
        label="达到保护上限"
        value={
          result.hitLimitCount
          ?? 0
        }
      />



      {

        smart &&

        <ResultItem
          label="迷宫回转"
          value={
            result.totalMazeTurns
            ?? 0
          }
        />

      }


    </div>

  );

}





function ResultItem({

  label,

  value,

  highlight = false

}){


  return (

    <div
      className={

        highlight

          ? "test-lab-result-item is-highlight"

          : "test-lab-result-item"

      }
    >


      <div
        className="
          test-lab-result-label
        "
      >

        {label}

      </div>


      <div
        className="
          test-lab-result-value
        "
      >

        {value}

      </div>


    </div>

  );

}





function BestGameCard({

  game,

  collectionMode

}){


  const balance =
    game.collectionBalance;


  const typeCounts =
    game.collectionFoodTypeCounts;



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
          collectionMode
            ? "最多收藏槽纪录"
            : "最长步数纪录"
        }

      </div>



      <div>

        第 {game.gameIndex} 局

        {" · "}

        开局 {

          game.initialValues
            ?.join(
              " / "
            )

        }

      </div>



      <div>

        Step{" "}

        <strong>
          {formatNumber(game.steps)}
        </strong>

        {" · "}

        操作{" "}

        {formatNumber(game.actions)}

        {" · "}

        收藏槽{" "}

        <strong>
          {game.collectionCount}
        </strong>

      </div>



      {

        collectionMode &&
        typeCounts &&

        <div>

          收藏槽类型：

          {" "}

          <strong>

            荤 {
              typeCounts.meat
              ?? 0
            }

            {" / "}

            素 {
              typeCounts.vegetable
              ?? 0
            }

            {" / "}

            调料 {
              typeCounts.seasoning
              ?? 0
            }

          </strong>

        </div>

      }



      {

        collectionMode &&
        balance &&

        <>


          <div>

            最终窗口：

            {" "}

            <strong>

              荤 {balance.meatCount}

              {" / "}

              素 {balance.vegetableCount}

              {" / "}

              调料 {balance.seasoningCount}

            </strong>

          </div>



          <div>

            三系失衡：

            {" "}

            <strong>
              {balance.imbalance}
            </strong>

          </div>



          <div>

            <strong>

              {
                describeBalanceState(
                  balance
                )
              }

            </strong>

          </div>



          <div>

            最近类型：

            {" "}

            {
              formatTypeSequence(
                balance.recent
              )
            }

          </div>


        </>

      }



      <div>

        结束：

        {" "}

        <strong>

          {
            getEndReason(
              game
            )
          }

        </strong>

      </div>


    </div>

  );

}





function CollectionTimeline({

  game

}){


  const timeline =

    Array.isArray(
      game?.collectionTimeline
    )

      ? game.collectionTimeline

      : [];



  if(
    timeline.length === 0
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

        收藏时间线

      </div>



      <div
        style={{
          marginBottom:
            "10px"
        }}
      >

        共{" "}

        <strong>
          {timeline.length}
        </strong>

        {" "}个新收藏槽

      </div>



      <div
        style={{

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "5px"

        }}
      >


        {

          timeline.map(

            entry => (

              <CollectionTimelineItem

                key={
                  `${entry.order}-${entry.value}-${entry.foodType}`
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





function CollectionTimelineItem({

  entry

}){


  const [
    open,
    setOpen
  ] = useState(
    false
  );



  const balance =
    entry.balance;



  return (

    <div
      style={{

        border:
          "1px solid rgba(90,110,96,.09)",

        borderRadius:
          "8px",

        overflow:
          "hidden"

      }}
    >


      <button

        type="button"

        onClick={() =>
          setOpen(
            value =>
              !value
          )
        }

        style={{

          width:
            "100%",

          border:
            "none",

          background:
            "transparent",

          cursor:
            "pointer",

          textAlign:
            "left",

          padding:
            "8px 10px",

          display:
            "grid",

          gridTemplateColumns:
            "42px 88px 1fr 20px",

          gap:
            "8px",

          alignItems:
            "center",

          color:
            "inherit"

        }}

      >


        <span
          style={{
            opacity:
              0.5,

            fontSize:
              "10px"
          }}
        >

          #{entry.order}

        </span>



        <span>


          <strong>
            {entry.value}
          </strong>


          <span
            style={{
              marginLeft:
                "5px",

              opacity:
                0.6,

              fontSize:
                "10px"
            }}
          >

            {
              formatFoodType(
                entry.foodType
              )
            }

          </span>


        </span>



        <span
          style={{
            fontSize:
              "11px",

            lineHeight:
              1.5
          }}
        >


          第 {formatNumber(entry.actionNumber)} 操作

          {" · "}

          Step {formatNumber(entry.steps)}



          {

            balance &&

            <>

              <br />

              荤 {balance.meatCount}

              {" / "}

              素 {balance.vegetableCount}

              {" / "}

              调料 {balance.seasoningCount}

              {" · "}

              失衡 {balance.imbalance}


              <br />


              <strong>

                {
                  describeBalanceState(
                    balance
                  )
                }

              </strong>

            </>

          }


        </span>



        <span>

          {
            open
              ? "▴"
              : "▾"
          }

        </span>


      </button>



      {

        open &&

        <CollectionRouteDetail

          entry={
            entry
          }

        />

      }


    </div>

  );

}





function CollectionRouteDetail({

  entry

}){


  const route =

    Array.isArray(
      entry.routeWindow
    )

      ? entry.routeWindow

      : [];



  return (

    <div
      style={{

        padding:
          "10px",

        borderTop:
          "1px solid rgba(90,110,96,.08)",

        fontSize:
          "11px",

        lineHeight:
          1.6

      }}
    >


      {

        entry.previousAction &&

        <div>

          <strong>
            前一步：
          </strong>

          {" "}

          {entry.previousAction.text}

        </div>

      }



      {

        entry.triggerAction &&

        <div
          style={{
            marginBottom:
              "8px"
          }}
        >

          <strong>
            收藏槽：
          </strong>

          {" "}

          {entry.triggerAction.text}

        </div>

      }



      {

        route.length > 0 &&

        <div>


          <strong>
            最近路线
          </strong>



          <div
            style={{

              marginTop:
                "5px",

              maxHeight:
                "220px",

              overflowY:
                "auto"

            }}
          >


            {

              route.map(

                item => (

                  <div
                    key={
                      item.actionNumber
                    }
                  >

                    {item.actionNumber}

                    {" "}

                    {item.text}



                    {

                      item.repeatCollectionRemoval &&

                      <strong>

                        {" [重复槽]"}

                      </strong>

                    }


                  </div>

                )

              )

            }


          </div>


        </div>

      }


    </div>

  );

}





function MazeTurnSummary({

  game

}){


  const turns =

    Array.isArray(
      game?.mazeTurns
    )

      ? game.mazeTurns

      : [];



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

        迷宫回转

      </div>



      {

        turns.map(

          turn => (

            <div
              key={
                `${turn.turnNumber}-${turn.actionNumber}`
              }
            >

              ↻ #{turn.turnNumber}

              {" · "}

              操作 {formatNumber(turn.actionNumber)}

              {" · "}

              Step {formatNumber(turn.triggerSteps)}

            </div>

          )

        )

      }


    </div>

  );

}





function describeBalanceState(
  balance
){


  if(
    !balance
  ){

    return "无类型状态";

  }



  const meat =

    Number(
      balance.meatCount
      ?? 0
    );


  const vegetable =

    Number(
      balance.vegetableCount
      ?? 0
    );


  const seasoning =

    Number(
      balance.seasoningCount
      ?? 0
    );



  const regular = [

    {
      key:
        "meat",

      label:
        "荤",

      count:
        meat
    },

    {
      key:
        "vegetable",

      label:
        "素",

      count:
        vegetable
    },

    {
      key:
        "seasoning",

      label:
        "调料",

      count:
        seasoning
    }

  ];



  const active =

    regular.filter(

      item =>
        item.count > 0

    );



  let text =
    "";



  if(
    active.length === 0
  ){


    text =
      "三系均缺失";

  }



  else if(
    active.length === 1
  ){


    text =

      `仅${active[0].label}系参与`;

  }



  else if(
    active.length === 2
  ){


    const missing =

      regular.find(

        item =>
          item.count === 0

      );



    const [
      first,
      second
    ] =
      active;



    if(
      first.count ===
      second.count
    ){


      text =

        `${missing.label}系缺失 · ${first.label}/${second.label}均衡`;

    }


    else{


      const dominant =

        first.count >
        second.count

          ? first

          : second;



      text =

        `${missing.label}系缺失 · 偏${dominant.label}`;

    }

  }



  else{


    const counts =

      regular.map(
        item =>
          item.count
      );



    const maxCount =

      Math.max(
        ...counts
      );


    const minCount =

      Math.min(
        ...counts
      );



    if(
      maxCount ===
      minCount
    ){


      text =
        "三系完全均衡";

    }


    else{


      const dominant =

        regular.filter(

          item =>
            item.count ===
            maxCount

        );



      const difference =

        maxCount -
        minCount;



      if(
        dominant.length === 1
      ){


        if(
          difference >= 3
        ){


          text =

            `三系均参与 · ${dominant[0].label}明显偏多`;

        }


        else{


          text =

            `三系均参与 · ${dominant[0].label}偏多`;

        }

      }


      else{


        text =

          `三系均参与 · ${dominant
            .map(
              item =>
                item.label
            )
            .join(
              "/"
            )}偏多`;

      }

    }

  }



  return text;

}





function getModeTitle(
  mode
){


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





function formatFoodType(
  foodType
){


  switch(
    foodType
  ){


    case "meat":

      return "荤";


    case "vegetable":

      return "素";


    case "seasoning":

      return "调料";


    default:

      return "未知";

  }

}





function formatTypeSequence(
  sequence
){


  if(
    !Array.isArray(
      sequence
    )
    ||
    sequence.length === 0
  ){


    return "—";

  }



  return sequence
    .map(
      formatFoodType
    )
    .join(
      " → "
    );

}





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