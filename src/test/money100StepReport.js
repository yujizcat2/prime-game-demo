import { runScoreGames } from "../ai/eightPalaceScoreAI";

const result = await runScoreGames({
  games: 100,
  difficulty: "medium",
  depth: 1,
  beamWidth: 2,
  maxActions: 100,
  compareRandom: false
});

const sample = result.results[0];
console.log(JSON.stringify({
  games: result.games,
  averageMoney: result.averageFinalMoney,
  highestMoney: result.highestFinalMoney,
  lowestMoney: result.lowestFinalMoney,
  averageCollection: result.averageCollectionCount,
  averageScore: result.averageFinalScore,
  sample: {
    finalScore: sample.finalScore,
    finalMoney: sample.finalMoney,
    collectionCount: sample.collectionCount,
    steps: sample.steps,
    status: sample.completed100Steps ? "完成" : sample.deadlocked ? "死局" : sample.gameOverReason
  }
}, null, 2));
