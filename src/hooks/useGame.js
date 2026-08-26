import {
  useState
} from "react";


import {
  gcd
} from "../utils/math";


import {
  combineValue,
  combineFoodType,
  combineFoodPurity,
  getReduceExtractFoodType
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

  applyAction

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
  // 当前选中的棋盘 index
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
  // 当前所有正式棋子
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


  const collectionPaths =

    gameState?.collectionPaths

    ??

    {};


  const collectionOrigins =

    gameState?.collectionOrigins

    ??

    {};


  const latestCollection =

    gameState?.latestCollection

    ??

    null;





  // ==========================================================
  // 分数 / 步数
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



    if(
      !target
    ){

      return;

    }



    // ========================================================
    // 新规则下理论上不会有正式1。
    //
    // 这里仍然保护旧热更新状态。
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
      selectedIndexes.length <
      2
    ){


      setSelectedIndexes(

        [

          ...selectedIndexes,

          index

        ]
          .sort(
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
    // 删除第一个
    // 保留第二个
    // 加入新的
    // ========================================================

    setSelectedIndexes(

      [

        selectedIndexes[1],

        index

      ]
        .sort(
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
  // ==========================================================
  // 合成
  // ==========================================================
  //
  // {
  //   value,
  //   foodType,
  //   purity
  // }
  //
  //
  // ==========================================================
  // 约分
  // ==========================================================
  //
  // {
  //
  //   results: [
  //
  //     {
  //       value,
  //       autoCollect,
  //       collectValue,
  //       foodType
  //     },
  //
  //     ...
  //
  //   ],
  //
  //   divisor,
  //
  //   extract
  //
  // }
  //
  //
  // 例如：
  //
  // 16荤 / 4素
  //
  // divisor = 4
  //
  // results:
  //
  // [
  //   {
  //     value: 4,
  //     autoCollect: false
  //   },
  //
  //   {
  //     value: 1,
  //     autoCollect: true,
  //     collectValue: 4,
  //     foodType: "vegetable"
  //   }
  // ]
  //
  // extract:
  //
  // {
  //   value: 4,
  //   foodType: "seasoning",
  //   purity: "mixed"
  // }
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





    // ========================================================
    // 合成预览
    // ========================================================

    const combinePreview =

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

              ),


            purity:

              combineFoodPurity(

                orderedPair.front,

                orderedPair.back

              )

          }

        :

          null;





    // ========================================================
    // 约分预览
    // ========================================================

    let reducePreview =
      null;



    if(
      reduceAllowed
    ){


      const firstResult =

        first.piece.value /
        divisor;



      const secondResult =

        second.piece.value /
        divisor;



      // ======================================================
      // 第一张卡预览
      // ======================================================

      const firstResultPreview = {

        value:
          firstResult,


        autoCollect:
          firstResult === 1,


        collectValue:

          firstResult === 1

            ? first.piece.value

            : null,


        foodType:
          first.piece.foodType,


        purity:
          first.piece.purity ?? null

      };



      // ======================================================
      // 第二张卡预览
      // ======================================================

      const secondResultPreview = {

        value:
          secondResult,


        autoCollect:
          secondResult === 1,


        collectValue:

          secondResult === 1

            ? second.piece.value

            : null,


        foodType:
          second.piece.foodType,


        purity:
          second.piece.purity ?? null

      };





      // ======================================================
      // 析出物
      // ======================================================

      let extract =
        null;



      if(
        first.piece.value !==
        second.piece.value
      ){


        const extractFoodType =

          getReduceExtractFoodType(

            first.piece,

            second.piece

          );



        if(
          extractFoodType
        ){


          extract = {

            value:
              divisor,


            foodType:
              extractFoodType,


            purity:

              first.piece.foodType ===
              second.piece.foodType

                ?

                "pure"

                :

                "mixed"

          };

        }

      }



      reducePreview = {

        results: [

          firstResultPreview,

          secondResultPreview

        ],


        divisor,


        extract,


        // ====================================================
        // 本次会自动收藏几个节点
        // ====================================================

        autoCollectCount:

          (
            firstResult === 1
              ? 1
              : 0
          )

          +

          (
            secondResult === 1
              ? 1
              : 0
          )

      };

    }





    return {

      combine:
        combinePreview,


      reduce:
        reducePreview

    };

  }





  const preview =

    getPreviewResult();





  // ==========================================================
  // 组合
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
            "combine",

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
  // 约分
  //
  // 正式：
  //
  // - 自动收藏1
  // - 自动释放格子
  // - 析出 gcd
  //
  // 都完全由 gameActions.js 负责。
  //
  // useGame 不重复实现规则。
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
  // 旧版手动处理1
  //
  // 新核心不再使用。
  //
  // 暂时保留接口，
  // 防止旧 Board / App import 立即报错。
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



    const target =

      getPieceAt(
        gameState,
        index
      );



    if(
      !target ||
      target.value !== 1
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


    // ========================================================
    // 棋盘
    // ========================================================

    board,

    numbers,


    // ========================================================
    // 选择
    // ========================================================

    selectedIndexes,

    selectedCells,

    selectedNumbers,


    // ========================================================
    // 预览
    // ========================================================

    preview,


    // ========================================================
    // 游戏状态
    // ========================================================

    started,

    gameOver,


    // ========================================================
    // 收藏
    // ========================================================

    collection,

    collectionPaths,

    collectionOrigins,

    latestCollection,


    // ========================================================
    // 分数 / 步数
    // ========================================================

    score,

    steps,


    // ========================================================
    // 迷宫回转
    // ========================================================

    mazeTurn,

    mazeTurnCount,

    mazeVisitedStates,


    // ========================================================
    // 环境状态
    // ========================================================

    primeEnergy,

    primeDensity,

    primeState,


    // ========================================================
    // 操作
    // ========================================================

    startGame,

    selectCell,

    combineNumbers,

    reduceNumbers,

    removeOne,


    // ========================================================
    // UI 辅助
    // ========================================================

    getCell,

    isCellSelected

  };

}