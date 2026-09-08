const NORMAL_FOOD_TYPES = Object.freeze([
  "land",
  "aquatic",
  "vegetable",
  "grainBean",
  "dairyEgg",
  "fruit",
  "seasoning",
  "spice"
]);

const COMBINATIONS = Object.freeze({
  "aquatic|land": "seasoning",
  "land|vegetable": "grainBean",
  "grainBean|land": "dairyEgg",
  "dairyEgg|land": "spice",
  "fruit|land": "vegetable",
  "land|seasoning": "aquatic",
  "land|spice": "fruit",
  "aquatic|vegetable": "spice",
  "aquatic|grainBean": "seasoning",
  "aquatic|dairyEgg": "fruit",
  "aquatic|fruit": "grainBean",
  "aquatic|seasoning": "vegetable",
  "aquatic|spice": "dairyEgg",
  "grainBean|vegetable": "fruit",
  "dairyEgg|vegetable": "seasoning",
  "fruit|vegetable": "spice",
  "seasoning|vegetable": "dairyEgg",
  "spice|vegetable": "aquatic",
  "dairyEgg|grainBean": "vegetable",
  "fruit|grainBean": "aquatic",
  "grainBean|seasoning": "spice",
  "grainBean|spice": "land",
  "dairyEgg|fruit": "seasoning",
  "dairyEgg|seasoning": "land",
  "dairyEgg|spice": "grainBean",
  "fruit|seasoning": "land",
  "fruit|spice": "dairyEgg",
  "seasoning|spice": "vegetable"
});

function normalizeFoodType(foodType){
  return foodType === "meat" ? "land" : foodType;
}

export function getCombinedFoodType(typeA,typeB){
  const a=normalizeFoodType(typeA),b=normalizeFoodType(typeB);
  if(!NORMAL_FOOD_TYPES.includes(a)||!NORMAL_FOOD_TYPES.includes(b))return null;
  if(a===b)return a;
  return COMBINATIONS[[a,b].sort().join("|")]??null;
}

