import assert from "node:assert/strict";
import { createEightPalaceInitialValues } from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { resolveGameOver } from "../game/gameEngine";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { getSaleScore } from "../game/saleScore";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { BASE_FOOD_TYPES } from "../game/rules";
import {
  DAY_DURATION_MINUTES,
  DAY_REVENUE_TARGET,
  MAX_DAYS,
  WEEKDAYS,
  advanceToNextDay,
  getDailyCollectionBonus,
  getDailyCollectionBonusTotal,
  getDayTargetScore,
  formatClosingTimeRemaining,
  getDayTime,
  getPerformanceBonusBreakdown,
  getTodayNewCollectionCount,
  getWeekday
} from "../game/dayCycle";

const createDayState = () => createGameState(createEightPalaceInitialValues(), {dayCycleEnabled: true});
const makeCollections = (count, offset = 0) => Array.from({length: count}, (_, index) => ({
  value: 2 + (index + offset) % 100,
  foodType: index % 2 ? "land" : "aquatic"
}));

const initial = createDayState();
assert.equal(DAY_DURATION_MINUTES, 1440);
assert.equal(getDailyCollectionBonus(10), 0);
assert.equal(getDailyCollectionBonus(11), 10);
assert.equal(getDailyCollectionBonus(12), 20);
assert.equal(getDailyCollectionBonus(13), 30);
assert.equal(getDailyCollectionBonusTotal(10), 0);

const thirteenthCollectionState = {
  ...createGameState([], {dayCycleEnabled: true}),
  collectionCards: Array.from({length: 13}, (_, index) => ({
    value: 20 + index,
    foodType: BASE_FOOD_TYPES[index % BASE_FOOD_TYPES.length]
  })),
  dayStartCollectionCount: 0,
  dayMinutesElapsed: 4 * 60,
  score: 26.3,
  dayRevenue: 700
};
const fourteenthPiece = {
  value: 1,
  foodType: "dairyEgg",
  collectionRewardLevel: 3,
  origin: {type: "reduce", parent: {value: 4, foodType: "dairyEgg", bornAt: 0}}
};
const fourteenthCollection = applyEightPalaceCollection(thirteenthCollectionState, fourteenthPiece);
const fourteenthReward = fourteenthCollection.latestCollectionRewards[0];
assert.equal(fourteenthReward.todayCollectionNumber, 14);
assert.equal(fourteenthReward.dailyCollectionBonus, 40, "the fourteenth sale still earns +40 revenue");
assert.equal(fourteenthReward.collectionMultiplierRate, 1.05, "a level-3 route still applies ×1.05 once");
assert.equal(fourteenthReward.saleScore, 105, "the normal sale uses base 100 × route 1.05");
assert.equal(fourteenthReward.salePointScore, 1.95, "points use only the normal point formula");
assert.equal(fourteenthCollection.dayRevenue - thirteenthCollectionState.dayRevenue, 145, "revenue includes the +40 daily sale bonus");
assert.equal(Number((fourteenthCollection.score - thirteenthCollectionState.score).toFixed(2)), 1.95, "the +40 revenue bonus never enters points");

const expiredFourteenthCollection = applyEightPalaceCollection(
  {...thirteenthCollectionState, totalActionMinutes: 24 * 60},
  fourteenthPiece
);
assert.equal(expiredFourteenthCollection.latestCollection.dailyCollectionBonus, 40);
assert.equal(expiredFourteenthCollection.dayRevenue - thirteenthCollectionState.dayRevenue, 40, "an expired fourteenth sale retains its revenue-only bonus");
assert.equal(expiredFourteenthCollection.score - thirteenthCollectionState.score, 0, "an expired sale cannot convert the +40 revenue bonus into points");
assert.equal(getDailyCollectionBonusTotal(13), 60);
assert.equal(formatClosingTimeRemaining(300), "距离打烊还有 5小时");
assert.equal(formatClosingTimeRemaining(270), "距离打烊还有 4小时30分钟");
assert.equal(formatClosingTimeRemaining(30), "距离打烊还有 30分钟");
assert.equal(formatClosingTimeRemaining(0), "已到打烊时间");
assert.deepEqual(
  Array.from({length: MAX_DAYS}, (_, index) => getDayTargetScore(index + 1)),
  Array(MAX_DAYS).fill(DAY_REVENUE_TARGET)
);
assert.equal(initial.day, 1);
assert.equal(initial.dayRevenue, 0);
assert.equal(getSaleScore({baseSalePrice: 99, qualityMultiplier: 1, daySaleCount: 5}), .8);
assert.equal(getSaleScore({baseSalePrice: 100, qualityMultiplier: 1.05, daySaleCount: 6}), 1.15);
assert.equal(getSaleScore({baseSalePrice: 300, qualityMultiplier: 1.5, daySaleCount: 8}), 2.1);
const maximumPerformance = getPerformanceBonusBreakdown({
  ...initial,
  dayRevenue: 1500,
  dayMinutesElapsed: 1440,
  dayTargetReachedAtMinutes: 0,
  collectionCards: [{collectionMultiplierRate: 1.5}],
  board: Array.from({length: 6}, (_, index) => ({value: 40 + index, foodType: "land"}))
}, 20);
assert.equal(maximumPerformance.efficiencyRate, .08);
assert.equal(maximumPerformance.overflowRate, .05);
assert.equal(maximumPerformance.qualityRate, .06);
assert.ok(maximumPerformance.boardRate <= .06);
assert.ok(maximumPerformance.performanceBonusRate >= 0 && maximumPerformance.performanceBonusRate <= .25);
assert.equal(getWeekday(initial.day), "星期一");
assert.equal(getDayTime(initial), "00:00");
assert.equal(getDayTime({...initial, dayMinutesElapsed: 65}), "01:05");

