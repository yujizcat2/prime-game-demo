import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import {
  areAllNormalPiecesSameFoodType,
  isSingleFlavorBoard
} from "../game/singleFlavorPenalty";

export const FOOD_TYPE_RATIO_BANDS = Object.freeze([
  "<50%", "50–59%", "60–69%", "70–79%", "80–99%", "100%"
]);

export function getDominantFoodTypeRatioBand(ratio){
  if(ratio >= 1) return "100%";
  if(ratio >= .8) return "80–99%";
  if(ratio >= .7) return "70–79%";
  if(ratio >= .6) return "60–69%";
  if(ratio >= .5) return "50–59%";
  return "<50%";
}

export function createFoodTypeBoardSnapshot(board, step){
  const foodTypeCounts = Object.fromEntries(
    [...BASE_FOOD_TYPES, FOOD_TYPES.DRINK].map(foodType => [foodType, 0])
  );
  let specialOneCount = 0;
  let normalPieceCount = 0;
  let drinkCount = 0;
  let penalizedPieceCount = 0;
  let boardPieceCount = 0;

  for(const piece of board ?? []){
    if(!piece) continue;
    boardPieceCount++;
    if(piece.singleFlavorPenalty === true) penalizedPieceCount++;
    if(piece.value === 1){
      specialOneCount++;
      continue;
    }
    if(piece.foodType === FOOD_TYPES.DRINK){
      foodTypeCounts[FOOD_TYPES.DRINK]++;
      drinkCount++;
      continue;
    }
    if(Object.hasOwn(foodTypeCounts, piece.foodType)){
      foodTypeCounts[piece.foodType]++;
      normalPieceCount++;
    }
  }

  const populatedTypes = BASE_FOOD_TYPES.filter(type => foodTypeCounts[type] > 0);
  const dominantFoodType = populatedTypes.reduce((dominant, type) =>
    dominant === null || foodTypeCounts[type] > foodTypeCounts[dominant]
      ? type
      : dominant,
  null);
  const dominantFoodTypeCount = dominantFoodType === null ? 0 : foodTypeCounts[dominantFoodType];
  const dominantFoodTypeRatio = normalPieceCount > 0
    ? dominantFoodTypeCount / normalPieceCount
    : 0;
  const boardValues = (board ?? []).filter(Boolean).map(piece => piece.value);

  return {
    step,
    foodTypeCounts,
    specialOneCount,
    normalPieceCount,
    drinkCount,
    boardPieceCount,
    boardAverage: boardValues.length ? boardValues.reduce((sum, value) => sum + value, 0) / boardValues.length : 0,
    distinctNormalFoodTypes: populatedTypes.length,
    dominantFoodType,
    dominantFoodTypeCount,
    dominantFoodTypeRatio,
    dominantFoodTypeRatioBand: getDominantFoodTypeRatioBand(dominantFoodTypeRatio),
    allNormalPiecesSameFoodType: areAllNormalPiecesSameFoodType(board),
    singleFlavor: isSingleFlavorBoard(board),
    penalizedPieceCount,
    penalizedPieceRatio: boardPieceCount > 0 ? penalizedPieceCount / boardPieceCount : 0
  };
}

function average(items, selector){
  return items.length ? items.reduce((sum, item) => sum + selector(item), 0) / items.length : 0;
}

function snapshotAtStep(timeline, step){
  return (timeline ?? []).find(snapshot => snapshot.step === step) ?? null;
}

export function createCollectionFoodTypeTimeline(collections, maxStep = 100){
  return Array.from({length: Math.floor(maxStep / 10)}, (_, index) => (index + 1) * 10)
    .map(step => {
      const counts = Object.fromEntries(
        [...BASE_FOOD_TYPES, FOOD_TYPES.DRINK].map(foodType => [foodType, 0])
      );
      for(const card of collections ?? []){
        if(card.isNewCollection !== false && card.step <= step && Object.hasOwn(counts, card.foodType)){
          counts[card.foodType]++;
        }
      }
      return {step, foodTypeCounts: counts};
    });
}

