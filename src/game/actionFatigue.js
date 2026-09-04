export const ACTION_FATIGUE_WINDOW = 20;

export function createCombinationPairKey(valueA,valueB){
  return `${Math.min(valueA,valueB)}-${Math.max(valueA,valueB)}`;
}

export function hasUsedCombinationPair(state,valueA,valueB){
  return (state?.usedCombinationPairs??[]).includes(createCombinationPairKey(valueA,valueB));
}


export function createCombineActionSignature(valueA, valueB, result){
  const [left, right] = [valueA, valueB].sort((a, b) => a - b);
  return `C:${left}|${right}>${result}`;
}


export function createReduceActionSignature(valueA, valueB, resultA, resultB){
  const [left, right] = [valueA, valueB].sort((a, b) => a - b);
  const [firstResult, secondResult] = [resultA, resultB].sort((a, b) => a - b);
  return `R:${left}|${right}>${firstResult}|${secondResult}`;
}


export function getActionFatigue(history, signature){
  const fatigueCount = (history ?? []).filter(item => item === signature).length;
  return {
    signature,
    fatigueCount,
    fatigueRate: Math.min(fatigueCount * 0.1, 0.5)
  };
}


export function appendRecentActionSignature(history, signature){
  return [...(history ?? []), signature].slice(-ACTION_FATIGUE_WINDOW);
}
