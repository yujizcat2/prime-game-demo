export function createCombinePairKey(left, right){
  return [left, right]
    .map(piece => `${piece?.value}:${piece?.foodType ?? ""}`)
    .sort()
    .join("|");
}

export function hasCombinePair(historyKeys, left, right){
  const key = createCombinePairKey(left, right);
  if(historyKeys instanceof Set)return historyKeys.has(key);
  return Boolean(historyKeys?.[key]);
}

export function addCombinePair(historyKeys, left, right){
  return {
    ...(historyKeys ?? {}),
    [createCombinePairKey(left, right)]: true
  };
}

export function createCombineHistoryRecord(left, right, result, step){
  return {
    key: createCombinePairKey(left, right),
    left: {value:left.value, foodType:left.foodType},
    right: {value:right.value, foodType:right.foodType},
    result: {value:result.value, foodType:result.foodType},
    step
  };
}
