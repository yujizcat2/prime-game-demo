import assert from "node:assert/strict";
import { createCombinePairKey, hasCombinePair } from "../game/combineHistory";
import { createGameState } from "../game/gameState";
import { applyAction, resolveGameOver } from "../game/gameEngine";
import { canCombineCells, getLegalActions } from "../game/gameActions";
import { getActivityStatus } from "../game/activityStatus";
import { getActionStatus } from "../game/actionStatus";
import { FOOD_TYPES as T } from "../game/rules";
import { createSimulationState, getSimulationLegalActions, applySimulationAction } from "./simulationEngine";

const piece=(value,foodType,extra={})=>({value,foodType,purity:"pure",parents:null,parentFoods:null,...extra});
const placed=(items)=>{
  const state=createGameState(items.map((item,index)=>({...item,boardIndex:index})));
  state.board=state.board.map((card,index)=>card?{...card,...items[index]}:null);
  return state;
};

const a=piece(12,T.VEGETABLE,{id:11,purity:"mixed",parents:[6,2]});
const b=piece(17,T.FRUIT,{id:22,purity:"pure",parents:[1,17]});
assert.equal(createCombinePairKey(a,b),createCombinePairKey(b,a),"A+B and B+A share a key");
assert.equal(createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.VEGETABLE)),"8:vegetable|8:vegetable");
assert.notEqual(createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.FRUIT)),createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.VEGETABLE)),"food type is identity");

let state=placed([a,b,piece(7,T.LAND)]);
state=applyAction(state,{type:"combine_ordered",indexes:[0,1]});
assert.equal(state.combineHistory.length,1);
const firstKey=state.combineHistory[0].key;
state.board[0]=piece(12,T.VEGETABLE,{id:901,purity:"pure",parents:null});
state.board[1]=piece(17,T.FRUIT,{id:902,purity:"mixed",parents:[99]});
assert.equal(hasCombinePair(state.combineHistoryKeys,state.board[0],state.board[1]),true,"id/parents/purity do not affect lock");
assert.equal(canCombineCells({...state,gameOver:false},0,1),false,"preview/formal predicate rejects repeated identities");
assert.equal(getActionStatus(state.board.filter(Boolean),[901,902],state.combineHistoryKeys).combine.reason,"这组料理本局已经搭配过");
assert.equal(applyAction({...state,gameOver:false},{type:"combine_ordered",indexes:[1,0]}).combineHistory.length,1,"failed retry does not append history");
assert.equal(state.combineHistory[0].key,firstKey);

const fresh=placed([a,b,piece(7,T.LAND)]);
assert.deepEqual(fresh.combineHistory,[],"new game clears history");
assert.equal(canCombineCells(fresh,0,1),true);

let samePair=placed([piece(8,T.VEGETABLE),piece(8,T.VEGETABLE),piece(7,T.LAND)]);
samePair=applyAction(samePair,{type:"combine",indexes:[0,1]});
assert.equal(samePair.combineHistory.length,1,"same value/type pair records once");
assert.equal(samePair.combineHistory[0].key,"8:vegetable|8:vegetable");

const lockedAll=placed([piece(2,T.LAND),piece(3,T.VEGETABLE),piece(5,T.FRUIT)]);
for(const [i,j] of [[0,1],[0,2],[1,2]])lockedAll.combineHistoryKeys[createCombinePairKey(lockedAll.board[i],lockedAll.board[j])]=true;
assert.equal(getLegalActions(lockedAll).filter(action=>action.type==="combine").length,0,"history-locked routes are not legal combine actions");
assert.equal(resolveGameOver(lockedAll).gameOver,false,"daily items can rescue a board with no legal combinations");
const activity=getActivityStatus(lockedAll.board.filter(Boolean),0,0,lockedAll.combineHistoryKeys);
assert.equal(activity.combineLegal,0);
assert.equal(activity.combinePotential,3,"locked routes remain potential relations");

const sim=createSimulationState([12,17,7]);
sim.board[0].foodType=T.VEGETABLE; sim.board[1].foodType=T.FRUIT;
assert.equal(applySimulationAction(sim,{type:"combine_ordered",indexes:[0,1]}),true);
sim.board[0]=piece(12,T.VEGETABLE,{id:700,purity:"mixed"});
sim.board[1]=piece(17,T.FRUIT,{id:701,parents:[4]});
assert.equal(getSimulationLegalActions(sim).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),false,"simulation shares history lock");
assert.equal(applySimulationAction(sim,{type:"combine_ordered",indexes:[1,0]}),false);

console.log("combine history tests passed");
