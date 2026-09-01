import { runScoreGames } from "../ai/eightPalaceScoreAI";

const report = await runScoreGames({
  games: 100,
  difficulty: "medium",
  depth: 1,
  beamWidth: 2,
  maxActions: 100,
  compareRandom: false,
  compareHeater: false
});

const output = {
  oldRuleBaseline: {
    formallyTriggeredGames: 64,
    averageFirstFormalTriggerStep: 19.13,
    allStepFormalSingleFlavorRate: .309,
    step100FormalSingleFlavorRate: .559,
    step100AveragePenaltyPieces: 4.65,
    singleFlavorCollectionAverageScore: 87.25,
    penalizedCollectionAverageScore: 85.39
  },
  games: report.games,
  completed100StepCount: report.completed100StepCount,
  foodTypeCheckpointSummary: report.foodTypeCheckpointSummary,
  firstDominanceThresholdSteps: report.firstDominanceThresholdSteps,
  averageCollectionFoodTypeCounts: report.averageCollectionFoodTypeCounts,
  averageCollectionScoreByBoardState: report.averageCollectionScoreByBoardState,
  averageCollectionScoreByDominance: report.averageCollectionScoreByDominance,
  structuralSingleFlavorReachedGameCount: report.structuralSingleFlavorReachedGameCount,
  structuralSingleFlavorReachedRate: report.structuralSingleFlavorReachedRate,
  averageFirstStructuralSingleFlavorStep: report.averageFirstStructuralSingleFlavorStep,
  allStepStructuralSingleFlavorRate: report.allStepStructuralSingleFlavorRate,
  formallyTriggeredGames: report.singleFlavorTriggeredGameCount,
  formalTriggerRate: report.singleFlavorTriggerRate,
  averageFirstFormalTriggerStep: report.averageSingleFlavorFirstTriggeredStep,
  earliestFormalTriggerStep: report.earliestSingleFlavorFirstTriggeredStep,
  allStepFormalSingleFlavorRate: report.allStepFormalSingleFlavorRate,
  averageFirstSingleFlavorNormalPieceCount: report.averageFirstSingleFlavorNormalPieceCount,
  minimumFirstSingleFlavorNormalPieceCount: report.minimumFirstSingleFlavorNormalPieceCount,
  maximumFirstSingleFlavorNormalPieceCount: report.maximumFirstSingleFlavorNormalPieceCount,
  firstSingleFlavorNormalPieceCountDistribution: report.firstSingleFlavorNormalPieceCountDistribution,
  completionComparison: report.completionComparison,
  dominantFoodTypeRatioDistribution: report.dominantFoodTypeRatioDistribution,
  dominantFoodTypeRatioDistributionAtSteps: report.dominantFoodTypeRatioDistributionAtSteps
};

console.log(JSON.stringify(output, null, 2));
