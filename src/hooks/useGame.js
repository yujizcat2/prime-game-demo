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
  getPrimeEnergy,
  getPrimeDensity,
  getPrimeState
} from "../game/primeStatus";

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


  // ==========================================================
  // 当前收藏UI使用的父系单线路径
  // ==========================================================

  const collectionPaths =
    gameState?.collectionPaths ?? {};


  // ==========================================================
  // 完整来源树
  //
  // 【当前UI暂时不用】
  // 【保留】
  // ==========================================================

  const collectionOrigins =
    gameState?.collectionOrigins ?? {};


  // ==========================================================
  // 最新一次收藏
  //
  // 例如：
  //
  // {
  //   value: 7,
  //   index: 3
  // }
  // ==========================================================

  const latestCollection =
    gameState?.latestCollection ?? null;


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
  // 当前棋盘质数状态
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


      if(
        target.value !== 1
      ){

        return;

      }



      if(
        selected.includes(id)
      ){


        setSelected([]);


        return;

      }



      setSelected([
        id
      ]);


      return;

    }





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
    // 已经选择1
    // ========================================================

    if(
      selectedOne
    ){


      if(
        selectedOne.id === id
      ){


        setSelected([]);


        return;

      }



      return;

    }





    // ========================================================
    // 当前点击的是1
    // ========================================================

    if(
      target.value === 1
    ){


      setSelected([
        id
      ]);


      return;

    }





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



    const combineAllowed =

      canCombine(
        a,
        b,
        numbers
      );



    const reduceAllowed =

      canReduce(
        a,
        b
      );



    return {


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



    if(
      list[0].value === 1 ||
      list[1].value === 1
    ){

      return;

    }



    const nextState =

      engineCombineNumbers(

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


    // ========================================================
    // 当前收藏UI使用
    // ========================================================

    collectionPaths,


    // ========================================================
    // 当前UI暂时不用
    // 完整来源树仍然保留
    // ========================================================

    collectionOrigins,


    // ========================================================
    // 最新收藏
    // ========================================================

    latestCollection,


    score,


    primeEnergy,

    primeDensity,

    primeState,


    steps,


    stepLimit,


    gameOver,


    checkpointPending,

    checkpointRequiredScore,

    checkpointNumber,


    startGame,

    selectNumber,

    combineNumbers,

    reduceNumbers,

    removeOne

  };

}