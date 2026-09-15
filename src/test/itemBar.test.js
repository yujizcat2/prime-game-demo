import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/ItemBar.jsx", "utf8");
const appSource = fs.readFileSync("src/App.jsx", "utf8");
const actionSource = fs.readFileSync("src/components/ActionButtons.jsx", "utf8");
const actionCss = fs.readFileSync("src/components/ActionButtons.css", "utf8");

assert.match(source, /name: "加热器"[\s\S]*count: heaterCount/);
assert.match(source, /name: "超级加热器"[\s\S]*count: superHeaterCount/);
assert.match(source, /name: "交换"[\s\S]*count: swapUsesRemaining/);
assert.match(source, /×\{item\.count\}/);
assert.match(actionSource, />售出 \/ 处理</);
assert.match(actionSource, /selected\.length === 1 && canSellSelected/);
assert.match(actionSource, /selected\.length === 2[\s\S]*preview\?\.reduce/);
assert.doesNotMatch(actionSource, /冰箱|onFridge|onSwap/);
assert.match(actionCss, /grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\)/);
assert.match(actionSource, /\{itemEntry\}/);
assert.equal((appSource.match(/<ItemBar/g) ?? []).length, 1, "the item system has one compact main-action entry");
assert.equal(source.includes(String.fromCodePoint(165)), false);
assert.equal(appSource.includes(String.fromCodePoint(165)), false);
console.log("item bar UI tests passed");
