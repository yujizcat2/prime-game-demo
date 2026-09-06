import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement } from "../game/collectionReward";
import {
  MAX_TIME_SALE_MULTIPLIER,
  MIN_TIME_SALE_MULTIPLIER,
  TIME_SALE_PERIODS,
  createNextTimeSalePeriods,
  getTimeSaleMultiplier,
  getTimeSalePriceTotal
} from "../game/timeSaleMultiplier";
import { BASE_FOOD_TYPES } from "../game/rules";
import { applyAction, createGameState, resolveGameOver } from "../game/gameEngine";
import { getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { advanceToNextDay } from "../game/dayCycle";

for(const [gameTime, expected] of [
  ["03:59", 0.8], ["04:00", 1], ["10:59", 1], ["11:00", 1.1],
  ["11:59", 1.1], ["12:00", 1], ["15:59", 1], ["16:00", 1.15],
  ["17:59", 1.15], ["18:00", 1.2], ["19:59", 1.2], ["20:00", 1]
]){
  assert.equal(getTimeSaleMultiplier(gameTime), expected, gameTime);
}

assert.equal(getTimeSaleMultiplier("24:00"), 0.8, "cross-midnight clock wraps to 00:00");
assert.equal(getTimeSaleMultiplier("27:59"), 0.8, "cross-midnight 03:59 remains early morning");
assert.equal(getTimeSaleMultiplier("28:00"), 1, "cross-midnight 04:00 returns to normal");
assert.deepEqual(
  TIME_SALE_PERIODS.map(({range, multiplier, displayName}) => [range, multiplier, displayName]),
  [
    ["00:00–03:59", 0.8, "凌晨低谷"], ["04:00–10:59", 1, "正常价格"],
    ["11:00–11:59", 1.1, "午间高价"], ["12:00–15:59", 1, "正常价格"],
    ["16:00–17:59", 1.15, "晚餐时段"], ["18:00–19:59", 1.2, "黄金时段"],
    ["20:00–23:59", 1, "正常价格"]
  ],
  "the UI schedule comes from the scoring authority"
);
assert.ok(Math.abs(getTimeSalePriceTotal() - 24) < 1e-10, "Day 1 weighted price total is 24");

const averageSaleScores = Object.fromEntries(TIME_SALE_PERIODS.map(period => [
  period.startMinutes,
  (period.endMinutes - period.startMinutes) / 60 * 100
]));
const unevenSaleScores = {
  ...averageSaleScores,
  0: 4 * 50,
  [18 * 60]: 2 * 200
};
const dayTwoPeriods = createNextTimeSalePeriods(TIME_SALE_PERIODS, unevenSaleScores);
assert.ok(dayTwoPeriods[0].multiplier > TIME_SALE_PERIODS[0].multiplier, "low-intensity early morning rises");
assert.ok(dayTwoPeriods[5].multiplier < TIME_SALE_PERIODS[5].multiplier, "high-intensity golden period falls");
assert.ok(Math.abs(dayTwoPeriods[1].multiplier - TIME_SALE_PERIODS[1].multiplier) < 0.02, "average periods only receive the shared conservation correction");
assert.ok(dayTwoPeriods.every(period =>
  period.multiplier >= MIN_TIME_SALE_MULTIPLIER && period.multiplier <= MAX_TIME_SALE_MULTIPLIER
));
assert.ok(Math.abs(getTimeSalePriceTotal(dayTwoPeriods) - 24) < 1e-10, "Day 2 conserves weighted price total");

const cappedPeriods = TIME_SALE_PERIODS.map((period, index) => ({
  ...period,
  multiplier: index === 0 ? MAX_TIME_SALE_MULTIPLIER : index === 5 ? MIN_TIME_SALE_MULTIPLIER : period.multiplier
}));
const cappedNext = createNextTimeSalePeriods(cappedPeriods, unevenSaleScores);
assert.ok(cappedNext.every(period =>
  period.multiplier >= MIN_TIME_SALE_MULTIPLIER && period.multiplier <= MAX_TIME_SALE_MULTIPLIER
), "conservation never pushes capped periods out of bounds");

const reversedSaleScores = {...averageSaleScores, 0: 4 * 200, [18 * 60]: 2 * 50};
const dayThreeFromDayTwoOnly = createNextTimeSalePeriods(dayTwoPeriods, reversedSaleScores);
const incorrectlyAccumulated = createNextTimeSalePeriods(dayTwoPeriods, Object.fromEntries(
  TIME_SALE_PERIODS.map(period => [period.startMinutes, (unevenSaleScores[period.startMinutes] ?? 0) + (reversedSaleScores[period.startMinutes] ?? 0)])
));
assert.notDeepEqual(
  dayThreeFromDayTwoOnly.map(period => period.multiplier),
  incorrectlyAccumulated.map(period => period.multiplier),
  "Day 3 uses Day 2 sales only instead of accumulating Day 1"
);

const settlement = createCollectionRewardSettlement({
  collectionCards: [], value: 2, foodType: BASE_FOOD_TYPES[0], name: "test",
  cuisineSequenceIndex: 2, gameTime: "17:00"
});
assert.equal(settlement.baseSaleScore, 50);
assert.equal(
  settlement.totalScore,
  Math.round(settlement.baseSaleScore * settlement.timeSaleMultiplier),
  "final score uses Math.round"
);

const reduceAt = dayMinutesElapsed => applyAction({
  ...createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"}
  ], {dayCycleEnabled: true}),
  dayMinutesElapsed
}, {type: "reduce", indexes: [0, 1]});

