import assert from "node:assert/strict";
import { createCombinePairKey, hasCombinePair } from "../game/combineHistory";
import { createGameState } from "../game/gameState";
import { applyAction, createCombineOutcome, resolveGameOver } from "../game/gameEngine";
import { canCombineCells, getLegalActions } from "../game/gameActions";
import { getActivityStatus } from "../game/activityStatus";
import { getActionStatus } from "../game/actionStatus";
import { FOOD_TYPES as T } from "../game/rules";
import { createSimulationState, getSimulationLegalActions, applySimulationAction } from "./simulationEngine";
import { getMergeHistory } from "../game/mergeHistory";
import { applyHeater } from "../game/heater";
import { applySuperHeater } from "../game/superHeater";

const piece=(value,foodType,extra={})=>({value,foodType,purity:"pure",parents:null,parentFoods:null,...extra});
const placed=(items)=>{
  const state=createGameState(items.map((item,index)=>({...item,boardIndex:index})));
  state.board=state.board.map((card,index)=>card?{...card,...items[index]}:null);
  return state;
};
const historyOf=(state,card)=>getMergeHistory(state.mergeHistoryByIdentity,card);

let heatedRegression=placed([
  piece(37,T.FRUIT,{id:3702}),
  piece(2,T.SPICE,{id:2002}),
  piece(11,T.LAND,{id:1102})
]);
heatedRegression=applyAction(heatedRegression,{type:"combine",indexes:[0,1]});
assert.equal(canCombineCells({...heatedRegression,gameOver:false},0,1),false,"37 + 2 is locked after its direct combination");
heatedRegression=applyHeater({...heatedRegression,gameOver:false,heaterCount:1},0);
assert.equal(heatedRegression.board[0].value,38,"ordinary heater reproduces 37 → 38");
assert.deepEqual(historyOf(heatedRegression,heatedRegression.board[0]),[],"ordinary heater reads history from the new 38 identity");
assert.equal(historyOf(heatedRegression,heatedRegression.board[1]).some(item=>item.value===38&&item.foodType===T.FRUIT),false,"2 has no direct relationship with the current 38 identity");
assert.equal(canCombineCells(heatedRegression,0,1),true,"38 + 2 is not blocked by the old 37 + 2 relationship");

let currentRelationship=placed([
  piece(38,T.FRUIT,{id:3802}),
  piece(2,T.SPICE,{id:2022}),
  piece(11,T.LAND,{id:1132})
]);
currentRelationship=applyAction(currentRelationship,{type:"combine",indexes:[0,1]});
assert.equal(canCombineCells({...currentRelationship,gameOver:false},0,1),false,"a real current 38 + 2 relationship is blocked");
assert.equal(historyOf(currentRelationship,currentRelationship.board[0]).some(item=>item.value===2&&item.foodType===T.SPICE&&item.role==="partner"),true,"38 detail shows its direct 2 relationship");
assert.equal(historyOf(currentRelationship,currentRelationship.board[1]).some(item=>item.value===38&&item.foodType===T.FRUIT&&item.role==="partner"),true,"2 detail shows its direct 38 relationship");

let superHeatedHistory=placed([
  piece(37,T.FRUIT,{id:3712}),
  piece(2,T.SPICE,{id:2012}),
  piece(11,T.LAND,{id:1112})
]);
superHeatedHistory=applyAction(superHeatedHistory,{type:"combine",indexes:[0,1]});
superHeatedHistory=applySuperHeater({...superHeatedHistory,gameOver:false,superHeaterCount:1});
assert.deepEqual(superHeatedHistory.board.slice(0,2).map(card=>card.value),[38,3],"super heater updates both current identities");
assert.deepEqual(historyOf(superHeatedHistory,superHeatedHistory.board[0]),[],"super heater does not retain the old 37 identity history");
assert.equal(canCombineCells(superHeatedHistory,0,1),true,"super-heated current identities are not blocked by the old pair");

let reducedHistory=placed([
  piece(74,T.FRUIT,{id:7412}),
  piece(4,T.SPICE,{id:4012}),
  piece(11,T.LAND,{id:1122})
]);
reducedHistory=applyAction(reducedHistory,{type:"combine",indexes:[0,1]});
reducedHistory=applyAction({...reducedHistory,gameOver:false},{type:"reduce",indexes:[0,1]});
assert.deepEqual(reducedHistory.board.slice(0,2).map(card=>card.value),[37,2],"reduction changes both current identities");
assert.deepEqual(historyOf(reducedHistory,reducedHistory.board[0]),[],"reduction reads history from the new current identity");
assert.equal(canCombineCells({...reducedHistory,gameOver:false},0,1),true,"reduced cards are not blocked by their old-number pair history");

