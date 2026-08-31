import { runScoreGames } from "../ai/eightPalaceScoreAI";

const result = await runScoreGames({
  games: 10,
  difficulty: "medium",
  depth: 2,
  beamWidth: 20,
  maxActions: 100,
  compareRandom: false,
  compareHeater: true,
  compareDynamicHeater: true
});

const summarize = summary => ({
  averageScore: summary.averageFinalScore,
  highestScore: summary.highestScore,
  lowestScore: summary.lowestScore,
  averageMoney: summary.averageFinalMoney,
  averageCollection: summary.averageCollectionCount,
  averageHeaterUses: summary.averageHeaterUseCount,
  averageHeaterSpending: summary.averageHeaterSpending,
  averageHeaterCost: summary.averageHeaterCost,
  completionRate: summary.completed100StepRate,
  deadlockRate: summary.deadlockRate
});

console.log(JSON.stringify({
  config: {games: 10, difficulty: "medium", depth: 2, beamWidth: 20, maxActions: 100},
  scoreAI: summarize(result),
  heaterAI: summarize(result.heaterComparison),
  dynamicHeaterAI: summarize(result.dynamicHeaterComparison),
  averageScoreDifference: result.heaterAverageScoreDifference,
  dynamicVsScoreAverageScoreDifference: result.dynamicHeaterAverageScoreDifference,
  dynamicVsFixedAverageScoreDifference: result.dynamicVsFixedAverageScoreDifference,
  dynamicPriceDistribution: result.dynamicHeaterComparison.heaterPriceDistribution,
  dynamicOpportunityDistribution: result.dynamicHeaterComparison.heaterOpportunityDistribution,
  dynamicMinimumHeaterCost: result.dynamicHeaterComparison.minimumHeaterCost,
  dynamicMaximumHeaterCost: result.dynamicHeaterComparison.maximumHeaterCost,
  highestDynamicHeaterGame: {
    finalScore: result.dynamicHeaterComparison.highScore.finalScore,
    finalMoney: result.dynamicHeaterComparison.highScore.finalMoney,
    collectionCount: result.dynamicHeaterComparison.highScore.collectionCount,
    steps: result.dynamicHeaterComparison.highScore.steps,
    heaterUseCount: result.dynamicHeaterComparison.highScore.heaterUseCount,
    heaterSpending: result.dynamicHeaterComparison.highScore.heaterSpending,
    heaterTimeline: result.dynamicHeaterComparison.highScore.heaterTimeline
  }
}, null, 2));
