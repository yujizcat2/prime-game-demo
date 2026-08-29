// src/game/initialValues.js

import {
  BASE_FOOD_TYPES
} from "./rules";


// ============================================================
// 开局数字池
// ============================================================

export const INITIAL_VALUE_POOL = [

  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9

];



// ============================================================
// 创建随机开局
//
// 返回三个不同的 2～9。
//
// gameEngine 会自动解释为：
//
// 第0个 → 荤
// 第1个 → 素
// 第2个 → 调料
// ============================================================

export function createRandomInitialValues(){


  const shuffled = [

    ...INITIAL_VALUE_POOL

  ];



  for(
    let i = shuffled.length - 1;
    i > 0;
    i--
  ){


    const j =

      Math.floor(

        Math.random() *
        (i + 1)

      );



    [

      shuffled[i],

      shuffled[j]

    ] = [

      shuffled[j],

      shuffled[i]

    ];

  }



  return shuffled.slice(
    0,
    3
  );

}



// ============================================================
// 创建八宫模式随机开局
//
// 八个基础料理系各出现一次，中央格固定留空。
// 每张卡的数字独立生成，因此允许重复。
// ============================================================

export function createEightPalaceInitialValues(){


  const foodTypes = [
    ...BASE_FOOD_TYPES
  ];


  const boardIndexes = [
    0,
    1,
    2,
    3,
    5,
    6,
    7,
    8
  ];


  for(
    let i = foodTypes.length - 1;
    i > 0;
    i--
  ){


    const j = Math.floor(
      Math.random() * (i + 1)
    );


    [
      foodTypes[i],
      foodTypes[j]
    ] = [
      foodTypes[j],
      foodTypes[i]
    ];

  }


  return boardIndexes.map(
    (
      boardIndex,
      index
    ) => ({

      value:
        Math.floor(Math.random() * 100) + 2,

      foodType:
        foodTypes[index],

      boardIndex

    })
  );

}

export function createSimpleEightPalaceInitialValues(){
  const shuffledTypes=[...BASE_FOOD_TYPES].sort(()=>Math.random()-.5);
  const targetFoodTypes=shuffledTypes.slice(0,2);
  const patterns=[[1,3,5,7],[0,2,6,8]];
  const boardIndexes=patterns[Math.floor(Math.random()*patterns.length)];
  const values=[...INITIAL_VALUE_POOL].sort(()=>Math.random()-.5).slice(0,4);
  const foodTypes=[targetFoodTypes[0],targetFoodTypes[1],targetFoodTypes[1],targetFoodTypes[0]];
  return boardIndexes.map((boardIndex,index)=>({
    value:values[index],
    foodType:foodTypes[index],
    boardIndex,
    gameMode:"simpleEightPalace",
    targetFoodTypes:[...targetFoodTypes]
  }));
}
