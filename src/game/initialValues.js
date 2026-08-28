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
