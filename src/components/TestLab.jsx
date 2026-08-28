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

import {
  EIGHT_PALACE_SOLVER_DEFAULTS,
  runEightPalaceSolver,
  runFixedEightPalaceAttempts
} from "../test/eightPalaceSolver";

import "./TestLab.css";





const TEST_MODES = {

  RANDOM:
    "random",

  SURVIVAL:
    "survival",

  COLLECTION:
    "collection",

  MONEY:
    "money",

  EIGHT_PALACE:
    "eight-palace",

  FIXED_EIGHT_PALACE:
    "fixed-eight-palace"

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


const MONEY_GAME_OPTIONS = [
  1,
  10,
  100
];


const EIGHT_PALACE_GAME_OPTIONS = [
  1,
  10,
  100
];


const FIXED_EIGHT_PALACE_OPTIONS = [
  10,
  20,
  30,
  50,
  100
];





const SMART_DEPTH =
  4;


const SMART_BEAM_WIDTH =
  50;


const COLLECTION_MAX_ACTIONS =
  1000;


const SURVIVAL_MAX_ACTIONS =
  10000;


const MONEY_MAX_STEPS =
  500;





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


  const isMoneyMode =

    mode ===
    TEST_MODES.MONEY;


  const isEightPalaceMode =

    mode === TEST_MODES.EIGHT_PALACE
    || mode === TEST_MODES.FIXED_EIGHT_PALACE;


  const isFixedEightPalaceMode =

    mode ===
    TEST_MODES.FIXED_EIGHT_PALACE;


  const gameOptions =

    isFixedEightPalaceMode

      ? FIXED_EIGHT_PALACE_OPTIONS

      : isEightPalaceMode

      ? EIGHT_PALACE_GAME_OPTIONS

      : isMoneyMode

      ? MONEY_GAME_OPTIONS

      : isSmartMode

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

      nextMode === TEST_MODES.RANDOM
      || nextMode === TEST_MODES.EIGHT_PALACE

        ? 100

        : nextMode === TEST_MODES.FIXED_EIGHT_PALACE

        ? 10

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



      else if(mode === TEST_MODES.COLLECTION){


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


      else if(mode === TEST_MODES.EIGHT_PALACE){


        nextResult = await runEightPalaceSolver({
          games,
          depth: EIGHT_PALACE_SOLVER_DEFAULTS.depth,
          beamWidth: EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,
          maxActions: EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,
          onProgress: setProgress
        });

      }


      else if(mode === TEST_MODES.FIXED_EIGHT_PALACE){


        nextResult = await runFixedEightPalaceAttempts({
          attempts: games,
          depth: EIGHT_PALACE_SOLVER_DEFAULTS.depth,
          beamWidth: EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,
          maxActions: EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,
          onProgress: setProgress
        });

      }


      else{

        nextResult = await runSmartExplorer({
          mode: SMART_AI_MODES.MONEY,
          games,
          depth: SMART_DEPTH,
          beamWidth: SMART_BEAM_WIDTH,
          maxActionsPerGame: MONEY_MAX_STEPS,
          onProgress: setProgress
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


            <ModeButton

              active={
                mode === TEST_MODES.MONEY
              }

              disabled={
                running
              }

              onClick={() =>
                changeMode(TEST_MODES.MONEY)
              }

            >

              最高金钱 AI

            </ModeButton>


            <ModeButton

              active={
                mode === TEST_MODES.EIGHT_PALACE
              }

              disabled={
                running
              }

              onClick={() =>
                changeMode(TEST_MODES.EIGHT_PALACE)
              }

            >

              八宫钥匙 AI

            </ModeButton>


            <ModeButton

              active={
                mode === TEST_MODES.FIXED_EIGHT_PALACE
              }

              disabled={running}

              onClick={() => changeMode(TEST_MODES.FIXED_EIGHT_PALACE)}

            >

              固定单局 · AI 多次尝试

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

              Depth {
                isEightPalaceMode
                  ? EIGHT_PALACE_SOLVER_DEFAULTS.depth
                  : SMART_DEPTH
              }

              {" · "}

              Beam {
                isEightPalaceMode
                  ? EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth
                  : SMART_BEAM_WIDTH
              }

              {" · "}

              最大 {

                isEightPalaceMode

                  ? EIGHT_PALACE_SOLVER_DEFAULTS.maxActions

                  : isMoneyMode

                  ? formatNumber(MONEY_MAX_STEPS)

                  : isCollectionMode

                  ? formatNumber(
                      COLLECTION_MAX_ACTIONS
                    )

                  : formatNumber(
                      SURVIVAL_MAX_ACTIONS
                    )

              } {isMoneyMode ? "Step" : "操作"}

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

              moneyMode={
                isMoneyMode
              }

              eightPalaceMode={
                isEightPalaceMode
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

          result && (

          isFixedEightPalaceMode

            ? <FixedEightPalaceResults result={result} />

            : isEightPalaceMode

            ? <EightPalaceResults result={result} />

            : <TestResults

            result={
              result
            }

            smart={
              isSmartMode
            }

            collectionMode={
              isCollectionMode
            }

            moneyMode={
              isMoneyMode
            }

          />)

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

  collectionMode,

  moneyMode,

  eightPalaceMode

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



  const autoCollectionEvents =

    progress.currentAutoCollectionEvents

    ??

    progress.currentRemoveActions

    ??

    0;



  const repeatAutoCollections =

    progress.currentRepeatAutoCollections

    ??

    progress.currentRepeatCollectionRemovals

    ??

    0;



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

        eightPalaceMode &&
        progress.currentGame &&

        <div>
          当前剩余 <strong>{progress.currentBoardCount}</strong> 张
          {" · "}
          钥匙 <strong>{progress.currentKeyCount} / 8</strong>
          {" · "}
          {progress.currentSuccess ? "成功" : "未清至目标"}
        </div>

      }


      {

        smart &&
        !eightPalaceMode &&
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
            moneyMode &&
            <div>
              当前 money <strong>¥{formatNumber(progress.currentMoney ?? 0)}</strong>
              {" · "}
              首次收藏 <strong>{progress.currentFirstCollection ?? 0}</strong>
            </div>
          }



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

                自动收藏{" "}

                <strong>
                  {formatNumber(autoCollectionEvents)}
                </strong>

                {" · "}

                重复{" "}

                <strong>
                  {formatNumber(repeatAutoCollections)}
                </strong>

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


function EightPalaceResults({
  result
}){
  const distribution = Object.entries(
    result.finalKeyCountDistribution ?? {}
  ).sort((a, b) => Number(a[0]) - Number(b[0]));

  return (
    <section className="test-lab-results">
      <div className="test-lab-result-title">八宫钥匙结果</div>

      <div className="test-lab-result-grid">
        <ResultItem label="测试局数" value={formatNumber(result.games)} />
        <ResultItem label="成功通关数" value={formatNumber(result.successCount)} highlight />
        <ResultItem label="成功率" value={`${(result.successRate * 100).toFixed(1)}%`} highlight />
        <ResultItem label="平均成功 Step" value={Number(result.averageSuccessSteps).toFixed(2)} />
        <ResultItem label="最短成功 Step" value={result.shortestSuccessSteps ?? "—"} />
        <ResultItem label="最长成功 Step" value={result.longestSuccessSteps ?? "—"} />
        <ResultItem label="平均最终钥匙数" value={`${Number(result.averageFinalKeyCount).toFixed(2)} / 8`} />
        <ResultItem label="8钥匙但未清盘" value={result.keysCompleteNotClearedCount} />
        <ResultItem label="清到≤2但钥匙未满" value={result.clearedWithoutKeysCount} />
        <ResultItem label="死局" value={result.failureCounts.deadlock} />
        <ResultItem label="循环/重复状态" value={result.failureCounts["repeated-state / loop"]} />
        <ResultItem label="达到搜索上限" value={result.failureCounts.maxActions} />
        <ResultItem label="搜索耗尽" value={result.failureCounts["search exhausted"]} />
      </div>

      <div className="test-lab-section">
        <div className="test-lab-section-title">最终钥匙数量分布</div>
        <div className="test-lab-small-grid">
          {distribution.map(([keyCount, count]) => (
            <ResultItem key={keyCount} label={`${keyCount} / 8`} value={count} />
          ))}
        </div>
      </div>

      <EightPalaceRecord title="最短成功纪录" game={result.shortestSuccess} />
      <EightPalaceRecord title="最难成功纪录（成功局中 Step 最大）" game={result.hardestSuccess} />
      {result.singleGame && <EightPalaceRecord title="单局详细过程" game={result.singleGame} />}
    </section>
  );
}


function FixedEightPalaceResults({
  result
}){
  return (
    <section className="test-lab-results">
      <div className="test-lab-result-title">固定单局 · AI 多次尝试</div>

      <div className="test-lab-record">
        <div className="test-lab-record-title">固定开局</div>
        {formatEightPalaceBoard(result.fixedInitialBoard)}
      </div>

      <div className="test-lab-result-grid">
        <ResultItem label="尝试次数" value={result.attempts} />
        <ResultItem label="成功次数" value={result.successCount} highlight />
        <ResultItem label="成功率" value={`${(result.successRate * 100).toFixed(1)}%`} />
        <ResultItem label="失败次数" value={result.failureCount} />
        <ResultItem label="平均最终钥匙" value={`${result.averageFinalKeyCount.toFixed(2)} / 8`} />
        <ResultItem label="平均最低剩余" value={result.averageMinimumBoardCount.toFixed(2)} />
        <ResultItem label="平均 Step" value={result.averageSteps.toFixed(2)} />
        <ResultItem label="最短成功 Step" value={result.shortestSuccessSteps ?? "—"} />
        <ResultItem label="最长成功 Step" value={result.longestSuccessSteps ?? "—"} />
        <ResultItem label="不同路线数量" value={result.distinctRoutes} />
        <ResultItem label="成功路线数量" value={result.successfulRouteCount} />
        <ResultItem label="不同成功路线" value={result.distinctSuccessRoutes} />
        <ResultItem label="清到≤2但钥匙未满" value={result.clearedWithoutKeysCount} />
        <ResultItem label="8钥匙但未清盘" value={result.keysCompleteNotClearedCount} />
        <ResultItem label="死局" value={result.failureCounts.deadlock} />
        <ResultItem label="循环/重复状态" value={result.failureCounts["repeated-state / loop"]} />
        <ResultItem label="搜索耗尽" value={result.failureCounts["search exhausted"]} />
        <ResultItem label="达到搜索上限" value={result.failureCounts.maxActions} />
      </div>

      <div className="test-lab-record">
        <div className="test-lab-record-title">迷惑度：{result.divergenceLabel}</div>
        {result.hasRouteDivergence ? "存在路线分歧" : "本轮未出现成功/失败分歧"}
      </div>

      <div className="test-lab-section">
        <div className="test-lab-section-title">逐次结果</div>
        {result.results.map(attempt => (
          <div className="test-lab-record" key={attempt.attemptIndex}>
            <div className="test-lab-record-title">
              尝试 #{attempt.attemptIndex} · {attempt.success ? "成功" : "失败"}
            </div>
            <div>
              Step {attempt.steps}
              {" · "}
              最终剩余 {attempt.finalBoardCount} 张
              {" · "}
              钥匙 {attempt.finalKeyCount} / 8
            </div>
            <div className="test-lab-record-collection">
              缺失钥匙：{formatKeyTypes(attempt.missingKeyTypes)}
              {!attempt.success && <> · 失败原因：{formatEightPalaceFailure(attempt.failureReason)}</>}
              {" · "}
              完整路径：{attempt.actionPath.length} 步
            </div>
            <details className="test-lab-action-details">
              <summary>展开完整操作路径（{attempt.actionPath.length}项）</summary>
              <ol>
                {attempt.actionPath.map(action => (
                  <li key={action.number}>
                    <strong>{formatEightPalaceAction(action)}</strong>
                    {" · "}
                    Step {action.stepBefore} → {action.stepAfter}
                    {" · "}
                    操作后剩余 {action.boardCountAfter} 张
                    {" · "}
                    钥匙 {action.keyCountAfter} / 8
                    {action.gainedKey && <> · 获得：{formatFoodType(action.gainedKey.foodType)}钥匙（{action.gainedKey.value}）</>}
                  </li>
                ))}
              </ol>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}


function formatEightPalaceFailure(reason){
  return {
    deadlock: "死局",
    "repeated-state / loop": "循环/重复状态",
    "search exhausted": "搜索耗尽",
    maxActions: "达到搜索上限"
  }[reason] ?? reason ?? "无";
}


function EightPalaceRecord({
  title,
  game
}){
  if(!game){
    return (
      <div className="test-lab-record">
        <div className="test-lab-record-title">{title}</div>
        无成功纪录
      </div>
    );
  }

  return (
    <div className="test-lab-record">
      <div className="test-lab-record-title">{title}</div>
      <div>第 {game.gameIndex} 局</div>
      <div className="test-lab-record-collection">
        开局八张：{formatEightPalaceBoard(game.initialBoard)}
      </div>
      <div>
        Step <strong>{game.steps}</strong>
        {" · "}
        操作 <strong>{game.actions}</strong>
        {" · "}
        最终剩余 <strong>{game.finalBoardCount}</strong> 张
        {" · "}
        最终钥匙 <strong>{game.finalKeyCount} / 8</strong>
      </div>
      <div className="test-lab-record-collection">
        结果：{game.success ? "成功" : "失败"}
        {" · "}
        已获得：{formatKeyTypes(game.acquiredKeyTypes)}
        {" · "}
        缺少：{formatKeyTypes(game.missingKeyTypes)}
        {!game.success && <> · 失败原因：{game.failureReason}</>}
      </div>
      <details className="test-lab-action-details">
        <summary>展开完整操作路径（{game.actionPath.length} 项）</summary>
        <ol>
          {game.actionPath.map(action => (
            <li key={action.number}>
              <strong>{formatEightPalaceAction(action)}</strong>
              {" · "}
              Step {action.stepBefore} → {action.stepAfter}
              {" · "}
              剩余 {action.boardCountAfter} 张
              {" · "}
              钥匙 {action.keyCountAfter} / 8
              {action.gainedKey && <> · 获得：{formatFoodType(action.gainedKey.foodType)}钥匙（{action.gainedKey.value}）</>}
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}


function formatKeyTypes(types){
  return Array.isArray(types) && types.length > 0
    ? types.map(formatFoodType).join("、")
    : "无";
}


function formatEightPalaceBoard(board){
  return board
    .filter(Boolean)
    .map(piece => `格${piece.index + 1} ${formatFoodType(piece.foodType)}${piece.value}`)
    .join(" / ");
}


function formatEightPalaceAction(action){
  const label = {
    combine: "合成",
    reduce: "约分",
    remove: "处理 1"
  }[action.type] ?? action.type;
  const inputs = action.inputs
    .map(piece => `格${piece.index + 1} ${formatFoodType(piece.foodType)}${piece.value}`)
    .join(" + ");

  return `${label}：${inputs}`;
}





function TestResults({

  result,

  smart,

  collectionMode,

  moneyMode

}){


  const bestGame =

    moneyMode

      ? result.bestMoneyGame

      : result.bestCollectionGame

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

        moneyMode={
          moneyMode
        }

      />

      {moneyMode && <BoardMeanSummary result={result} />}



      {

        bestGame &&

        <BestGameCard

          game={
            bestGame
          }

          collectionMode={
            collectionMode
          }

          moneyMode={
            moneyMode
          }

        />

      }


      {
        moneyMode &&
        result.bestMoneyGame &&
        <MoneyActionHistory game={result.bestMoneyGame} />
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

  collectionMode,

  moneyMode

}){


  const repeatAutoCollections =

    result.totalRepeatAutoCollections

    ??

    result.totalRepeatCollectionRemovals

    ??

    0;



  const averageRepeatAutoCollections =

    result.averageRepeatAutoCollectionsPerCollection

    ??

    result.averageRepeatRemovalsPerCollection

    ??

    0;



  const totalAutoCollectionEvents =

    result.totalAutoCollectionEvents

    ??

    result.totalRemoveActions

    ??

    0;



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


      {
        moneyMode &&
        <>
          <ResultItem label="平均总金钱" value={`¥${Number(result.averageMoney ?? 0).toFixed(2)}`} />
          <ResultItem label="最大总金钱" value={`¥${formatNumber(result.maxMoney ?? 0)}`} highlight />
          <ResultItem label="最小总金钱" value={`¥${formatNumber(result.minMoney ?? 0)}`} />
          <ResultItem label="平均首次收藏" value={Number(result.averageFirstCollection ?? 0).toFixed(2)} />
          <ResultItem label="最大首次收藏" value={result.maxFirstCollection ?? 0} />
          <ResultItem label="达到 500 Step" value={result.reachedStepLimitCount ?? 0} />
          <ResultItem label="提前死局" value={result.deadGameCount ?? 0} />
          <ResultItem label="产业疲劳触发" value={result.totalFatigueTriggerCount ?? 0} />
          <ResultItem label="疲劳额外损失" value={`¥${formatNumber(result.totalFatigueExtraLoss ?? 0)}`} />
          <ResultItem label="单一动作最高重复" value={result.maxActionSignatureRepeatCount ?? 0} />
        </>
      }


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
            label="自动收藏总数"
            value={
              formatNumber(
                totalAutoCollectionEvents
              )
            }
          />


          <ResultItem
            label="重复自动收藏"
            value={
              formatNumber(
                repeatAutoCollections
              )
            }
          />


          <ResultItem
            label="每新槽平均重复自动收藏"
            value={
              Number(
                averageRepeatAutoCollections
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

  collectionMode,

  moneyMode

}){


  const balance =
    game.collectionBalance;


  const typeCounts =
    game.collectionFoodTypeCounts;



  const totalAutoCollectionEvents =

    game.totalAutoCollectionEvents

    ??

    game.totalRemoveActions

    ??

    0;



  const repeatAutoCollections =

    game.repeatAutoCollections

    ??

    game.repeatCollectionRemovals

    ??

    0;



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
            : moneyMode
              ? "最高金钱纪录"
              : "最长步数纪录"
        }

      </div>


      {
        moneyMode &&
        <div>
          金钱 <strong>¥{formatNumber(game.money ?? 0)}</strong>
          {" · "}
          首次收藏 <strong>{game.firstCollectionCount ?? 0}</strong>
          {" · "}
          最后首次收藏 <strong>{game.lastFirstCollection ?? "无"}</strong>
          <br />
          最终 Trend <strong>{Number(game.finalTrend ?? 1).toFixed(3)}</strong>
          {" · "}
          {game.hitLimit ? "已达到 500 Step" : "提前结束"}
        </div>
      }



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

        <div>

          自动收藏：

          {" "}

          <strong>

            {formatNumber(
              totalAutoCollectionEvents
            )}

          </strong>

          {" · "}

          重复：

          {" "}

          <strong>

            {formatNumber(
              repeatAutoCollections
            )}

          </strong>

        </div>

      }



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





function BoardMeanSummary({result}){
  const game = result.bestMoneyGame ?? {};
  const stepText = step => step == null ? "未进入" : `Step ${step}`;
  const rangeLabels = ["1–100", "101–200", "201–300", "301–400", "401–500"];

  return (
    <div className="test-lab-record" style={{marginTop: "12px"}}>
      <div className="test-lab-record-title">盘面指数</div>
      <div className="test-lab-result-grid">
        <ResultItem label="最终平均值" value={Number(game.finalBoardMean ?? 0).toFixed(1)} />
        <ResultItem label="历史最高" value={`${Number(game.highestBoardMean ?? 0).toFixed(1)} · ${stepText(game.highestBoardMeanStep)}`} />
        <ResultItem label="全局平均" value={Number(game.averageBoardMean ?? 0).toFixed(1)} />
        <ResultItem label="低位占比" value={`${((game.lowStepRate ?? 0) * 100).toFixed(1)}%`} />
        <ResultItem label="最长连续低位" value={`${game.longestLowStepCount ?? 0} Step`} />
        <ResultItem label="低位区间" value={game.longestLowStartStep == null ? "无" : `Step ${game.longestLowStartStep}–${game.longestLowEndStep}`} />
        <ResultItem label="首次进入中位" value={stepText(game.firstMiddleStep)} />
        <ResultItem label="首次进入高位" value={stepText(game.firstHighStep)} />
        <ResultItem label="历史最大数字" value={`${game.highestBoardMax ?? 0} · ${stepText(game.highestBoardMaxStep)}`} />
        <ResultItem label="首次收藏平均" value={Number(game.firstCollectionAverageBoardMean ?? 0).toFixed(1)} />
        <ResultItem label="前10次首次收藏" value={Number(game.first10CollectionAverageBoardMean ?? 0).toFixed(1)} />
        <ResultItem label="后10次首次收藏" value={Number(game.last10CollectionAverageBoardMean ?? 0).toFixed(1)} />
        {(game.boardMeanRanges ?? []).map((value, index) => value == null ? null : (
          <ResultItem key={rangeLabels[index]} label={`Step ${rangeLabels[index]}`} value={Number(value).toFixed(1)} />
        ))}
      </div>

      {result.games > 1 && (
        <div style={{marginTop: "10px"}}>
          多局汇总：平均最终 {Number(result.averageFinalBoardMean ?? 0).toFixed(1)}
          {" · "}平均历史最高 {Number(result.averageHighestBoardMean ?? 0).toFixed(1)}
          {" · "}平均全局 {Number(result.averageGlobalBoardMean ?? 0).toFixed(1)}
          {" · "}平均低位占比 {((result.averageLowStepRate ?? 0) * 100).toFixed(1)}%
          {" · "}最大连续低位 {result.maxLongestLowStepCount ?? 0} Step
          {" · "}进入高位 {result.highEntryGameCount ?? 0}/{result.games}（{((result.highEntryGameRate ?? 0) * 100).toFixed(1)}%）
          {" · "}平均历史最大数字 {Number(result.averageHighestBoardMax ?? 0).toFixed(1)}
        </div>
      )}
    </div>
  );
}


function MoneyActionHistory({game}){

  const history = game.actionHistory ?? [];
  const earningSteps = history.flatMap(action =>
    (action.collections ?? [])
      .filter(collection => collection.first && collection.reward > 0)
      .map(collection => ({action, collection}))
  );

  return (
    <div className="test-lab-record">
      <div className="test-lab-record-title">赚钱步骤</div>

      {
        earningSteps.length === 0
          ? <div>本局没有付费收藏</div>
          : earningSteps.map(({action, collection}, index) => (
              <div key={`${action.actionNumber}-${collection.value}-${collection.foodType}`}>
                #{index + 1} · Step {action.step} · {collection.value} {formatFoodType(collection.foodType)}
                {" · "+`+¥${collection.reward}`}
                {" · "}总计 ¥{action.money}
              </div>
            ))
      }

      <details style={{marginTop: "12px"}}>
        <summary style={{cursor: "pointer", fontWeight: 800}}>
          查看完整路径（{history.length} Step）
        </summary>

        <div style={{display: "grid", gap: "10px", marginTop: "12px"}}>
          {history.map(action => (
            <div key={action.actionNumber} className="test-lab-record-collection">
              <strong>
                Step {action.step} · {action.type === "combine" ? "合成" : action.type === "reduce" ? "约分" : "处理1"}
                {" "}{action.inputValues.join(action.type === "combine" ? " + " : " / ")}
                {" → "}{action.resultValues.join(" / ")}
                {" · "}BoardMean {Number(action.boardMean ?? 0).toFixed(1)}
                {action.moneyGain > 0
                  ? ` · +¥${action.moneyGain}`
                  : action.moneyGain < 0
                    ? ` · -¥${Math.abs(action.moneyGain)}`
                    : ""}
                {" · "}总计 ¥{action.money}
              </strong>

              <div>盘面：{action.boardAfter.length > 0 ? action.boardAfter.join(" / ") : "空"}</div>

              {action.type === "reduce" && action.inputValues[0] === action.inputValues[1] && (
                <div>
                  来源：{action.inputSourceKeys?.map(source => source ?? "无").join(" / ")}
                  {" · "}{action.sameSource ? "同源" : "多源"}
                </div>
              )}

              {(action.collections ?? []).map((collection, index) => (
                <div key={`${collection.value}-${collection.foodType}-${index}`}>
                  收藏：{collection.value} {formatFoodType(collection.foodType)}
                  {" · "}{collection.reward > 0
                    ? `+¥${collection.reward}`
                    : collection.reward < 0
                      ? `-¥${Math.abs(collection.reward)}`
                      : "¥0"}
                  {" · "}{collection.sameSourceRepeat ? "同源重复" : collection.first ? "首次" : "重复"}
                  <br />
                  Trend：{Number(collection.trendBefore ?? 1).toFixed(2)} → {Number(collection.trendAfter ?? 1).toFixed(2)}
                  {collection.first && collection.reward > 0 && (
                    <>
                      <br />
                      价格：Base {collection.base} × Liquidity {Number(collection.liquidity).toFixed(2)} × Trend {Number(collection.trendBefore).toFixed(2)} = ¥{collection.price}
                    </>
                  )}
                  {(collection.fatigueCount ?? 0) > 0 && (
                    <>
                      <br />
                      产业疲劳：{collection.fatigueCount}次 · {Math.round(collection.fatigueRate * 100)}%
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </details>
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



  const repeatAutoCollectionsSincePrevious =

    entry.repeatAutoCollectionsSincePrevious

    ??

    entry.repeatRemovalsSincePrevious

    ??

    0;



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



          {

            repeatAutoCollectionsSincePrevious > 0 &&

            <>

              <br />

              重复自动收藏{" "}

              <strong>
                {repeatAutoCollectionsSincePrevious}
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
            收藏触发：
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

                item => {


                  const repeatAutoCollectionCount =

                    item.repeatAutoCollectionCount

                    ??

                    (
                      item.repeatCollectionRemoval
                        ? 1
                        : 0
                    );



                  return (

                    <div
                      key={
                        item.actionNumber
                      }
                    >

                      {item.actionNumber}

                      {" "}

                      {item.text}



                      {

                        repeatAutoCollectionCount > 0 &&

                        <strong>

                          {
                            ` [重复自动收藏${
                              repeatAutoCollectionCount > 1

                                ? `×${repeatAutoCollectionCount}`

                                : ""
                            }]`
                          }

                        </strong>

                      }


                    </div>

                  );

                }

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


  if(
    mode ===
    TEST_MODES.MONEY
  ){

    return "最高金钱 AI";

  }


  if(
    mode ===
    TEST_MODES.EIGHT_PALACE
  ){

    return "八宫钥匙 AI";

  }


  if(
    mode ===
    TEST_MODES.FIXED_EIGHT_PALACE
  ){

    return "固定单局 · AI 多次尝试";

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

    case "land":

      return "荤";


    case "aquatic":

      return "水产";


    case "vegetable":

      return "素";


    case "grainBean":

      return "谷豆";


    case "dairyEgg":

      return "乳蛋";


    case "fruit":

      return "果物";


    case "seasoning":

      return "调料";


    case "spice":

      return "香辛";


    case "drink":

      return "饮品";


    case "dessert":

      return "甜食";


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
