import assert from "node:assert/strict";
import { createCombinePairKey, hasCombinePair } from "../game/combineHistory";
import { createGameState } from "../game/gameState";
import { applyAction, createCombineOutcome, resolveGameOver } from "../game/gameEngine";
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
state=applyAction(state,{type:"combine",indexes:[0,1]});
assert.equal(state.combineHistory.length,1);
const firstKey=state.combineHistory[0].key;
state.board[0]=piece(12,T.VEGETABLE,{id:901,purity:"pure",parents:null});
state.board[1]=piece(17,T.FRUIT,{id:902,purity:"mixed",parents:[99]});
assert.equal(hasCombinePair(state.combineHistoryKeys,state.board[0],state.board[1]),true,"id/parents/purity do not affect lock");
assert.equal(canCombineCells({...state,gameOver:false},0,1),false,"preview/formal predicate rejects repeated identities");
assert.equal(getActionStatus(state.board.filter(Boolean),[901,902],state.combineHistoryKeys).combine.reason,"这组料理本局已经搭配过");
assert.equal(applyAction({...state,gameOver:false},{type:"combine",indexes:[1,0]}).combineHistory.length,1,"failed retry does not append history");
assert.equal(state.combineHistory[0].key,firstKey);

const fresh=placed([a,b,piece(7,T.LAND)]);
assert.deepEqual(fresh.combineHistory,[],"new game clears history");
assert.equal(canCombineCells(fresh,0,1),true);

let cardHistory=placed([piece(3,T.VEGETABLE,{id:301}),piece(7,T.DAIRY_EGG,{id:307}),piece(11,T.LAND,{id:311})]);
cardHistory=applyAction(cardHistory,{type:"combine",indexes:[0,1]});
assert.deepEqual(cardHistory.board[0].mergeHistory.map(item=>item.value),[7,10],"first parent records its partner and the generated dish");
assert.deepEqual(cardHistory.board[1].mergeHistory.map(item=>item.value),[3,10],"second parent records its partner and the generated dish");
assert.ok(cardHistory.board[0].mergeHistory.every(item=>typeof item.name==="string"&&item.name.length>0),"names are captured when the relationship is created");
const generated=cardHistory.board.find(card=>card?.id===cardHistory.nextId-1);
assert.deepEqual(cardHistory.board[0].mergeHistory.map(item=>item.role),["partner","result"],"parent history distinguishes partner and result roles");
assert.equal(cardHistory.board[0].mergeHistory[1].foodType,generated?.foodType,"result history captures the generated food type");
assert.deepEqual(generated.mergeHistory.map(item=>item.value),[3,7],"generated card inherits the relationship history");
assert.ok(generated.mergeHistory.every(item=>item.role==="parent"),"generated card marks both direct ingredients as parents");

const sameNumber=placed([piece(5,T.GRAIN_BEAN,{id:551}),piece(5,T.AQUATIC,{id:552}),piece(11,T.LAND)]);
assert.equal(canCombineCells(sameNumber,0,1),true,"the same number remains combinable across different food types");

let sameValueParents=placed([piece(3,T.VEGETABLE,{id:531}),piece(3,T.SEASONING,{id:532}),piece(11,T.LAND)]);
sameValueParents=applyAction(sameValueParents,{type:"combine",indexes:[0,1]});
const sameValueChild=sameValueParents.board.find(card=>card?.id===sameValueParents.nextId-1);
assert.deepEqual(
  sameValueChild.mergeHistory.map(item=>[item.value,item.foodType,item.role]),
  [[3,T.VEGETABLE,"parent"],[3,T.SEASONING,"parent"]],
  "a child keeps same-value parents from different food types"
);
assert.ok(sameValueChild.mergeHistory.every(item=>typeof item.name==="string"&&item.name.length>0),"both same-value parent names are captured");
assert.deepEqual(sameValueParents.board[0].mergeHistory.map(item=>[item.value,item.foodType]),[[3,T.SEASONING],[6,sameValueChild.foodType]],"first same-value parent records partner and result");
assert.deepEqual(sameValueParents.board[1].mergeHistory.map(item=>[item.value,item.foodType]),[[3,T.VEGETABLE],[6,sameValueChild.foodType]],"second same-value parent records partner and result");

