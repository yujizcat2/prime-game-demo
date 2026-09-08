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

const first = applyEightPalaceCollection(createGameState([2, 3, 5]), piece, undefined, 0);
assert.equal(first.latestCollection.cookingMethod, "炒");
assert.equal(first.latestCollection.name.startsWith("炒"), true);
assert.equal(first.latestCollectionRewards[0].name.startsWith("炒"), true);

const repeated = applyEightPalaceCollection(first, piece, undefined, 5);
assert.equal(repeated.collectionCards.length, 1, "cooking method must not create another collection slot");
assert.equal(repeated.collectionTimeline.at(-1).cookingMethod, "蒸");
assert.equal(repeated.collectionTimeline.at(-1).name.startsWith("蒸"), true);
assert.equal(getCookingMethod(8), "拌");

console.log("cooking method tests passed");
