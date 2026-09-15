import { gcd } from "../utils/math";

export const FOOD_TYPES = Object.freeze({ LAND:"land", AQUATIC:"aquatic", VEGETABLE:"vegetable", GRAIN_BEAN:"grainBean", DAIRY_EGG:"dairyEgg", FRUIT:"fruit", SEASONING:"seasoning", SPICE:"spice", DRINK:"drink", MEAT:"land" });
export const BASE_FOOD_TYPES = Object.freeze([FOOD_TYPES.LAND,FOOD_TYPES.AQUATIC,FOOD_TYPES.VEGETABLE,FOOD_TYPES.GRAIN_BEAN,FOOD_TYPES.DAIRY_EGG,FOOD_TYPES.FRUIT,FOOD_TYPES.SEASONING,FOOD_TYPES.SPICE]);
export const FOOD_TYPE_META = Object.freeze({
  [FOOD_TYPES.LAND]:{group:"A",side:1}, [FOOD_TYPES.AQUATIC]:{group:"A",side:2},
  [FOOD_TYPES.VEGETABLE]:{group:"B",side:1}, [FOOD_TYPES.GRAIN_BEAN]:{group:"B",side:2},
  [FOOD_TYPES.DAIRY_EGG]:{group:"C",side:1}, [FOOD_TYPES.FRUIT]:{group:"C",side:2},
  [FOOD_TYPES.SEASONING]:{group:"D",side:1}, [FOOD_TYPES.SPICE]:{group:"D",side:2}
});
export const FOOD_PURITY=Object.freeze({PURE:"pure",MIXED:"mixed"});
export const SPECIAL_ONE_KINDS=Object.freeze({KEY:"key",FUNCTION:"function"});
export function canReduce(a,b){return gcd(a.value,b.value)>1;}
export function combineValue(a,b){return a+b;}
export function isNaturalDrinkValue(value){return Number.isFinite(value)&&value>101;}
export function isNormalFoodType(type){return BASE_FOOD_TYPES.includes(type);}
export function isDrinkFoodPair(a,b){return Boolean(a&&b&&(a.foodType===FOOD_TYPES.DRINK)!==(b.foodType===FOOD_TYPES.DRINK));}
export function flipFoodType(){return null;}
export function getDessertMutationFoodType(){return null;}

export function combineFoodPurity(front,back,resultFoodType){const result=resultFoodType;if(!result||result===FOOD_TYPES.DRINK)return null;return front.foodType===back.foodType&&result===front.foodType?FOOD_PURITY.PURE:FOOD_PURITY.MIXED;}
export function createSpecialOne(sourceTypeA,sourceTypeB){
  if(sourceTypeA==="meat")sourceTypeA=FOOD_TYPES.LAND;
  if(sourceTypeB==="meat")sourceTypeB=FOOD_TYPES.LAND;
  if(!isNormalFoodType(sourceTypeA)||!isNormalFoodType(sourceTypeB))return null;
  if(sourceTypeA===sourceTypeB)return {kind:SPECIAL_ONE_KINDS.KEY,keyType:sourceTypeA,sourceTypes:[sourceTypeA],identity:`key:${sourceTypeA}`};
  const sourceTypes=[sourceTypeA,sourceTypeB].sort();
  return {kind:SPECIAL_ONE_KINDS.FUNCTION,sourceTypes,identity:`function:${sourceTypes.join("+")}`};
}
export function canApplyFunctionOne(piece){return Boolean(piece&&piece.value>=2&&piece.value<101&&isNormalFoodType(piece.foodType)&&!piece.specialOne);}
export function canCombineRelation(a,b){return Boolean(a&&b);}
export function canCombine(a,b,numbers=[]){const aType=a?.foodType==="meat"?FOOD_TYPES.LAND:a?.foodType,bType=b?.foodType==="meat"?FOOD_TYPES.LAND:b?.foodType;return Boolean(!(aType===FOOD_TYPES.DRINK&&bType===FOOD_TYPES.DRINK)&&(numbers.length<9||isDrinkFoodPair(a,b))&&(isNormalFoodType(aType)||aType===FOOD_TYPES.DRINK)&&(isNormalFoodType(bType)||bType===FOOD_TYPES.DRINK));}
