import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  combineValue,
  combineFoodType,
  combineFoodTypeByBoardPosition,
  combineFoodPurity,
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

import {
  createGameState,

  getBoardPieces,
  getPieceAt,
  getOrderedPair,

  canCombineCells,
  canReduceCells,

  applyAction,
  resolveGameOver

} from "../game/gameEngine";


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
          values
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
    );


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


  const trend =

    gameState?.trend

    ??

    1;


  const boardPrices =

    getBoardPrices(
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


    // 已选 → 取消
    if(
      selectedIndexes.includes(
        index
      )
    ){


      setSelectedIndexes(

        selectedIndexes.filter(

          selectedIndex =>
            selectedIndex !== index

        )

      );


      return;

    }


    // 少于两个
    if(
      selectedIndexes.length <
      2
    ){


      setSelectedIndexes(

        [
          ...selectedIndexes,
          index
        ]

      );


      return;

    }


    // 第三个
    setSelectedIndexes(

      [
        selectedIndexes[1],
        index
      ]

    );

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


    const orderedPair =

      getOrderedPair(

        gameState,

        first.index,

        second.index

      );


    if(
      !orderedPair
    ){


      return null;

    }


    return {


      combine:

        combineAllowed

          ?

            {

              value:

                combineValue(

                  orderedPair.front.value,

                  orderedPair.back.value

                ),


              foodType:["eightPalace","simpleEightPalace"].includes(gameState?.gameMode)
                ? combineFoodTypeByBoardPosition(first.piece,first.index,second.piece,second.index)
                : combineFoodType(orderedPair.front,orderedPair.back),


              purity:(()=>{const resultType=["eightPalace","simpleEightPalace"].includes(gameState?.gameMode)?combineFoodTypeByBoardPosition(first.piece,first.index,second.piece,second.index):combineFoodType(orderedPair.front,orderedPair.back);return combineFoodPurity(orderedPair.front,orderedPair.back,resultType);})()

            }

          :

            null,


      reduce:

        reduceAllowed

          ?

            {

              divisor,

              keyOutcome:(()=>{
                if(!["eightPalace","simpleEightPalace"].includes(gameState?.gameMode))return null;
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

                  value:
                    first.piece.value / divisor,

                  autoCollect:
                    first.piece.value / divisor === 1,

                  collectValue:
                    first.piece.value / divisor === 1
                      ? first.piece.value
                      : null,

                  foodType:
                    first.piece.foodType,

                  purity:
                    first.piece.purity
                    ?? null

                },

                {

                  value:
                    second.piece.value / divisor,

                  autoCollect:
                    second.piece.value / divisor === 1,

                  collectValue:
                    second.piece.value / divisor === 1
                      ? second.piece.value
                      : null,

                  foodType:
                    second.piece.foodType,

                  purity:
                    second.piece.purity
                    ?? null

                }

              ]

            }

          :

            null

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


  // ==========================================================
  // 处理 / 约分
  // ==========================================================

  function reduceNumbers(){


    if(
      !gameState ||
      gameOver
    ){


      return;

    }


    const cells =

      getSelectedCells();


    if(
      cells.length !==
      2
    ){


      return;

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


      return;

    }


    setGameState(
      nextState
    );


    setSelectedIndexes(
      []
    );

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

    collectionPaths,

    collectionOrigins,

    collectionParents,

    latestCollection,

    money,

    trend,

    boardPrices,


    // 分数 / 时间
    score,

    steps,


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

    combineNumbers,

    reduceNumbers,

    removeOne,

    activateOne,


    // UI 辅助
    getCell,

    isCellSelected

  };

}
