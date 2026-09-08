import assert from "node:assert/strict";
import { applyAction, createCombineOutcome, createGameState } from "../game/gameEngine";
import { createEightPalaceInitialValues, createStandardInitialValues } from "../game/initialValues";
import { BOARD_NATIVE_FOOD_TYPES, getFoodTypeForPosition } from "../game/nativeFoodTypes";
import { FOOD_TYPES as T } from "../game/rules";
import { applySimulationAction, createSimulationState } from "./simulationEngine";

assert.equal(getFoodTypeForPosition(4),T.DRINK);

for(const opening of [createStandardInitialValues(()=>0.25),createEightPalaceInitialValues()]){
  const state=createGameState(opening.map(card=>({...card,gameMode:"eightPalace"})));
  for(const card of opening){
    assert.equal(card.boardIndex,BOARD_NATIVE_FOOD_TYPES.indexOf(card.foodType));
    assert.equal(state.board[card.boardIndex].foodType,getFoodTypeForPosition(card.boardIndex));
  }
  assert.equal(state.board[4],null,"center starts empty");
}

function stateWithOnlyPositionEmpty(targetIndex,leftType=T.LAND,rightType=T.AQUATIC){
  const inputIndexes=[0,1].includes(targetIndex)?[2,3]:[0,1];
  const cards=BOARD_NATIVE_FOOD_TYPES.flatMap((foodType,index)=>index===targetIndex?[]:[{
    value:index===inputIndexes[0]?7:index===inputIndexes[1]?11:20+index,
    foodType,
    boardIndex:index,
    gameMode:"eightPalace"
  }]);
  const state=createGameState(cards);
  const board=[...state.board];
  board[inputIndexes[0]]={...board[inputIndexes[0]],foodType:leftType};
  board[inputIndexes[1]]={...board[inputIndexes[1]],foodType:rightType};
  return [{...state,board,gameOver:false},inputIndexes];
}

for(const [targetIndex,expectedValue,expectedType] of [
  [0,18,T.LAND],
  [6,18,T.FRUIT],
  [4,118,T.DRINK]
]){
  const [state,indexes]=stateWithOnlyPositionEmpty(targetIndex);
  const forward=createCombineOutcome(state,...indexes);
  const reverse=createCombineOutcome(state,...[...indexes].reverse());
  assert.equal(forward.targetIndex,targetIndex);
  assert.equal(forward.value,expectedValue);
  assert.equal(forward.foodType,expectedType);
  assert.deepEqual([reverse.targetIndex,reverse.value,reverse.foodType],[targetIndex,expectedValue,expectedType]);
  const created=applyAction(state,{type:"combine",indexes}).board[targetIndex];
  assert.deepEqual([created.value,created.foodType],[expectedValue,expectedType]);
  if(targetIndex===4)assert.equal(created.drinkOriginValue,118,"center bonus is applied exactly once");
}

for(const parentTypes of [[T.LAND,T.AQUATIC],[T.FRUIT,T.SPICE],[T.VEGETABLE,T.VEGETABLE]]){
  const [state,indexes]=stateWithOnlyPositionEmpty(6,...parentTypes);
  assert.equal(createCombineOutcome(state,...indexes).foodType,T.FRUIT,"parent types do not decide result type");
}

const simulation=createSimulationState([7,11,13],"eightPalace");
simulation.board=BOARD_NATIVE_FOOD_TYPES.map((foodType,index)=>index===4?null:{value:index<2?[7,11][index]:20+index,foodType});
assert.equal(applySimulationAction(simulation,{type:"combine",indexes:[0,1]}),true);
assert.deepEqual([simulation.board[4].value,simulation.board[4].foodType],[118,T.DRINK]);

console.log("position food type tests passed");
