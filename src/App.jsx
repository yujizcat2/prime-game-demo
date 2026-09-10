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
import CollectionPanel from "./components/CollectionPanel";
import EightPalaceCollectionPanel from "./components/EightPalaceCollectionPanel";
import StepPanel from "./components/StepPanel";
import DayPanel from "./components/DayPanel";
import DaySettlement from "./components/DaySettlement";
import BoardStatus from "./components/BoardStatus";
import GameOver from "./components/GameOver";
import CombineHistoryPanel from "./components/CombineHistoryPanel";
import ActionToast from "./components/ActionToast";
import CollectionRewardModal from "./components/CollectionRewardModal";
import BoardTypeTotals from "./components/BoardTypeTotals";
import ItemBar from "./components/ItemBar";
import Fridge from "./components/Fridge";
import SelectionBar from "./components/SelectionBar";
import FoodDetailModal from "./components/FoodDetailModal";

import useGame from "./hooks/useGame";

import {
  getActivityStatus
} from "./game/activityStatus";

import { FOOD_TYPE_LABELS } from "./data/specialOneRegistry";
import { getActionStatus } from "./game/actionStatus";
import { getNonDrinkBoardSum } from "./game/scoreValue";
import { playSound } from "./audio/sound";

const numberFormatter = new Intl.NumberFormat("zh-CN");