const a=piece(12,T.VEGETABLE,{id:11,purity:"mixed",parents:[6,2]});
const b=piece(17,T.FRUIT,{id:22,purity:"pure",parents:[1,17]});
assert.equal(createCombinePairKey(a,b),createCombinePairKey(b,a),"A+B and B+A share a key");
assert.equal(createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.VEGETABLE)),"8:vegetable|8:vegetable");
assert.equal(createCombinePairKey({...a,id:1},{...b,id:2}),createCombinePairKey({...a,id:3},{...b,id:4}),"card ids do not affect the current value/type pair lock");
assert.notEqual(createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.FRUIT)),createCombinePairKey(piece(8,T.VEGETABLE),piece(8,T.VEGETABLE)),"food type is identity");

let state=placed([a,b,piece(7,T.LAND)]);
state=applyAction(state,{type:"combine",indexes:[0,1]});
assert.equal(state.combineHistory.length,1);
const firstKey=state.combineHistory[0].key;
state.board[0]=piece(12,T.VEGETABLE,{id:901,purity:"pure",parents:null});
state.board[1]=piece(17,T.FRUIT,{id:902,purity:"mixed",parents:[99]});
assert.equal(hasCombinePair(state.combineHistoryKeys,state.board[0],state.board[1]),true,"card ids, parents, and purity do not affect a current value/type pair lock");
assert.equal(canCombineCells({...state,gameOver:false},0,1),false,"formal predicate rejects a repeated current value/type pair");
assert.equal(getActionStatus(state.board.filter(Boolean),[901,902],state.combineHistoryKeys).combine.allowed,false,"UI status uses the same current identity-pair rule");
assert.equal(state.combineHistory[0].key,firstKey);

const fresh=placed([a,b,piece(7,T.LAND)]);
assert.deepEqual(fresh.combineHistory,[],"new game clears history");
assert.equal(canCombineCells(fresh,0,1),true);

let cardHistory=placed([piece(3,T.VEGETABLE,{id:301}),piece(7,T.DAIRY_EGG,{id:307}),piece(11,T.LAND,{id:311})]);
cardHistory=applyAction(cardHistory,{type:"combine",indexes:[0,1]});
assert.deepEqual(historyOf(cardHistory,cardHistory.board[0]).map(item=>item.value),[7,10],"first identity records its partner and the generated dish");
assert.deepEqual(historyOf(cardHistory,cardHistory.board[1]).map(item=>item.value),[3,10],"second identity records its partner and the generated dish");
assert.ok(historyOf(cardHistory,cardHistory.board[0]).every(item=>typeof item.name==="string"&&item.name.length>0),"names are captured when the relationship is created");
const generated=cardHistory.board.find(card=>card?.id===cardHistory.nextId-1);
assert.deepEqual(historyOf(cardHistory,cardHistory.board[0]).map(item=>item.role),["partner","result"],"parent history distinguishes partner and result roles");
assert.equal(historyOf(cardHistory,cardHistory.board[0])[1].foodType,generated?.foodType,"result history captures the generated food type");
assert.deepEqual(historyOf(cardHistory,generated).map(item=>item.value),[3,7],"generated identity records the direct relationship");
assert.ok(historyOf(cardHistory,generated).every(item=>item.role==="parent"),"generated identity marks both direct ingredients as parents");

const sameNumber=placed([piece(5,T.GRAIN_BEAN,{id:551}),piece(5,T.AQUATIC,{id:552}),piece(11,T.LAND)]);
assert.equal(canCombineCells(sameNumber,0,1),true,"the same number remains combinable across different food types");

let sameValueParents=placed([piece(3,T.VEGETABLE,{id:531}),piece(3,T.SEASONING,{id:532}),piece(11,T.LAND)]);
sameValueParents=applyAction(sameValueParents,{type:"combine",indexes:[0,1]});
const sameValueChild=sameValueParents.board.find(card=>card?.id===sameValueParents.nextId-1);
assert.deepEqual(
  historyOf(sameValueParents,sameValueChild).map(item=>[item.value,item.foodType,item.role]),
  [[3,T.VEGETABLE,"parent"],[3,T.SEASONING,"parent"]],
  "a child keeps same-value parents from different food types"
);
assert.ok(historyOf(sameValueParents,sameValueChild).every(item=>typeof item.name==="string"&&item.name.length>0),"both same-value parent names are captured");
assert.deepEqual(historyOf(sameValueParents,sameValueParents.board[0]).map(item=>[item.value,item.foodType]),[[3,T.SEASONING],[6,sameValueChild.foodType]],"first same-value identity records partner and result");
assert.deepEqual(historyOf(sameValueParents,sameValueParents.board[1]).map(item=>[item.value,item.foodType]),[[3,T.VEGETABLE],[6,sameValueChild.foodType]],"second same-value identity records partner and result");