const generatedTypeLocked=placed([piece(5,T.GRAIN_BEAN,{id:561}),piece(5,T.AQUATIC,{id:562}),piece(11,T.LAND)]);
const predicted=createCombineOutcome(generatedTypeLocked,0,1).foodType;
generatedTypeLocked.board[0].mergeHistory=[{value:2,foodType:predicted,name:"旧料理",role:"result"}];
assert.equal(canCombineCells(generatedTypeLocked,0,1),false,"a card cannot reuse a food type previously generated by its combinations");
generatedTypeLocked.board[0].mergeHistory=[{value:2,foodType:predicted,name:"旧搭档",role:"partner"}];
assert.equal(canCombineCells(generatedTypeLocked,0,1),true,"partner food types do not trigger the generated-type lock");

const accumulated={...cardHistory,gameOver:false,combineHistoryKeys:{},board:[...cardHistory.board]};
accumulated.board[2]=piece(11,T.LAND,{id:311});
const afterSecond=applyAction(accumulated,{type:"combine",indexes:[0,2]});
assert.deepEqual(afterSecond.board[0].mergeHistory.map(item=>item.value),[7,10,11,14],"parent history accumulates direct partners and generated dishes");

const directOnly=placed([
  piece(2,T.FRUIT,{id:621,mergeHistory:[{value:13,foodType:T.AQUATIC,name:"青蟹"}]}),
  piece(7,T.SEASONING,{id:627,mergeHistory:[{value:17,foodType:T.AQUATIC,name:"鲑鱼"}]}),
  piece(11,T.LAND)
]);
const directOnlyResult=applyAction(directOnly,{type:"combine",indexes:[0,1]});
const directOnlyChild=directOnlyResult.board.find(card=>card?.id===directOnlyResult.nextId-1);
assert.deepEqual(directOnlyChild.mergeHistory.map(item=>item.value),[2,7],"a new card only records its two direct ingredients");
assert.equal(directOnlyChild.mergeHistory.some(item=>item.name==="青蟹"||item.name==="鲑鱼"),false,"parent histories do not propagate to a child");
assert.deepEqual(directOnlyResult.board[0].mergeHistory.map(item=>item.value),[13,7,9],"the parent keeps its history and appends the direct partner and generated dish");

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
assert.equal(applySimulationAction(sim,{type:"combine",indexes:[0,1]}),true);
sim.board[0]=piece(12,T.VEGETABLE,{id:700,purity:"mixed"});
sim.board[1]=piece(17,T.FRUIT,{id:701,parents:[4]});
assert.equal(getSimulationLegalActions(sim).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),false,"simulation shares history lock");
assert.equal(applySimulationAction(sim,{type:"combine",indexes:[1,0]}),false);

const sameValueSim=createSimulationState([3,3,11]);
sameValueSim.board[0].foodType=T.VEGETABLE;
sameValueSim.board[1].foodType=T.SEASONING;
assert.equal(applySimulationAction(sameValueSim,{type:"combine",indexes:[0,1]}),true);
const sameValueSimChild=sameValueSim.board.find(card=>card?.value===6&&card?.parents);
assert.deepEqual(sameValueSimChild.mergeHistory.map(item=>[item.value,item.foodType]),[[3,T.VEGETABLE],[3,T.SEASONING]],"simulation keeps both same-value, different-type parents");
assert.deepEqual(sameValueSim.board[0].mergeHistory.map(item=>[item.value,item.foodType]),[[3,T.SEASONING],[6,sameValueSimChild.foodType]],"simulation records the full direct triangle");

console.log("combine history tests passed");