const sameCollectible = {
  value: 1,
  foodType: BASE_FOOD_TYPES[0],
  origin: {type: "reduce", parent: {value: 2, foodType: BASE_FOOD_TYPES[0], origin: null}}
};
const previewState = {
  collectionCards: [],
  board: [],
  dayMinutesElapsed: 3 * 60 + 59
};
assert.equal(getEightPalaceCollectionScoreGain(previewState, sameCollectible), 80);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 4 * 60}, sameCollectible),
  100,
  "the same uncollected dish updates when current time crosses 04:00"
);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 10 * 60 + 59}, sameCollectible),
  100
);
assert.equal(
  getEightPalaceCollectionScoreGain({...previewState, dayMinutesElapsed: 11 * 60}, sameCollectible),
  110,
  "the same preview also updates across the lunch boundary"
);

const earlyMorningCollection = reduceAt(3 * 60 + 59);
const earlyMorningReward = earlyMorningCollection.latestCollectionRewards[0];
assert.equal(earlyMorningReward.baseSaleScore, 100);
assert.equal(earlyMorningReward.timeSaleMultiplier, 0.8);
assert.equal(earlyMorningReward.totalScore, 80);
assert.equal(earlyMorningCollection.score, 80, "real reduce-to-one action banks the discounted score once");
assert.equal(earlyMorningCollection.latestCollection.totalScore, 80);
assert.equal(earlyMorningCollection.timeSaleScores[0], 80, "only the formal collection score enters period sales");

const normalCollection = reduceAt(4 * 60);
assert.equal(normalCollection.latestCollectionRewards[0].baseSaleScore, 100);
assert.equal(normalCollection.latestCollectionRewards[0].totalScore, 100);
assert.equal(normalCollection.score, 100, "04:00 real auto-collection banks the restored base price once");

const lunchCollection = reduceAt(11 * 60);
assert.equal(lunchCollection.latestCollectionRewards[0].timeSaleMultiplier, 1.1);
assert.equal(lunchCollection.score, 110, "real non-early-morning action keeps its configured multiplier");

const sevenCollections = Array.from({length: 7}, (_, index) => ({
  value: 20 + index,
  foodType: BASE_FOOD_TYPES[index % BASE_FOOD_TYPES.length]
}));
const eighthPreviewState = {
  ...createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"}
  ], {dayCycleEnabled: true}),
  collectionCards: sevenCollections,
  dayStartCollectionCount: 0,
  dayMinutesElapsed: 18 * 60
};
const eighthPreviewScore = getEightPalaceCollectionScoreGain(eighthPreviewState, sameCollectible);
const eighthCollection = applyAction(eighthPreviewState, {type: "reduce", indexes: [0, 1]});
const eighthReward = eighthCollection.latestCollectionRewards[0];
assert.equal(eighthReward.saleScore, eighthPreviewScore, "pre-collection preview remains the unmodified dish sale price");
assert.equal(eighthReward.todayCollectionNumber, 8);
assert.equal(eighthReward.dailyCollectionBonus, 50);
assert.equal(eighthReward.totalScore, eighthPreviewScore + 50);
assert.equal(eighthCollection.score - eighthPreviewState.score, eighthPreviewScore + 50);
assert.equal(eighthCollection.timeSaleScores[18 * 60], eighthPreviewScore, "daily bonus does not enter dynamic market sales");