const at23 = resolveGameOver({...initial, steps: 23, dayMinutesElapsed: 1439, score: 0, collectionCards: makeCollections(10)});
assert.equal(at23.daySettlement, null, "time before 24:00 does not settle the day");
assert.equal(at23.gameOver, false);

const tenCollections = makeCollections(10);
const failedAt99 = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 9.9, dayRevenue: 999, collectionCards: tenCollections});
assert.equal(failedAt99.daySettlement.passed, false);
assert.equal(failedAt99.gameOverReason, "daily_score_target_not_met");
const semanticFailure = resolveGameOver({...initial, dayMinutesElapsed: 1440, score: 12.75, dayRevenue: 856});
assert.equal(semanticFailure.daySettlement.passed, false, "score 12.75 cannot pass when revenue is 856");
const semanticPass = resolveGameOver({...initial, dayMinutesElapsed: 1440, score: 5, dayRevenue: 1000});
assert.equal(semanticPass.daySettlement.passed, true, "score 5 passes when revenue is 1000");

const closingBoard = initial.board.map((piece, index) => piece && index === 0 ? {
  ...piece,
  parents: [{value: 2, foodType: "aquatic"}],
  origin: {kind: "test-origin", sourceId: 77}
} : piece);
const passed = resolveGameOver({...initial, board: closingBoard, steps: 24, dayMinutesElapsed: 1440, totalActionMinutes: 1440, score: 10, dayRevenue: 1000, collectionCards: tenCollections});
assert.equal(passed.daySettlement.passed, true);
assert.equal(passed.daySettlement.scoreTargetMet, true);
assert.equal(passed.daySettlement.targetScore, 1000);
assert.equal(passed.daySettlement.collectionGainToday, 10);
assert.equal(passed.daySettlement.dailyCollectionBonusTotal, 0);
assert.equal(passed.daySettlement.weekday, "星期一");
assert.equal(passed.daySettlement.scoreGainToday, 10);
assert.equal(passed.daySettlement.dailyRevenue, 1000);
assert.equal(passed.score, 10 + passed.daySettlement.performanceBonusScore, "performance bonus is added exactly once");
assert.equal(passed.daySettlement.dayFinalScore, 10 + passed.daySettlement.performanceBonusScore);
assert.equal(resolveGameOver(passed).score, passed.score, "an existing settlement cannot award its bonus twice");
assert.equal(passed.daySettlement.boardCount, passed.board.filter(Boolean).length);
assert.equal(Object.hasOwn(passed.daySettlement, "nextDayCards"), false);
assert.equal(passed.dayHistory.length, 1);
assert.equal(getDayTime(passed), "24:00");

const overTarget = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 10, dayRevenue: 1010, collectionCards: tenCollections});
assert.equal(overTarget.daySettlement.passed, true);

const fewCollections = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 7, dayRevenue: 1000, collectionCards: makeCollections(7)});
assert.equal(fewCollections.daySettlement.scoreTargetMet, true);
assert.equal(fewCollections.daySettlement.passed, true, "revenue passes even with fewer than eight sales");

const manyCollectionsLowScore = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 20, dayRevenue: 999, collectionCards: makeCollections(20)});
assert.equal(manyCollectionsLowScore.daySettlement.passed, false, "many collections cannot replace the score target");

assert.equal(getScoreEfficiency(100, 600), 10, "live efficiency is hourly score from actual minutes");
assert.equal(getScoreEfficiency(60, 600), 6);
assert.ok(getScoreEfficiency(100, 300) > getScoreEfficiency(100, 600));
assert.notEqual(
  getScoreEfficiency(100, 300),
  getScoreEfficiency(100, 600),
  "equal scores and Step counts can have different efficiency when action minutes differ"
);
const efficiencyState = resolveGameOver({
  ...initial, steps: 24, dayMinutesElapsed: 1440, score: 14.8, dayRevenue: 1480, dayStartScore: 0, collectionCards: tenCollections
});
assert.equal(efficiencyState.daySettlement.efficiency, 14.8 / 1440 * 60, "daily efficiency uses the day's score and complete action minutes");

