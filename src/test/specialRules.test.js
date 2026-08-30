import assert from "node:assert/strict";
import { applyAction, createCombineOutcome, createCombinedPiece, createGameState, createReduceOutcome, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { FOOD_TYPES as T, createSpecialOne } from "../game/rules";
import { createMazeStateKey } from "../game/mazeHistory";
import { createSimulationState, getSimulationLegalActions, applySimulationAction, cloneSimulationState } from "./simulationEngine";
import { createCombinationPairKey } from "../game/actionFatigue";
import { getSpecialOneDisplayName } from "../data/specialOneRegistry";
import { getDrinkName } from "../data/ingredients/drinkData";
import { getNextSelectionIndexes } from "../game/selection";

const stateWith=(pieces)=>{const seed=createGameState(pieces.map((piece,index)=>({...piece,boardIndex:index})));return {...seed,gameOver:false,board:[...seed.board]};};
const combine=(a,b)=>applyAction({...stateWith([a,b]),gameMode:"classic"},{type:"combine_ordered",indexes:[0,1]});

assert.equal(combine({value:64,foodType:T.DAIRY_EGG},{value:25,foodType:T.FRUIT}).board[2].foodType,T.DAIRY_EGG);
assert.equal(applyAction({...stateWith([{value:64,foodType:T.DAIRY_EGG},{value:25,foodType:T.FRUIT}]),gameMode:"classic"},{type:"combine_ordered",indexes:[1,0]}).board[2].foodType,T.FRUIT);
const orderedState={...stateWith([{value:12,foodType:T.LAND},{value:7,foodType:T.VEGETABLE}]),gameMode:"eightPalace"};
const mainFirst=createCombinedPiece(orderedState,0,1),pairingFirst=createCombinedPiece(orderedState,1,0);
assert.equal(mainFirst.value,pairingFirst.value);assert.equal(mainFirst.foodType,T.LAND);assert.equal(pairingFirst.foodType,T.VEGETABLE);
assert.deepEqual(mainFirst.parents,[12,7]);assert.deepEqual(mainFirst.parentFoods.map(parent=>parent.foodType),[T.LAND,T.VEGETABLE]);
const committedOrdered=applyAction(orderedState,{type:"combine_ordered",indexes:[0,1]}).board[2];
for(const field of ["value","foodType","purity","crossed101"])assert.deepEqual(committedOrdered[field],mainFirst[field]);
assert.deepEqual(committedOrdered.parents,mainFirst.parents);assert.deepEqual(committedOrdered.parentFoods,mainFirst.parentFoods);assert.deepEqual(committedOrdered.origin,mainFirst.origin);
let selection=getNextSelectionIndexes([],0);selection=getNextSelectionIndexes(selection,1);selection=getNextSelectionIndexes(selection,2);assert.deepEqual(selection,[0,2]);assert.deepEqual(getNextSelectionIndexes(selection,0),[]);
assert.equal(combine({value:64,foodType:T.LAND},{value:37,foodType:T.FRUIT}).board[2].foodType,T.LAND);
const crossed=combine({value:64,foodType:T.LAND},{value:38,foodType:T.FRUIT}); assert.equal(crossed.board[2].value,102); assert.equal(crossed.board[2].foodType,T.DRINK);
assert.equal(combine({value:101,foodType:T.LAND},{value:101,foodType:T.FRUIT}).board[2].value,202);
const drinkPair=stateWith([{value:120,foodType:T.DRINK},{value:180,foodType:T.DRINK}]);assert.equal(getLegalActions(drinkPair).some(action=>action.type.startsWith("combine")||action.type==="reduce"),false);
assert.notEqual(getDrinkName(120),"120");assert.notEqual(getDrinkName(202),"202");

assert.equal(getSpecialOneDisplayName({foodType:T.LAND,specialOne:createSpecialOne(T.LAND,T.FRUIT)}),"肉汁");
assert.equal(getSpecialOneDisplayName({foodType:T.FRUIT,specialOne:createSpecialOne(T.LAND,T.FRUIT)}),"果汁");
assert.equal(getSpecialOneDisplayName({foodType:T.SPICE,specialOne:createSpecialOne(T.LAND,T.SPICE)}),"香汁");
assert.equal(getSpecialOneDisplayName({foodType:T.LAND,specialOne:createSpecialOne(T.LAND,T.LAND)}),"纯肉汁");
assert.equal(getSpecialOneDisplayName({foodType:T.FRUIT,specialOne:createSpecialOne(T.FRUIT,T.FRUIT)}),"纯果汁");

const reduced=applyAction(stateWith([{value:6,foodType:T.AQUATIC},{value:3,foodType:T.LAND},{value:37,foodType:T.AQUATIC}]),{type:"reduce",indexes:[0,1]});
assert.equal(reduced.board[1],null); assert.equal(Object.values(reduced.eightPalaceKeys).filter(Boolean).length,0);
assert.equal(getLegalActions({...reduced,gameOver:false}).some(action=>action.type==="apply_one"),false);
assert.deepEqual(createSpecialOne(T.LAND,T.FRUIT),createSpecialOne(T.FRUIT,T.LAND));

const actionState={...stateWith([{value:10,foodType:T.LAND},{value:20,foodType:T.FRUIT}]),gameMode:"classic"};
assert.equal(getLegalActions(actionState).filter(a=>a.type==="combine_ordered").length,2);
const drinkActions=getLegalActions(stateWith([{value:10,foodType:T.DRINK},{value:20,foodType:T.FRUIT}]));assert.deepEqual(drinkActions.filter(a=>a.type.startsWith("combine")&&a.indexes.includes(0)&&a.indexes.includes(1)),[{type:"combine",indexes:[0,1]}]);assert.equal(drinkActions.some(a=>a.type==="combine_drink_convert"),false);
const keyStateA=stateWith([{value:1,foodType:T.LAND}]),keyStateB=stateWith([{value:1,foodType:T.LAND}]);keyStateA.board[0].specialOne=createSpecialOne(T.LAND,T.LAND);keyStateB.board[0].specialOne=createSpecialOne(T.LAND,T.FRUIT);assert.notEqual(createMazeStateKey(keyStateA),createMazeStateKey(keyStateB));

const sim=createSimulationState([10,20,30]);sim.board[0].foodType=T.LAND;sim.board[1].foodType=T.FRUIT;assert.equal(getSimulationLegalActions(sim).filter(a=>a.type==="combine_ordered"&&a.indexes.includes(0)&&a.indexes.includes(1)).length,2);const simAction=getSimulationLegalActions(sim).find(a=>a.type==="combine_ordered"&&a.indexes[0]===1&&a.indexes[1]===0);assert.equal(applySimulationAction(sim,simAction),true);assert.equal(sim.board.find(p=>p?.value===30&&p.parents)?.foodType,T.FRUIT);
const simDrink=createSimulationState([120,2,7]);simDrink.board[0].foodType=T.DRINK;simDrink.board[1].foodType=T.LAND;assert.equal(applySimulationAction(simDrink,{type:"combine",indexes:[0,1]}),true);assert.equal(simDrink.board.filter(Boolean).length,2);assert.equal(simDrink.board[0].value,122);assert.equal(simDrink.board[0].foodType,T.DRINK);

const pairState=stateWith([{value:89,foodType:T.AQUATIC},{value:6,foodType:T.FRUIT}]);
assert.equal(getLegalActions(pairState).some(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)),true);
const pairUsed=applyAction(pairState,{type:"combine_ordered",indexes:[0,1]});
assert.deepEqual(pairUsed.usedCombinationPairs,["6-89"]);
pairUsed.board[3]={id:103,value:89,foodType:T.LAND};pairUsed.board[4]={id:104,value:6,foodType:T.DAIRY_EGG};pairUsed.board[5]={id:105,value:7,foodType:T.SPICE};
assert.equal(getLegalActions({...pairUsed,gameOver:false}).some(action=>action.type.startsWith("combine")&&action.indexes.includes(3)&&action.indexes.includes(4)),false);
assert.equal(applyAction({...pairUsed,gameOver:false},{type:"combine_ordered",indexes:[4,3]}).usedCombinationPairs.length,1);
assert.equal(getLegalActions({...pairUsed,gameOver:false}).some(action=>action.type.startsWith("combine")&&action.indexes.includes(3)&&action.indexes.includes(5)),true);
const copiedPairState={...pairUsed,board:[...pairUsed.board]};assert.deepEqual(copiedPairState.usedCombinationPairs,[createCombinationPairKey(89,6)]);
assert.notEqual(createMazeStateKey(pairState),createMazeStateKey({...pairState,usedCombinationPairs:["6-89"]}));
const reduceAfterUsed=stateWith([{value:6,foodType:T.LAND},{value:12,foodType:T.FRUIT}]);reduceAfterUsed.usedCombinationPairs=[createCombinationPairKey(6,12)];
assert.equal(getLegalActions(reduceAfterUsed).some(action=>action.type==="reduce"&&action.indexes.includes(0)&&action.indexes.includes(1)),true);
assert.deepEqual(createGameState([{value:89,foodType:T.LAND,boardIndex:0},{value:6,foodType:T.FRUIT,boardIndex:1}]).usedCombinationPairs,[]);