const generatedTypeLocked=placed([piece(5,T.GRAIN_BEAN,{id:561}),piece(5,T.AQUATIC,{id:562}),piece(11,T.LAND)]);
const predicted=createCombineOutcome(generatedTypeLocked,0,1).foodType;
generatedTypeLocked.mergeHistoryByIdentity={"5:grainBean":[{value:2,foodType:predicted,name:"旧料理",role:"result"}]};
assert.equal(canCombineCells(generatedTypeLocked,0,1),true,"a result food type in unrelated history does not lock a fresh pair");

const accumulated={...cardHistory,gameOver:false,combineHistoryKeys:{},board:[...cardHistory.board]};
accumulated.board[2]=piece(11,T.LAND,{id:311});
const afterSecond=applyAction(accumulated,{type:"combine",indexes:[0,2]});
assert.deepEqual(historyOf(afterSecond,afterSecond.board[0]).map(item=>item.value),[7,10,11,14],"identity history accumulates direct partners and generated dishes");

const directOnly=placed([
  piece(2,T.FRUIT,{id:621,mergeHistory:[{value:13,foodType:T.AQUATIC,name:"青蟹"}]}),
  piece(7,T.SEASONING,{id:627,mergeHistory:[{value:17,foodType:T.AQUATIC,name:"鲑鱼"}]}),
  piece(11,T.LAND)
]);
const directOnlyResult=applyAction(directOnly,{type:"combine",indexes:[0,1]});
const directOnlyChild=directOnlyResult.board.find(card=>card?.id===directOnlyResult.nextId-1);
assert.deepEqual(historyOf(directOnlyResult,directOnlyChild).map(item=>item.value),[2,7],"a new identity records its two direct ingredients");
assert.equal(historyOf(directOnlyResult,directOnlyChild).some(item=>item.name==="青蟹"||item.name==="鲑鱼"),false,"parent histories do not propagate to a child identity");
assert.deepEqual(historyOf(directOnlyResult,directOnlyResult.board[0]).map(item=>item.value),[7,9],"card-local legacy history is not authoritative");

let reducedIdentity=placed([piece(12,T.GRAIN_BEAN,{id:1201}),piece(3,T.AQUATIC,{id:1202}),piece(11,T.LAND)]);
reducedIdentity.mergeHistoryByIdentity={
  "12:grainBean":[{value:99,foodType:T.FRUIT,name:"旧十二历史",role:"partner"}],
  "4:grainBean":[{value:5,foodType:T.VEGETABLE,name:"旧身份共享历史",role:"partner"}]
};
reducedIdentity=applyAction(reducedIdentity,{type:"reduce",indexes:[0,1]});
assert.equal(reducedIdentity.board[0].value,4);
assert.deepEqual(historyOf(reducedIdentity,reducedIdentity.board[0]).map(item=>item.name),["旧身份共享历史"],"reduction switches to the new current value/type identity history");
assert.equal(historyOf(reducedIdentity,reducedIdentity.board[0]).some(item=>item.name==="旧十二历史"),false,"reduction does not carry old-number history into the new identity");

const sharedIdentity=placed([piece(4,T.GRAIN_BEAN,{id:4101}),piece(4,T.GRAIN_BEAN,{id:4102}),piece(5,T.FRUIT,{id:5101})]);
sharedIdentity.mergeHistoryByIdentity={"4:grainBean":[{value:5,foodType:T.FRUIT,name:"直接搭档",role:"partner"}]};
assert.deepEqual(historyOf(sharedIdentity,sharedIdentity.board[0]),historyOf(sharedIdentity,sharedIdentity.board[1]),"same current value and food type share the same visible direct history");
assert.equal(canCombineCells(sharedIdentity,1,2),true,"visible detail history alone is not a hidden pair lock");

let existingResultIdentity=placed([piece(3,T.VEGETABLE),piece(7,T.DAIRY_EGG),piece(11,T.LAND)]);
const existingOutcome=createCombineOutcome(existingResultIdentity,0,1);
const existingKey=`${existingOutcome.value}:${existingOutcome.foodType}`;
existingResultIdentity.mergeHistoryByIdentity={[existingKey]:[{value:19,foodType:T.SPICE,name:"既有身份历史",role:"partner"}]};
existingResultIdentity=applyAction(existingResultIdentity,{type:"combine",indexes:[0,1]});
const existingChild=existingResultIdentity.board.find(card=>card?.id===existingResultIdentity.nextId-1);
assert.equal(historyOf(existingResultIdentity,existingChild)[0].name,"既有身份历史","generating an existing identity preserves its shared history");

