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
import BoardStatus from "./components/BoardStatus";
import GameOver from "./components/GameOver";
import CombineHistoryPanel from "./components/CombineHistoryPanel";
import ActionToast from "./components/ActionToast";
import CollectionRewardModal from "./components/CollectionRewardModal";
import BoardTypeTotals from "./components/BoardTypeTotals";
import ItemBar from "./components/ItemBar";

import useGame from "./hooks/useGame";

import {
  getActivityStatus
} from "./game/activityStatus";

import { getCollectionMoneyGain } from "./game/money";

import { FOOD_TYPE_LABELS } from "./data/specialOneRegistry";
import { getActionStatus } from "./game/actionStatus";


function App(){

  const game = useGame();

  const [
    showTestLab,
    setShowTestLab
  ] = useState(false);

  const removingIndex = null;

  const [
    activeAnimation,
    setActiveAnimation
  ] = useState(null);

  const [
    clearedCells,
    setClearedCells
  ] = useState([]);

  const [keyNotice,setKeyNotice] = useState(null);
  const [showCombineHistory,setShowCombineHistory] = useState(false);
  const [actionToast,setActionToast] = useState(null);
  const [collectionRewardQueue,setCollectionRewardQueue] = useState([]);
  const [heaterSelectMode,setHeaterSelectMode] = useState(false);
  const [restoreSelectMode,setRestoreSelectMode] = useState(false);

  const animationTimersRef = useRef([]);
  const animationTokenRef = useRef(0);
  const actionToastTimerRef = useRef(null);
  const notifiedEfficiencyStepRef = useRef(0);

  function showActionToast(title,message){
    if(actionToastTimerRef.current)window.clearTimeout(actionToastTimerRef.current);
    const id=Date.now();
    setActionToast({id,title,message});
    actionToastTimerRef.current=window.setTimeout(()=>{
      setActionToast(null);
      actionToastTimerRef.current=null;
    },1100);
  }

  function closeCollectionReward(){
    setCollectionRewardQueue(queue => queue.slice(1));
  }

  function toggleHeaterMode(){
    if(heaterSelectMode){
      setHeaterSelectMode(false);
      return;
    }
    if(!game.heaterAvailable){
      const shortage = Math.max(0, game.heaterCost - game.money);
      showActionToast("金钱不足", shortage ? `还需要 ¥${shortage}` : "没有可加热的料理");
      return;
    }
    game.clearSelection();
    setRestoreSelectMode(false);
    setHeaterSelectMode(true);
  }

  function toggleRestoreMode(){
    if(restoreSelectMode){ setRestoreSelectMode(false); return; }
    if(!game.restoreAvailable){
      const shortage = Math.max(0, game.restoreCost - game.money);
      showActionToast("无法归味", shortage ? `还需要 ¥${shortage}` : "没有可归味的料理");
      return;
    }
    game.clearSelection();
    setHeaterSelectMode(false);
    setRestoreSelectMode(true);
  }

  function handleSuperHeater(){
    if(!game.superHeaterAvailable){
      const shortage = Math.max(0, game.superHeaterCost - game.money);
      showActionToast("无法超级加热", shortage ? `还需要 ¥${shortage}` : "没有可加热的料理");
      return;
    }
    setHeaterSelectMode(false);
    setRestoreSelectMode(false);
    const result = game.useSuperHeater();
    if(result){
      beginInstantAnimation({
        type: "super-heater",
        sourceIndexes: game.board.flatMap((piece,index)=>piece ? [index] : []),
        targetIndexes: game.board.flatMap((piece,index)=>piece ? [index] : []),
        beforeValues: game.board.filter(Boolean).map(piece=>piece.value),
        afterValues: game.board.filter(Boolean).map(piece=>piece.value+1)
      },620);
      showActionToast("超级加热", `全盘 +1 · -¥${result.cost}`);
    }
  }

  function handleHeaterTarget(index){
    const result = game.useHeaterOnCell(index);
    if(!result) return;
    setHeaterSelectMode(false);
    beginInstantAnimation({
      type: "heater",
      sourceIndexes: [index],
      targetIndexes: [index],
      beforeValues: [result.fromValue],
      afterValues: [result.toValue]
    },430);
    showActionToast(`${result.fromValue} → ${result.toValue}`, `加热完成 · -¥${result.cost}`);
  }

  function handleRestoreTarget(index){
    const result = game.useRestoreOnCell(index);
    if(!result) return;
    setRestoreSelectMode(false);
    beginInstantAnimation({
      type: "restore",
      sourceIndexes: [index],
      targetIndexes: [index],
      beforeValues: [result.valueBefore],
      afterValues: [result.valueAfter]
    },480);
    showActionToast(
      "归味",
      `${FOOD_TYPE_LABELS[result.foodTypeBefore] ?? "饮品"} ${result.valueBefore} → ${FOOD_TYPE_LABELS[result.foodTypeAfter] ?? "饮品"} ${result.valueAfter} · -¥${result.cost}`
    );
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

  function beginInstantAnimation(animation,duration){
    clearAnimationTimers();
    const token=++animationTokenRef.current;
    setActiveAnimation({...animation,phase:"active",startedAt:Date.now(),token});
    scheduleAnimation(()=>{
      setActiveAnimation(current=>current?.token===token ? null : current);
    },duration);
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

  useEffect(() => {
    const snapshot = game.collectionEfficiencyTimeline.at(-1);
    if(!snapshot || snapshot.step <= notifiedEfficiencyStepRef.current) return;
    notifiedEfficiencyStepRef.current = snapshot.step;
    showActionToast(
      `Step ${snapshot.step} · 效率 ${snapshot.collectionEfficiency.toFixed(2)}`,
      `最近10步 +${snapshot.recent10Collections}`
    );
  }, [game.collectionEfficiencyTimeline]);


  // ==========================================================
  // 组合
  // ==========================================================

  function handleCombine(){


    if(
      activeAnimation?.phase === "exit" ||
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


    setActiveAnimation(
      {
        type: "combine",
        phase: "exit",
        indexes,
        sourceIndexes:indexes,
        targetIndexes:[targetIndex],
        beforeValues:indexes.map(index=>game.board[index]?.value),
        afterValues:[game.preview.combine.value],
        startedAt:Date.now(),
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


        setActiveAnimation(
          {
            type: "combine",
            phase: "enter",
            indexes,
            sourceIndexes:indexes,
            targetIndexes:[targetIndex],
            beforeValues:indexes.map(index=>game.board[index]?.value),
            afterValues:[game.preview.combine.value],
            startedAt:Date.now(),
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
      () => setActiveAnimation(null),
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
      activeAnimation?.phase === "compress" ||
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


          const isFirstSlot = !collectedSlots.has(slotKey);


          reward = getCollectionMoneyGain(isFirstSlot);


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


    const settledRemovedCells = removedCells;


    const token =
      ++animationTokenRef.current;


    const commitDelay =
      removedIndexes.length > 0
        ? 240
        : 150;


    clearAnimationTimers();

    setClearedCells([]);


    setActiveAnimation({
      type: "reduce",
      phase: "compress",
      indexes,
      sourceIndexes:indexes,
      targetIndexes:indexes.filter(index=>!removedIndexes.includes(index)),
      beforeValues:indexes.map(index=>game.board[index]?.value),
      afterValues:game.preview.reduce.results?.map(result=>result.value)??[],
      startedAt:Date.now(),
      removedIndexes,
      token
    });


    scheduleAnimation(
      () => {

        const result=game.reduceNumbers();
        if(result){
          const rewards = result.collectionRewards ?? [];
          if(rewards.length > 0){
            setCollectionRewardQueue(queue => [...queue, ...rewards]);
          }else{
            showActionToast(reduceToast.title,reduceToast.message);
          }
        }

        if(game.preview.reduce.keyOutcome?.status==="used")setKeyNotice(`${game.preview.reduce.keyOutcome.triggerValue} 已经触发过钥匙，本次没有获得新钥匙`);


        setActiveAnimation({
          type: "reduce",
          phase: "settle",
          indexes,
          sourceIndexes:indexes,
          targetIndexes:indexes.filter(index=>!removedIndexes.includes(index)),
          beforeValues:[],
          afterValues:[],
          startedAt:Date.now(),
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
        setActiveAnimation(null),
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
      activeAnimation?.type === "remove"
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


    setActiveAnimation({
      type: "remove",
      phase:"exit",
      index,
      sourceIndexes:[index],
      targetIndexes:[],
      beforeValues:[piece.value],
      afterValues:[],
      startedAt:Date.now(),
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
        setActiveAnimation(null),
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
            money={game.money}
            stepLimit={game.stepLimit}
            gameMode={game.gameMode}
            collectionEfficiencyTimeline={game.collectionEfficiencyTimeline}
          />


        </section>


        <section className="game-info-row">

          <div className="game-situation-hint">
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

          <div className="game-situation-meta">
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

            <ItemBar
              heaterCost={game.heaterCost}
              heaterAvailable={game.heaterAvailable}
              heaterActive={heaterSelectMode}
              onHeaterClick={toggleHeaterMode}
              superHeaterCost={game.superHeaterCost}
              superHeaterAvailable={game.superHeaterAvailable}
              onSuperHeaterClick={handleSuperHeater}
              restoreCost={game.restoreCost}
              restoreAvailable={game.restoreAvailable}
              restoreActive={restoreSelectMode}
              onRestoreClick={toggleRestoreMode}
            />

            <button
              type="button"
              className="combine-history-trigger"
              onClick={() => setShowCombineHistory(true)}
            >
              历史合成
              <span>{game.combineHistory.length}</span>
            </button>
          </div>

        </section>


        <section className="game-board-section">

          <div className="game-board-toolbar">
            <div className="game-board-type-strip">
              <BoardTypeTotals board={game.board} />
            </div>
          </div>


          <div className="game-board-layout">
            <div className="game-board-main">

              <ActionToast toast={actionToast} />
              {collectionRewardQueue[0] && (
                <CollectionRewardModal
                  reward={collectionRewardQueue[0]}
                  onClose={closeCollectionReward}
                />
              )}

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
                heaterSelectMode={heaterSelectMode}
                restoreSelectMode={restoreSelectMode}
                onSelectCell={
                  activeAnimation?.phase === "exit" || activeAnimation?.phase === "compress"
                    ? undefined
                    : restoreSelectMode
                      ? handleRestoreTarget
                    : heaterSelectMode
                      ? handleHeaterTarget
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
                  activeAnimation
                }
                actionCandidates={
                  game.actionCandidates
                }
                clearedCells={
                  clearedCells
                }
              />

              <div className="game-board-actions">
                <ActionButtons
                  selected={selectedIdsForLegacyUI}
                  preview={game.preview}
                  onCombine={handleCombine}
                  onBlockedCombine={handleBlockedCombine}
                  onReduce={handleReduce}
                  gameOver={game.gameOver || heaterSelectMode || restoreSelectMode}
                  removingId={removingIndex ?? ((activeAnimation?.phase === "exit" || activeAnimation?.phase === "compress") ? activeAnimation.token : null)}
                />
              </div>

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
