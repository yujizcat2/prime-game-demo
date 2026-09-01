import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createStandardInitialValues
} from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { BASE_FOOD_TYPES, FOOD_PURITY, FOOD_TYPES } from "../game/rules";
import { getBaseScore } from "../game/scoreValue";
import { BOARD_NATIVE_FOOD_TYPES, getNativeBoardIndex } from "../game/nativeFoodTypes";

const seenCombinations = new Set();

for(let attempt = 0; attempt < 250; attempt++){
    const opening = createStandardInitialValues();
    const values = opening.map(card => card.value);
    const foodTypes = opening.map(card => card.foodType);

    assert.equal(opening.length, 4, "standard opening card count");
    assert.equal(new Set(foodTypes).size, 4, "four distinct food types");
    assert.equal(values.reduce((sum, value) => sum + value, 0), 30, "exact total");
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 101), "legal values");
    assert.ok(foodTypes.every(foodType => BASE_FOOD_TYPES.includes(foodType)), "base food types only");
    assert.ok(!foodTypes.includes(FOOD_TYPES.DRINK), "excludes drink");
    opening.forEach(card => assert.equal(card.boardIndex, getNativeBoardIndex(card.foodType)));

    const state = createGameState(opening);
    const cards = state.board.filter(Boolean);
    assert.equal(cards.length, 4);
    assert.equal(state.board[4], null, "center starts empty");
    for(const [boardIndex, card] of state.board.entries()){
      if(!card) continue;
      assert.equal(card.scoreValue, getBaseScore(card.value));
      assert.equal(card.foodType, BOARD_NATIVE_FOOD_TYPES[boardIndex]);
      assert.equal(card.purity, FOOD_PURITY.PURE);
      assert.equal(card.origin, null);
      assert.ok(Object.hasOwn(card, "id"));
      assert.ok(Object.hasOwn(card, "parents"));
      assert.ok(Object.hasOwn(card, "parentFoods"));
      assert.ok(Object.hasOwn(card, "drinkOriginValue"));
      assert.ok(Object.hasOwn(card, "sourceKey"));
    }

    seenCombinations.add([...values].sort((left, right) => left - right).join(","));
  }

assert.ok(seenCombinations.size > 1, "standard opening produces varied number combinations");
assert.equal(BOARD_NATIVE_FOOD_TYPES[4], null);

const startScreenSource = readFileSync("src/components/StartScreen.jsx", "utf8");
assert.doesNotMatch(startScreenSource, /随机探索|新手入门/);
assert.doesNotMatch(startScreenSource, /4个数字|5个数字|8个数字|料理系|总和/);
assert.doesNotMatch(startScreenSource, /label: "简单"|label: "中等"|label: "困难"|选择难度/);
assert.match(startScreenSource, /onClick=\{startGame\}/);

console.log("standard opening tests passed");
