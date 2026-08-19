import {
  useState
} from "react";

import {
  gcd
} from "../utils/math";

import {
  canReduce,
  canCombine,
  combineValue,
  combineAnimal
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


      // ------------------------------------------------------
      // 只能点击1
      // ------------------------------------------------------

      if(
        target.value !== 1
      ){

        return;

      }



      // ------------------------------------------------------
      // 再次点击当前1
      // 取消选择
      // ------------------------------------------------------

      if(
        selected.includes(id)
      ){


        setSelected([]);


        return;

      }



      // ------------------------------------------------------
      // checkpoint期间
      // 永远只允许选择一个1
      // ------------------------------------------------------

      setSelected([
        id
      ]);


      return;

    }





    // ========================================================
    // 正常状态
    // ========================================================



    // ========================================================
    // 当前是否已经选择了1
    // ========================================================

    const selectedOne =

      selected

        .map(

          selectedId =>

            numbers.find(

              item =>
                item.id === selectedId

            )

        )

        .find(

          item =>
            item?.value === 1

        );



    // ========================================================
    // 已经选择了1
    // ========================================================

    if(
      selectedOne
    ){


      // ------------------------------------------------------
      // 再次点击这个1
      // 取消选择
      // ------------------------------------------------------

      if(
        selectedOne.id === id
      ){


        setSelected([]);


        return;

      }



      // ------------------------------------------------------
      // 已选中1以后
      // 其他任何数字都不能选择
      // ------------------------------------------------------

      return;

    }





    // ========================================================
    // 当前点击的是1
    // ========================================================

    if(
      target.value === 1
    ){


      // ------------------------------------------------------
      // 无论之前选中了几个普通数字
      // 全部取消
      //
      // 只留下这个1
      // ------------------------------------------------------

      setSelected([
        id
      ]);


      return;

    }





    // ========================================================
    // 以下全部属于普通数字
    // ========================================================



    // ========================================================
    // 已选择 -> 取消
    // ========================================================

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
  //
  // 这里非常重要：
  //
  // numbers.filter 会按照棋盘中的顺序返回
  // 而不是按照玩家点击的顺序返回
  //
  // 因此：
  //
  // list[0] = 位置靠前
  // list[1] = 位置靠后
  //
  // 正好符合猫狗异种合成规则
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



    // ========================================================
    // 因为getSelectedNumbers按照棋盘顺序返回
    //
    // a = 前面
    // b = 后面
    // ========================================================

    const a =
      list[0];


    const b =
      list[1];



    // ========================================================
    // 安全保护
    //
    // 1不能参与普通双数字操作
    // ========================================================

    if(
      a.value === 1 ||
      b.value === 1
    ){

      return null;

    }



    const divisor =

      gcd(
        a.value,
        b.value
      );



    // ========================================================
    // 是否可以合成
    // ========================================================

    const combineAllowed =

      canCombine(
        a,
        b,
        numbers
      );



    // ========================================================
    // 是否可以约分
    //
    // 现在canReduce接收完整节点
    //
    // 规则：
    // animal相同 && gcd > 1
    // ========================================================

    const reduceAllowed =

      canReduce(
        a,
        b
      );



    return {


      // ======================================================
      // 合成预览
      //
      // 不再只是返回数字
      //
      // 现在同时返回：
      // value
      // animal
      // ======================================================

      combine:

        combineAllowed

        ?

        {

          value:

            combineValue(
              a.value,
              b.value
            ),


          animal:

            combineAnimal(
              a,
              b
            )

        }

        :

        null,



      // ======================================================
      // 约分预览
      // ======================================================

      reduce:

        reduceAllowed

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



    // ========================================================
    // 1不能参与合成
    // ========================================================

    if(
      list[0].value === 1 ||
      list[1].value === 1
    ){

      return;

    }



    // ========================================================
    // list[0]和list[1]
    // 已经是棋盘前后顺序
    // ========================================================

    const nextState =

      engineCombineNumbers(

        gameState,

        list[0].id,

        list[1].id

      );



    // ========================================================
    // Engine没有发生变化
    // 即操作无效
    // ========================================================

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



    // ========================================================
    // 1不能参与约分
    // ========================================================

    if(
      list[0].value === 1 ||
      list[1].value === 1
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



    const target =

      numbers.find(

        item =>
          item.id === id

      );



    // ========================================================
    // 只能消除1
    // ========================================================

    if(
      !target ||
      target.value !== 1
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