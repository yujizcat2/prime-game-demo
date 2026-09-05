// src/game/initialValues.js

import {
  BASE_FOOD_TYPES
} from "./rules";
import { GAME_VALUE_MAX, GAME_VALUE_MIN, GAME_VALUE_SCALE, scaleGameValue } from "./valueScale";


// ============================================================
// 开局数字池
// ============================================================

export const INITIAL_VALUE_POOL = [

  2, 3, 4, 5, 6, 7, 8, 9

].map(scaleGameValue);

const STANDARD_OPENING_COUNT = 4;

function shuffle(items, random){
  const result = [...items];
  for(let index = result.length - 1; index > 0; index--){
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createStandardInitialValues(random = Math.random){
  const foodTypes = shuffle(BASE_FOOD_TYPES, random).slice(0, STANDARD_OPENING_COUNT);
  const boardIndexes = shuffle(Array.from({length: 9}, (_, index) => index), random)
    .slice(0, STANDARD_OPENING_COUNT);

  return foodTypes.map((foodType, index) => ({
    value: INITIAL_VALUE_POOL[Math.floor(random() * INITIAL_VALUE_POOL.length)],
    foodType,
    boardIndex: boardIndexes[index]
  }));
}



// ============================================================
// 创建随机开局
//
// 返回三个不同的 20～90。
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


  // Start from an exact, valid total and randomize it with sum-preserving
  // pair transfers. Every intermediate opening remains eight distinct values
  // in the inclusive 20-1010 range and totals exactly 3000.
  const values = [2, 7, 13, 24, 38, 51, 73, 92].map(scaleGameValue);

  for(let attempt = 0; attempt < 100; attempt++){
    const left = Math.floor(Math.random() * values.length);
    let right = Math.floor(Math.random() * values.length);
    if(left === right) right = (right + 1) % values.length;

    const maxDown = values[left] - GAME_VALUE_MIN;
    const maxUp = GAME_VALUE_MAX - values[right];
    const maxTransfer = Math.min(maxDown, maxUp, 12 * GAME_VALUE_SCALE);
    if(maxTransfer < GAME_VALUE_SCALE) continue;

    const amount = (Math.floor(Math.random() * (maxTransfer / GAME_VALUE_SCALE)) + 1) * GAME_VALUE_SCALE;
    const nextLeft = values[left] - amount;
    const nextRight = values[right] + amount;
    const unchanged = values.filter((_, index) => index !== left && index !== right);
    if(nextLeft === nextRight || unchanged.includes(nextLeft) || unchanged.includes(nextRight)) continue;

    values[left] = nextLeft;
    values[right] = nextRight;
  }

  return boardIndexes.map(
    (
      boardIndex,
      index
    ) => ({

      value:
        values[index],

      foodType:
        foodTypes[index],

      boardIndex

    })
  );

}
