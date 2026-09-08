import assert from "node:assert/strict";
import { applyAction, canSwapCells, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { areOrthogonallyAdjacent } from "../game/boardRules";
import { SWAP_DURATION_MINUTES } from "../game/actionDuration";
import { FOOD_TYPES as T } from "../game/rules";
import { applySimulationAction, createSimulationState, getSimulationLegalActions } from "./simulationEngine";

const origin={type:"reduce",parent:{value:34,foodType:T.LAND}};
function stateWith(cards){
  return {...createGameState(cards.map(card=>({...card,gameMode:"eightPalace"})),{dayCycleEnabled:true}),gameOver:false,dayMinutesElapsed:40,totalActionMinutes:70};
}

assert.equal(SWAP_DURATION_MINUTES,15);
assert.equal(areOrthogonallyAdjacent(0,1),true);
assert.equal(areOrthogonallyAdjacent(0,3),true);
assert.equal(areOrthogonallyAdjacent(0,4),false);
assert.equal(areOrthogonallyAdjacent(0,8),false);

for(const indexes of [[0,1],[0,3]]){
  const before=stateWith([
    {id:101,value:17,foodType:T.LAND,boardIndex:indexes[0],origin},
    {id:102,value:23,foodType:T.AQUATIC,boardIndex:indexes[1]}
  ]);
  const left=before.board[indexes[0]],right=before.board[indexes[1]];
  const after=applyAction(before,{type:"swap",indexes});
  assert.deepEqual(after.board[indexes[0]],right);
  assert.deepEqual(after.board[indexes[1]],left);
  assert.equal(after.totalActionMinutes,85);
  assert.equal(after.dayMinutesElapsed,55);
}

const cardAndEmpty=stateWith([{id:201,value:18,foodType:T.FRUIT,boardIndex:3,origin}]);
const moved=applyAction(cardAndEmpty,{type:"swap",indexes:[3,4]});
assert.equal(moved,cardAndEmpty,"card and empty cannot swap");
assert.equal(moved.totalActionMinutes,70);

const centerSwap=stateWith([
  {id:301,value:18,foodType:T.FRUIT,boardIndex:3},
  {id:302,value:118,foodType:T.DRINK,boardIndex:4}
]);
const movedIntoCenter=applyAction(centerSwap,{type:"swap",indexes:[3,4]});
assert.deepEqual([movedIntoCenter.board[4].value,movedIntoCenter.board[4].foodType],[18,T.FRUIT],"swap into center does not trigger birth effects");
assert.deepEqual([movedIntoCenter.board[3].value,movedIntoCenter.board[3].foodType],[118,T.DRINK],"drink leaving center stays unchanged");

const twoEmpty=stateWith([{value:9,foodType:T.LAND,boardIndex:8}]);
assert.equal(canSwapCells(twoEmpty,0,1),false);
assert.equal(applyAction(twoEmpty,{type:"swap",indexes:[0,1]}),twoEmpty);
assert.equal(applyAction(twoEmpty,{type:"swap",indexes:[0,4]}),twoEmpty);
assert.equal(twoEmpty.totalActionMinutes,70);
assert.equal(getLegalActions(cardAndEmpty).some(action=>action.type==="swap"),false);
assert.equal(resolveGameOver({...cardAndEmpty,gameOver:false,heaterCount:0,superHeaterCount:0}).gameOver,true);

const simulation=createSimulationState([7,11,13],"eightPalace");
const simulationCard=simulation.board[0];
const simulationOther=simulation.board[1];
assert.ok(getSimulationLegalActions(simulation).some(action=>action.type==="swap"));
assert.equal(getSimulationLegalActions(simulation).some(action=>action.type==="swap"&&action.indexes.join("-")==="0-3"),false);
assert.equal(applySimulationAction(simulation,{type:"swap",indexes:[0,1]}),true);
assert.deepEqual(simulation.board[1],simulationCard);
assert.deepEqual(simulation.board[0],simulationOther);
assert.equal(simulation.totalActionMinutes,15);

function fourCardState(cValue=5,dValue=7){
  return stateWith([
    {id:401,value:17,foodType:T.LAND,boardIndex:0},
    {id:402,value:23,foodType:T.AQUATIC,boardIndex:1},
    {id:403,value:cValue,foodType:T.FRUIT,boardIndex:3},
    {id:404,value:dValue,foodType:T.SPICE,boardIndex:4}
  ]);
}

{
  const before=fourCardState();
  const lockedIds=[before.board[0].id,before.board[1].id].sort((a,b)=>a-b);
  const once=applyAction(before,{type:"swap",indexes:[0,1]});
  assert.deepEqual(once.lastSwappedCardIds,lockedIds);
  for(const indexes of [[0,1],[1,0]]){
    assert.equal(canSwapCells(once,...indexes),false);
    const rejected=applyAction(once,{type:"swap",indexes});
    assert.equal(rejected,once);
    assert.equal(rejected.totalActionMinutes,once.totalActionMinutes,"blocked return costs no time");
  }
  assert.equal(getLegalActions(once).some(action=>action.type==="swap"&&action.indexes.includes(0)&&action.indexes.includes(1)),false);

  const afterIllegal=applyAction(once,{type:"swap",indexes:[0,4]});
  assert.equal(afterIllegal,once,"an illegal action neither applies nor clears the lock");
  assert.equal(canSwapCells(afterIllegal,0,1),false);

  const afterCombine=applyAction(once,{type:"combine",indexes:[3,4]});
  assert.equal(afterCombine.lastSwappedCardIds,null);
  assert.equal(canSwapCells(afterCombine,0,1),true,"a successful combine clears the lock");
}

{
  const once=applyAction(fourCardState(6,9),{type:"swap",indexes:[0,1]});
  const afterReduce=applyAction(once,{type:"reduce",indexes:[3,4]});
  assert.equal(afterReduce.lastSwappedCardIds,null);
  assert.equal(canSwapCells(afterReduce,0,1),true,"a successful reduce clears the lock");
}

{
  const once=applyAction(fourCardState(),{type:"swap",indexes:[0,1]});
  const otherIds=[once.board[3].id,once.board[4].id].sort((a,b)=>a-b);
  const otherSwap=applyAction(once,{type:"swap",indexes:[3,4]});
  assert.deepEqual(otherSwap.lastSwappedCardIds,otherIds);
  assert.equal(canSwapCells(otherSwap,0,1),true,"another pair swap replaces the lock");
}

{
  const once=applyAction(fourCardState(),{type:"swap",indexes:[0,1]});
  const replacement={...once,board:[...once.board]};
  replacement.board[0]={...replacement.board[0],id:501};
  replacement.board[1]={...replacement.board[1],id:502};
  assert.equal(canSwapCells(replacement,0,1),true,"the lock follows card ids rather than cell indexes");
}

{
  const lockedSimulation=createSimulationState([7,11,13],"eightPalace");
  assert.equal(applySimulationAction(lockedSimulation,{type:"swap",indexes:[0,1]}),true);
  assert.equal(applySimulationAction(lockedSimulation,{type:"swap",indexes:[1,0]}),false);
  assert.equal(getSimulationLegalActions(lockedSimulation).some(action=>action.type==="swap"&&action.indexes.includes(0)&&action.indexes.includes(1)),false);
  assert.equal(lockedSimulation.totalActionMinutes,15);
}

console.log("swap tests passed");
