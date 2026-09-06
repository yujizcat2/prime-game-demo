import assert from "node:assert/strict";
import {
  applyAction,
  createCombineOutcome,
  createGameState,
  getLegalActions
} from "../game/gameEngine";
import { FOOD_TYPES as T } from "../game/rules";
import {
  applySimulationAction,
  cloneSimulationState,
  createSimulationState,
  getSimulationLegalActions
} from "./simulationEngine";

function positionedState(cards){
  const state=createGameState(cards.map(card=>({...card,gameMode:"eightPalace"})));
  return {...state,gameOver:false};
}

function absorptionState(){
  return positionedState([
    {
      value:117,
      foodType:T.DRINK,
      boardIndex:1,
      origin:{type:"reduce",parent:{value:234,foodType:T.AQUATIC}}
    },
    {
      value:23,
      foodType:T.AQUATIC,
      boardIndex:7,
      origin:{type:"reduce",parent:{value:46,foodType:T.AQUATIC}}
    }
  ]);
}

for(const indexes of [[1,7],[7,1]]){
  const before=absorptionState();
  const drinkBefore=before.board[1];
  const foodBefore=before.board[7];
  const outcome=createCombineOutcome(before,...indexes);
  const after=applyAction(before,{type:"combine",indexes});

  assert.equal(outcome.kind,"absorb");
  assert.equal(outcome.targetIndex,1);
  assert.equal(after.board[1].id,drinkBefore.id);
  assert.equal(after.board[1].value,140);
  assert.equal(after.board[1].foodType,T.DRINK);
  assert.equal(after.board[1].drinkOriginValue,117);
  assert.deepEqual(after.board[1].drinkIngredients,[{value:23,foodType:T.AQUATIC}]);
  assert.deepEqual(after.board[1].origin,drinkBefore.origin);
  assert.equal(after.board[7].id,foodBefore.id);
  assert.equal(after.board[7].value,foodBefore.value);
  assert.equal(after.board[7].foodType,foodBefore.foodType);
  assert.deepEqual(after.board[7].origin,foodBefore.origin);
  assert.equal(after.board.filter(Boolean).length,2);
  assert.equal(after.nextId,before.nextId);
  assert.equal(after.steps,before.steps+1);
}

const after23=applyAction(absorptionState(),{type:"combine",indexes:[1,7]});
function withFresh23(foodType){
  const board=[...after23.board];
  board[6]={id:306,value:23,foodType,origin:{type:"reduce",parent:{value:69,foodType}}};
  return {...after23,board,gameOver:false,combineHistoryKeys:{}};
}
for(const foodType of [T.AQUATIC,T.GRAIN_BEAN]){
  const repeated=withFresh23(foodType);
  assert.equal(createCombineOutcome(repeated,1,6),null);
  assert.equal(getLegalActions(repeated).some(action=>action.type.startsWith("combine")&&action.indexes.includes(1)&&action.indexes.includes(6)),false);
  assert.equal(applyAction(repeated,{type:"combine",indexes:[1,6]}),repeated);
}

const before31={...after23,gameOver:false,board:[...after23.board]};
before31.board[6]={id:331,value:31,foodType:T.GRAIN_BEAN,origin:{type:"reduce",parent:{value:62,foodType:T.GRAIN_BEAN}}};
const food31Before=before31.board[6];
const after31=applyAction(before31,{type:"combine",indexes:[6,1]});
assert.equal(after31.board[1].value,171);
assert.equal(after31.board[1].drinkOriginValue,117);
assert.deepEqual(after31.board[1].drinkIngredients,[
  {value:23,foodType:T.AQUATIC},
  {value:31,foodType:T.GRAIN_BEAN}
]);
assert.deepEqual(after31.board[6],food31Before);

const newSameValue=positionedState([
  {value:171,foodType:T.DRINK,boardIndex:1},
  {value:23,foodType:T.SEASONING,boardIndex:7}
]);
assert.equal(newSameValue.board[1].drinkOriginValue,171);
assert.deepEqual(newSameValue.board[1].drinkIngredients,[]);
const newSameValueAfter=applyAction(newSameValue,{type:"combine",indexes:[1,7]});
assert.equal(newSameValueAfter.board[1].value,194);
assert.deepEqual(newSameValueAfter.board[1].drinkIngredients,[{value:23,foodType:T.SEASONING}]);

const normalState=positionedState([
  {value:19,foodType:T.LAND,boardIndex:1},
  {value:23,foodType:T.AQUATIC,boardIndex:7}
]);
const normalOutcome=createCombineOutcome(normalState,1,7);
const normalAfter=applyAction(normalState,{type:"combine_ordered",indexes:[1,7]});
assert.equal(normalOutcome.kind,"new");
assert.equal(normalAfter.board.filter(Boolean).length,3);
assert.equal(normalAfter.board[0].value,42);

const drinksState=positionedState([
  {value:117,foodType:T.DRINK,boardIndex:1},
  {value:23,foodType:T.DRINK,boardIndex:7}
]);
assert.equal(createCombineOutcome(drinksState,1,7),null);
assert.equal(getLegalActions(drinksState).some(action=>action.type.startsWith("combine")),false);
assert.equal(applyAction(drinksState,{type:"combine",indexes:[1,7]}),drinksState);

const fullState=absorptionState();
for(let index=0;index<fullState.board.length;index++){
  if(!fullState.board[index])fullState.board[index]={id:1000+index,value:31+index,foodType:T.FRUIT};
}
assert.equal(getLegalActions(fullState).some(action=>action.type.startsWith("combine")&&action.indexes.includes(1)&&action.indexes.includes(7)),true);
const fullAfter=applyAction(fullState,{type:"combine",indexes:[7,1]});
assert.equal(fullAfter.board[1].value,140);
assert.equal(fullAfter.board[7].value,23);
assert.equal(fullAfter.board.filter(Boolean).length,9);

const simulation=createSimulationState([117,23,31],"eightPalace");
simulation.board[0].foodType=T.DRINK;
simulation.board[1].foodType=T.AQUATIC;
simulation.board[2].foodType=T.GRAIN_BEAN;
assert.equal(applySimulationAction(simulation,{type:"combine",indexes:[1,0]}),true);
assert.deepEqual(simulation.board[0].drinkIngredients,[{value:23,foodType:T.AQUATIC}]);
simulation.board[3]={id:403,value:23,foodType:T.SEASONING};
simulation.combineHistoryKeys={};
assert.equal(getSimulationLegalActions(simulation).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(3)),false);
assert.equal(getSimulationLegalActions(simulation).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(2)),true);
assert.equal(applySimulationAction(simulation,{type:"combine",indexes:[0,2]}),true);
assert.deepEqual(simulation.board[0].drinkIngredients,[
  {value:23,foodType:T.AQUATIC},
  {value:31,foodType:T.GRAIN_BEAN}
]);
assert.deepEqual(cloneSimulationState(simulation).board[0].drinkIngredients,simulation.board[0].drinkIngredients);

console.log("drink combine tests passed");
