// =========================
// 质数系统
// =========================


// =========================
// 判断是否为质数
// =========================

import { GAME_VALUE_SCALE } from "./valueScale";

export function isPrime(n) {
  if(n !== 1 && n % GAME_VALUE_SCALE === 0) n /= GAME_VALUE_SCALE;

  if (n < 2) {
    return false;
  }


  if (n === 2) {
    return true;
  }


  if (n % 2 === 0) {
    return false;
  }


  for (
    let i = 3;
    i * i <= n;
    i += 2
  ) {

    if (n % i === 0) {
      return false;
    }

  }


  return true;

}
