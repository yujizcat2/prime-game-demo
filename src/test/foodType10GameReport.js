import { runScoreGames, SCORE_AI_DEFAULTS } from "../ai/eightPalaceScoreAI";
import { BASE_FOOD_TYPES } from "../game/rules";

const report = await runScoreGames({
  games: 10,
  depth: SCORE_AI_DEFAULTS.depth,
  beamWidth: SCORE_AI_DEFAULTS.beamWidth,
  maxActions: SCORE_AI_DEFAULTS.maxActions,
  compareRandom: false
});

const collectedTypeCounts = report.results.map(result =>
  new Set(result.collections.map(card => card.foodType).filter(type => BASE_FOOD_TYPES.includes(type))).size
);
const average = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const reachCounts = Object.fromEntries([5, 6, 7, 8].map(target => [target,
  collectedTypeCounts.filter(count => count >= target).length
]));
const firstSteps = Object.fromEntries([5, 6, 7, 8].map(target => {
  const steps = report.results.flatMap(result => {
    const seen = new Set();
    for(const card of result.collections){
      if(BASE_FOOD_TYPES.includes(card.foodType)) seen.add(card.foodType);
      if(seen.size >= target) return [card.step];
    }
    return [];
  });
  return [target, steps.length ? average(steps) : null];
}));

console.log(JSON.stringify({
  config: {games: 10, ...SCORE_AI_DEFAULTS},
  averageFinalScore: report.averageFinalScore,
  highestScore: report.highestScore,
  averageCollectionCount: report.averageCollectionCount,
  averageFinalNormalFoodTypeCount: average(report.results.map(result =>
    new Set(result.finalBoard.map(piece => piece?.foodType).filter(type => BASE_FOOD_TYPES.includes(type))).size
  )),
  averageCollectedNormalFoodTypeCount: average(collectedTypeCounts),
  collectedNormalFoodTypeReachCounts: reachCounts,
  averageFirstCollectedNormalFoodTypeSteps: firstSteps,
  averageBoardPowerBonus: report.averageBoardPowerBonus,
  largeCollectionSummary: report.largeCollectionSummary,
  lowestScore: report.lowestScore
}, null, 2));
