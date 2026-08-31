import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DIFFICULTY_OPENINGS,
  createDifficultyInitialValues
} from "../game/initialValues";
import { createGameState } from "../game/gameState";
import { BASE_FOOD_TYPES, FOOD_PURITY, FOOD_TYPES } from "../game/rules";
import { getBaseScore } from "../game/scoreValue";

for(const [difficulty, config] of Object.entries(DIFFICULTY_OPENINGS)){
  const seenCombinations = new Set();

  for(let attempt = 0; attempt < 100; attempt++){
    const opening = createDifficultyInitialValues(difficulty);
    const values = opening.map(card => card.value);
    const foodTypes = opening.map(card => card.foodType);

    assert.equal(opening.length, config.count, `${difficulty} card count`);
    assert.equal(new Set(foodTypes).size, config.typeCount, `${difficulty} distinct food types`);
    assert.equal(values.reduce((sum, value) => sum + value, 0), config.targetSum, `${difficulty} exact total`);
    assert.ok(values.every(value => Number.isInteger(value) && value >= 2 && value <= 101), `${difficulty} legal values`);
    assert.equal(new Set(values).size, config.count, `${difficulty} distinct values`);
    assert.ok(foodTypes.every(foodType => BASE_FOOD_TYPES.includes(foodType)), `${difficulty} base food types only`);
    assert.ok(!foodTypes.includes(FOOD_TYPES.DRINK), `${difficulty} excludes drink`);

    const state = createGameState(opening);
    const cards = state.board.filter(Boolean);
    assert.equal(cards.length, config.count);
    for(const card of cards){
      assert.equal(card.scoreValue, getBaseScore(card.value));
      assert.ok(BASE_FOOD_TYPES.includes(card.foodType));
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

  assert.ok(seenCombinations.size > 1, `${difficulty} produces varied number combinations`);
}

assert.deepEqual(createDifficultyInitialValues("easy").map(card => card.boardIndex), [0, 2, 6, 8]);
assert.deepEqual(createDifficultyInitialValues("medium").map(card => card.boardIndex), [0, 2, 6, 8]);
assert.deepEqual(createDifficultyInitialValues("hard").map(card => card.boardIndex), [0, 2, 4, 6, 8]);

const startScreenSource = readFileSync("src/components/StartScreen.jsx", "utf8");
assert.doesNotMatch(startScreenSource, /随机探索|新手入门/);
assert.match(startScreenSource, /id: "easy", label: "简单"/);
assert.match(startScreenSource, /id: "medium", label: "中等"/);
assert.match(startScreenSource, /id: "hard", label: "困难"/);
assert.match(startScreenSource, /onClick=\{\(\) => startDifficulty\(difficulty\.id\)\}/);

console.log("difficulty opening tests passed");
