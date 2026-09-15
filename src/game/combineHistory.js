export function createCombinePairKey(left, right){
  return [left, right]
    .map(piece => piece?.id == null ? `${piece?.value}:${piece?.foodType ?? ""}` : `card:${piece.id}`)
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
    left: {id:left.id, value:left.value, foodType:left.foodType},
    right: {id:right.id, value:right.value, foodType:right.foodType},
    result: {id:result.id, value:result.value, foodType:result.foodType},
    step
  };
}
