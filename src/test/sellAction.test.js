import assert from "node:assert/strict";
import {applyAction, canSwapCells, createGameState, getLegalActions} from "../game/gameEngine";
import {getFoodExpiryState} from "../game/foodShelfLife";
import {getLegalFridgeStoreActions} from "../game/fridge";
import {getSellDurationMinutes} from "../game/actionDuration";
import {getFinishedFoodCardDisplayName, getFoodCardDisplayName} from "../components/foodCardDisplay";
import {getFoodName} from "../data/food/foodRegistry";
import {getNextSellSelectionIndexes} from "../game/selection";

const cards = [
  {id:1,value: 8, foodType: "land", bornAt: 0, boardIndex:0, gameMode:"eightPalace", parents: [3, 5], parentFoods: [{value: 3, foodType: "land"}, {value: 5, foodType: "vegetable"}]},
  {id:2,value: 3, foodType: "aquatic", bornAt: 0, boardIndex:1, gameMode:"eightPalace"},
  {id:3,value: 10, foodType: "vegetable", bornAt: 0, boardIndex:2, gameMode:"eightPalace"},
  {id:4,value: 4, foodType: "grainBean", bornAt: 0, boardIndex:3, gameMode:"eightPalace"}
];

let state=createGameState(cards,{dayCycleEnabled:true});
state={...state,totalActionMinutes:600,dayMinutesElapsed:600,gameOver:false};
const reducible={...state,board:[
  {...state.board[0],value:8},
  {...state.board[1],value:4},
  {...state.board[2]},
  {...state.board[3]}
]};
const finished=applyAction(reducible,{type:"reduce",indexes:[0,1]});
assert.equal(finished.board[1].value,1,"reduction leaves the finished dish on the board");
assert.equal(finished.collectionTimeline.length,0,"reduction does not sell or collect");
assert.equal(finished.latestActionDurationMinutes,30);
assert.equal(finished.board[1].processedAt,630);
assert.equal(finished.board[1].processedAgeMinutes,630);
assert.deepEqual(finished.board[1].parents,reducible.board[1].parents);
assert.equal(finished.board[1].foodType,reducible.board[1].foodType);
assert.equal(finished.board[1].processedFromValue,4);
assert.equal(getFoodCardDisplayName(finished.board[1]),getFoodName(4,reducible.board[1].foodType));
assert.equal(getFinishedFoodCardDisplayName(finished.board[1],1),`烤${getFoodName(4,reducible.board[1].foodType)}`);
assert.match(finished.board[1].origin.type,/reduce/);
assert.ok(getLegalActions(finished).some(action=>action.type==="sell"&&action.indexes[0]===1));
assert.equal(canSwapCells(finished,0,1),false);

const muchLater={...finished,totalActionMinutes:3000,dayMinutesElapsed:3000,gameOver:false};
assert.equal(getFoodExpiryState(muchLater.board[1],muchLater).ageMinutes,630,"finished shelf life is frozen");
assert.equal(getLegalFridgeStoreActions({...muchLater,board:[muchLater.board[1],muchLater.board[1],muchLater.board[1],...muchLater.board.slice(3)]}).length,0);

const sold=applyAction({...muchLater,dayMinutesElapsed:600},{type:"sell",indexes:[1]});
assert.equal(sold.board[1],null);
assert.equal(sold.totalActionMinutes,3020);
assert.equal(sold.collectionTimeline.length,1);
assert.equal(sold.collectionTimeline[0].foodAgeMinutes,630);
assert.equal(sold.recapActionCounts.sellCount,1);
assert.equal(sold.recapActionCounts.sellCardsCount,1);
assert.equal(sold.recapActionCounts.sellMinutes,20);

const invalid=applyAction(finished,{type:"sell",indexes:[0]});
assert.equal(invalid,finished,"selling a value greater than one is a no-op");

const secondFinished={
  ...finished.board[1],
  id:99,
  foodType:"vegetable",
  origin:{type:"reduce",parent:{value:12,foodType:"vegetable",bornAt:100}},
  processedAgeMinutes:545
};
const batchState={...finished,board:[finished.board[1],secondFinished,...finished.board.slice(2)],gameOver:false};
const batchSold=applyAction(batchState,{type:"sell",indexes:[0,1]});
assert.equal(batchSold.totalActionMinutes,batchState.totalActionMinutes+30);
assert.equal(batchSold.collectionTimeline.length,2,"batch sale settles every card separately");
assert.equal(batchSold.recapActionCounts.sellCount,1);
assert.equal(batchSold.recapActionCounts.sellCardsCount,2);
assert.equal(batchSold.recapActionCounts.sellMinutes,30);
assert.deepEqual([1,2,3].map(getSellDurationMinutes),[20,30,40]);

let sellSelection=[];
sellSelection=getNextSellSelectionIndexes(sellSelection,0);
assert.deepEqual(sellSelection,[0]);
sellSelection=getNextSellSelectionIndexes(sellSelection,0);
assert.deepEqual(sellSelection,[],"cancelling the last finished dish leaves no sell selection");
sellSelection=getNextSellSelectionIndexes(sellSelection,0);
sellSelection=getNextSellSelectionIndexes(sellSelection,1);
assert.deepEqual(sellSelection,[0,1]);
sellSelection=getNextSellSelectionIndexes(sellSelection,0);
assert.deepEqual(sellSelection,[1],"clicking a selected finished dish cancels only that dish");

const thirdFinished={
  ...secondFinished,
  id:100,
  foodType:"fruit",
  origin:{type:"reduce",parent:{value:15,foodType:"fruit",bornAt:120}},
  processedFromValue:15,
  processedAgeMinutes:510
};
const tripleState={...finished,board:[finished.board[1],secondFinished,thirdFinished,...finished.board.slice(3)],gameOver:false};
const tripleSold=applyAction(tripleState,{type:"sell",indexes:[0,1,2]});
assert.ok(tripleSold.board.slice(0,3).every(piece=>piece===null));
assert.equal(tripleSold.totalActionMinutes,tripleState.totalActionMinutes+40);
assert.equal(tripleSold.collectionTimeline.length,3);

console.log("sell action tests passed");
