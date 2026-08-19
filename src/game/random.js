// 随机2-99
export function randomNumber() {
  return Math.floor(Math.random() * 98) + 2;
}

// 随机生成4个不重复数字
export function randomFourNumbers() {
  const result = [];

  while (result.length < 4) {
    const num = randomNumber();

    if (!result.includes(num)) {
      result.push(num);
    }
  }

  return result;
}