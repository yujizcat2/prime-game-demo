import assert from "node:assert/strict";
import { getCombinedFoodType } from "../game/foodTypeCombination";
import { applyAction, createCombineOutcome, createGameState } from "../game/gameEngine";
import { getCombineDurationMinutes } from "../game/actionDuration";
import { BASE_FOOD_TYPES, FOOD_TYPES as T } from "../game/rules";

for(const a of BASE_FOOD_TYPES){
  for(const b of BASE_FOOD_TYPES){
    const forward=getCombinedFoodType(a,b);
    const reverse=getCombinedFoodType(b,a);
    assert.equal(forward,reverse,`${a} + ${b} must be symmetric`);
    if(a===b)assert.equal(forward,a,`${a} + ${a} must stay ${a}`);
    else{
      assert.notEqual(forward,a,`${a} + ${b} must not return ${a}`);
      assert.notEqual(forward,b,`${a} + ${b} must not return ${b}`);
    }
  }
}

for(const [a,b,result] of [
  [T.LAND,T.AQUATIC,T.SEASONING],
  [T.LAND,T.VEGETABLE,T.GRAIN_BEAN],
  [T.AQUATIC,T.SPICE,T.DAIRY_EGG],
  [T.GRAIN_BEAN,T.SPICE,T.LAND]
]){
  assert.equal(getCombinedFoodType(a,b),result);
  assert.equal(getCombinedFoodType(b,a),result);
}

assert.equal(getCombinedFoodType(T.LAND,T.LAND),T.LAND);
assert.equal(getCombinedFoodType(T.FRUIT,T.FRUIT),T.FRUIT);
assert.equal(getCombinedFoodType(T.DRINK,T.LAND),null,"drink is handled by its existing caller rule");

function combinationState(){
  const state=createGameState([
    {value:7,foodType:T.LAND,boardIndex:0,gameMode:"eightPalace"},
    {value:11,foodType:T.AQUATIC,boardIndex:1,gameMode:"eightPalace"}
  ]);
  return {...state,gameOver:false,totalActionMinutes:35};
}

for(const indexes of [[0,1],[1,0]]){
  const before=combinationState();
  const outcome=createCombineOutcome(before,...indexes);
  const after=applyAction(before,{type:"combine",indexes});
  const created=after.board.find(piece=>piece?.id===before.nextId);
  assert.equal(outcome.value,18);
  assert.equal(outcome.foodType,T.SEASONING);
  assert.equal(created.value,18);
  assert.equal(created.foodType,T.SEASONING);
  assert.equal(outcome.piece.bornAt,35);
  assert.equal(created.bornAt,35+getCombineDurationMinutes(7,11));
  assert.deepEqual(created.parents,indexes.map(index=>before.board[index].value));
  assert.deepEqual(created.parentFoods,indexes.map(index=>({value:before.board[index].value,foodType:before.board[index].foodType,purity:before.board[index].purity??null})));
}

console.log("food type combination tests passed");
