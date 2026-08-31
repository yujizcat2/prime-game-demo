import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/ItemBar.jsx", "utf8");
assert.match(source, /aria-label="道具栏"/);
assert.match(source, /name: "加热器"/);
assert.match(source, /cost: heaterCost/);
assert.match(source, /disabled: !heaterActive && !heaterAvailable/);
assert.match(source, /item\.active \? "取消加热"/);
assert.match(source, /item\.active \? "选择中"/);
assert.match(source, /选择一道料理进行加热/);
assert.match(source, /money < heaterCost/);

console.log("ItemBar tests passed");