function App(){

  const game = useGame();
  const nonDrinkBoardSum = getNonDrinkBoardSum(game.board);

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
  const [showCollection,setShowCollection] = useState(false);
  const [actionToast,setActionToast] = useState(null);
  const [collectionRewardQueue,setCollectionRewardQueue] = useState([]);
  const [heaterSelectMode,setHeaterSelectMode] = useState(false);
  const [showFridge,setShowFridge] = useState(false);
  const [foodDetail,setFoodDetail] = useState(null);

  const animationTimersRef = useRef([]);
  const animationTokenRef = useRef(0);
  const actionToastTimerRef = useRef(null);
  const notifiedEfficiencyStepRef = useRef(0);
  const notifiedCheckpointIndexRef = useRef(0);

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
      showActionToast("无法使用加热器", game.heaterCount === 0 ? "今日已使用" : "没有可加热的料理");
      return;
    }
    game.clearSelection();
    setHeaterSelectMode(true);
  }

  function handleSwap(){
    const indexes=[...game.selectedIndexes];
    if(!game.canSwapSelected||!game.swapSelectedCells())return;
    beginInstantAnimation({type:"swap",indexes,sourceIndexes:indexes,targetIndexes:indexes},320);
    showActionToast("交换完成","消耗 15 分钟");
  }

  function handleSuperHeater(){
    if(!game.superHeaterAvailable){
      showActionToast("无法超级加热", game.superHeaterCount === 0 ? "今日已使用" : "没有可加热的料理");
      return;
    }
    setHeaterSelectMode(false);
    const result = game.useSuperHeater();
    if(result){
      beginInstantAnimation({
        type: "super-heater",
        sourceIndexes: game.board.flatMap((piece,index)=>piece ? [index] : []),
        targetIndexes: game.board.flatMap((piece,index)=>piece ? [index] : []),
        beforeValues: game.board.filter(Boolean).map(piece=>piece.value),
        afterValues: game.board.filter(Boolean).map(piece=>piece.value+1)
      },620);
      showActionToast("超级加热", "全盘 +1");
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
    showActionToast(`${result.fromValue} → ${result.toValue}`, "加热完成");
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
    if(game.dayCycleEnabled) return;
    const snapshot = game.collectionEfficiencyTimeline.at(-1);
    if(!snapshot || snapshot.step <= notifiedEfficiencyStepRef.current) return;
    notifiedEfficiencyStepRef.current = snapshot.step;
    showActionToast(
      `Step ${snapshot.step} · 效率 ${snapshot.collectionEfficiency.toFixed(2)}`,
      `最近10步 +${snapshot.recent10Collections}`
    );
  }, [game.collectionEfficiencyTimeline, game.dayCycleEnabled]);

  useEffect(() => {
    if(game.dayCycleEnabled) return;
    const result = game.latestCheckpointResult;
    if(!result || result.index <= notifiedCheckpointIndexRef.current) return;
    notifiedCheckpointIndexRef.current = result.index;
    if(result.passed){
      showActionToast("检查站通过", `下一站 Step ${game.checkpoint.step}`);
    }else{
      showActionToast(
        "检查站未通过",
        result.type === "collection"
          ? "Step 10 前需要至少售出 1 个料理"
          : `目标 ${numberFormatter.format(result.requiredScore)} 分 · 最终 ${numberFormatter.format(result.currentScore)} 分`
      );
    }
  }, [game.latestCheckpointResult, game.checkpoint, game.dayCycleEnabled]);


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


    const targetIndex = game.preview.combine.kind==="absorb"
      ? game.preview.combine.drinkIndex
      : game.board.findIndex(piece => !piece);


    if(targetIndex === -1){
      return;
    }


    const token =
      ++animationTokenRef.current;

    const combineKind=game.preview.combine.kind;
    const combineToast={
      title: `${game.board[indexes[0]].value} + ${game.board[indexes[1]].value} → ${game.preview.combine.value}`,
      message: "搭配成功"
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

        const result=game.combineNumbers(indexes);
        if(result){
          playSound("combine");
          showActionToast(
            combineToast.title,
            `${combineToast.message}${result.actionBaseScore?.score ? ` +${result.actionBaseScore.score}分` : ""}${result.comboEvent?.message ? ` · ${result.comboEvent.message}` : ""}`
          );
        }


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

    const reduceToast=game.preview.reduce.equalEliminate
      ? {
          title:`同数消除 · ${game.board[indexes[0]].value}`,
          message:"处理完成"
        }
      : {
          title:game.preview.reduce.results
            .map((result,position)=>`${game.board[indexes[position]].value} → ${result.value}`)
            .join(" · "),
          message:"处理完成"
        };


    const removedIndexes = game.preview.reduce.equalEliminate
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


        if(
          collectible
        ){

          const slotKey =
            isEightPalace
              ? `${foodType ?? "default"}:${value ?? ""}`
              : `${value}:${foodType}`;


          const isFirstSlot = !collectedSlots.has(slotKey);


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
          playSound(rewards.length > 0 || removedIndexes.length > 0 ? "collect" : "process");
          const newCollectionRewards = rewards.filter(reward => reward.isNewCollection);
          if(newCollectionRewards.length > 0){
            setCollectionRewardQueue(queue => [...queue, ...newCollectionRewards]);
          }else{
            showActionToast(reduceToast.title,`${reduceToast.message}${result.actionBaseScore?.score ? ` +${result.actionBaseScore.score}分` : ""}`);
          }
          if(result.comboEvent?.message) showActionToast("连击中断", "下一次得分将从第 1 连重新开始");
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

      const activated = game.activateOne(
        index
      );

      if(activated) playSound("click");

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

        const removed = game.activateOne(
          index
        );

        if(removed) playSound("collect");


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

  function handleSelectCell(index){
    if(game.selectCell(index)) playSound("click");
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
      ,game.combineHistoryKeys,
      game.legalSwapCount
    );


  const selectedIdsForLegacyUI =
    game.selectedNumbers.map(
      item =>
        item.id
    );

  const collectionCount = ["eightPalace", "simpleEightPalace"].includes(game.gameMode)
    ? game.collectionCards.length
    : game.collection.length;


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

          {game.dayCycleEnabled ? <DayPanel
            day={game.day}
            weekday={game.weekday}
            time={game.dayTime}
            period={game.dayPeriod}
            dayMinutesElapsed={game.dayMinutesElapsed}
            timeSalePeriods={game.timeSalePeriods}
            score={game.score}
            dayRevenue={game.dayRevenue}
            collectionsToday={game.collectionsToday}
            steps={game.steps}
            totalActionMinutes={game.totalActionMinutes}
            comboCount={game.comboCount}
          /> : <StepPanel
            steps={
              game.steps
            }
            score={game.score}
            totalActionMinutes={game.totalActionMinutes}
            stepLimit={game.stepLimit}
            gameMode={game.gameMode}
            checkpoint={game.checkpoint}
            collectionCount={game.collectionCards.length}
            collectionEfficiencyTimeline={game.collectionEfficiencyTimeline}
          />}


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
                onSelectCell={
                  game.daySettlement || activeAnimation?.phase === "exit" || activeAnimation?.phase === "compress"
                    ? undefined
                    : heaterSelectMode
                      ? handleHeaterTarget
                      : handleSelectCell
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
                dayMinutesElapsed={
                  game.dayMinutesElapsed
                }
                totalActionMinutes={game.totalActionMinutes}
                timeSalePeriods={
                  game.timeSalePeriods
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
                onOpenDetails={(piece,index) => setFoodDetail({piece,index})}
              />

              <SelectionBar board={game.board} selectedIndexes={game.selectedIndexes} />

              <div className="game-board-actions">
                <ActionButtons
                  selected={selectedIdsForLegacyUI}
                  preview={game.preview}
                  onCombine={handleCombine}
                  onBlockedCombine={handleBlockedCombine}
                  onReduce={handleReduce}
                  onSwap={handleSwap}
                  canSwap={!game.gameOver&&!game.daySettlement&&game.canSwapSelected}
                  onFridge={() => setShowFridge(true)}
                  fridgeCount={game.fridgeCards.length}
                  fridgeActionCount={game.fridgeStoreActions.length}
                  gameOver={game.gameOver || Boolean(game.daySettlement) || heaterSelectMode}
                  removingId={removingIndex ?? ((activeAnimation?.phase === "exit" || activeAnimation?.phase === "compress") ? activeAnimation.token : null)}
                />
              </div>

              <section className="game-info-row game-info-row--secondary">
                <div className="game-situation-meta">
                  <BoardStatus activity={activityStatus.activity} activityCombineLegal={activityStatus.combineLegal} activityReduceLegal={activityStatus.reduceLegal} numberCount={game.numbers.length} nonDrinkBoardSum={nonDrinkBoardSum} dead={activityStatus.dead} />
                  <ItemBar heaterCount={game.heaterCount} heaterAvailable={game.heaterAvailable && !game.daySettlement} heaterActive={heaterSelectMode} onHeaterClick={toggleHeaterMode} superHeaterCount={game.superHeaterCount} superHeaterAvailable={game.superHeaterAvailable && !game.daySettlement} onSuperHeaterClick={handleSuperHeater} />
                  <div className="game-meta-buttons">
                    <button type="button" className="combine-history-trigger" onClick={() => setShowCombineHistory(true)}>历史<span>{game.combineHistory.length}</span></button>
                    <button type="button" className="combine-history-trigger" onClick={() => setShowCollection(true)}>销售<span>{collectionCount}</span></button>
                  </div>
                </div>
              </section>

            </div>

          </div>

        </section>


      </div>

      {showCollection && (
        <div className="collection-panel-overlay" onClick={() => setShowCollection(false)}>
          <div className="collection-panel-dialog" onClick={event => event.stopPropagation()}>
            <button type="button" className="collection-panel-close" aria-label="关闭销售记录" onClick={() => setShowCollection(false)}>×</button>
            {["eightPalace", "simpleEightPalace"].includes(game.gameMode) ? (
              <EightPalaceCollectionPanel cards={game.collectionTimeline} score={game.score} />
            ) : (
              <CollectionPanel
                collection={game.collection}
                collectionTimeline={game.collectionTimeline}
                collectionPaths={game.collectionPaths}
                collectionOrigins={game.collectionOrigins}
                collectionParents={game.collectionParents}
                latestCollection={game.latestCollection}
              />
            )}
          </div>
        </div>
      )}

      {showFridge && (
        <div className="fridge-overlay" onClick={() => setShowFridge(false)}>
          <div className="fridge-dialog" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button type="button" className="fridge-dialog-close" aria-label="关闭冰箱" onClick={() => setShowFridge(false)}>×</button>
            <Fridge cards={game.fridgeCards} storeActions={game.fridgeStoreActions} selectedIndex={game.selectedFridgeIndex} canRetrieve={game.board.some(piece => !piece)} disabled={game.gameOver || Boolean(game.daySettlement) || Boolean(activeAnimation)} onStore={game.storeInFridge} onSelectCard={index => { game.selectFridgeCard(index); setShowFridge(false); }} />
          </div>
        </div>
      )}

      <FoodDetailModal piece={foodDetail?.piece} index={foodDetail?.index} totalActionMinutes={game.totalActionMinutes} onClose={() => setFoodDetail(null)} />


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
          checkpointResult={game.latestCheckpointResult}
          daySettlement={game.daySettlement}
          passedCheckpointCount={game.passedCheckpointCount}
          recapSnapshots={game.gameRecapSnapshots}
          recapActionCounts={game.recapActionCounts}
          maxCombo={game.maxCombo}
          comboBonusTotal={game.comboBonusTotal}
          totalActionMinutes={game.totalActionMinutes}
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

      <DaySettlement settlement={game.daySettlement} onContinue={game.startNextDay} />

    </div>

  );

}


export default App;
