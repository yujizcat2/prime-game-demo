import assert from "node:assert/strict";
import { applyAction, createCombinedPiece, createGameState, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { FOOD_TYPES as T, createSpecialOne } from "../game/rules";
import { createMazeStateKey } from "../game/mazeHistory";
import { createSimulationState, getSimulationLegalActions, applySimulationAction, cloneSimulationState } from "./simulationEngine";
import { createCombinationPairKey } from "../game/actionFatigue";
import { getSpecialOneDisplayName } from "../data/specialOneRegistry";
import { createEightPalaceBoardKey } from "./eightPalaceSolver";
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
const crossed=combine({value:64,foodType:T.LAND},{value:38,foodType:T.FRUIT}); assert.equal(crossed.board[2].value,2); assert.equal(crossed.board[2].foodType,T.DRINK);
for(const total of [90,130]){const state=combine({value:60,foodType:T.DRINK},{value:total-60,foodType:T.LAND}),result=state.board[2];assert.equal(result.value,total>101?total-100:total);assert.equal(result.foodType,total>101?T.DRINK:T.LAND);assert.equal(state.board.filter(Boolean).length,3);}
assert.equal(combine({value:60,foodType:T.DRINK},{value:55,foodType:T.DRINK}).board[2].foodType,T.DRINK);
const poured=combine({value:3,foodType:T.DRINK},{value:2,foodType:T.LAND});assert.equal(poured.board.filter(Boolean).length,3);assert.equal(poured.board[2].value,5);assert.equal(poured.board[2].foodType,T.LAND);

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
const simDrink=createSimulationState([3,2,7]);simDrink.board[0].foodType=T.DRINK;simDrink.board[1].foodType=T.LAND;assert.equal(applySimulationAction(simDrink,{type:"combine",indexes:[0,1]}),true);assert.equal(simDrink.board.filter(Boolean).length,4);assert.equal(simDrink.board[3].value,5);assert.equal(simDrink.board[3].foodType,T.LAND);

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
const earlierDrink=positionedEight({value:20,foodType:T.DRINK},1,{value:30,foodType:T.LAND},7);assert.equal(applyAction(earlierDrink,{type:"combine",indexes:[7,1]}).board[0].foodType,T.LAND);
const laterDrink=positionedEight({value:20,foodType:T.LAND},1,{value:30,foodType:T.DRINK},7);assert.equal(applyAction(laterDrink,{type:"combine",indexes:[7,1]}).board[0].foodType,T.LAND);
const crossedPosition=positionedEight({value:80,foodType:T.FRUIT},1,{value:30,foodType:T.LAND},7);const crossedPositionResult=applyAction(crossedPosition,{type:"combine",indexes:[7,1]}).board[0];assert.equal(crossedPositionResult.value,10);assert.equal(crossedPositionResult.foodType,T.DRINK);
const crossedEarlierLand=positionedEight({value:66,foodType:T.LAND},0,{value:88,foodType:T.SPICE},6);assert.equal(applyAction(crossedEarlierLand,{type:"combine",indexes:[0,6]}).board.find(piece=>piece?.value===54)?.foodType,T.DRINK);
const crossedWithDrink=positionedEight({value:60,foodType:T.DRINK},7,{value:50,foodType:T.GRAIN_BEAN},8);assert.equal(applyAction(crossedWithDrink,{type:"combine",indexes:[7,8]}).board[0].foodType,T.DRINK);
const belowCrossing=positionedEight({value:28,foodType:T.VEGETABLE},0,{value:61,foodType:T.GRAIN_BEAN},8);assert.equal(applyAction(belowCrossing,{type:"combine",indexes:[8,0]}).board[1].foodType,T.GRAIN_BEAN);
const classicOrder={...stateWith([{value:41,foodType:T.GRAIN_BEAN},{value:20,foodType:T.FRUIT}]),gameMode:"classic"};assert.equal(applyAction(classicOrder,{type:"combine_ordered",indexes:[1,0]}).board[2].foodType,T.FRUIT);

const simPosition=createSimulationState([2,3,5],"eightPalace");simPosition.board=Array(9).fill(null);simPosition.board[1]={value:41,foodType:T.GRAIN_BEAN};simPosition.board[7]={value:20,foodType:T.FRUIT};assert.equal(applySimulationAction(simPosition,{type:"combine_ordered",indexes:[7,1]}),true);assert.equal(simPosition.board[0].foodType,T.FRUIT);assert.equal(getSimulationLegalActions(createSimulationState([41,20,7],"eightPalace")).filter(action=>action.type.startsWith("combine")&&action.indexes.includes(0)&&action.indexes.includes(1)).length,2);assert.equal(cloneSimulationState(simPosition).gameMode,"eightPalace");

const originDrinkState=positionedEight({value:68,foodType:T.LAND},0,{value:57,foodType:T.FRUIT},6);const bornDrink=applyAction(originDrinkState,{type:"combine",indexes:[0,6]}).board.find(piece=>piece?.value===25);assert.equal(bornDrink.foodType,T.DRINK);assert.equal(bornDrink.drinkOriginValue,25);
const drinkState=(index,value,origin,otherIndex,otherValue,otherType=T.LAND)=>{const state=createGameState([{value,foodType:T.DRINK,drinkOriginValue:origin,boardIndex:index,gameMode:"eightPalace"},{value:otherValue,foodType:otherType,boardIndex:otherIndex,gameMode:"eightPalace"}]);return {...state,gameOver:false,board:[...state.board]};};
const reducedDrink=applyAction(drinkState(3,25,25,8,10),{type:"reduce",indexes:[3,8]});assert.equal(reducedDrink.board[3].value,5);assert.equal(reducedDrink.board[3].drinkOriginValue,25);
const grainRestored=applyAction(drinkState(3,5,25,8,10),{type:"reduce",indexes:[3,8]});assert.equal(grainRestored.board[3].value,25);assert.equal(grainRestored.board[3].foodType,T.GRAIN_BEAN);assert.equal(grainRestored.board[3].drinkOriginValue,undefined);assert.equal(Object.values(grainRestored.eightPalaceKeys).filter(Boolean).length,0);assert.deepEqual(grainRestored.usedKeyTriggerValues,[]);
const seasoningRestored=applyAction(drinkState(7,5,25,0,10),{type:"reduce",indexes:[7,0]});assert.equal(seasoningRestored.board[7].value,25);assert.equal(seasoningRestored.board[7].foodType,T.SEASONING);
const centerDrink=applyAction(drinkState(4,5,25,0,10),{type:"reduce",indexes:[4,0]});assert.equal(centerDrink.board[4],null);assert.equal(Object.values(centerDrink.eightPalaceKeys).filter(Boolean).length,0);
const restoredCanKey={...grainRestored,gameOver:false,board:[...grainRestored.board]};restoredCanKey.board[8]={id:701,value:100,foodType:T.GRAIN_BEAN};const restoredKey=applyAction(restoredCanKey,{type:"reduce",indexes:[3,8]});assert.ok(restoredKey.eightPalaceKeys[T.GRAIN_BEAN]);assert.equal(restoredKey.eightPalaceKeys[T.GRAIN_BEAN].triggerValue,25);
const doubleOne=applyAction(drinkState(3,5,25,0,5,T.LAND),{type:"reduce",indexes:[3,0]});assert.equal(doubleOne.board[3].value,25);assert.equal(doubleOne.board[3].foodType,T.GRAIN_BEAN);assert.equal(doubleOne.board[0],null);
const keyDrink25=drinkState(3,5,25,8,7),keyDrink45={...keyDrink25,board:keyDrink25.board.map(piece=>piece?.foodType===T.DRINK?{...piece,drinkOriginValue:45}:piece)};assert.notEqual(createEightPalaceBoardKey(keyDrink25),createEightPalaceBoardKey(keyDrink45));assert.notEqual(createMazeStateKey(keyDrink25),createMazeStateKey(keyDrink45));
const simRestoredDrink=createSimulationState([5,10,7],"eightPalace");simRestoredDrink.board=Array(9).fill(null);simRestoredDrink.board[3]={value:5,foodType:T.DRINK,drinkOriginValue:25};simRestoredDrink.board[8]={value:10,foodType:T.LAND};assert.equal(applySimulationAction(simRestoredDrink,{type:"reduce",indexes:[3,8]}),true);assert.equal(simRestoredDrink.board[3].value,25);assert.equal(simRestoredDrink.board[3].foodType,T.GRAIN_BEAN);assert.equal(simRestoredDrink.board[3].drinkOriginValue,undefined);

const fullSpecialState=(specialOne,normalTarget=false)=>{const state=stateWith([{value:1,foodType:T.LAND}]);state.board=Array(9).fill(null);state.board[0]={...state.board[0],value:1,foodType:T.LAND,specialOne};const primes=normalTarget?[23,2,3,5,7,11,13,17]:[2,3,5,7,11,13,17,19];for(let i=1;i<9;i++)state.board[i]={id:100+i,value:primes[i-1],foodType:normalTarget&&i===1?T.LAND:T.DRINK,purity:"pure",parents:null,parentFoods:null};state.gameOver=true;state.gameOverReason="no_legal_actions";return state;};
const fullKey=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.LAND)));assert.equal(fullKey.gameOver,true);assert.equal(getLegalActions({...fullKey,gameOver:false}).some(action=>action.type==="claim_key"),false);
const fullFunction=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.FRUIT),true));assert.equal(fullFunction.gameOver,true);assert.equal(getLegalActions({...fullFunction,gameOver:false}).some(action=>action.type==="apply_one"),false);
const inertFunction=resolveGameOver(fullSpecialState(createSpecialOne(T.LAND,T.FRUIT),false));assert.equal(inertFunction.gameOver,true);assert.equal(getLegalActions({...inertFunction,gameOver:false}).length,0);
console.log("special rules tests passed");
