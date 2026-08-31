import {
  useEffect,
  useRef,
  useState
} from "react";

import "./App.css";

import StartScreen from "./components/StartScreen";
import TestLab from "./components/TestLab";

import Board from "./components/Board";
import ActionButtons from "./components/ActionButtons";
import ActionHintPanel from "./components/ActionHintPanel";
import CollectionPanel from "./components/CollectionPanel";
import EightPalaceCollectionPanel from "./components/EightPalaceCollectionPanel";
import StepPanel from "./components/StepPanel";
import Discovery from "./components/Discovery";
import BoardStatus from "./components/BoardStatus";
import GameOver from "./components/GameOver";
import CombineHistoryPanel from "./components/CombineHistoryPanel";
import ActionToast from "./components/ActionToast";
import BoardTypeTotals from "./components/BoardTypeTotals";

import useGame from "./hooks/useGame";

import {
  getActivityStatus
} from "./game/activityStatus";

import {
  getCurrentPrice,
  getRepeatPenalty
} from "./game/price";

import {
  settleMoneyChanges
} from "./game/collectionRules";

import { FOOD_TYPE_LABELS } from "./data/specialOneRegistry";
import { getBaseScore } from "./game/scoreValue";
import { getActionStatus } from "./game/actionStatus";


function App(){

  const game = useGame();

  const [
    showTestLab,
    setShowTestLab
  ] = useState(false);

  const removingIndex = null;

  const [
    boardAnimation,
    setBoardAnimation
  ] = useState(null);

  const [
    clearedCells,
    setClearedCells
  ] = useState([]);

  const [keyNotice,setKeyNotice] = useState(null);
  const [showCombineHistory,setShowCombineHistory] = useState(false);
  const [actionToast,setActionToast] = useState(null);

  const animationTimersRef = useRef([]);
  const animationTokenRef = useRef(0);
  const actionToastTimerRef = useRef(null);

  function showActionToast(title,message){
    if(actionToastTimerRef.current)window.clearTimeout(actionToastTimerRef.current);
    const id=Date.now();
    setActionToast({id,title,message});
    actionToastTimerRef.current=window.setTimeout(()=>{
      setActionToast(null);
      actionToastTimerRef.current=null;
    },1100);
  }


  function clearAnimationTimers(){

    animationTimersRef.current.forEach(
      timer => window.clearTimeout(timer)
    );

    animationTimersRef.current = [];

  }


  function scheduleAnimation(
    callback,
    delay
  ){

    const timer = window.setTimeout(
      callback,
      delay
    );

    animationTimersRef.current.push(
      timer
    );

  }


  useEffect(
    () => () => {
      clearAnimationTimers();
      if(actionToastTimerRef.current)window.clearTimeout(actionToastTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const key = game.latestEightPalaceKey;
    if(!key)return undefined;
    setKeyNotice(`恭喜获得${FOOD_TYPE_LABELS[key.foodType] ?? key.foodType}钥匙！ · 触发数字 ${key.triggerValue}`);
  },[game.latestEightPalaceKey]);

  useEffect(()=>{if(!keyNotice)return undefined;const timer=window.setTimeout(()=>setKeyNotice(null),2200);return()=>window.clearTimeout(timer);},[keyNotice]);


  // ==========================================================
  // 组合
  // ==========================================================

  function handleCombine(){


    if(
      boardAnimation ||
      removingIndex !== null ||
      game.selectedIndexes.length !== 2 ||
      !game.preview?.combine
    ){
      return;
    }


    const indexes = [
      ...game.selectedIndexes
    ];


    const targetIndex = game.preview.combine.kind==="wrap"
      ? game.preview.combine.drinkIndex
      : game.board.findIndex(piece => !piece);


    if(targetIndex === -1){
      return;
    }


    const token =
      ++animationTokenRef.current;

    const combineKind=game.preview.combine.kind;
    const combineToast={
      title: combineKind==="wrap"
        ? `${game.board[indexes[0]].value + game.board[indexes[1]].value} → ${game.preview.combine.value}`
        : `${game.board[indexes[0]].value} + ${game.board[indexes[1]].value} → ${game.preview.combine.value}`,
      message: combineKind==="wrap" ? "特殊搭配" : "搭配成功"
    };
    const drinkIndex=game.preview.combine.drinkIndex??null;
    const ingredientIndex=game.preview.combine.ingredientIndex??null;


    clearAnimationTimers();

    setClearedCells([]);


    setBoardAnimation(
      {
        type: "combine",
        phase: "exit",
        indexes,
        targetIndex,
        combineKind,
        drinkIndex,
        ingredientIndex,
        token
      }
    );


    scheduleAnimation(
      () => {

        const succeeded=game.combineNumbers(indexes);
        if(succeeded)showActionToast(combineToast.title,combineToast.message);


        setBoardAnimation(
          {
            type: "combine",
            phase: "enter",
            indexes,
            targetIndex,
            combineKind,
            drinkIndex,
            ingredientIndex,
            token
          }
        );

      },
      140
    );


    scheduleAnimation(
      () => setBoardAnimation(null),
      560
    );

  }

  function handleBlockedCombine(){
    const status=getActionStatus(
      game.numbers,
      game.selectedNumbers.map(item=>item.id),
      game.combineHistoryKeys
    );
    if(status.type!=="pair"||status.combine.allowed)return;
    if(status.combine.reason==="这组料理本局已经搭配过"){
      showActionToast("已经搭配过","换一种组合试试");
      return;
    }
    showActionToast("暂时无法搭配",status.combine.reason);
  }


  // ==========================================================
  // 约分
  //
  // 保持原逻辑，不修改。
  // ==========================================================

  function handleReduce(){

    if(
      boardAnimation ||
      removingIndex !== null ||
      game.selectedIndexes.length !== 2 ||
      !game.preview?.reduce
    ){
      return;
    }


    const indexes = [
      ...game.selectedIndexes
    ];

    const reduceToast=game.preview.reduce.equalClear
      ? {
          title:`${game.board[indexes[0]].value} + ${game.board[indexes[1]].value} → 清除`,
          message:"处理完成"
        }
      : {
          title:game.preview.reduce.results
            .map((result,position)=>`${game.board[indexes[position]].value} → ${result.value}`)
            .join(" · "),
          message:"处理完成"
        };


    const removedIndexes = game.preview.reduce.equalClear
      ? indexes
      : indexes.filter((_,position)=>game.preview.reduce.results?.[position]?.autoCollect);


    const isEightPalace =
      ["eightPalace", "simpleEightPalace"].includes(game.gameMode);

    const collectedSlots = new Set(
      isEightPalace
        ? game.collectionCards.map(
            card => card.collectionKey ?? `${card.foodType ?? "default"}:${card.value ?? ""}`
          )
        : Object.entries(game.collectionPaths).flatMap(
            ([value, slots]) => Object.keys(slots ?? {}).map(foodType => `${value}:${foodType}`)
          )
    );


    const autoCollectIndexes = indexes.filter(
      (_, position) =>
        game.preview.reduce.results?.[position]?.autoCollect
    );


    const sameSourceTwins =
      autoCollectIndexes.length === 2 &&
      game.board[
        autoCollectIndexes[0]
      ]?.value ===
        game.board[
          autoCollectIndexes[1]
        ]?.value &&
      game.board[
        autoCollectIndexes[0]
      ]?.sourceKey != null &&
      game.board[
        autoCollectIndexes[0]
      ]?.sourceKey ===
        game.board[
          autoCollectIndexes[1]
        ]?.sourceKey;


    const removedCells = indexes.flatMap(
      (index, position) => {

        const result =
          game.preview.reduce.results?.[position];

        if(
          !result?.autoCollect
        ){
          return [];
        }


        const foodType =
          game.board[index]?.foodType ?? null;


        const collectible = [
          "land",
          "aquatic",
          "vegetable",
          "grainBean",
          "dairyEgg",
          "fruit",
          "seasoning",
          "spice",
          "drink"
        ].includes(
          foodType
        );


        const value =
          result.collectValue;


        let reward =
          null;


        if(
          collectible
        ){

          const slotKey =
            isEightPalace
              ? `${foodType ?? "default"}:${value ?? ""}`
              : `${value}:${foodType}`;


          const sameSourceRepeat =
            sameSourceTwins &&
            index === autoCollectIndexes[1];


          const isFirstSlot =
            !sameSourceRepeat &&
            !collectedSlots.has(slotKey);


          reward =
            isEightPalace
              ? isFirstSlot
                ? game.board[index]?.scoreValue ?? getBaseScore(value)
                : 0
              : (() => {
                  const currentPrice = getCurrentPrice(value, game.board, game.trend);
                  return isFirstSlot ? currentPrice : -getRepeatPenalty(currentPrice);
                })();


          if(
            isFirstSlot
          ){
            collectedSlots.add(
              slotKey
            );
          }

        }


        return [
          {
            index,
            foodType,
            reward,
            sameSourceRepeat:
              sameSourceTwins &&
              index === autoCollectIndexes[1]
          }
        ];

      }
    );


    const moneySettlement = isEightPalace
      ? {
          actualChanges: removedCells
            .filter(cell => cell.reward != null)
            .map(cell => cell.reward)
        }
      : settleMoneyChanges(
          game.money,
          removedCells
            .filter(cell => cell.reward != null)
            .map(cell => cell.reward)
        );


    let moneyChangeIndex =
      0;


    const settledRemovedCells =
      removedCells.map(
        cell =>
          cell.reward == null
            ? cell
            : {
                ...cell,
                reward:
                  moneySettlement
                    .actualChanges[
                      moneyChangeIndex++
                    ]
              }
      );


    const token =
      ++animationTokenRef.current;


    const commitDelay =
      removedIndexes.length > 0
        ? 420
        : 150;


    clearAnimationTimers();

    setClearedCells([]);


    setBoardAnimation({
      type: "reduce",
      phase: "compress",
      indexes,
      removedIndexes,
      token
    });


    scheduleAnimation(
      () => {

        const succeeded=game.reduceNumbers();
        if(succeeded)showActionToast(reduceToast.title,reduceToast.message);

        if(game.preview.reduce.keyOutcome?.status==="used")setKeyNotice(`${game.preview.reduce.keyOutcome.triggerValue} 已经触发过钥匙，本次没有获得新钥匙`);


        setBoardAnimation({
          type: "reduce",
          phase: "settle",
          indexes,
          removedIndexes,
          token
        });


        if(
          settledRemovedCells.length > 0
        ){

          setClearedCells(
            settledRemovedCells
          );


          scheduleAnimation(
            () =>
              setClearedCells([]),
            1050
          );

        }

      },
      commitDelay
    );


    scheduleAnimation(
      () =>
        setBoardAnimation(null),
      commitDelay +
        (
          removedIndexes.length > 0
            ? 80
            : 300
        )
    );

  }


  function handleSpecialOne(
    index
  ){

    if(
      removingIndex !== null ||
      boardAnimation
    ){
      return;
    }


    const piece =
      game.board[index];


    if(
      piece?.specialOne?.kind === "function"
    ){

      game.activateOne(
        index
      );

      return;

    }


    const removedCell = {
      index,
      foodType:
        game.board[index]?.foodType ?? null
    };


    clearAnimationTimers();

    setClearedCells([]);


    setBoardAnimation({
      type: "claim_key",
      index,
      token:
        ++animationTokenRef.current
    });


    scheduleAnimation(
      () => {

        game.activateOne(
          index
        );


        setClearedCells([
          removedCell
        ]);


        scheduleAnimation(
          () =>
            setClearedCells([]),
          360
        );

      },
      240
    );


    scheduleAnimation(
      () =>
        setBoardAnimation(null),
      300
    );

  }


  if(
    showTestLab
  ){

    return (

      <TestLab
        onBack={() =>
          setShowTestLab(false)
        }
      />

    );

  }


  if(
    !game.started
  ){

    return (

      <StartScreen
        onStart={
          game.startGame
        }
        onOpenTest={() =>
          setShowTestLab(true)
        }
      />

    );

  }


  const activityStatus =
    getActivityStatus(
      game.numbers,
      game.primeDensity,
      game.steps
      ,game.combineHistoryKeys
    );


  const selectedIdsForLegacyUI =
    game.selectedNumbers.map(
      item =>
        item.id
    );


  return (

    <div className="game-page">

      {keyNotice && (
        <div role="status" aria-live="polite" style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:1000,padding:"10px 18px",borderRadius:10,background:"rgba(31,41,55,.94)",color:"white",boxShadow:"0 8px 24px rgba(0,0,0,.22)",fontWeight:700}}>
          {keyNotice}
        </div>
      )}

      <div className="game-shell">

        <header className="game-header">

          <div>

            <div className="game-header-kicker">
              PRIME KITCHEN
            </div>

            <h1 className="game-header-title">
              料理迷宫
            </h1>

          </div>


          <div className="game-header-status">

            <span>
              LABYRINTH
            </span>

            <span className="game-header-dot" />

          </div>

        </header>


        <section className="game-top-status">

          <StepPanel
            steps={
              game.steps
            }
            score={
              ["eightPalace", "simpleEightPalace"].includes(game.gameMode)
                ? game.score
                : game.money
            }
            stepLimit={game.stepLimit}
            gameMode={game.gameMode}
          />


          <Discovery
            collection={
              game.collection
            }
            collectionPaths={
              game.collectionPaths
            }
            concreteCount={
              ["eightPalace", "simpleEightPalace"].includes(game.gameMode)
                ? game.collectionCards.length
                : null
            }
          />

        </section>


        <section className="game-info-row">

          <div className="game-info-item">

            <button
              type="button"
              className="combine-history-trigger"
              onClick={() => setShowCombineHistory(true)}
            >
              历史合成 {game.combineHistory.length}
            </button>

            <ActionHintPanel
              numbers={
                game.numbers
              }
              selected={
                selectedIdsForLegacyUI
              }
              keyOutcome={game.preview?.reduce?.keyOutcome??null}
              preview={game.preview}
              candidateCounts={{
                combine:Object.values(game.actionCandidates).filter(item=>item.combine).length,
                reduce:Object.values(game.actionCandidates).filter(item=>item.reduce).length
              }}
              combineHistoryKeys={game.combineHistoryKeys}
            />

          </div>


          <div className="game-info-item">

            <BoardStatus
              activity={
                activityStatus.activity
              }
              activityCombineLegal={
                activityStatus.combineLegal
              }
              activityReduceLegal={
                activityStatus.reduceLegal
              }
              numberCount={
                game.numbers.length
              }
              dead={
                activityStatus.dead
              }
            />

          </div>

        </section>


        <section className="game-board-section">

          <div className="game-board-toolbar">

            <div className="game-section-title">
              料理台
            </div>


            <div className="game-section-count">

              {game.numbers.length}

              {" / "}

              9

            </div>

          </div>


          <div className="game-board-layout">

            <aside className="game-board-control-panel">

              <div className="game-board-control-inner">

                <div className="game-board-control-kicker">
                  ACTION
                </div>


                <ActionButtons
                  selected={
                    selectedIdsForLegacyUI
                  }
                  preview={
                    game.preview
                  }
                  onCombine={
                    handleCombine
                  }
                  onBlockedCombine={
                    handleBlockedCombine
                  }
                  onReduce={
                    handleReduce
                  }
                  gameOver={
                    game.gameOver
                  }
                  removingId={
                    removingIndex ??
                    boardAnimation?.token ??
                    null
                  }
                />

              </div>

            </aside>


            <div className="game-board-main">

              <ActionToast toast={actionToast} />

              <BoardTypeTotals board={game.board} />

              <Board
                board={
                  game.board
                }
                selectedIndexes={
                  game.selectedIndexes
                }
                functionOneIndex={
                  game.functionOneIndex
                }
                onSelectCell={
                  boardAnimation
                    ? undefined
                    : game.selectCell
                }
                onRemoveOne={
                  handleSpecialOne
                }
                onCombine={
                  handleCombine
                }
                collection={
                  game.collection
                }
                collectionCards={
                  game.collectionCards
                }
                prices={
                  game.boardPrices
                }
                scoreMode={
                  ["eightPalace", "simpleEightPalace"].includes(game.gameMode)
                }
                removingIndex={
                  removingIndex
                }
                preview={
                  game.preview
                }
                mazeTurn={
                  game.mazeTurn
                }
                animationState={
                  boardAnimation
                }
                actionCandidates={
                  game.actionCandidates
                }
                clearedCells={
                  clearedCells
                }
              />

            </div>

          </div>

        </section>


        <div className="game-collection-divider" />


        {
          [
            "eightPalace",
            "simpleEightPalace"
          ].includes(
            game.gameMode
          )

            ? (

                <EightPalaceCollectionPanel
                  cards={game.collectionCards}
                  score={game.score}
                />

              )

            : (

                <CollectionPanel
                  collection={
                    game.collection
                  }
                  collectionTimeline={
                    game.collectionTimeline
                  }
                  collectionPaths={
                    game.collectionPaths
                  }
                  collectionOrigins={
                    game.collectionOrigins
                  }
                  collectionParents={
                    game.collectionParents
                  }
                  latestCollection={
                    game.latestCollection
                  }
                />

              )
        }

      </div>


      {
        showCombineHistory &&
        <CombineHistoryPanel
          history={game.combineHistory}
          onClose={() => setShowCombineHistory(false)}
        />
      }

      {
        game.gameOver &&

        <GameOver
          steps={
            game.steps
          }
          stepLimit={game.stepLimit}
          score={
            game.score
          }
          collection={
            ["eightPalace", "simpleEightPalace"].includes(game.gameMode)
              ? game.collectionCards
              : game.collection
          }
          reason={
            game.gameOverReason
          }
          gameMode={
            game.gameMode
          }
          eightPalaceKeys={
            game.eightPalaceKeys
          }
          targetFoodTypes={
            game.targetFoodTypes
          }
          boardCount={
            game.numbers.length
          }
          onRestart={() =>
            window.location.reload()
          }
        />
      }

    </div>

  );

}


export default App;