const simPair=createSimulationState([89,6,7]);assert.equal(applySimulationAction(simPair,{type:"combine",indexes:[0,1]}),true);simPair.board[4]={value:89,foodType:T.LAND};simPair.board[5]={value:6,foodType:T.DAIRY_EGG};
assert.equal(getSimulationLegalActions(simPair).some(action=>action.type.startsWith("combine")&&action.indexes.includes(4)&&action.indexes.includes(5)),false);
assert.deepEqual(cloneSimulationState(simPair).usedCombinationPairs,["6-89"]);

const eightStateWith=(pieces)=>{const state=createGameState(pieces.map((piece,index)=>({...piece,boardIndex:index,gameMode:"eightPalace"})));return {...state,gameOver:false,board:[...state.board]};};
const firstTrigger=applyAction(eightStateWith([{value:2,foodType:T.AQUATIC},{value:90,foodType:T.AQUATIC}]),{type:"reduce",indexes:[0,1]});
assert.deepEqual(firstTrigger.usedKeyTriggerValues,[2]);assert.ok(firstTrigger.eightPalaceKeys[T.AQUATIC]);
assert.equal(firstTrigger.eightPalaceKeys[T.AQUATIC].triggerValue,2);
const twinTrigger=applyAction(eightStateWith([{value:6,foodType:T.AQUATIC},{value:6,foodType:T.AQUATIC}]),{type:"reduce",indexes:[0,1]});assert.deepEqual(twinTrigger.usedKeyTriggerValues,[6]);
const secondTriggerState={...firstTrigger,gameOver:false,board:[...firstTrigger.board]};secondTriggerState.board[2]={id:202,value:2,foodType:T.LAND};secondTriggerState.board[3]={id:203,value:78,foodType:T.LAND};
const blockedTrigger=applyAction(secondTriggerState,{type:"reduce",indexes:[2,3]});assert.equal(blockedTrigger.board[2],null);assert.equal(blockedTrigger.board[3].value,39);assert.equal(blockedTrigger.eightPalaceKeys[T.LAND],null);assert.deepEqual(blockedTrigger.usedKeyTriggerValues,[2]);
const thirdTriggerState={...blockedTrigger,gameOver:false,board:[...blockedTrigger.board]};thirdTriggerState.board[4]={id:204,value:3,foodType:T.LAND};thirdTriggerState.board[5]={id:205,value:78,foodType:T.LAND};
const thirdTrigger=applyAction(thirdTriggerState,{type:"reduce",indexes:[4,5]});assert.ok(thirdTrigger.eightPalaceKeys[T.LAND]);assert.deepEqual(thirdTrigger.usedKeyTriggerValues,[2,3]);
const noKeyReduction=applyAction(eightStateWith([{value:2,foodType:T.AQUATIC},{value:90,foodType:T.FRUIT}]),{type:"reduce",indexes:[0,1]});assert.deepEqual(noKeyReduction.usedKeyTriggerValues,[]);
const ownedKeyState=eightStateWith([{value:3,foodType:T.AQUATIC},{value:90,foodType:T.AQUATIC}]);ownedKeyState.eightPalaceKeys[T.AQUATIC]={foodType:T.AQUATIC,value:1};const ownedKeyReduction=applyAction(ownedKeyState,{type:"reduce",indexes:[0,1]});assert.deepEqual(ownedKeyReduction.usedKeyTriggerValues,[]);
assert.notEqual(createMazeStateKey(firstTrigger),createMazeStateKey({...firstTrigger,usedKeyTriggerValues:[2,3]}));
assert.deepEqual(eightStateWith([{value:2,foodType:T.AQUATIC},{value:90,foodType:T.AQUATIC}]).usedKeyTriggerValues,[]);

