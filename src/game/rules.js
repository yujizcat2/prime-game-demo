import { gcd } from "../utils/math";

// 是否可以约分
export function canReduce(a, b) {
  return gcd(a, b) > 1;
}


// 判断合成后的数字
export function combineValue(a, b) {

  let value = a + b;

  while (value > 101) {
    value -= 100;
  }

  return value;
}


// 判断是否已经存在同父母孩子
export function hasSameParents(numbers, a, b) {
  return numbers.some((item) => {
    if (!item.parents) {
      return false;
    }

    const p1 = item.parents[0];
    const p2 = item.parents[1];

    return (
      (p1 === a && p2 === b) ||
      (p1 === b && p2 === a)
    );
  });
}


// 判断是否可以合成
export function canCombine(a, b, numbers) {

  // 不能和自己的父母合成
  if (a.parents && a.parents.includes(b.value)) {
    return false;
  }

  if (b.parents && b.parents.includes(a.value)) {
    return false;
  }


  // 已存在同父母孩子
  if (hasSameParents(numbers, a.value, b.value)) {
    return false;
  }


  return true;
}