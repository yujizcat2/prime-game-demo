import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/CollectionPanel.jsx", "utf8");

assert.doesNotMatch(source, />\s*已获得的料理包\s*</);
assert.doesNotMatch(source, /OBTAINED DISH PACKS/);
assert.doesNotMatch(source, /完成 \{completedCount\}/);
assert.match(source, /aria-live="polite"/);
assert.match(source, /latestCollection\?\.reward/);
assert.match(source, /\{value, foodType: type\.key\}/);
assert.match(source, /已获得的料理包详情/);
assert.match(source, /collection\.map/);

console.log("Collection panel UI tests passed");
