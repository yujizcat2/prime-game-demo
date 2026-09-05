import { GAME_VALUE_SCALE } from "../game/valueScale";

// 最大公约数（主数域统一使用放大前的公因数）
export function gcd(a, b) {
  const usesGameScale = a % GAME_VALUE_SCALE === 0 && b % GAME_VALUE_SCALE === 0;
  while (b !== 0) {
    const temp = a % b;
    a = b;
    b = temp;
  }

  return usesGameScale ? a / GAME_VALUE_SCALE : a;
}
