import assert from "node:assert/strict";
import { applyAction, createCombineOutcome, createGameState, getLegalCombineActions } from "../game/gameEngine";
import { createEightPalaceInitialValues, createStandardInitialValues } from "../game/initialValues";
import { BOARD_NATIVE_FOOD_TYPES, getFoodTypeForPosition } from "../game/nativeFoodTypes";
import { FOOD_TYPES as T } from "../game/rules";
import { applySimulationAction, createSimulationState, getSimulationLegalActions } from "./simulationEngine";

assert.equal(getFoodTypeForPosition(4),null,"center has no fixed cuisine");
for(const opening of [createStandardInitialValues(()=>0.25),createEightPalaceInitialValues()]){
  const state=createGameState(opening.map(card=>({...card,gameMode:"eightPalace"})));
  for(const card of opening)assert.equal(state.board[card.boardIndex].foodType,card.foodType);
}
assert.equal(createGameState(createEightPalaceInitialValues()).board[4],null,"center starts empty");

function stateWithOnlyPositionEmpty(targetIndex,left={value:7,foodType:T.LAND},right={value:11,foodType:T.AQUATIC}){
  const inputIndexes=[0,1].includes(targetIndex)?[2,3]:[0,1];
  const cards=BOARD_NATIVE_FOOD_TYPES.flatMap((positionType,index)=>index===targetIndex?[]:[{
    value:index===inputIndexes[0]?left.value:index===inputIndexes[1]?right.value:20+index,
    foodType:index===inputIndexes[0]?left.foodType:index===inputIndexes[1]?right.foodType:positionType??T.SEASONING,
    boardIndex:index,
    gameMode:"eightPalace"
  }]);
  return [createGameState(cards),inputIndexes];
}

{
  const [state,indexes]=stateWithOnlyPositionEmpty(6);
  for(const ordered of [indexes,[...indexes].reverse()]){
    const outcome=createCombineOutcome(state,...ordered);
    assert.deepEqual([outcome.value,outcome.foodType,outcome.targetIndex],[18,T.FRUIT,6]);
  }
  const created=applyAction(state,{type:"combine",indexes}).board[6];
  assert.deepEqual([created.value,created.foodType],[18,T.FRUIT]);
}

{
  const [state,indexes]=stateWithOnlyPositionEmpty(4,{value:5,foodType:T.LAND},{value:7,foodType:T.FRUIT});
  const forward=createCombineOutcome(state,...indexes),reverse=createCombineOutcome(state,...[...indexes].reverse());
  assert.deepEqual([forward.value,forward.foodType],[12,T.LAND]);
  assert.deepEqual([reverse.value,reverse.foodType],[12,T.FRUIT]);
  const ordered=getLegalCombineActions(state).filter(action=>action.indexes.includes(indexes[0])&&action.indexes.includes(indexes[1]));
  assert.deepEqual(ordered.map(action=>action.indexes),[indexes,[...indexes].reverse()]);
}

for(const targetIndex of [4,6]){
  const [state,indexes]=stateWithOnlyPositionEmpty(targetIndex,{value:60,foodType:T.LAND},{value:58,foodType:T.FRUIT});
  for(const ordered of [indexes,[...indexes].reverse()]){
    const outcome=createCombineOutcome(state,...ordered);
    assert.deepEqual([outcome.value,outcome.foodType],[118,T.DRINK]);
    assert.equal(outcome.piece.drinkOriginValue,118);
  }
  const created=applyAction(state,{type:"combine",indexes}).board[targetIndex];
  assert.equal(created.foodType,T.DRINK);
  assert.ok(!(created.value>101&&created.foodType!==T.DRINK));
}

{
  const simulation=createSimulationState([5,7,13],"eightPalace");
  simulation.board=BOARD_NATIVE_FOOD_TYPES.map((positionType,index)=>index===4?null:{value:index===0?5:index===1?7:20+index,foodType:index===0?T.LAND:index===1?T.FRUIT:positionType});
  const actions=getSimulationLegalActions(simulation).filter(action=>action.type==="combine"&&action.indexes.includes(0)&&action.indexes.includes(1));
  assert.deepEqual(actions.map(action=>action.indexes),[[0,1],[1,0]]);
  const forward=structuredClone(simulation),reverse=structuredClone(simulation);
  assert.equal(applySimulationAction(forward,{type:"combine",indexes:[0,1]}),true);
  assert.equal(applySimulationAction(reverse,{type:"combine",indexes:[1,0]}),true);
  assert.deepEqual([forward.board[4].value,forward.board[4].foodType],[12,T.LAND]);
  assert.deepEqual([reverse.board[4].value,reverse.board[4].foodType],[12,T.FRUIT]);
}

console.log("position food type tests passed");
