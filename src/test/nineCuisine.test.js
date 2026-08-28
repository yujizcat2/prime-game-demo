import assert from "node:assert/strict";
import { BASE_FOOD_TYPES, FOOD_TYPES as T, combineFoodType, combineValue } from "../game/rules";
import { DRINK_DATA } from "../data/ingredients/drinkData";
import { LAND_DATA } from "../data/ingredients/landData";
import { AQUATIC_DATA } from "../data/ingredients/aquaticData";
import { VEGETABLE_DATA } from "../data/ingredients/vegetableData";
import { GRAIN_BEAN_DATA } from "../data/ingredients/grainBeanData";
import { DAIRY_EGG_DATA } from "../data/ingredients/dairyEggData";
import { FRUIT_DATA } from "../data/ingredients/fruitData";
import { SEASONING_DATA } from "../data/ingredients/seasoningData";
import { SPICE_DATA } from "../data/ingredients/spiceData";
import { createGameState } from "../game/gameState";
import { applyCollection } from "../game/collectionRules";

const p=(foodType,value=10)=>({foodType,value});
const cases=[
 [T.LAND,T.VEGETABLE,T.DAIRY_EGG],[T.AQUATIC,T.GRAIN_BEAN,T.DAIRY_EGG],[T.LAND,T.GRAIN_BEAN,T.FRUIT],[T.AQUATIC,T.VEGETABLE,T.FRUIT],
 [T.VEGETABLE,T.DAIRY_EGG,T.SEASONING],[T.VEGETABLE,T.FRUIT,T.SPICE],[T.DAIRY_EGG,T.SEASONING,T.LAND],[T.DAIRY_EGG,T.SPICE,T.AQUATIC],
 [T.SEASONING,T.LAND,T.VEGETABLE],[T.SEASONING,T.AQUATIC,T.GRAIN_BEAN],
 [T.AQUATIC,T.AQUATIC,T.LAND],[T.LAND,T.AQUATIC,T.AQUATIC],[T.SPICE,T.SPICE,T.SEASONING],
 [T.LAND,T.DAIRY_EGG,T.VEGETABLE],[T.LAND,T.FRUIT,T.SPICE],[T.VEGETABLE,T.SEASONING,T.DAIRY_EGG],[T.VEGETABLE,T.SPICE,T.AQUATIC]
];
for(const [a,b,result] of cases){assert.equal(combineFoodType(p(a),p(b)),result);assert.equal(combineFoodType(p(b),p(a)),result);}
assert.equal(combineFoodType(p(T.LAND,58),p(T.VEGETABLE,67)),T.DRINK);
assert.equal(combineValue(58,67),25);
assert.equal(combineFoodType(p(T.LAND,50),p(T.VEGETABLE,51)),T.DAIRY_EGG);
assert.equal(combineFoodType(p(T.LAND,50),p(T.VEGETABLE,52)),T.DRINK);
assert.equal(combineFoodType(p(T.DRINK),p(T.LAND)),T.AQUATIC);
assert.equal(combineFoodType(p(T.DRINK),p(T.AQUATIC)),T.LAND);
assert.equal(combineFoodType(p(T.DRINK),p(T.DRINK)),T.DRINK);
assert.equal(Object.keys(DRINK_DATA).length,100);
const baseNames=new Set([LAND_DATA,AQUATIC_DATA,VEGETABLE_DATA,GRAIN_BEAN_DATA,DAIRY_EGG_DATA,FRUIT_DATA,SEASONING_DATA,SPICE_DATA].flatMap(data=>Object.values(data)));
assert.deepEqual(Object.entries(DRINK_DATA).filter(([,name])=>baseNames.has(name)),[],"drink names must not duplicate frozen base names");
for(let i=0;i<100;i++){const state=createGameState([2,3,4]);const types=state.board.filter(Boolean).map(x=>x.foodType);assert.equal(new Set(types).size,3);assert.ok(types.every(type=>BASE_FOOD_TYPES.includes(type)));}
const collectionState=createGameState([2,3,4]);
const collected={value:1,foodType:T.DRINK,origin:{type:"reduce",parent:{value:7,foodType:T.DRINK,parents:[3,4],parentFoods:[p(T.LAND,3),p(T.VEGETABLE,4)],origin:null,crossed101:false}}};
const once=applyCollection(collectionState,collected);
const twice=applyCollection(once,collected);
assert.equal(twice.collectionTimeline.length,2);
assert.equal(twice.collectionTimeline[0].value,7);
assert.equal(twice.collectionTimeline[0].name,DRINK_DATA[7]);
console.log("nine cuisine tests passed");
