import { createSeededScoreOpenings, runScoreGames } from "../ai/eightPalaceScoreAI";

const games = 100;
const report = await runScoreGames({
  games,
  depth: 4,
  beamWidth: 50,
  maxActions: 168,
  compareRandom: false,
  searchMode: "legacy",
  openings: createSeededScoreOpenings(Array.from({length: games}, (_, index) => index + 1))
});

console.log(JSON.stringify({
  games: report.games,
  depth: report.depth,
  beamWidth: report.beamWidth,
  averageFinalScore: report.averageFinalScore,
  averageScoreEfficiency: report.averageScoreEfficiency,
  averageCollectionCount: report.averageCollectionCount,
  averageOperatingDays: report.averageOperatingDays,
  highestOperatingDays: report.highestOperatingDays,
  deadlockCount: report.deadlockCount,
  avoidableImmediateDeathCount: report.avoidableImmediateDeathCount ?? 0,
  averageElapsedMs: report.averageElapsedMs,
  daySummaries: report.daySummaries.map(day => ({
    day: day.day,
    reachedCount: day.reachedCount,
    passedCount: day.passedCount,
    passRate: day.passRate
  }))
}, null, 2));
