import assert from "node:assert/strict";
import { applyAction, canSwapCells, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { areOrthogonallyAdjacent } from "../game/boardRules";
import { SWAP_DURATION_MINUTES } from "../game/actionDuration";
import { advanceToNextDay } from "../game/dayCycle";
import { FOOD_TYPES as T } from "../game/rules";
import { applySimulationAction, createSimulationState, getSimulationLegalActions } from "./simulationEngine";

function stateWith(cards){
  return {...createGameState(cards.map(card=>({...card,gameMode:"eightPalace"})),{dayCycleEnabled:true}),gameOver:false,dayMinutesElapsed:40,totalActionMinutes:70};
}

const cards=[
  {id:101,value:17,foodType:T.LAND,boardIndex:0},
  {id:102,value:23,foodType:T.AQUATIC,boardIndex:1},
  {id:103,value:29,foodType:T.FRUIT,boardIndex:3},
  {id:104,value:31,foodType:T.SPICE,boardIndex:4}
];

assert.equal(SWAP_DURATION_MINUTES,15);
assert.equal(stateWith(cards).swapUsesRemaining,5,"Day 1 starts with five swaps");
assert.equal(areOrthogonallyAdjacent(0,1),true);
assert.equal(areOrthogonallyAdjacent(0,3),true);
assert.equal(areOrthogonallyAdjacent(0,4),false);

const before=stateWith(cards);
const originalLeftId=before.board[0].id;
const originalRightId=before.board[1].id;
const once=applyAction(before,{type:"swap",indexes:[0,1]});
assert.equal(once.swapUsesRemaining,4);
assert.equal(once.totalActionMinutes,85);
assert.equal(once.dayMinutesElapsed,55);
assert.equal(once.board[0].id,originalRightId);

for(const indexes of [[0,0],[0,4],[0,2]]){
  const rejected=applyAction(once,{type:"swap",indexes});
  assert.equal(rejected,once,"illegal swap is a no-op");
  assert.equal(rejected.swapUsesRemaining,4);
  assert.equal(rejected.totalActionMinutes,85);
}

const returned=applyAction(once,{type:"swap",indexes:[1,0]});
assert.equal(returned.swapUsesRemaining,3,"immediate return is legal and costs another use");
assert.equal(returned.totalActionMinutes,100);
assert.equal(returned.board[0].id,originalLeftId);

let exhausted=stateWith(cards);
for(let count=0;count<5;count++)exhausted=applyAction(exhausted,{type:"swap",indexes:[0,1]});
assert.equal(exhausted.swapUsesRemaining,0);
assert.equal(exhausted.totalActionMinutes,145);
assert.equal(getLegalActions(exhausted).some(action=>action.type==="swap"),false);
assert.equal(applyAction(exhausted,{type:"swap",indexes:[0,1]}),exhausted,"sixth daily swap cannot execute");

const nextDay=advanceToNextDay({...exhausted,daySettlement:{passed:true,nextTimeSalePeriods:[]}});
assert.equal(nextDay.swapUsesRemaining,5,"next day restores swaps");

const cardAndEmpty=stateWith([{value:18,foodType:T.FRUIT,boardIndex:3}]);
assert.equal(canSwapCells(cardAndEmpty,3,4),false);
assert.equal(getLegalActions(cardAndEmpty).some(action=>action.type.startsWith("fridge_")),false);
assert.equal(resolveGameOver({...cardAndEmpty,heaterCount:0,superHeaterCount:0}).gameOver,true,"removed fridge cannot keep game alive");

const simulation=createSimulationState([7,11,13],"eightPalace");
assert.equal(simulation.swapUsesRemaining,5);
assert.ok(getSimulationLegalActions(simulation).some(action=>action.type==="swap"));
for(let count=0;count<5;count++)assert.equal(applySimulationAction(simulation,{type:"swap",indexes:[0,1]}),true);
assert.equal(simulation.swapUsesRemaining,0);
assert.equal(simulation.totalActionMinutes,75);
assert.equal(applySimulationAction(simulation,{type:"swap",indexes:[1,0]}),false);
assert.equal(getSimulationLegalActions(simulation).some(action=>action.type==="swap"),false);
assert.equal(getSimulationLegalActions(simulation).some(action=>action.type.startsWith("fridge_")),false);

console.log("swap tests passed");
