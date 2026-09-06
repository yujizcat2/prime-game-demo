import assert from "node:assert/strict";
import {
  getFoodCardDisplayName,
  getFoodCardDisplayValue,
  getFoodCardTypeLabel,
  getFoodOriginDescription
} from "../components/foodCardDisplay";
import { getFoodName, getFoodTypeShortName } from "../data/food/foodRegistry";
import { FOOD_TYPES } from "../game/rules";

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

for(const [stage, reducePreview] of [
  ["unselected", null],
  ["first selected", null],
  ["two selected before confirmation", {value: 1, foodType: "land"}]
]){
  assert.equal(getFoodCardDisplayValue(reduced, reducePreview), 8, `${stage} keeps the real card value`);
}

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

const drink={value:117,foodType:FOOD_TYPES.DRINK,drinkOriginValue:117,drinkIngredients:[]};
assert.equal(
  getFoodOriginDescription(drink),
  `原生：${getFoodName(117,FOOD_TYPES.DRINK)}（117）`
);
const grownDrink={
  ...drink,
  value:171,
  drinkIngredients:[
    {value:23,foodType:FOOD_TYPES.AQUATIC},
    {value:31,foodType:FOOD_TYPES.GRAIN_BEAN}
  ]
};
assert.equal(
  getFoodOriginDescription(grownDrink),
  `原生：${getFoodName(117,FOOD_TYPES.DRINK)}（117） · ${getFoodName(23,FOOD_TYPES.AQUATIC)}（23） · ${getFoodName(31,FOOD_TYPES.GRAIN_BEAN)}（31）`
);

console.log("Food card display tests passed");
