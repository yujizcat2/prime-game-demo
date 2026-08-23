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
  combineFoodType
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

  removeOne as engineRemoveOne

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



  // ==========================================================
  // 调料盘
  //
  // 当前调料暂时只展示，
  // 不允许使用。
  // ==========================================================

  const seasoningTray =
    gameState?.seasoningTray ?? [];



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
  // 当前UI暂时不用。
  // ==========================================================

  const collectionOrigins =
    gameState?.collectionOrigins ?? {};



  // ==========================================================
  // 最新一次收藏
  // ==========================================================

  const latestCollection =
    gameState?.latestCollection ?? null;



  // ==========================================================
  // 分数
  //
  // 后续UI换皮为金钱。
  // ==========================================================

  const score =
    gameState?.score ?? 0;



  // ==========================================================
  // 时间
  //
  // 底层暂时继续叫steps。
  //
  // 不再存在stepLimit。
  // steps可以无限增长。
  // ==========================================================

  const steps =
    gameState?.steps ?? 0;



  const gameOver =
    gameState?.gameOver ?? false;





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
    //
    // 1只能单独选择。
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
  //
  // numbers.filter会按照主菜盘实际顺序返回。
  //
  // list[0] = front
  // list[1] = back
  //
  // 不受玩家点击顺序影响。
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
    // 当前list已经按主菜盘位置排序
    // ========================================================

    const front =
      list[0];


    const back =
      list[1];



    if(
      front.value === 1 ||
      back.value === 1
    ){

      return null;

    }



    const divisor =

      gcd(
        front.value,
        back.value
      );



    const combineAllowed =

      canCombine(
        front,
        back,
        numbers
      );



    const reduceAllowed =

      canReduce(
        front,
        back
      );



    return {


      combine:

        combineAllowed

        ?

        {

          value:

            combineValue(
              front.value,
              back.value
            ),


          foodType:

            combineFoodType(
              front,
              back
            )

        }

        :

        null,



      reduce:

        reduceAllowed

        ?

        [

          front.value /
          divisor,

          back.value /
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
      gameOver
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
      gameOver
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
  //
  // Engine会自动完成：
  //
  // 收藏
  // +
  // 对应编号调料进入调料盘
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
  // 对外提供
  // ==========================================================

  return {


    // ========================================================
    // 主菜盘
    // ========================================================

    numbers,


    // ========================================================
    // 调料盘
    // ========================================================

    seasoningTray,


    selected,


    started,


    selectedNumbers,


    preview,


    collection,


    collectionPaths,


    collectionOrigins,


    latestCollection,


    // ========================================================
    // 营业数据
    //
    // score 后续显示为金钱
    // steps 后续显示为时间
    // ========================================================

    score,

    steps,


    // ========================================================
    // 环境
    // ========================================================

    primeEnergy,

    primeDensity,

    primeState,


    // ========================================================
    // 状态
    // ========================================================

    gameOver,


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