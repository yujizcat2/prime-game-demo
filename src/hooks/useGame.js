import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  combineValue,
  combineFoodType
} from "../game/rules";

import {
  getPrimeEnergy,
  getPrimeDensity,
  getPrimeState
} from "../game/primeStatus";

import {
  createGameState,

  getBoardPieces,
  getPieceAt,
  getOrderedPair,

  canCombineCells,
  canReduceCells,

  combineCells as engineCombineCells,
  reduceCells as engineReduceCells,
  removeOne as engineRemoveOne

} from "../game/gameEngine";



export default function useGame(){


  // ==========================================================
  // Engine状态
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
  ] = useState(false);



  // ==========================================================
  // 选择的是格子index
  // ==========================================================

  const [
    selectedIndexes,
    setSelectedIndexes
  ] = useState([]);





  // ==========================================================
  // 开始游戏
  // ==========================================================

  function startGame(
    values
  ){


    const state =

      createGameState(
        values
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

    ?? Array.from(
      {
        length: 9
      },
      () => null
    );



  // ==========================================================
  // 普通棋子数组
  //
  // 仅用于旧统计系统兼容。
  // ==========================================================

  const numbers =

    getBoardPieces(
      board
    );



  const seasoningTray =
    gameState?.seasoningTray ?? [];


  const collection =
    gameState?.collection ?? [];


  const collectionPaths =
    gameState?.collectionPaths ?? {};


  const collectionOrigins =
    gameState?.collectionOrigins ?? {};


  const latestCollection =
    gameState?.latestCollection ?? null;


  const score =
    gameState?.score ?? 0;


  const steps =
    gameState?.steps ?? 0;


  const gameOver =
    gameState?.gameOver ?? false;





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



    return [

      ...selectedIndexes

    ]

      .sort(
        (
          a,
          b
        ) =>
          a - b
      )

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



    // ========================================================
    // 空格不能选择
    // ========================================================

    if(
      !target
    ){

      return;

    }



    // ========================================================
    // 1由Board直接触发removeOne
    //
    // 不进入普通选择逻辑。
    // ========================================================

    if(
      target.value === 1
    ){

      return;

    }



    // ========================================================
    // 已选 → 取消
    // ========================================================

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



    // ========================================================
    // 少于两个
    // ========================================================

    if(
      selectedIndexes.length < 2
    ){


      setSelectedIndexes(

        [

          ...selectedIndexes,

          index

        ].sort(
          (
            a,
            b
          ) =>
            a - b
        )

      );


      return;

    }



    // ========================================================
    // 第三个
    //
    // 保留旧操作：
    // 删除第一个，
    // 保留第二个，
    // 加入新的。
    // ========================================================

    setSelectedIndexes(

      [

        selectedIndexes[1],

        index

      ].sort(
        (
          a,
          b
        ) =>
          a - b
      )

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
      cells.length !== 2
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


            foodType:

              combineFoodType(

                orderedPair.front,

                orderedPair.back

              )

          }

          :

          null,


      reduce:

        reduceAllowed

          ?

          [

            first.piece.value /
            divisor,

            second.piece.value /
            divisor

          ]

          :

          null

    };

  }





  const preview =
    getPreviewResult();





  // ==========================================================
  // 搭配
  //
  // 点击后立即：
  //
  // C → 下一个空格
  // ==========================================================

  function combineNumbers(){


    if(
      !gameState ||
      gameOver
    ){

      return;

    }



    const cells =
      getSelectedCells();



    if(
      cells.length !== 2
    ){

      return;

    }



    const nextState =

      engineCombineCells(

        gameState,

        cells[0].index,

        cells[1].index

      );



    if(
      nextState === gameState
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
  // 处理
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
      cells.length !== 2
    ){

      return;

    }



    const nextState =

      engineReduceCells(

        gameState,

        cells[0].index,

        cells[1].index

      );



    if(
      nextState === gameState
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
  // 消除1
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

      engineRemoveOne(

        gameState,

        index

      );



    if(
      nextState === gameState
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





  // ==========================================================
  // UI辅助
  // ==========================================================

  function isCellSelected(
    index
  ){


    return selectedIndexes.includes(
      index
    );

  }





  return {


    board,

    numbers,


    seasoningTray,


    selectedIndexes,

    selectedCells,

    selectedNumbers,


    preview,


    started,

    gameOver,


    collection,

    collectionPaths,

    collectionOrigins,

    latestCollection,


    score,

    steps,


    primeEnergy,

    primeDensity,

    primeState,


    startGame,

    selectCell,

    combineNumbers,

    reduceNumbers,

    removeOne,


    getCell,

    isCellSelected

  };

}