const fruitTrigger=applyAction(eightStateWith([{value:13,foodType:T.FRUIT},{value:91,foodType:T.FRUIT}]),{type:"reduce",indexes:[0,1]});assert.equal(fruitTrigger.eightPalaceKeys[T.FRUIT].triggerValue,13);

const simKey=createSimulationState([2,90,3]);simKey.board[0].foodType=T.AQUATIC;simKey.board[1].foodType=T.AQUATIC;assert.equal(applySimulationAction(simKey,{type:"reduce",indexes:[0,1]}),true);assert.deepEqual(simKey.usedKeyTriggerValues,[2]);simKey.board[3]={value:2,foodType:T.LAND};simKey.board[4]={value:78,foodType:T.LAND};assert.equal(applySimulationAction(simKey,{type:"reduce",indexes:[3,4]}),true);assert.equal(simKey.eightPalaceKeys[T.LAND],null);assert.deepEqual(cloneSimulationState(simKey).usedKeyTriggerValues,[2]);

const positionedEight=(first,firstIndex,second,secondIndex)=>{const state=createGameState([{...first,boardIndex:firstIndex,gameMode:"eightPalace"},{...second,boardIndex:secondIndex,gameMode:"eightPalace"}]);return {...state,gameOver:false,board:[...state.board]};};
const earlierGrain=positionedEight({value:41,foodType:T.GRAIN_BEAN},1,{value:20,foodType:T.FRUIT},7);
assert.equal(applyAction(earlierGrain,{type:"combine_ordered",indexes:[1,7]}).board[0].foodType,T.GRAIN_BEAN);
assert.equal(applyAction(earlierGrain,{type:"combine_ordered",indexes:[7,1]}).board[0].foodType,T.FRUIT);
assert.equal(getLegalActions(earlierGrain).filter(action=>action.type.startsWith("combine")&&action.indexes.includes(1)&&action.indexes.includes(7)).length,2);
const crossedPosition=positionedEight({value:80,foodType:T.FRUIT},1,{value:30,foodType:T.LAND},7);const crossedPositionResult=applyAction(crossedPosition,{type:"combine",indexes:[7,1]}).board[0];assert.equal(crossedPositionResult.value,110);assert.equal(crossedPositionResult.foodType,T.DRINK);
const belowCrossing=positionedEight({value:28,foodType:T.VEGETABLE},0,{value:61,foodType:T.GRAIN_BEAN},8);assert.equal(applyAction(belowCrossing,{type:"combine",indexes:[8,0]}).board[1].foodType,T.GRAIN_BEAN);
const classicOrder={...stateWith([{value:41,foodType:T.GRAIN_BEAN},{value:20,foodType:T.FRUIT}]),gameMode:"classic"};assert.equal(applyAction(classicOrder,{type:"combine_ordered",indexes:[1,0]}).board[2].foodType,T.FRUIT);

