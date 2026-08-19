// 数字按从小到大排序
export function sortNumbers(list) {
  return [...list].sort((a, b) => a.value - b.value);
}