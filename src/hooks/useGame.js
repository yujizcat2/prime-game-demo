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
  //
  // 新版：
  //
  // values只需要3个数字。
  //
  // gameEngine会自动赋予：
  //
  // 第0格 → 荤
  // 第1格 → 素
  // 第2格 → 调料
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
  // 现在包括：
  //
  // meat
  // vegetable
  // seasoning
  // dessert
  //
  // 全部统一存在于主棋盘。
  //
  // 继续用于旧统计系统兼容。
  // ==========================================================

  const numbers =

    getBoardPieces(
      board
    );



  // ==========================================================
  // 收藏
  // ==========================================================

  const collection =
    gameState?.collection ?? [];


  const collectionPaths =
    gameState?.collectionPaths ?? {};


  const collectionOrigins =
    gameState?.collectionOrigins ?? {};


  const latestCollection =
    gameState?.latestCollection ?? null;



  // ==========================================================
  // 分数 / 时间
  // ==========================================================

  const score =
    gameState?.score ?? 0;


  const steps =
    gameState?.steps ?? 0;


  const gameOver =
    gameState?.gameOver ?? false;





  // ==========================================================
  // 质数状态
  //
  // 调料现在也是普通棋盘棋子，
  // 因此自然参与这些统计。
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
  //
  // 新版类型预览完全依赖：
  //
  // combineFoodType()
  //
  // 所以这里会自然得到：
  //
  // 荤 + 素
  // → 调料
  //
  // 素 + 调料
  // → 荤
  //
  // 调料 + 荤
  // → 素
  //
  // 同类
  // → 同类
  //
  // 甜食 + 普通
  // → 普通
  //
  // 甜食 + 甜食
  // → 甜食
  //
  // 跨101不会改变类型。
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
  // 点击后：
  //
  // A、B保留
  // C进入下一个空格
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





  // ==========================================================
  // 对外接口
  // ==========================================================

  return {


    board,

    numbers,


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