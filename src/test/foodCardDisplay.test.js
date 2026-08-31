import assert from "node:assert/strict";
import {
  getFoodCardDisplayName,
  getFoodCardTypeLabel,
  getFoodOriginDescription
} from "../components/foodCardDisplay";
import { getFoodTypeShortName } from "../data/food/foodRegistry";

const native = {value: 7, foodType: "dairyEgg"};
const nativeName = getFoodCardDisplayName(native);
assert.equal(getFoodCardTypeLabel(native), getFoodTypeShortName("dairyEgg"));
assert.equal(getFoodOriginDescription(native), `一种原生的${nativeName}`);

const reduced = {
  value: 8,
  foodType: "dairyEgg",
  origin: {type: "reduce", parent: {value: 24, foodType: "dairyEgg"}}
};
const reducedName = getFoodCardDisplayName(reduced);
assert.match(getFoodOriginDescription(reduced), new RegExp(`^一种由.+处理而来的${reducedName}$`));

const combined = {
  value: 12,
  foodType: "vegetable",
  parentFoods: [
    {value: 5, foodType: "vegetable"},
    {value: 7, foodType: "vegetable"}
  ]
};
const combinedName = getFoodCardDisplayName(combined);
assert.match(getFoodOriginDescription(combined), new RegExp(`^一种由.+与.+制成的${combinedName}$`));

console.log("Food card display tests passed");
