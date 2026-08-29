import assert from "node:assert/strict";
import { applyAction, createGameState, getLegalActions } from "../game/gameEngine";
import { BASE_FOOD_TYPES, FOOD_TYPES as T, createSpecialOne } from "../game/rules";
import { createMazeStateKey } from "../game/mazeHistory";
import { createSimulationState, getSimulationLegalActions, applySimulationAction } from "./simulationEngine";
import { getSpecialOneDisplayName } from "../data/specialOneRegistry";

const stateWith=(pieces)=>{const seed=createGameState(pieces.map((piece,index)=>({...piece,boardIndex:index})));return {...seed,gameOver:false,board:[...seed.board]};};
const combine=(a,b,resultFoodType=null)=>applyAction(stateWith([a,b]),{type:resultFoodType?"combine_drink_convert":"combine_ordered",indexes:[0,1],resultFoodType});

assert.equal(combine({value:64,foodType:T.DAIRY_EGG},{value:25,foodType:T.FRUIT}).board[2].foodType,T.DAIRY_EGG);
assert.equal(applyAction(stateWith([{value:64,foodType:T.DAIRY_EGG},{value:25,foodType:T.FRUIT}]),{type:"combine_ordered",indexes:[1,0]}).board[2].foodType,T.FRUIT);
assert.equal(combine({value:64,foodType:T.LAND},{value:37,foodType:T.FRUIT}).board[2].foodType,T.LAND);
const crossed=combine({value:64,foodType:T.LAND},{value:38,foodType:T.FRUIT}); assert.equal(crossed.board[2].value,2); assert.equal(crossed.board[2].foodType,T.DRINK);
for(const total of [90,130]){const state=combine({value:60,foodType:T.DRINK},{value:total-60,foodType:T.LAND},T.SPICE),result=state.board[1];assert.equal(result.value,total>101?total-100:total);assert.equal(result.foodType,T.SPICE);assert.equal(state.board.filter(Boolean).length,1);assert.equal(state.board.some(piece=>piece?.foodType===T.DRINK),false);}
assert.equal(combine({value:60,foodType:T.DRINK},{value:55,foodType:T.DRINK}).board[2].foodType,T.DRINK);
const poured=combine({value:3,foodType:T.DRINK},{value:2,foodType:T.LAND},T.DAIRY_EGG);assert.equal(poured.board.filter(Boolean).length,1);assert.equal(poured.board[1].value,5);assert.equal(poured.board[1].foodType,T.DAIRY_EGG);

assert.equal(getSpecialOneDisplayName({foodType:T.LAND,specialOne:createSpecialOne(T.LAND,T.FRUIT)}),"肉汁");
assert.equal(getSpecialOneDisplayName({foodType:T.FRUIT,specialOne:createSpecialOne(T.LAND,T.FRUIT)}),"果汁");
assert.equal(getSpecialOneDisplayName({foodType:T.SPICE,specialOne:createSpecialOne(T.LAND,T.SPICE)}),"香汁");
assert.equal(getSpecialOneDisplayName({foodType:T.LAND,specialOne:createSpecialOne(T.LAND,T.LAND)}),"纯肉汁");
assert.equal(getSpecialOneDisplayName({foodType:T.FRUIT,specialOne:createSpecialOne(T.FRUIT,T.FRUIT)}),"纯果汁");

const reduced=applyAction(stateWith([{value:6,foodType:T.AQUATIC},{value:3,foodType:T.LAND},{value:37,foodType:T.AQUATIC}]),{type:"reduce",indexes:[0,1]});
assert.equal(reduced.board[1].specialOne.kind,"function"); assert.equal(Object.values(reduced.eightPalaceKeys).filter(Boolean).length,0);
const applied=applyAction(reduced,{type:"apply_one",oneIndex:1,targetIndex:2}); assert.equal(applied.board[1],null); assert.equal(applied.board[2].value,38); assert.equal(applied.board[2].foodType,T.AQUATIC);
const blocked=applyAction(stateWith([{value:6,foodType:T.AQUATIC},{value:3,foodType:T.LAND},{value:101,foodType:T.SPICE}]),{type:"reduce",indexes:[0,1]}); assert.equal(applyAction(blocked,{type:"apply_one",oneIndex:1,targetIndex:2}),blocked);
assert.deepEqual(createSpecialOne(T.LAND,T.FRUIT),createSpecialOne(T.FRUIT,T.LAND));

const actionState=stateWith([{value:10,foodType:T.LAND},{value:20,foodType:T.FRUIT}]);
assert.equal(getLegalActions(actionState).filter(a=>a.type==="combine_ordered").length,2);
assert.equal(getLegalActions(stateWith([{value:10,foodType:T.DRINK},{value:20,foodType:T.FRUIT}])).filter(a=>a.type==="combine_drink_convert").length,BASE_FOOD_TYPES.length);
const keyStateA=stateWith([{value:1,foodType:T.LAND}]),keyStateB=stateWith([{value:1,foodType:T.LAND}]);keyStateA.board[0].specialOne=createSpecialOne(T.LAND,T.LAND);keyStateB.board[0].specialOne=createSpecialOne(T.LAND,T.FRUIT);assert.notEqual(createMazeStateKey(keyStateA),createMazeStateKey(keyStateB));

const sim=createSimulationState([10,20,30]);sim.board[0].foodType=T.LAND;sim.board[1].foodType=T.FRUIT;assert.equal(getSimulationLegalActions(sim).filter(a=>a.type==="combine_ordered"&&a.indexes.includes(0)&&a.indexes.includes(1)).length,2);const simAction=getSimulationLegalActions(sim).find(a=>a.type==="combine_ordered"&&a.indexes[0]===1&&a.indexes[1]===0);assert.equal(applySimulationAction(sim,simAction),true);assert.equal(sim.board.find(p=>p?.value===30&&p.parents)?.foodType,T.FRUIT);
const simDrink=createSimulationState([3,2,7]);simDrink.board[0].foodType=T.DRINK;simDrink.board[1].foodType=T.LAND;assert.equal(applySimulationAction(simDrink,{type:"combine_drink_convert",indexes:[0,1],resultFoodType:T.DAIRY_EGG}),true);assert.equal(simDrink.board.filter(Boolean).length,2);assert.equal(simDrink.board[0],null);assert.equal(simDrink.board[1].value,5);assert.equal(simDrink.board[1].foodType,T.DAIRY_EGG);
console.log("special rules tests passed");