export function summarizeFoodTypeTelemetry(results){
  const checkpoints = Array.from({length: 10}, (_, index) => (index + 1) * 10);
  const checkpointSummary = checkpoints.map(step => {
    const snapshots = results.map(result => snapshotAtStep(result.foodTypeBoardTimeline, step)).filter(Boolean);
    const singleFlavorCount = snapshots.filter(snapshot => snapshot.singleFlavor).length;
    const allNormalPiecesSameFoodTypeCount = snapshots.filter(
      snapshot => snapshot.allNormalPiecesSameFoodType
    ).length;
    return {
      step,
      gameCount: snapshots.length,
      averageDistinctNormalFoodTypes: average(snapshots, snapshot => snapshot.distinctNormalFoodTypes),
      averageDominantFoodTypeRatio: average(snapshots, snapshot => snapshot.dominantFoodTypeRatio),
      averagePenalizedPieceCount: average(snapshots, snapshot => snapshot.penalizedPieceCount),
      singleFlavorCount,
      singleFlavorRate: snapshots.length ? singleFlavorCount / snapshots.length : 0,
      allNormalPiecesSameFoodTypeCount,
      allNormalPiecesSameFoodTypeRate: snapshots.length
        ? allNormalPiecesSameFoodTypeCount / snapshots.length
        : 0
    };
  });

  const allSnapshots = results.flatMap(result =>
    (result.foodTypeBoardTimeline ?? []).filter(snapshot => snapshot.step > 0)
  );
  const distribution = Object.fromEntries(FOOD_TYPE_RATIO_BANDS.map(band => [band, 0]));
  for(const snapshot of allSnapshots) distribution[snapshot.dominantFoodTypeRatioBand]++;
  const distributionAtSteps = Object.fromEntries(
    [20, 40, 60, 80, 100].map(step => {
      const counts = Object.fromEntries(FOOD_TYPE_RATIO_BANDS.map(band => [band, 0]));
      for(const result of results){
        const snapshot = snapshotAtStep(result.foodTypeBoardTimeline, step);
        if(snapshot) counts[snapshot.dominantFoodTypeRatioBand]++;
      }
      return [step, counts];
    })
  );

  const thresholds = [.6, .7, .8, 1];
  const firstThresholdSteps = Object.fromEntries(thresholds.map(threshold => {
    const values = results.flatMap(result => {
      const hit = (result.foodTypeBoardTimeline ?? []).find(snapshot =>
        snapshot.normalPieceCount > 0 && snapshot.dominantFoodTypeRatio >= threshold
      );
      return hit ? [hit.step] : [];
    });
    return [String(threshold), {averageStep: average(values, value => value), reachedGameCount: values.length}];
  }));

  const collectionEvents = results.flatMap(result =>
    (result.actionPath ?? []).flatMap(action => action.collectionEvents ?? [])
  ).filter(event => event.isNewCollection);
  const collectionScoreGroups = {
    multiFlavor: collectionEvents.filter(event => !event.collectionBoardState?.singleFlavor),
    singleFlavor: collectionEvents.filter(event => event.collectionBoardState?.singleFlavor),
    penalized: collectionEvents.filter(event => event.collectedPieceSingleFlavorPenalty),
    unpenalized: collectionEvents.filter(event => !event.collectedPieceSingleFlavorPenalty)
  };
  const averageCollectionScore = Object.fromEntries(
    Object.entries(collectionScoreGroups).map(([key, events]) => [key, average(events, event => event.scoreGain)])
  );
  const collectionScoreByDominance = Object.fromEntries([
    ["<60%", collectionEvents.filter(event => event.collectionBoardState?.dominantFoodTypeRatio < .6)],
    ["60–79%", collectionEvents.filter(event => {
      const ratio = event.collectionBoardState?.dominantFoodTypeRatio;
      return ratio >= .6 && ratio < .8;
    })],
    ["80–99%", collectionEvents.filter(event => {
      const ratio = event.collectionBoardState?.dominantFoodTypeRatio;
      return ratio >= .8 && ratio < 1;
    })],
    ["100%", collectionEvents.filter(event => event.collectionBoardState?.dominantFoodTypeRatio >= 1)]
  ].map(([key, events]) => [key, {
    collectionCount: events.length,
    averageScore: average(events, event => event.scoreGain)
  }]));

  const averageCollectionFoodTypeCounts = Object.fromEntries(
    [...BASE_FOOD_TYPES, FOOD_TYPES.DRINK].map(foodType => [foodType, average(
      results,
      result => (result.collectionFoodTypeCounts ?? {})[foodType] ?? 0
    )])
  );

  const structurallySingleSnapshots = allSnapshots.filter(
    snapshot => snapshot.allNormalPiecesSameFoodType
  );
  const formallySingleSnapshots = allSnapshots.filter(snapshot => snapshot.singleFlavor);
  const triggerSizeDistribution = Object.fromEntries(
    [5, 6, 7, 8, 9].map(size => [size, results.filter(
      result => result.firstSingleFlavorNormalPieceCount === size
    ).length])
  );
  const triggeredResults = results.filter(result => result.singleFlavorTriggered);
  const structuralResults = results.filter(result => result.structuralSingleFlavorReached);

  const createCompletionGroup = group => {
    const structural = group.filter(result => result.structuralSingleFlavorReached);
    const formal = group.filter(result => result.singleFlavorTriggered);
    return {
      gameCount: group.length,
      averageFinalScore: average(group, result => result.finalScore),
      structuralSingleFlavorRate: group.length ? structural.length / group.length : 0,
      formalSingleFlavorRate: group.length ? formal.length / group.length : 0,
      averageFirstStructuralSingleFlavorStep: average(
        structural,
        result => result.firstStructuralSingleFlavorStep
      ),
      averageFirstFormalSingleFlavorStep: average(
        formal,
        result => result.singleFlavorFirstTriggeredStep
      ),
      averageMaximumDominantFoodTypeRatio: average(
        group,
        result => result.maximumDominantFoodTypeRatio
      ),
      averageFinalDistinctNormalFoodTypes: average(
        group,
        result => result.finalFoodTypeBoardState?.distinctNormalFoodTypes ?? 0
      ),
      averageFinalPenalizedPieceCount: average(
        group,
        result => result.finalSingleFlavorPenaltyCount
      )
    };
  };

  return {
    foodTypeCheckpointSummary: checkpointSummary,
    dominantFoodTypeRatioDistribution: distribution,
    dominantFoodTypeRatioDistributionAtSteps: distributionAtSteps,
    firstDominanceThresholdSteps: firstThresholdSteps,
    averageCollectionScoreByBoardState: averageCollectionScore,
    averageCollectionScoreByDominance: collectionScoreByDominance,
    averageCollectionFoodTypeCounts,
    structuralSingleFlavorReachedGameCount: structuralResults.length,
    structuralSingleFlavorReachedRate: results.length ? structuralResults.length / results.length : 0,
    averageFirstStructuralSingleFlavorStep: average(
      structuralResults,
      result => result.firstStructuralSingleFlavorStep
    ),
    allStepStructuralSingleFlavorRate: allSnapshots.length
      ? structurallySingleSnapshots.length / allSnapshots.length
      : 0,
    allStepFormalSingleFlavorRate: allSnapshots.length
      ? formallySingleSnapshots.length / allSnapshots.length
      : 0,
    averageFirstSingleFlavorNormalPieceCount: average(
      triggeredResults,
      result => result.firstSingleFlavorNormalPieceCount
    ),
    minimumFirstSingleFlavorNormalPieceCount: triggeredResults.length
      ? Math.min(...triggeredResults.map(result => result.firstSingleFlavorNormalPieceCount))
      : null,
    maximumFirstSingleFlavorNormalPieceCount: triggeredResults.length
      ? Math.max(...triggeredResults.map(result => result.firstSingleFlavorNormalPieceCount))
      : null,
    firstSingleFlavorNormalPieceCountDistribution: triggerSizeDistribution,
    completionComparison: {
      completed100Steps: createCompletionGroup(results.filter(result => result.completed100Steps)),
      endedEarly: createCompletionGroup(results.filter(result => !result.completed100Steps))
    }
  };
}
