import { runScoreGames } from "../ai/eightPalaceScoreAI";

const result = await runScoreGames({
  games: 10,
  difficulty: "medium",
  depth: 2,
  beamWidth: 20,
  maxActions: 100,
  compareRandom: false,
  compareHeater: true
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
  averageScoreDifference: result.heaterAverageScoreDifference,
  highestHeaterGame: {
    finalScore: result.heaterComparison.highScore.finalScore,
    finalMoney: result.heaterComparison.highScore.finalMoney,
    collectionCount: result.heaterComparison.highScore.collectionCount,
    steps: result.heaterComparison.highScore.steps,
    heaterUseCount: result.heaterComparison.highScore.heaterUseCount,
    heaterSpending: result.heaterComparison.highScore.heaterSpending,
    heaterTimeline: result.heaterComparison.highScore.heaterTimeline
  }
}, null, 2));
