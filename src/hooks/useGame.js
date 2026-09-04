import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  BASE_FOOD_TYPES,
  SPECIAL_ONE_KINDS,
  canApplyFunctionOne
} from "../game/rules";

import {
  getPrimeEnergy,
  getPrimeDensity,
  getPrimeState
} from "../game/primeStatus";

import {
  getBoardPrices
} from "../game/price";
import { getNextSelectionIndexes } from "../game/selection";
import { getHeaterCost } from "../game/heater";
import { getHeaterAvailability } from "../game/heaterPricing";
import { canRestorePiece } from "../game/restore";
import { getCurrentRestorePrice } from "../game/restorePricing";
import { canUseSuperHeater } from "../game/superHeater";
import { getCurrentSuperHeaterPrice } from "../game/superHeaterPricing";

import {
  createGameState,

  getBoardPieces,
  getPieceAt,

  canCombineCells,
  createCombineOutcome,
  canReduceCells,
  createReduceOutcome,

  applyAction,
  resolveGameOver

} from "../game/gameEngine";
import { advanceToNextDay, getDayPeriod, getDayScoreTarget, getDayStep, getDayTime } from "../game/dayCycle";
import { canCompoundCells, compoundCells, getCompoundType, isCompoundPiece } from "../game/compound";


export default function useGame(){


  // ==========================================================
  // Engine 状态
  // ==========================================================

  const [

    gameState,

    setGameState

  ] = useState(
    null
  );


  // ==========================================================
  // 游戏开始
  // ==========================================================

  const [

    started,

    setStarted

  ] = useState(
    false
  );


  // ==========================================================
  // 选择的是格子 index
  // ==========================================================

  const [

    selectedIndexes,

    setSelectedIndexes

  ] = useState([]);

  const [
    functionOneIndex,
    setFunctionOneIndex
  ] = useState(null);


  // ==========================================================
  // 开始游戏
  // ==========================================================

  function startGame(
    values
  ){


    const state =

      resolveGameOver(

        createGameState(
          values,
          {dayCycleEnabled: true}
        )

      );


    setGameState(
      state
    );


    setSelectedIndexes(
      []
    );



    setStarted(
      true
    );

  }


  // ==========================================================
  // 九宫格
  // ==========================================================

  const board =

    gameState?.board

    ??

    Array.from(
      {
        length:
          9
      },
      () =>
        null
    );


  // ==========================================================
  // 普通棋子数组
  // ==========================================================

  const numbers =

    getBoardPieces(
      board
    ).filter(piece => !isCompoundPiece(piece));


  // ==========================================================
  // 收藏
  // ==========================================================

  const collection =

    gameState?.collection

    ??

    [];


  const collectionTimeline =

    gameState?.collectionTimeline

    ??

    [];

  const collectionCards = gameState?.collectionCards ?? [];

  const collectionEfficiencyTimeline = gameState?.collectionEfficiencyTimeline ?? [];


  const collectionPaths =

    gameState?.collectionPaths

    ??

    {};


  const collectionOrigins =

    gameState?.collectionOrigins

    ??

    {};


  const collectionParents =

    gameState?.collectionParents

    ??

    {};


  const latestCollection =

    gameState?.latestCollection

    ??

    null;


  const money =

    gameState?.money

    ??

    0;

  const heaterUseCount = gameState?.heaterUseCount ?? 0;
  const heaterCost = getHeaterCost(gameState);
  const heaterAvailability = getHeaterAvailability(gameState);
  const heaterAvailable = heaterAvailability.canEnter;
  const superHeaterUseCount = gameState?.superHeaterUseCount ?? 0;
  const superHeaterCost = getCurrentSuperHeaterPrice(gameState);
  const superHeaterAvailable = canUseSuperHeater(gameState);
  const restoreUseCount = gameState?.restoreUseCount ?? 0;
  const restoreCost = getCurrentRestorePrice(gameState);
  const restoreAvailable = Boolean(gameState?.board?.some((_, index) => canRestorePiece(gameState, index)));


  const trend =

    gameState?.trend

    ??

    1;


  const boardPrices =
    ["eightPalace", "simpleEightPalace"].includes(gameState?.gameMode)
      ? []
      : getBoardPrices(
          board,
          trend,
          collectionPaths
        );


  // ==========================================================
  // 分数 / 时间
  // ==========================================================

  const score =

    gameState?.score

    ??

    0;


  const steps =

    gameState?.steps

    ??

    0;

  const stepLimit = gameState?.stepLimit ?? 0;
  const combineHistoryKeys = gameState?.combineHistoryKeys ?? {};
  const combineHistory = gameState?.combineHistory ?? [];
  const checkpoint = gameState?.checkpoint ?? null;
  const passedCheckpointCount = gameState?.passedCheckpointCount ?? 0;
  const checkpointHistory = gameState?.checkpointHistory ?? [];
  const latestCheckpointResult = gameState?.latestCheckpointResult ?? null;
  const dayCycleEnabled = gameState?.dayCycleEnabled ?? false;
  const day = gameState?.day ?? 1;
  const dayStep = getDayStep(gameState);
  const dayTime = getDayTime(gameState);
  const dayPeriod = getDayPeriod(gameState);
  const dayTarget = getDayScoreTarget(day);
  const daySettlement = gameState?.daySettlement ?? null;
  const dayHistory = gameState?.dayHistory ?? [];
  const gameRecapSnapshots = gameState?.gameRecapSnapshots ?? [];
  const recapActionCounts = gameState?.recapActionCounts ?? null;
  const recapItemSpending = gameState?.recapItemSpending ?? null;


  const gameOver =

    gameState?.gameOver

    ??

    false;


  const gameOverReason =

    gameState?.gameOverReason

    ??

    null;


  const gameMode =

    gameState?.gameMode

    ??

    null;


  const eightPalaceKeys =

    gameState?.eightPalaceKeys

    ??

    {};

  const usedKeyTriggerValues=gameState?.usedKeyTriggerValues??[];


  const targetFoodTypes =

    gameState?.targetFoodTypes

    ??

    [];


  // ==========================================================
  // 迷宫回转
  // ==========================================================

  const mazeTurn =

    gameState?.mazeTurn

    ??

    null;


  const mazeTurnCount =

    gameState
      ?.mazeHistory
      ?.turnCount

    ??

    0;


  const mazeVisitedStates =

    gameState
      ?.mazeHistory
      ?.entries
      ?.length

    ??

    0;


  // ==========================================================
  // 质数状态
  // ==========================================================

  const primeEnergy =

    getPrimeEnergy(
      numbers
    );


  const primeDensity =

    getPrimeDensity(
      numbers
    );


  const primeState =

    getPrimeState(

      primeEnergy,

      primeDensity

    );


  // ==========================================================
  // 获取格子
  // ==========================================================

  function getCell(
    index
  ){


    if(
      !gameState
    ){


      return null;

    }


    return getPieceAt(

      gameState,

      index

    );

  }


  // ==========================================================
  // 获取选中格
  // ==========================================================

  function getSelectedCells(){


    if(
      !gameState
    ){


      return [];

    }


    return [...selectedIndexes]
      .map(

        index => ({

          index,

          piece:

            getPieceAt(
              gameState,
              index
            )

        })

      )
      .filter(

        item =>
          item.piece

      );

  }


  const selectedCells =

    getSelectedCells();


  const selectedNumbers =

    selectedCells.map(

      item =>
        item.piece

    );


  // ==========================================================
  // 选择格子
  // ==========================================================

  function selectCell(
    index
  ){


    if(
      !gameState ||
      gameOver
    ){


      return;

    }


    const target =

      getPieceAt(
        gameState,
        index
      );


    // 空格不能选择
    if(
      !target
    ){


      return;

    }

    if(isCompoundPiece(target)) return;


    if(
      functionOneIndex !== null
    ){

      const nextState =

        applyAction(

          gameState,

          {
            type:
              "apply_one",

            oneIndex:
              functionOneIndex,

            targetIndex:
              index
          }

        );


      if(
        nextState !== gameState
      ){

        setGameState(
          nextState
        );

        setFunctionOneIndex(
          null
        );

        setSelectedIndexes(
          []
        );

      }


      return;

    }


    // 1 不进入普通选择逻辑
    if(
      target.value ===
      1
    ){


      return;

    }


    setSelectedIndexes(getNextSelectionIndexes(selectedIndexes,index));

  }

  function clearSelection(){
    setSelectedIndexes([]);
    setFunctionOneIndex(null);
  }

  function useHeaterOnCell(index){
    if(!gameState) return null;
    const nextState = applyAction(gameState, {type: "heater", indexes: [index]});
    if(nextState === gameState) return null;
    setGameState(nextState);
    clearSelection();
    return nextState.latestHeaterUse;
  }

  function useSuperHeater(){
    if(!gameState) return null;
    const nextState = applyAction(gameState, {type: "super_heater"});
    if(nextState === gameState) return null;
    setGameState(nextState);
    clearSelection();
    return nextState.latestSuperHeaterUse;
  }

  function useRestoreOnCell(index){
    if(!gameState) return null;
    const nextState = applyAction(gameState, {type: "restore", indexes: [index]});
    if(nextState === gameState) return null;
    setGameState(nextState);
    clearSelection();
    return nextState.latestRestoreUse;
  }

  function startNextDay(){
    if(!gameState) return;
    setGameState(advanceToNextDay(gameState));
    clearSelection();
  }


  // ==========================================================
  // Preview
  // ==========================================================

  function getPreviewResult(){


    if(
      !gameState
    ){


      return null;

    }


    const cells =

      getSelectedCells();


    if(
      cells.length !==
      2
    ){


      return null;

    }


    const first =
      cells[0];


    const second =
      cells[1];


    const divisor =

      gcd(

        first.piece.value,

        second.piece.value

      );


    const combineAllowed =

      canCombineCells(

        gameState,

        first.index,

        second.index

      );


    const reduceAllowed =

      canReduceCells(

        gameState,

        first.index,

        second.index

      );


    const combineOutcome=combineAllowed
      ? createCombineOutcome(gameState,first.index,second.index)
      : null;
    const reduceOutcome=reduceAllowed?createReduceOutcome(gameState,first.index,second.index):null;


    return {


      combine:

        combineAllowed

          ?

            {...(combineOutcome?.piece??{}),...combineOutcome}

          :

            null,


      reduce:

        reduceAllowed

          ?

            {

              divisor,
              kind:reduceOutcome.kind,
              equalClear:reduceOutcome.kind==="equalClear",

              keyOutcome:(()=>{
                if(!["eightPalace","simpleEightPalace"].includes(gameState?.gameMode))return null;
                if(reduceOutcome.kind==="equalClear")return null;
                const firstResult=first.piece.value/divisor,secondResult=second.piece.value/divisor;
                const triggerPiece=firstResult===1?first.piece:secondResult===1?second.piece:null;
                if(!triggerPiece)return null;
                const triggerValue=triggerPiece.value,foodType=triggerPiece.foodType;
                if(first.piece.foodType!==second.piece.foodType||!BASE_FOOD_TYPES.includes(foodType))return {status:"ineligible",triggerValue,foodType};
                if(gameState.eightPalaceKeys?.[foodType])return {status:"owned",triggerValue,foodType};
                if((gameState.usedKeyTriggerValues??[]).includes(triggerValue))return {status:"used",triggerValue,foodType};
                return {status:"available",triggerValue,foodType};
              })(),

              results: [

                {

                  ...reduceOutcome.results[0],

                  value:reduceOutcome.results[0].value,

                  autoCollect:reduceOutcome.results[0].autoCollect??reduceOutcome.results[0].value===1,
                  clear:reduceOutcome.results[0].clear===true,

                  collectValue:
                    first.piece.value / divisor === 1
                      ? first.piece.value
                      : null,

                  foodType:reduceOutcome.results[0].foodType,

                  purity:reduceOutcome.results[0].purity

                },

                {

                  ...reduceOutcome.results[1],

                  value:reduceOutcome.results[1].value,

                  autoCollect:reduceOutcome.results[1].autoCollect??reduceOutcome.results[1].value===1,
                  clear:reduceOutcome.results[1].clear===true,

                  collectValue:
                    second.piece.value / divisor === 1
                      ? second.piece.value
                      : null,

                  foodType:reduceOutcome.results[1].foodType,

                  purity:reduceOutcome.results[1].purity

                }

              ]

            }

          :

            null,

      compound: canCompoundCells(gameState, first.index, second.index)
        ? {
            compoundType: getCompoundType(first.index, second.index),
            value: Math.abs(first.piece.value - second.piece.value)
          }
        : null

    };

  }


  const preview =

    getPreviewResult();


  // ==========================================================
  // 单选后的合法操作提示
  // ==========================================================

  const actionCandidates = {};


  if(
    !gameOver &&
    functionOneIndex !== null
  ){

    board.forEach(

      (
        piece,
        index
      ) => {

        if(
          canApplyFunctionOne(
            piece
          )
        ){

          actionCandidates[index] = {

            applyOne:
              true

          };

        }

      }

    );

  }


  if(
    gameState &&
    !gameOver &&
    selectedCells.length === 1
  ){


    const selectedIndex =
      selectedCells[0].index;


    const selectedPiece =
      selectedCells[0].piece;


    board.forEach(

      (
        piece,
        index
      ) => {


        if(
          !piece ||
          index === selectedIndex ||
          piece.value === 1
        ){


          return;

        }


        const combine =

          canCombineCells(

            gameState,

            selectedIndex,

            index

          );


        const reduce =

          canReduceCells(

            gameState,

            selectedIndex,

            index

          );


        const divisor =

          reduce

            ?

              gcd(

                selectedPiece.value,

                piece.value

              )

            :

              1;


        actionCandidates[index] = {

          combine,

          reduce,

          remove:

            reduce

            &&

            (

              selectedPiece.value /
              divisor === 1

              ||

              piece.value /
              divisor === 1

            )

        };

      }

    );

  }


  // ==========================================================
  // 组合
  //
  // lockedIndexes：
  //
  // App 的动画在点击瞬间会锁定两个格子。
  // 动画延迟结束后直接使用这两个格子执行动作，
  // 避免重新依赖 React 的 selectedIndexes。
  //
  // 没传 lockedIndexes 时仍使用当前 selectedIndexes，
  // 因此保持旧调用兼容。
  // ==========================================================

  function combineNumbers(
    lockedIndexes = null
  ){


    if(
      !gameState ||
      gameOver
    ){


      return false;

    }


    const indexes =

      Array.isArray(
        lockedIndexes
      )

        ?

          [
            ...lockedIndexes
          ]

        :

          [
            ...selectedIndexes
          ];


    if(
      indexes.length !==
      2
    ){


      return false;

    }


    const first =

      getPieceAt(

        gameState,

        indexes[0]

      );


    const second =

      getPieceAt(

        gameState,

        indexes[1]

      );


    if(
      !first ||
      !second
    ){


      return false;

    }


    const nextState =

      applyAction(

        gameState,

        {

          type:
            "combine",

          indexes: [

            indexes[0],

            indexes[1]

          ]

        }

      );


    if(
      nextState ===
      gameState
    ){


      return false;

    }


    setGameState(
      nextState
    );


    setSelectedIndexes(
      []
    );


    return true;

  }

  function compoundNumbers(){
    if(!gameState || gameOver || selectedIndexes.length !== 2) return false;
    const nextState = compoundCells(gameState, selectedIndexes[0], selectedIndexes[1]);
    if(nextState === gameState) return false;
    setGameState(nextState);
    setSelectedIndexes([]);
    return true;
  }


  // ==========================================================
  // 处理 / 约分
  // ==========================================================

  function reduceNumbers(){


    if(
      !gameState ||
      gameOver
    ){


      return false;

    }


    const cells =

      getSelectedCells();


    if(
      cells.length !==
      2
    ){


      return false;

    }


    const nextState =

      applyAction(

        gameState,

        {

          type:
            "reduce",

          indexes: [

            cells[0].index,

            cells[1].index

          ]

        }

      );


    if(
      nextState ===
      gameState
    ){


      return false;

    }


    setGameState(
      nextState
    );


    setSelectedIndexes(
      []
    );

    const rewards=nextState.latestCollectionRewards ?? [];
    const collectionEvents=(nextState.collectionTimeline ?? []).slice(-rewards.length);
    return {
      collectionRewards: rewards.map((reward,index)=>({
        ...reward,
        isNewCollection:collectionEvents[index]?.isNewCollection,
        moneyGain:collectionEvents[index]?.moneyGain
      }))
    };

  }


  // ==========================================================
  // 消除 1
  // ==========================================================

  function removeOne(
    index
  ){


    if(
      !gameState ||
      gameOver
    ){


      return;

    }


    const nextState =

      applyAction(

        gameState,

        {

          type:
            "remove",

          index

        }

      );


    if(
      nextState ===
      gameState
    ){


      return;

    }


    setGameState(
      nextState
    );


    setSelectedIndexes(

      prev =>

        prev.filter(

          selectedIndex =>
            selectedIndex !== index

        )

    );

  }


  function activateOne(
    index
  ){

    if(
      gameState?.gameMode === "eightPalace" ||
      gameState?.gameMode === "simpleEightPalace"
    ){
      return;
    }


    const piece =

      gameState
        ?.board
        ?.[index];


    if(
      piece
        ?.specialOne
        ?.kind ===
      SPECIAL_ONE_KINDS.FUNCTION
    ){


      setFunctionOneIndex(
        index
      );


      setSelectedIndexes(
        []
      );


      return;

    }


    removeOne(
      index
    );

  }


  // ==========================================================
  // UI 辅助
  // ==========================================================

  function isCellSelected(
    index
  ){


    return selectedIndexes.includes(
      index
    );

  }


  // ==========================================================
  // 对外接口
  // ==========================================================

  return {


    // 棋盘
    board,

    numbers,


    // 选择
    selectedIndexes,

    selectedCells,

    selectedNumbers,

    functionOneIndex,


    // 预览
    preview,

    actionCandidates,


    // 游戏状态
    started,

    gameOver,

    gameOverReason,

    gameMode,

    eightPalaceKeys,

    usedKeyTriggerValues,

    targetFoodTypes,


    // 收藏
    collection,

    collectionTimeline,

    collectionCards,

    collectionEfficiencyTimeline,

    collectionPaths,

    collectionOrigins,

    collectionParents,

    latestCollection,

    money,

    heaterUseCount,

    heaterCost,

    heaterAvailable,
    superHeaterUseCount,
    superHeaterCost,
    superHeaterAvailable,
    restoreUseCount,
    restoreCost,
    restoreAvailable,

    trend,

    boardPrices,


    // 分数 / 时间
    score,

    steps,

    stepLimit,
    checkpoint,
    passedCheckpointCount,
    checkpointHistory,
    latestCheckpointResult,
    dayCycleEnabled,
    day,
    dayStep,
    dayTime,
    dayPeriod,
    dayTarget,
    daySettlement,
    dayHistory,
    gameRecapSnapshots,
    recapActionCounts,
    recapItemSpending,
    combineHistoryKeys,

    combineHistory,


    // 迷宫回转
    mazeTurn,

    mazeTurnCount,

    mazeVisitedStates,


    // 环境状态
    primeEnergy,

    primeDensity,

    primeState,


    // 操作
    startGame,

    selectCell,

    clearSelection,

    useHeaterOnCell,
    useSuperHeater,
    useRestoreOnCell,
    startNextDay,

    combineNumbers,

    compoundNumbers,

    reduceNumbers,

    removeOne,

    activateOne,


    // UI 辅助
    getCell,

    isCellSelected

  };

}
