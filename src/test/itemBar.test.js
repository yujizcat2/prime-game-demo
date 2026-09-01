import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/ItemBar.jsx", "utf8");
const appSource = readFileSync("src/App.jsx", "utf8");
const hookSource = readFileSync("src/hooks/useGame.js", "utf8");
assert.match(source, /aria-label="道具栏"/);
assert.match(source, /name: "加热器"/);
assert.match(source, /costLabel: `¥\$\{heaterCost\}`/);
assert.doesNotMatch(source, /¥10\+/);
assert.match(source, /disabled: !heaterActive && !heaterAvailable/);
assert.match(source, /`取消\$\{item\.name\}`/);
assert.match(source, /name: "归味"/);
assert.match(source, /costLabel: `¥\$\{restoreCost\}`/);
assert.match(source, /disabled: !restoreActive && !restoreAvailable/);
assert.match(source, /item\.active \? "选择中"/);
assert.match(source, /选择一道料理进行加热/);
assert.match(source, /!heaterAvailable/);
assert.match(source, /disabled: !heaterActive && !heaterAvailable/);
assert.match(appSource, /if\(heaterSelectMode\)[\s\S]*setHeaterSelectMode\(false\)/);
assert.match(appSource, /if\(!game\.heaterAvailable\)/);
assert.match(appSource, /setHeaterSelectMode\(true\)/);
assert.match(appSource, /setRestoreSelectMode\(true\)/);
assert.match(hookSource, /getHeaterAvailability\(gameState\)/);
assert.match(hookSource, /heaterAvailable = heaterAvailability\.canEnter/);
assert.match(hookSource, /useRestoreOnCell/);

console.log("ItemBar tests passed");
