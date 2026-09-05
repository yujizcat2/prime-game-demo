export function getComboBonus(comboCount){
  return Math.min(12, Math.max(0, comboCount - 1) * 3);
}

function addComboBonusToLatestCollection(state, comboBonus, comboCount){
  if(comboBonus <= 0) return state;
  const update = item => ({
    ...item,
    scoreGain: (item.scoreGain ?? item.totalScore ?? 0) + comboBonus,
    totalScore: (item.totalScore ?? item.scoreGain ?? 0) + comboBonus,
    comboBonus,
    comboCount
  });
  const rewards = state.latestCollectionRewards ?? [];
  let rewardIndex = -1;
  for(let index = rewards.length - 1; index >= 0; index--){
    if((rewards[index]?.totalScore ?? 0) > 0){ rewardIndex = index; break; }
  }
  if(rewardIndex < 0) return state;
  const eventIndex = (state.collectionTimeline?.length ?? 0) - rewards.length + rewardIndex;
  const targetId = state.collectionTimeline?.[eventIndex]?.id;
  const updateTarget = items => items?.map(item => item?.id === targetId ? update(item) : item);
  return {
    ...state,
    latestCollection: state.latestCollection?.id === targetId ? update(state.latestCollection) : state.latestCollection,
    latestCollectionRewards: rewards.map((item, index) => index === rewardIndex ? update(item) : item),
    collectionTimeline: updateTarget(state.collectionTimeline),
    collectionCards: updateTarget(state.collectionCards)
  };
}

export function applyScoreCombo(previousState, actionState){
  if((actionState.steps ?? 0) <= (previousState.steps ?? 0)) return actionState;
  const baseScoreGain = Math.max(0, (actionState.score ?? 0) - (previousState.score ?? 0));
  if(baseScoreGain <= 0){
    const previousComboCount = previousState.comboCount ?? 0;
    const event = {
      type: "broken",
      step: actionState.steps,
      day: actionState.day,
      previousComboCount,
      message: previousComboCount >= 2 ? "连击中断" : null
    };
    return {
      ...actionState,
      comboCount: 0,
      latestComboEvent: event,
      comboTimeline: previousComboCount >= 2
        ? [...(previousState.comboTimeline ?? []), event]
        : (previousState.comboTimeline ?? [])
    };
  }

  const comboCount = (previousState.comboCount ?? 0) + 1;
  const comboBonus = getComboBonus(comboCount);
  const withCollectionBonus = addComboBonusToLatestCollection(actionState, comboBonus, comboCount);
  const event = {
    type: "scored",
    step: actionState.steps,
    day: actionState.day,
    comboCount,
    baseScoreGain,
    comboBonus,
    totalScoreGain: baseScoreGain + comboBonus
  };
  return {
    ...withCollectionBonus,
    score: (actionState.score ?? 0) + comboBonus,
    comboCount,
    maxCombo: Math.max(previousState.maxCombo ?? 0, comboCount),
    comboBonusTotal: (previousState.comboBonusTotal ?? 0) + comboBonus,
    dayMaxCombo: Math.max(previousState.dayMaxCombo ?? 0, comboCount),
    dayComboBonusTotal: (previousState.dayComboBonusTotal ?? 0) + comboBonus,
    latestComboEvent: event,
    comboTimeline: comboCount >= 2
      ? [...(previousState.comboTimeline ?? []), event]
      : (previousState.comboTimeline ?? [])
  };
}
