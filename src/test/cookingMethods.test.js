import assert from "node:assert/strict";
import { BOARD_COOKING_METHODS, getCookingMethod } from "../game/cookingMethods";
import { applyEightPalaceCollection } from "../game/collectionRules";
import { createGameState } from "../game/gameState";
import { BASE_FOOD_TYPES } from "../game/rules";

assert.deepEqual(BOARD_COOKING_METHODS, ["炒", "烤", "煮", "煎", "调制", "蒸", "炖", "炸", "拌"]);

const foodType = BASE_FOOD_TYPES[3];
const piece = {
  value: 1,
  foodType,
  origin: {type: "reduce", parent: {value: 6, foodType}}
};

const first = applyEightPalaceCollection(createGameState([2, 3, 5], {dayCycleEnabled:true}), piece, undefined, 0);
assert.equal(first.latestCollection.cookingMethod, "炒");
assert.equal(first.latestCollection.name.startsWith("炒"), true);
assert.equal(first.latestCollectionRewards[0].name.startsWith("炒"), true);

const repeated = applyEightPalaceCollection(first, piece, undefined, 5);
assert.equal(repeated.collectionCards.length, 1, "cooking method must not create another collection slot");
assert.equal(repeated.collectionCards[0].collectionKey, `${foodType}:6`);
assert.equal(repeated.collectionTimeline.at(-1).cookingMethod, "蒸");
assert.equal(repeated.collectionTimeline.at(-1).name.startsWith("蒸"), true);
assert.equal(repeated.collectionTimeline.length,2,"repeat sales remain in sales history");
assert.equal(repeated.dayRevenue-first.dayRevenue,repeated.latestCollection.totalScore,"repeat sales keep their existing revenue settlement");
const otherType=BASE_FOOD_TYPES[1];
const otherPiece={value:1,foodType:otherType,origin:{type:"reduce",parent:{value:6,foodType:otherType}}};
const otherCollected=applyEightPalaceCollection(repeated,otherPiece,undefined,1);
assert.equal(otherCollected.collectionCards.length,2,"the same value in another food type is a new slot");
assert.ok(otherCollected.collectionCards.some(card=>card.collectionKey===`${otherType}:6`));
assert.equal(getCookingMethod(8), "拌");

console.log("cooking method tests passed");