const simPosition=createSimulationState([2,3,5],"eightPalace");simPosition.board=Array(9).fill(null);simPosition.board[1]={value:41,foodType:T.GRAIN_BEAN};simPosition.board[7]={value:20,foodType:T.FRUIT};assert.equal(applySimulationAction(simPosition,{type:"combine_ordered",indexes:[7,1]}),true);assert.equal(simPosition.board[0].foodType,T.FRUIT);assert.equal(getSimulationLegalActions(createSimulationState([41,20,7],"eightPalace")).filter(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)).length,2);assert.equal(cloneSimulationState(simPosition).gameMode,"eightPalace");

const drinkState=(drinkValue,normalValue,normalType=T.LAND,drinkIndex=1,normalIndex=7)=>positionedEight({value:drinkValue,foodType:T.DRINK},drinkIndex,{value:normalValue,foodType:normalType},normalIndex);
const absorbed=applyAction(drinkState(120,17),{type:"combine",indexes:[7,1]});assert.equal(absorbed.board[1].value,137);assert.equal(absorbed.board[1].foodType,T.DRINK);assert.equal(absorbed.board[7],null);
const absorbedReverse=applyAction(drinkState(120,17),{type:"combine",indexes:[1,7]});assert.equal(absorbedReverse.board[1].value,137);assert.equal(absorbedReverse.board[7],null);
assert.equal(applyAction(drinkState(180,22),{type:"combine",indexes:[1,7]}).board[1].value,202);
const burstState=drinkState(180,23),burstPreview=createCombineOutcome(burstState,1,7),burst=applyAction(burstState,{type:"combine",indexes:[1,7]});assert.equal(burstPreview.kind,"burst");assert.equal(burst.board[1],null);assert.equal(burst.board[7],null);
const drinkReduceState=drinkState(110,20,T.LAND),reducePreview=createReduceOutcome(drinkReduceState,1,7),drinkReduced=applyAction(drinkReduceState,{type:"reduce",indexes:[1,7]});assert.deepEqual(reducePreview.results.map(item=>[item.value,item.foodType]),[[11,T.LAND],[2,T.LAND]]);assert.equal(drinkReduced.board[1].value,11);assert.equal(drinkReduced.board[1].foodType,T.LAND);assert.equal(drinkReduced.board[7].value,2);assert.equal(drinkReduced.board[7].foodType,T.LAND);
const vegetableReduced=applyAction(drinkState(110,20,T.VEGETABLE),{type:"reduce",indexes:[7,1]});assert.equal(vegetableReduced.board[1].foodType,T.VEGETABLE);assert.equal(vegetableReduced.board[7].foodType,T.VEGETABLE);
const dualChoice=drinkState(198,4);assert.ok(getLegalActions(dualChoice).some(action=>action.type.startsWith("combine")));assert.ok(getLegalActions(dualChoice).some(action=>action.type==="reduce"));
const fullDrinkBoard=drinkState(120,17);for(let index=0;index<9;index++)if(!fullDrinkBoard.board[index])fullDrinkBoard.board[index]={id:800+index,value:3+index,foodType:T.FRUIT};assert.equal(resolveGameOver(fullDrinkBoard).gameOver,false);assert.ok(getLegalActions(fullDrinkBoard).some(action=>action.type.startsWith("combine")&&action.indexes.includes(1)&&action.indexes.includes(7)));
const simAbsorb=createSimulationState([120,17,7],"eightPalace");simAbsorb.board[0].foodType=T.DRINK;simAbsorb.board[1].foodType=T.LAND;assert.equal(applySimulationAction(simAbsorb,{type:"combine",indexes:[1,0]}),true);assert.equal(simAbsorb.board[0].value,137);assert.equal(simAbsorb.board[1],null);
const simDrinkPair=createSimulationState([120,180,7],"eightPalace");simDrinkPair.board[0].foodType=T.DRINK;simDrinkPair.board[1].foodType=T.DRINK;assert.equal(getSimulationLegalActions(simDrinkPair).some(action=>action.indexes?.includes(0)&&action.indexes?.includes(1)),false);

const fullSpecialState=(specialOne,normalTarget=false)=>{const state=stateWith([{value:1,foodType:T.LAND}]);state.board=Array(9).fill(null);state.board[0]={...state.board[0],value:1,foodType:T.LAND,specialOne};const primes=normalTarget?[23,2,3,5,7,11,13,17]:[2,3,5,7,11,13,17,19];for(let i=1;i<9;i++)state.board[i]={id:100+i,value:primes[i-1],foodType:normalTarget&&i===1?T.LAND:T.DRINK,purity:"pure",parents:null,parentFoods:null};state.gameOver=true;state.gameOverReason="no_legal_actions";return state;};
const fullKey=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.LAND)));assert.equal(fullKey.gameOver,true);assert.equal(getLegalActions({...fullKey,gameOver:false}).some(action=>action.type==="claim_key"),false);
const fullFunction=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.FRUIT),true));assert.equal(fullFunction.gameOver,false);assert.equal(getLegalActions({...fullFunction,gameOver:false}).some(action=>action.type==="apply_one"),false);
const inertFunction=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.FRUIT),false));assert.equal(inertFunction.gameOver,true);assert.equal(getLegalActions({...inertFunction,gameOver:false}).length,0);
console.log("special rules tests passed");
