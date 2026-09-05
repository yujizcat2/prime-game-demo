// 最大公约数
export function gcd(a, b) {
  while (b !== 0) {
    const temp = a % b;
    a = b;
    b = temp;
  }

  return a;
}