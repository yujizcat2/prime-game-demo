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

  ] = useState(
    false
  );



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
  // values只需要3个数字。
  //
  // gameEngine会自动赋予：
  //
  // 第0格 → 荤 / pure
  // 第1格 → 素 / pure
  // 第2格 → 调料 / pure
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
  // dessert当前purity为null。
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
  // 后面UI提示可以直接读取。
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
  // purity目前不影响：
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
    // 1由Board直接触发removeOne
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
  // 肉 + 肉
  // → 肉 / pure
  //
  // 肉 + 素
  // → 调料 / mixed
  //
  // 普通跨101
  // → 甜食 / null
  //
  // 甜食 + 普通
  // → 普通 / mixed
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
  // 所有正式玩家动作统一通过：
  //
  // applyAction()
  //
  // 因此动作完成后会继续执行：
  //
  // mazeHistory检测
  // ↓
  // 必要时触发迷宫回转
  //
  // useGame不再直接调用combineCells。
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
  // 同样统一走applyAction。
  //
  // gameEngine负责：
  //
  // 数字变化
  // foodType保留
  // purity保留
  // mazeHistory检测
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
  // 消除1
  //
  // 同样统一走applyAction。
  //
  // 这一步尤其重要：
  //
  // 很多循环都是在最后一次处理1后
  // 回到过去的第二层状态。
  //
  // 因此如果这里绕过applyAction，
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
    // 分数 / 时间
    // ========================================================

    score,

    steps,


    // ========================================================
    // 迷宫回转
    //
    // 先暴露给外部。
    //
    // 下一步UI可以直接显示：
    //
    // mazeTurn?.triggered
    // mazeTurn.count
    // mazeTurn.beforeValues
    // mazeTurn.afterValues
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
    // UI辅助
    // ========================================================

    getCell,

    isCellSelected

  };

}