const discountedEighth = applyAction({...eighthPreviewState, dayMinutesElapsed: 0}, {type: "reduce", indexes: [0, 1]});
const discountedSaleScore = getEightPalaceCollectionScoreGain(
  {...eighthPreviewState, dayMinutesElapsed: 0},
  sameCollectible
);
assert.equal(discountedEighth.latestCollectionRewards[0].saleScore, discountedSaleScore);
assert.equal(discountedEighth.latestCollectionRewards[0].dailyCollectionBonus, 50);
assert.equal(discountedEighth.score - eighthPreviewState.score, discountedSaleScore + 50, "the 0.80 market rate never discounts the fixed bonus");

const routedEighthState = {
  ...eighthPreviewState,
  board: [
    {value: 5, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, origin: {type: "reduce", parent: {value: 35, foodType: BASE_FOOD_TYPES[0]}}},
    {value: 10, foodType: BASE_FOOD_TYPES[1], boardIndex: 1},
    ...eighthPreviewState.board.slice(2)
  ]
};
const routedEighth = applyAction(routedEighthState, {type: "reduce", indexes: [0, 1]});
assert.equal(routedEighth.latestCollectionRewards[0].collectionMultiplierRate, 1.4);
assert.equal(routedEighth.latestCollectionRewards[0].dailyCollectionBonus, 50, "route multiplier never changes the fixed bonus");
assert.equal(
  routedEighth.latestCollectionRewards[0].totalScore,
  routedEighth.latestCollectionRewards[0].saleScore + 50
);

const closingDayOne = resolveGameOver({
  ...createGameState([
    {value: 2, foodType: BASE_FOOD_TYPES[0], boardIndex: 0, gameMode: "eightPalace"},
    {value: 4, foodType: BASE_FOOD_TYPES[1], boardIndex: 1, gameMode: "eightPalace"}
  ], {dayCycleEnabled: true}),
  dayMinutesElapsed: 24 * 60,
  score: 1000,
  collectionCards: Array.from({length: 8}, (_, index) => ({value: 20 + index, foodType: BASE_FOOD_TYPES[index % 2]})),
  timeSaleScores: unevenSaleScores
});
const dayTwoState = advanceToNextDay(closingDayOne);
assert.deepEqual(dayTwoState.timeSalePeriods, closingDayOne.daySettlement.nextTimeSalePeriods);
assert.deepEqual(dayTwoState.timeSaleScores, {}, "new day starts a fresh sales statistic");
const dayTwoPreview = getEightPalaceCollectionScoreGain(dayTwoState, sameCollectible);
const dayTwoCollected = applyAction(dayTwoState, {type: "reduce", indexes: [0, 1]});
assert.equal(dayTwoCollected.score - dayTwoState.score, dayTwoPreview, "Day 2 preview and formal score use the generated price");
assert.equal(dayTwoCollected.latestCollectionRewards[0].timeSaleMultiplier, dayTwoPeriods[0].multiplier);

const rewardModalSource = readFileSync("src/components/CollectionRewardModal.jsx", "utf8");
assert.match(rewardModalSource, /createPortal/);
assert.match(rewardModalSource, /今日销售奖励/);
assert.match(rewardModalSource, />确认<\/button>/);
assert.doesNotMatch(rewardModalSource, /setTimeout/);
const rewardModalCssSource = readFileSync("src/components/CollectionRewardModal.css", "utf8");
assert.match(rewardModalCssSource, /position:\s*fixed/);
assert.match(rewardModalCssSource, /z-index:\s*10000/);
assert.match(rewardModalCssSource, /max-height:\s*calc\(100vh/);
const appSource = readFileSync("src/App.jsx", "utf8");
assert.match(appSource, /rewards\.filter\(reward => reward\.isNewCollection\)/);
const boardSource = readFileSync("src/components/Board.jsx", "utf8");
assert.match(boardSource, /\{collectionCards, board, dayMinutesElapsed, timeSalePeriods\}/);
const dayPanelSource = readFileSync("src/components/DayPanel.jsx", "utf8");
assert.match(dayPanelSource, /getTimeSalePeriod\(time, timeSalePeriods\)/);
assert.match(dayPanelSource, /timeSalePeriods\.map/);
const daySettlementSource = readFileSync("src/components/DaySettlement.jsx", "utf8");
assert.match(daySettlementSource, /今日销售行情/);
assert.match(daySettlementSource, /row\.saleIntensity/);
assert.match(daySettlementSource, /dailyCollectionBonusTotal/);
assert.notEqual(settlement.totalScore, settlement.baseSaleScore * settlement.timeSaleMultiplier);
assert.equal(
  settlement.totalScore,
  Math.round(settlement.baseSaleScore * getTimeSaleMultiplier("17:00")),
  "time multiplier is applied exactly once"
);

console.log("time sale multiplier tests passed");
