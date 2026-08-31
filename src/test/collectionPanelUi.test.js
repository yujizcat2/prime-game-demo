import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/CollectionPanel.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");

assert.doesNotMatch(source, />\s*已获得的料理包\s*</);
assert.doesNotMatch(source, /OBTAINED DISH PACKS/);
assert.doesNotMatch(source, /完成 \{completedCount\}/);
assert.match(source, /aria-live="polite"/);
assert.match(source, /latestCollection\?\.reward/);
assert.match(source, /value,[\s\S]*foodType: type\.key/);
assert.match(source, /\{display\.name\} \{value\}/);
assert.match(source, /\{display\.typeLabel\}/);
assert.match(source, /\{display\.originText\}/);
assert.match(source, /getFoodOriginDescription\(piece, name\)/);
assert.doesNotMatch(appSource, /<Discovery/);
assert.match(source, /已获得的料理包详情/);
assert.match(source, /collection\.map/);

console.log("Collection panel UI tests passed");