const separatedTypes={...sharedIdentity,mergeHistoryByIdentity:{"4:grainBean":[{value:8,foodType:T.LAND,name:"谷物历史",role:"partner"}]}};
assert.deepEqual(historyOf(separatedTypes,piece(4,T.AQUATIC)),[],"the same value in a different food type does not share history");

let generations=placed([
  piece(2,T.LAND,{id:2001}),piece(3,T.VEGETABLE,{id:2002}),
  piece(7,T.FRUIT,{id:2003}),piece(13,T.SEASONING,{id:2004})
]);
generations=applyAction(generations,{type:"combine",indexes:[0,1]});
const childIndex=generations.board.findIndex(card=>card?.id===generations.nextId-1);
const child=generations.board[childIndex];
assert.equal(canCombineCells({...generations,gameOver:false},0,1),false,"the exact A+B card pair is locked after A+B→C");
assert.equal(canCombineCells({...generations,gameOver:false},childIndex,2),true,"new child C can combine with unrelated D");
generations.mergeHistoryByIdentity[`${child.value}:${child.foodType}`].push({value:7,foodType:T.AQUATIC,name:"同数字旧记录",role:"parent"});
assert.equal(canCombineCells({...generations,gameOver:false},childIndex,2),true,"a repeated value in unrelated C history does not lock C+D");
generations=applyAction({...generations,gameOver:false},{type:"combine",indexes:[childIndex,2]});
const grandchildIndex=generations.board.findIndex(card=>card?.id===generations.nextId-1);
assert.equal(canCombineCells({...generations,gameOver:false},grandchildIndex,3),true,"second-generation E inherits none of A/B/C/D locks");

const parentRelation=placed([
  piece(9,T.GRAIN_BEAN,{id:3001,parents:[2,7],parentFoods:[{value:2,foodType:T.LAND},{value:7,foodType:T.FRUIT}]}),
  piece(2,T.LAND,{id:3002}),piece(11,T.SPICE,{id:3003})
]);
assert.equal(canCombineCells(parentRelation,0,1),true,"parent metadata alone is not a pair lock");
assert.equal(getActionStatus(parentRelation.board.filter(Boolean),[3001,3002],parentRelation.combineHistoryKeys).combine.allowed,true,"UI does not treat parent metadata as a lock");

const consistency=placed([piece(4,T.VEGETABLE,{id:4001}),piece(6,T.FRUIT,{id:4002}),piece(11,T.LAND,{id:4003})]);
const simulation=createSimulationState([4,6,11]);
simulation.board=consistency.board.map(card=>card?{...card}:null);
simulation.combineHistoryKeys={...consistency.combineHistoryKeys};
assert.equal(canCombineCells(consistency,0,1),getLegalActions(consistency).some(action=>action.type==="combine"&&action.indexes.includes(0)&&action.indexes.includes(1)),"formal predicate and AI legal actions agree");
assert.equal(canCombineCells(consistency,0,1),getSimulationLegalActions(simulation).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),"formal predicate and Simulation/TestLab agree");

let samePair=placed([piece(8,T.VEGETABLE),piece(8,T.VEGETABLE),piece(7,T.LAND)]);
samePair=applyAction(samePair,{type:"combine",indexes:[0,1]});
assert.equal(samePair.combineHistory.length,1,"same value/type pair records once");
assert.equal(samePair.combineHistory[0].key,createCombinePairKey(samePair.combineHistory[0].left,samePair.combineHistory[0].right));

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
assert.equal(getSimulationLegalActions(sim).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),false,"simulation locks the exact card pair");
sim.board[0]=piece(12,T.VEGETABLE,{id:700,purity:"mixed"});
sim.board[1]=piece(17,T.FRUIT,{id:701,parents:[4]});
assert.equal(getSimulationLegalActions(sim).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),false,"simulation shares the current value/type history lock");
assert.equal(applySimulationAction(sim,{type:"combine",indexes:[1,0]}),false);

const sameValueSim=createSimulationState([3,3,11]);
sameValueSim.board[0].foodType=T.VEGETABLE;
sameValueSim.board[1].foodType=T.SEASONING;
assert.equal(applySimulationAction(sameValueSim,{type:"combine",indexes:[0,1]}),true);
const sameValueSimChild=sameValueSim.board.find(card=>card?.value===6&&card?.parents);
assert.deepEqual(historyOf(sameValueSim,sameValueSimChild).map(item=>[item.value,item.foodType]),[[3,T.VEGETABLE],[3,T.SEASONING]],"simulation keeps both same-value, different-type parents");
assert.deepEqual(historyOf(sameValueSim,sameValueSim.board[0]).map(item=>[item.value,item.foodType]),[[3,T.SEASONING],[6,sameValueSimChild.foodType]],"simulation records the full direct triangle");

console.log("combine history tests passed");
