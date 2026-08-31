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

const EIGHT_PALACE_VALUE_MIN = 2;
const EIGHT_PALACE_VALUE_MAX = 101;

export const DIFFICULTY_OPENINGS = Object.freeze({
  easy: Object.freeze({count: 4, typeCount: 4, targetSum: 30}),
  medium: Object.freeze({count: 5, typeCount: 5, targetSum: 100}),
  hard: Object.freeze({count: 8, typeCount: 8, targetSum: 200})
});

const OPENING_BOARD_INDEXES = Object.freeze({
  4: Object.freeze([0, 2, 6, 8]),
  5: Object.freeze([0, 2, 4, 6, 8]),
  8: Object.freeze([0, 1, 2, 3, 5, 6, 7, 8])
});

function shuffle(items){
  const result = [...items];
  for(let index = result.length - 1; index > 0; index--){
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createDistinctValues(count, targetSum){
  const memo = new Map();

  function canComplete(remainingCount, minimum, remainingSum){
    if(remainingCount === 0) return remainingSum === 0;

    const minimumSum = remainingCount * (2 * minimum + remainingCount - 1) / 2;
    const maximumStart = EIGHT_PALACE_VALUE_MAX - remainingCount + 1;
    const maximumSum = remainingCount * (maximumStart + EIGHT_PALACE_VALUE_MAX) / 2;
    if(minimum > maximumStart || remainingSum < minimumSum || remainingSum > maximumSum) return false;

    const key = `${remainingCount}:${minimum}:${remainingSum}`;
    if(memo.has(key)) return memo.get(key);

    for(let value = minimum; value <= maximumStart; value++){
      if(canComplete(remainingCount - 1, value + 1, remainingSum - value)){
        memo.set(key, true);
        return true;
      }
    }

    memo.set(key, false);
    return false;
  }

  if(!canComplete(count, EIGHT_PALACE_VALUE_MIN, targetSum)){
    throw new RangeError(`No legal Eight Palace opening for ${count} cards totaling ${targetSum}`);
  }

  const values = [];
  let minimum = EIGHT_PALACE_VALUE_MIN;
  let remainingSum = targetSum;

  for(let remainingCount = count; remainingCount > 0; remainingCount--){
    const maximumCandidate = EIGHT_PALACE_VALUE_MAX - remainingCount + 1;
    const candidates = [];
    for(let value = minimum; value <= maximumCandidate; value++){
      if(canComplete(remainingCount - 1, value + 1, remainingSum - value)) candidates.push(value);
    }

    const value = candidates[Math.floor(Math.random() * candidates.length)];
    values.push(value);
    minimum = value + 1;
    remainingSum -= value;
  }

  return shuffle(values);
}

export function createDifficultyOpening({count, typeCount, targetSum}){
  if(count !== typeCount || !OPENING_BOARD_INDEXES[count]){
    throw new RangeError("Difficulty openings require 4, 5, or 8 cards with one distinct food type per card");
  }

  const values = createDistinctValues(count, targetSum);
  const foodTypes = shuffle(BASE_FOOD_TYPES).slice(0, typeCount);

  return OPENING_BOARD_INDEXES[count].map((boardIndex, index) => ({
    value: values[index],
    foodType: foodTypes[index],
    boardIndex
  }));
}

export function createDifficultyInitialValues(difficulty){
  const config = DIFFICULTY_OPENINGS[difficulty];
  if(!config) throw new RangeError(`Unknown difficulty: ${difficulty}`);
  return createDifficultyOpening(config);
}



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


  // Start from an exact, valid total and randomize it with sum-preserving
  // pair transfers. Every intermediate opening remains eight distinct values
  // in the inclusive 2-101 range and totals exactly 300.
  const values = [2, 7, 13, 24, 38, 51, 73, 92];

  for(let attempt = 0; attempt < 100; attempt++){
    const left = Math.floor(Math.random() * values.length);
    let right = Math.floor(Math.random() * values.length);
    if(left === right) right = (right + 1) % values.length;

    const maxDown = values[left] - 2;
    const maxUp = 101 - values[right];
    const maxTransfer = Math.min(maxDown, maxUp, 12);
    if(maxTransfer < 1) continue;

    const amount = Math.floor(Math.random() * maxTransfer) + 1;
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
