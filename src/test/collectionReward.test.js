import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCollectionRewardSettlement, getCollectionBaseSalePrice } from "../game/collectionReward";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getCollectionMultiplier } from "../game/collectionMultiplier";

const card = (value, foodType) => ({value, foodType});
const settle = (collectionCards, value, foodType, nonDrinkBoardSum = 0, singleFlavorPenalty = false) =>
  createCollectionRewardSettlement({
    collectionCards, value, foodType, name: `${value}号料理`, nonDrinkBoardSum,
    boardAverageValue: 100, singleFlavorPenalty
  });

const first = settle([], 17, BASE_FOOD_TYPES[0], 900, true);
assert.equal(first.totalScore, 150);
assert.equal(first.bonusScore, 0);
assert.deepEqual(first.bonuses, []);

const second = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[1], 0);
assert.equal(second.totalScore, 75);
assert.equal(second.existingFoodTypeCountForSameNumber, 1);

const duplicate = settle([card(17, BASE_FOOD_TYPES[0])], 17, BASE_FOOD_TYPES[0], 900);
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.totalScore, 0);

const reductionRecord = (originalValue, value = 5) => ({
  value,
  origin: {type: "reduce", parent: {value: originalValue}}
});
for(const [originalValue, expectedMultiplier, expectedRate] of [
  [10, 2, 1], [15, 3, 1.1], [25, 5, 1.25], [35, 7, 1.4], [40, 8, 1.5], [60, 12, 1.5]
]){
  assert.deepEqual(getCollectionMultiplier(reductionRecord(originalValue)), {
    collectionMultiplier: expectedMultiplier,
    collectionMultiplierRate: expectedRate
  });
}
for(const invalidRecord of [null, {value: 5}, reductionRecord(12)]){
  assert.deepEqual(getCollectionMultiplier(invalidRecord), {
    collectionMultiplier: 1,
    collectionMultiplierRate: 1
  });
}

const multiplied = createCollectionRewardSettlement({
  collectionCards: [], value: 5, foodType: BASE_FOOD_TYPES[0], name: "5号料理",
  collectionRecord: reductionRecord(35)
});
assert.equal(multiplied.totalScore, 140, "the route multiplier is applied before final rounding");
assert.equal(multiplied.collectionMultiplier, 7);
assert.equal(multiplied.collectionMultiplierRate, 1.4);

const crossFamilyWithSeries = createCollectionRewardSettlement({
  collectionCards: [card(2, BASE_FOOD_TYPES[0])],
  value: 2,
  foodType: BASE_FOOD_TYPES[1],
  name: "跨系料理",
  cuisineSequenceIndex: 2,
  gameTime: "12:00",
  collectionRecord: reductionRecord(8, 2)
});
assert.equal(crossFamilyWithSeries.baseScore, 100);
assert.equal(crossFamilyWithSeries.preCuisineSaleScore, 50);
assert.equal(crossFamilyWithSeries.cuisineScoreMultiplier, 1, "cross-family adjustment skips the duplicate series half-price");
assert.equal(crossFamilyWithSeries.collectionScore, 50, "100 becomes 50 only once");
assert.equal(crossFamilyWithSeries.totalScore, 58, "50 × 115% rounds to 58");
assert.equal(crossFamilyWithSeries.saleBreakdown.at(-1).result, crossFamilyWithSeries.totalScore);
assert.deepEqual(
  crossFamilyWithSeries.saleBreakdown.map(step => step.label),
  ["基础售价", "同款半价", "当前时段", "×4路线奖励", "最终结算"]
);
assert.equal(
  getCollectionBaseSalePrice([card(2, BASE_FOOD_TYPES[0])], 2, BASE_FOOD_TYPES[1]),
  crossFamilyWithSeries.saleBreakdown[1].result,
  "card price and the formal same-item discount use the same authority"
);

const normalSeriesSale = createCollectionRewardSettlement({
  collectionCards: [], value: 2, foodType: BASE_FOOD_TYPES[0], name: "系列料理",
  cuisineSequenceIndex: 2, gameTime: "12:00"
});
assert.equal(normalSeriesSale.cuisineScoreMultiplier, 1);
assert.equal(normalSeriesSale.totalScore, 100, "food-type sale order never discounts a first sale of this value");
assert.deepEqual(
  normalSeriesSale.saleBreakdown.map(step => step.label),
  ["基础售价", "当前时段", "×1路线奖励", "最终结算"]
);
assert.equal(getCollectionBaseSalePrice([], 2, BASE_FOOD_TYPES[0]), 100, "first-sale card price ignores series order");
assert.equal(getCollectionBaseSalePrice([card(2, BASE_FOOD_TYPES[0])], 2, BASE_FOOD_TYPES[0]), 0, "same-family repeats stay zero");

