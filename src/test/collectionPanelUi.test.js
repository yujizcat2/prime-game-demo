import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSaleSummary } from "../components/saleSummary";

const source = readFileSync("src/components/CollectionPanel.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");

const saleSummary = getSaleSummary([
  {value: 12, foodType: "land", salePointScore: 30},
  {value: 12, foodType: "land", salePointScore: 0},
  {value: 8, foodType: "aquatic", salePointScore: 15},
  {value: 20, foodType: "drink", salePointScore: 50}
]);

assert.deepEqual(saleSummary.land, {value: 24, score: 30});
assert.deepEqual(saleSummary.aquatic, {value: 8, score: 15});
assert.deepEqual(saleSummary.grainBean, {value: 0, score: 0});
assert.equal(Object.hasOwn(saleSummary, "drink"), false);
assert.equal(Object.keys(saleSummary).length, 8);

assert.doesNotMatch(source, />\s*已获得的料理包\s*</);
assert.doesNotMatch(source, /OBTAINED DISH PACKS/);
assert.doesNotMatch(source, /完成 \{completedCount\}/);
assert.match(source, /value,[\s\S]*foodType: type\.key/);
assert.match(source, /\{display\.name\} \{value\}/);
assert.match(source, /\{display\.typeLabel\}/);
assert.match(source, /\{display\.originText\}/);
assert.match(source, /getFoodOriginDescription\(piece, name\)/);
assert.doesNotMatch(appSource, /<Discovery/);
assert.match(source, /已售料理详情/);
assert.match(source, /collection\.map/);
assert.match(appSource, /cards=\{game\.collectionTimeline\}/);

console.log("Collection panel UI tests passed");
