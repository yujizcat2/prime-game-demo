import { runAdaptiveScoreBenchmark } from "../ai/eightPalaceScoreAI";

const games = Number(process.argv[2] ?? 100);
const result = await runAdaptiveScoreBenchmark({games});
const printable = summary => ({
  games: summary.games,
  averageFinalScore: summary.averageFinalScore,
  medianFinalScore: summary.medianFinalScore,
  scoreStandardDeviation: summary.scoreStandardDeviation,
  scoreP10: summary.scoreP10,
  scoreP25: summary.scoreP25,
  scoreP75: summary.scoreP75,
  scoreP90: summary.scoreP90,
  highestScore: summary.highestScore,
  lowestScore: summary.lowestScore,
  averageCollectionCount: summary.averageCollectionCount,
  averageSteps: summary.averageSteps,
  completed100StepRate: summary.completed100StepRate,
  deadlockRate: summary.deadlockRate,
  scoreBands: summary.scoreBands,
  largeCollections: summary.largeCollections,
  averageHeaterUseCount: summary.averageHeaterUseCount,
  averageHeaterSpending: summary.averageHeaterSpending,
  averageRestoreUseCount: summary.averageRestoreUseCount,
  averageRestoreSpending: summary.averageRestoreSpending,
  averageSuperHeaterUseCount: summary.averageSuperHeaterUseCount,
  averageSuperHeaterSpending: summary.averageSuperHeaterSpending,
  extensionTelemetry: summary.extensionTelemetry,
  averageSearchedNodes: summary.averageSearchedNodes,
  averageEvaluatedNodes: summary.averageEvaluatedNodes,
  averageGeneratedActions: summary.averageGeneratedActions,
  averagePrunedActions: summary.averagePrunedActions,
  averageElapsedMs: summary.averageElapsedMs,
  elapsedP50Ms: summary.elapsedP50Ms,
  elapsedP90Ms: summary.elapsedP90Ms,
  slowestElapsedMs: summary.slowestElapsedMs,
  totalBudgetHits: summary.totalBudgetHits,
  averageReachedDepth: summary.averageReachedDepth,
  averageMaximumReachedDepth: summary.averageMaximumReachedDepth,
  maximumReachedDepth: summary.maximumReachedDepth,
  totalEvaluationCacheHits: summary.totalEvaluationCacheHits,
  totalEvaluationCacheMisses: summary.totalEvaluationCacheMisses,
  totalTranspositionHits: summary.totalTranspositionHits,
  averageCollectionFoodTypeCounts: summary.averageCollectionFoodTypeCounts,
  foodTypeCheckpointSummary: summary.foodTypeCheckpointSummary,
  maximumDominantFoodTypeRatio: summary.averageMaximumDominantFoodTypeRatio,
  singleFlavorTriggerRate: summary.singleFlavorTriggerRate
});

console.log(JSON.stringify({
  config: {games, seeds: `${result.seeds[0]}..${result.seeds.at(-1)}`},
  baseline: printable(result.baseline),
  adaptive: printable(result.adaptive)
}, null, 2));
