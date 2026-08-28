import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  combineValue,
  combineFoodType,
  combineFoodPurity
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





  // ==========================================================
  // 开始游戏
  //
  // values 只需要 3 个数字。
  //
  // gameEngine 会自动赋予：
  //
  // 第0格 → 荤系 / pure
  // 第1格 → 素系 / pure
  // 第2格 → 调料系 / pure
  //
  // 同时：
  //
  // createGameState()
  // 会建立初始 mazeHistory。
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
  //
  // 当前所有正式棋子统一存在主棋盘：
  //
  // meat
  // vegetable
  // seasoning
  // dessert
  //
  // 每个普通棋子还可以拥有：
  //
  // purity:
  //
  // pure
  // mixed
  //
  // dessert 当前 purity 为 null。
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
    ?? [];


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
    ?? 0;


  const trend =
    gameState?.trend
    ?? 1;


  const boardPrices =
    getBoardPrices(board, trend, collectionPaths);





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





  // ==========================================================
  // 迷宫回转
  //
  // null
  // = 当前没有新的回转事件
  //
  // object
  // = 最近一次回转事件
  //
  // 目前先对外暴露，
  // 后面 UI 提示可以直接读取。
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
  //
  // purity 目前不影响：
  //
  // primeEnergy
  // primeDensity
  // primeState
  //
  // 后续如果要让纯度参与环境状态，
  // 再单独扩展。
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
    // 1 由 Board 直接触发 removeOne
    //
    // 不进入普通选择逻辑。
    // ========================================================

    if(
      target.value ===
      1
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
    // 删除第一个，
    // 保留第二个，
    // 加入新的。
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
  // 合成预览现在同时计算：
  //
  // value
  // foodType
  // purity
  //
  // 例：
  //
  // 荤 + 荤
  // → 荤系 / pure
  //
  // 荤 + 素
  // → 调料系 / mixed
  //
  // 普通跨 101
  // → 甜食系 / null
  //
  // 甜食 + 普通
  // → 普通食物系 / mixed
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

            null,


      reduce:

        reduceAllowed

          ?

            {

              divisor,

              results: [

                {
                  value: first.piece.value / divisor,
                  autoCollect: first.piece.value / divisor === 1,
                  collectValue: first.piece.value / divisor === 1
                    ? first.piece.value
                    : null,
                  foodType: first.piece.foodType,
                  purity: first.piece.purity ?? null
                },

                {
                  value: second.piece.value / divisor,
                  autoCollect: second.piece.value / divisor === 1,
                  collectValue: second.piece.value / divisor === 1
                    ? second.piece.value
                    : null,
                  foodType: second.piece.foodType,
                  purity: second.piece.purity ?? null
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
  //
  // 只派生 UI 数据；合法性继续由 gameEngine 的真实判断负责。
  // ==========================================================

  const actionCandidates = {};


  if(
    gameState &&
    !gameOver &&
    selectedCells.length === 1
  ){

    const selectedIndex = selectedCells[0].index;
    const selectedPiece = selectedCells[0].piece;


    board.forEach(
      (piece, index) => {

        if(
          !piece ||
          index === selectedIndex ||
          piece.value === 1
        ){
          return;
        }

        const combine = canCombineCells(
          gameState,
          selectedIndex,
          index
        );

        const reduce = canReduceCells(
          gameState,
          selectedIndex,
          index
        );

        const divisor = reduce
          ? gcd(selectedPiece.value, piece.value)
          : 1;

        actionCandidates[index] = {
          combine,
          reduce,
          remove:
            reduce &&
            (
              selectedPiece.value / divisor === 1 ||
              piece.value / divisor === 1
            )
        };

      }
    );

  }





  // ==========================================================
  // 组合
  //
  // 所有正式玩家动作统一通过：
  //
  // applyAction()
  //
  // 因此动作完成后会继续执行：
  //
  // mazeHistory 检测
  // ↓
  // 必要时触发迷宫回转
  //
  // useGame 不再直接调用 combineCells。
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
  // 处理 / 约分
  //
  // 同样统一走 applyAction。
  //
  // gameEngine 负责：
  //
  // 数字变化
  // foodType 保留
  // purity 保留
  // mazeHistory 检测
  // 迷宫回转
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
  //
  // 同样统一走 applyAction。
  //
  // 这一步尤其重要：
  //
  // 很多循环都是在最后一次处理 1 后
  // 回到过去的第二层状态。
  //
  // 因此如果这里绕过 applyAction，
  // 迷宫回转就永远不会触发。
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

    actionCandidates,


    // ========================================================
    // 游戏状态
    // ========================================================

    started,

    gameOver,

    gameOverReason,


    // ========================================================
    // 收藏
    // ========================================================

    collection,
    collectionTimeline,

    collectionPaths,

    collectionOrigins,

    collectionParents,

    latestCollection,

    money,

    trend,

    boardPrices,


    // ========================================================
    // 分数 / 时间
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
