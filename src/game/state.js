export function getCurrentState(list) {

  return list
    .map(item => item.value)
    .sort((a, b) => a - b)
    .join(",");

}