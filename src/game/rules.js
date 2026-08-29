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
export function isCrossing101(a,b){return a+b>101;}
export function combineValue(a,b){let value=a+b;while(value>101)value-=100;return value;}
export function isNormalFoodType(type){return BASE_FOOD_TYPES.includes(type);}
export function flipFoodType(){return null;}
export function getDessertMutationFoodType(){return null;}

// Ordered type rule shared by player and AI. resultFoodType is required only
// when exactly one input is a drink.
export function combineFoodType(front,back,resultFoodType=null){
  if(!front||!back||!front.foodType||!back.foodType)return null;
  const a=front.foodType==="meat"?FOOD_TYPES.LAND:front.foodType,b=back.foodType==="meat"?FOOD_TYPES.LAND:back.foodType;
  if(a===FOOD_TYPES.DRINK&&b===FOOD_TYPES.DRINK)return FOOD_TYPES.DRINK;
  if(a===FOOD_TYPES.DRINK||b===FOOD_TYPES.DRINK)return isNormalFoodType(resultFoodType)?resultFoodType:null;
  if(!isNormalFoodType(a)||!isNormalFoodType(b))return null;
  return isCrossing101(front.value,back.value)?FOOD_TYPES.DRINK:a;
}
export function combineFoodPurity(front,back,resultFoodType=null){const result=combineFoodType(front,back,resultFoodType);if(!result||result===FOOD_TYPES.DRINK)return null;return front.foodType===back.foodType&&result===front.foodType?FOOD_PURITY.PURE:FOOD_PURITY.MIXED;}
export function createSpecialOne(sourceTypeA,sourceTypeB){
  if(sourceTypeA==="meat")sourceTypeA=FOOD_TYPES.LAND;
  if(sourceTypeB==="meat")sourceTypeB=FOOD_TYPES.LAND;
  if(!isNormalFoodType(sourceTypeA)||!isNormalFoodType(sourceTypeB))return null;
  if(sourceTypeA===sourceTypeB)return {kind:SPECIAL_ONE_KINDS.KEY,keyType:sourceTypeA,sourceTypes:[sourceTypeA],identity:`key:${sourceTypeA}`};
  const sourceTypes=[sourceTypeA,sourceTypeB].sort();
  return {kind:SPECIAL_ONE_KINDS.FUNCTION,sourceTypes,identity:`function:${sourceTypes.join("+")}`};
}
export function canApplyFunctionOne(piece){return Boolean(piece&&piece.value>=2&&piece.value<101&&isNormalFoodType(piece.foodType)&&!piece.specialOne);}
export function isSameFoodIdentity(a,b){return Boolean(a&&b&&a.value===b.value&&a.foodType===b.foodType);}
export function hasParentFood(child,candidate){if(!child||!candidate)return false;if(Array.isArray(child.parentFoods))return child.parentFoods.some(parent=>isSameFoodIdentity(parent,candidate));return Array.isArray(child.parents)&&child.parents.includes(candidate.value);}
export function hasSameParents(numbers,a,b){return Array.isArray(numbers)&&numbers.some(item=>{if(Array.isArray(item.parentFoods)&&item.parentFoods.length>=2){const [p1,p2]=item.parentFoods;return isSameFoodIdentity(p1,a)&&isSameFoodIdentity(p2,b)||isSameFoodIdentity(p1,b)&&isSameFoodIdentity(p2,a);}if(!Array.isArray(item.parents)||item.parents.length<2)return false;const [p1,p2]=item.parents;return p1===a.value&&p2===b.value||p1===b.value&&p2===a.value;});}
export function canCombineRelation(a,b,numbers=[]){return Boolean(a&&b&&!hasParentFood(a,b)&&!hasParentFood(b,a)&&!hasSameParents(numbers,a,b));}
export function canCombine(a,b,numbers=[]){const aType=a?.foodType==="meat"?FOOD_TYPES.LAND:a?.foodType,bType=b?.foodType==="meat"?FOOD_TYPES.LAND:b?.foodType;return Boolean(numbers.length<9&&canCombineRelation(a,b,numbers)&&(isNormalFoodType(aType)||aType===FOOD_TYPES.DRINK)&&(isNormalFoodType(bType)||bType===FOOD_TYPES.DRINK));}
