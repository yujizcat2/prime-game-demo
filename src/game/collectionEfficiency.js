export function getEffectiveCollectionCount(state){
  if(
    state?.gameMode === "eightPalace"
    || state?.gameMode === "simpleEightPalace"
  ) return state.collectionCards?.length ?? 0;
  if(state?.collection instanceof Set) return state.collection.size;

  let count = 0;
  for(const value of state?.collection ?? []){
    const slots = state?.collectionPaths?.[value];
    if(!slots || Array.isArray(slots)) continue;
    count += Object.values(slots).filter(Boolean).length;
  }
  return count;
}

export function getCollectionEfficiency(collectionCount, steps){
  return steps > 0 ? collectionCount / steps * 10 : 0;
}

export function recordCollectionEfficiencySnapshot(state){
  const step = state?.steps ?? 0;
  if(step === 0 || step % 10 !== 0) return state;

  const timeline = state.collectionEfficiencyTimeline ?? [];
  if(timeline.some(snapshot => snapshot.step === step)) return state;

  const cumulativeCollections = getEffectiveCollectionCount(state);
  const previousCollections = timeline.at(-1)?.cumulativeCollections ?? 0;

  return {
    ...state,
    collectionEfficiencyTimeline: [...timeline, {
      step,
      cumulativeCollections,
      collectionEfficiency: Number(getCollectionEfficiency(cumulativeCollections, step).toFixed(2)),
      recent10Collections: cumulativeCollections - previousCollections
    }]
  };
}

export function summarizeCollectionEfficiencyTimelines(results){
  const gameCount = results.length;
  const steps = new Set(
    results.flatMap(result => (result.collectionEfficiencyTimeline ?? []).map(snapshot => snapshot.step))
  );

  return [...steps].sort((left, right) => left - right).map(step => {
    const samples = results
      .map(result => (result.collectionEfficiencyTimeline ?? []).find(snapshot => snapshot.step === step))
      .filter(Boolean);
    return {
      step,
      averageCollectionEfficiency: samples.reduce(
        (sum, snapshot) => sum + snapshot.collectionEfficiency,
        0
      ) / samples.length,
      sampleCount: samples.length,
      gameCount
    };
  });
}
