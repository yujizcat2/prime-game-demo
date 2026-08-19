import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  canReduce,
  canCombine,
  combineValue
} from "../game/rules";

import {
  createGameState,

  combineNumbers as engineCombineNumbers,

  reduceNumbers as engineReduceNumbers,

  removeOne as engineRemoveOne,

  getCheckpointRequiredScore,

  getCheckpointNumber

} from "../game/gameEngine";



// ============================================================
// Hook
// ============================================================

export default function useGame(){


  // ==========================================================
  // Engine核心状态
  // ==========================================================

  const [
    gameState,
    setGameState
  ] = useState(
    null
  );



  // ==========================================================
  // UI状态
  // ==========================================================

  const [
    started,
    setStarted
  ] = useState(false);



  const [
    selected,
    setSelected
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


    setSelected([]);


    setStarted(true);

  }





  // ==========================================================
  // 没开始时的默认数据
  // ==========================================================

  const numbers =
    gameState?.numbers ?? [];


  const collection =
    gameState?.collection ?? [];


  const score =
    gameState?.score ?? 0;


  const steps =
    gameState?.steps ?? 0;


  const stepLimit =
    gameState?.stepLimit ?? 0;


  const gameOver =
    gameState?.gameOver ?? false;


  const checkpointPending =
    gameState?.checkpointPending
    ?? false;





  // ==========================================================
  // 选择数字
  // ==========================================================

  function selectNumber(
    id
  ){


    if(
      !gameState ||
      gameOver
    ){

      return;

    }



    const target =

      numbers.find(

        item =>
          item.id === id

      );



    if(
      !target
    ){

      return;

    }



    // ========================================================
    // checkpoint期间
    // ========================================================

    if(
      checkpointPending
    ){


      // 只能点击1

      if(
        target.value !== 1
      ){

        return;

      }



      // 再次点击取消

      if(
        selected.includes(id)
      ){


        setSelected(

          selected.filter(

            itemId =>
              itemId !== id

          )

        );


        return;

      }



      // checkpoint只允许选择1个

      setSelected([
        id
      ]);


      return;

    }



    // ========================================================
    // 正常状态
    // ========================================================


    // 已选择 -> 取消

    if(
      selected.includes(id)
    ){


      setSelected(

        selected.filter(

          itemId =>
            itemId !== id

        )

      );


      return;

    }



    // ========================================================
    // 少于两个
    // ========================================================

    if(
      selected.length < 2
    ){


      setSelected([

        ...selected,

        id

      ]);


      return;

    }



    // ========================================================
    // 第三个数字
    //
    // 删除第一个
    // 保留第二个
    // 加入新的
    // ========================================================

    setSelected([

      selected[1],

      id

    ]);

  }





  // ==========================================================
  // 当前选择数字
  // ==========================================================

  function getSelectedNumbers(){


    return numbers.filter(

      item =>
        selected.includes(
          item.id
        )

    );

  }





  // ==========================================================
  // Preview
  // ==========================================================

  function getPreviewResult(){


    const list =
      getSelectedNumbers();



    if(
      list.length !== 2
    ){

      return null;

    }



    const a =
      list[0];


    const b =
      list[1];



    const divisor =

      gcd(
        a.value,
        b.value
      );



    return {


      combine:

        canCombine(
          a,
          b,
          numbers
        )

        ?

        combineValue(
          a.value,
          b.value
        )

        :

        null,



      reduce:

        canReduce(
          a.value,
          b.value
        )

        ?

        [

          a.value /
          divisor,

          b.value /
          divisor

        ]

        :

        null

    };

  }





  // ==========================================================
  // 合成
  // ==========================================================

  function combineNumbers(){


    if(
      !gameState ||
      gameOver ||
      checkpointPending
    ){

      return;

    }



    const list =
      getSelectedNumbers();



    if(
      list.length !== 2
    ){

      return;

    }



    const nextState =

      engineCombineNumbers(

        gameState,

        list[0].id,

        list[1].id

      );



    // Engine没有发生变化
    // 即操作无效

    if(
      nextState === gameState
    ){

      return;

    }



    setGameState(
      nextState
    );


    setSelected([]);

  }





  // ==========================================================
  // 约分
  // ==========================================================

  function reduceNumbers(){


    if(
      !gameState ||
      gameOver ||
      checkpointPending
    ){

      return;

    }



    const list =
      getSelectedNumbers();



    if(
      list.length !== 2
    ){

      return;

    }



    const nextState =

      engineReduceNumbers(

        gameState,

        list[0].id,

        list[1].id

      );



    if(
      nextState === gameState
    ){

      return;

    }



    setGameState(
      nextState
    );


    setSelected([]);

  }





  // ==========================================================
  // 消除1
  // ==========================================================

  function removeOne(
    id
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

        id

      );



    if(
      nextState === gameState
    ){

      return;

    }



    setGameState(
      nextState
    );



    setSelected(

      prev =>

        prev.filter(

          selectedId =>
            selectedId !== id

        )

    );

  }





  // ==========================================================
  // Preview
  // ==========================================================

  const selectedNumbers =
    getSelectedNumbers();


  const preview =
    getPreviewResult();





  // ==========================================================
  // checkpoint
  // ==========================================================

  const checkpointRequiredScore =

    gameState

      ?

      getCheckpointRequiredScore(
        gameState
      )

      :

      0;



  const checkpointNumber =

    gameState

      ?

      getCheckpointNumber(
        gameState
      )

      :

      0;





  // ==========================================================
  // 对外提供
  // ==========================================================

  return {


    numbers,


    selected,


    started,


    selectedNumbers,


    preview,


    collection,


    score,


    steps,


    stepLimit,


    gameOver,



    // ========================================================
    // Checkpoint
    // ========================================================

    checkpointPending,

    checkpointRequiredScore,

    checkpointNumber,



    // ========================================================
    // 操作
    // ========================================================

    startGame,

    selectNumber,

    combineNumbers,

    reduceNumbers,

    removeOne

  };

}