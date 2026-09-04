import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/ItemBar.jsx", "utf8");
const appSource = fs.readFileSync("src/App.jsx", "utf8");

assert.match(source, /name: "加热器"[\s\S]*count: heaterCount/);
assert.match(source, /name: "归味"[\s\S]*count: restoreCount/);
assert.match(source, /name: "超级加热器"[\s\S]*count: superHeaterCount/);
assert.match(source, /×\{item\.count\}/);
assert.equal(source.includes(String.fromCodePoint(165)), false);
assert.equal(appSource.includes(String.fromCodePoint(165)), false);
console.log("item bar UI tests passed");