const priorSevenAndThree = [
  card(7, BASE_FOOD_TYPES[2]),
  card(3, BASE_FOOD_TYPES[4])
];
const firstDairyEight = createCollectionRewardSettlement({
  collectionCards: priorSevenAndThree,
  value: 8,
  foodType: BASE_FOOD_TYPES[4],
  name: "奶油 8",
  cuisineSequenceIndex: 2,
  gameTime: "12:00"
});
assert.equal(firstDairyEight.hasCrossFamilyDiscount, false);
assert.equal(firstDairyEight.collectionScore, firstDairyEight.baseScore);
assert.equal(firstDairyEight.totalScore, 100);
assert.doesNotMatch(firstDairyEight.saleBreakdown.map(step => step.label).join(" "), /系列调整|同款半价/);
assert.equal(getCollectionBaseSalePrice(priorSevenAndThree, 8, BASE_FOOD_TYPES[4]), 100);

const secondFruitEight = createCollectionRewardSettlement({
  collectionCards: [...priorSevenAndThree, card(8, BASE_FOOD_TYPES[4])],
  value: 8,
  foodType: BASE_FOOD_TYPES[5],
  name: "水果 8",
  gameTime: "12:00"
});
assert.equal(secondFruitEight.hasCrossFamilyDiscount, true);
assert.equal(secondFruitEight.collectionScore, 50);
assert.equal(secondFruitEight.saleBreakdown[1].label, "同款半价");
assert.equal(getCollectionBaseSalePrice([...priorSevenAndThree, card(8, BASE_FOOD_TYPES[4])], 8, BASE_FOOD_TYPES[5]), 50);

const repeatedDairyEight = createCollectionRewardSettlement({
  collectionCards: [...priorSevenAndThree, card(8, BASE_FOOD_TYPES[4])],
  value: 8,
  foodType: BASE_FOOD_TYPES[4],
  name: "奶油 8"
});
assert.equal(repeatedDairyEight.duplicate, true);
assert.equal(repeatedDairyEight.totalScore, 0);

const timedCrossFamilySale = createCollectionRewardSettlement({
  collectionCards: [card(2, BASE_FOOD_TYPES[0])],
  value: 2,
  foodType: BASE_FOOD_TYPES[1],
  name: "时段料理",
  cuisineSequenceIndex: 2,
  gameTime: "18:00",
  collectionRecord: reductionRecord(8, 2)
});
assert.equal(timedCrossFamilySale.totalScore, 69, "time and route multipliers still apply after the single cross-family adjustment");

assert.deepEqual(duplicate.saleBreakdown, [
  {label: "基础售价", operation: null, result: 150},
  {label: "重复销售调整", operation: "→", result: 0},
  {label: "最终结算", operation: "四舍五入", result: 0}
]);

const yuzuEight = card(8, "fruit");
const priorAquatic = card(3, "aquatic");
const tigerShrimpRecord = {
  value: 8,
  foodType: "aquatic",
  origin: {type: "reduce", parent: {value: 32, foodType: "aquatic"}}
};
const tigerShrimp = createCollectionRewardSettlement({
  collectionCards: [yuzuEight, priorAquatic],
  value: tigerShrimpRecord.value,
  foodType: tigerShrimpRecord.foodType,
  name: "虎虾",
  cuisineSequenceIndex: 2,
  gameTime: "04:00",
  collectionRecord: tigerShrimpRecord
});
assert.equal(tigerShrimp.baseSaleScore, 100, "value 8 base lookup uses the sold value");
assert.equal(tigerShrimp.preCuisineSaleScore, 50, "an existing value 8 in another cuisine keeps the existing cross-cuisine adjustment");
assert.equal(tigerShrimp.collectionScore, 50, "cross-cuisine adjustment is not halved again by the cuisine sequence");
assert.equal(tigerShrimp.collectionMultiplier, 4);
assert.equal(tigerShrimp.collectionMultiplierRate, 1.15);
assert.equal(tigerShrimp.timeSaleMultiplier, 1);
assert.equal(tigerShrimp.totalScore, 58, "round(50 × 1.00 × 1.15) is the sale amount");

for(const collectionRecord of [
  {value: 8, foodType: "aquatic"},
  {value: 8, foodType: "aquatic", origin: {type: "reduce", parent: {value: 16}}},
  tigerShrimpRecord
]){
  const reward = createCollectionRewardSettlement({
    collectionCards: [], value: 8, foodType: "aquatic", name: "8号料理",
    collectionRecord
  });
  assert.equal(reward.baseSaleScore, 100, "origin and parent never replace the final value in base lookup");
}

for(const path of ["src/game/collectionReward.js", "src/components/CollectionRewardModal.jsx"]){
  const source = readFileSync(path, "utf8");
  assert.doesNotMatch(source, /首次发现|新料理系|firstDiscoveryRate|getNewFoodTypeBonus/);
}

console.log("collection reward tests passed");