let state = passed;
const dayTwoOpening = advanceToNextDay(state);
assert.equal(dayTwoOpening.board, state.board, "Day 2 keeps the exact closing board array");
assert.deepEqual(dayTwoOpening.board, closingBoard, "values, food types, positions, parents, and origin are unchanged");
assert.equal(dayTwoOpening.nextId, state.nextId, "day rollover creates no replacement cards");
assert.equal(dayTwoOpening.comboCount, 0);
assert.equal(dayTwoOpening.dayMinutesElapsed, 0);
assert.equal(dayTwoOpening.score - dayTwoOpening.dayStartScore, 0, "Day 2 daily revenue restarts at zero");
assert.equal(dayTwoOpening.score, passed.score, "cumulative score is retained");
assert.equal(dayTwoOpening.dayRevenue, 0, "Day 2 revenue starts at zero");
assert.equal(
  getScoreEfficiency(dayTwoOpening.score, dayTwoOpening.totalActionMinutes),
  getScoreEfficiency(passed.score, passed.totalActionMinutes),
  "score efficiency keeps cumulative score and actual elapsed time across days"
);
assert.equal(dayTwoOpening.collectionCards.length, tenCollections.length, "cumulative collections are retained");
assert.equal(getTodayNewCollectionCount(dayTwoOpening), 0, "the daily collection bonus count restarts at rollover");
assert.equal(getDailyCollectionBonus(getTodayNewCollectionCount(dayTwoOpening) + 1), 0);
assert.equal(dayTwoOpening.heaterCount, 1);
assert.equal(dayTwoOpening.superHeaterCount, 1);
const dayTwoFailed = resolveGameOver({
  ...dayTwoOpening,
  steps: 48,
  dayMinutesElapsed: 1440,
  score: dayTwoOpening.score + 9.99,
  dayRevenue: 999,
  collectionCards: [...dayTwoOpening.collectionCards, ...makeCollections(10, 10)]
});
assert.equal(dayTwoFailed.daySettlement.scoreGainToday, 9.99, "Day 2 retains daily score as a statistic");
assert.equal(dayTwoFailed.daySettlement.passed, false);
assert.equal(dayTwoFailed.daySettlement.performanceBonusRate, 0, "failed days receive no performance bonus");
assert.equal(dayTwoFailed.daySettlement.performanceBonusScore, 0);

const bufferedDayOne = resolveGameOver({...initial, steps: 24, dayMinutesElapsed: 1440, score: 15.5, dayRevenue: 1550, collectionCards: tenCollections});
const bufferedDayTwo = advanceToNextDay(bufferedDayOne);
assert.equal(bufferedDayTwo.dayRevenue, 0, "Day 1 excess revenue does not carry into Day 2");
const alreadyAtDayTwoTarget = resolveGameOver({...bufferedDayTwo, dayRevenue: 1000});
assert.equal(alreadyAtDayTwoTarget.daySettlement, null, "meeting Day 2's target before closing never settles the day early");
const bufferedDayTwoPassed = resolveGameOver({...bufferedDayTwo, steps: 48, dayMinutesElapsed: 1440, score: bufferedDayTwo.score + 8, dayRevenue: 1000, collectionCards: [...bufferedDayTwo.collectionCards, ...makeCollections(8, 10)]});
assert.equal(bufferedDayTwoPassed.daySettlement.scoreGainToday, 8);
assert.equal(bufferedDayTwoPassed.daySettlement.targetScore, 1000);
assert.equal(bufferedDayTwoPassed.daySettlement.passed, true, "Day 2 passes on its own daily revenue");

for(let day = 1; day <= MAX_DAYS; day++){
  assert.equal(state.day, day);
  assert.equal(state.daySettlement.weekday, WEEKDAYS[day - 1]);
  if(day === MAX_DAYS) break;
  const closingBoardForDay = state.board;
  const next = advanceToNextDay(state);
  assert.equal(next.board, closingBoardForDay, `Day ${day + 1} inherits Day ${day}'s closing board`);
  assert.equal(next.day, day + 1);
  assert.equal(next.dayStartStep, day * 24);
  assert.equal(getDayTime(next), "00:00");
  const collections = [...next.collectionCards, ...makeCollections(10, day * 10)];
  state = resolveGameOver({
    ...next,
    steps: (day + 1) * 24,
    dayMinutesElapsed: 1440,
    score: next.score + 10,
    dayRevenue: 1000,
    collectionCards: collections
  });
}

assert.equal(state.steps, 168);
assert.equal(state.day, 7);
assert.equal(state.daySettlement.passed, true);
assert.equal(state.daySettlement.weekday, "星期日");
assert.equal(Object.hasOwn(state.daySettlement, "nextDayCards"), false);
assert.equal(state.gameOver, true);
assert.equal(state.gameOverReason, "week_complete");
assert.equal(advanceToNextDay(state), state, "the eighth day is never created");
assert.equal(state.dayHistory.length, 7);

const daySevenFailed = resolveGameOver({...initial, day: 7, dayMinutesElapsed: 1440, score: 70, dayRevenue: 999, collectionCards: tenCollections});
assert.equal(daySevenFailed.gameOverReason, "daily_score_target_not_met");
const daySevenPassed = resolveGameOver({...initial, day: 7, dayMinutesElapsed: 1440, score: 70, dayRevenue: 1000, collectionCards: tenCollections});
assert.equal(daySevenPassed.gameOverReason, "week_complete");

console.log("dayCycle.test.js passed");
