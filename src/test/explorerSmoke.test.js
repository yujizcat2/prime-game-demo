import assert from "node:assert/strict";
import { runRandomGame } from "./randomExplorer";
import { runSmartGame, SMART_AI_MODES } from "./smartExplorer";
import { getFoodName } from "../data/food/foodRegistry";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";

const valid=new Set([...BASE_FOOD_TYPES,FOOD_TYPES.DRINK]);
function verify(game,label){assert.ok(game.steps>=0,`${label} ran`);for(const piece of game.finalBoard??[]){assert.ok(valid.has(piece.foodType),`${label}: valid cuisine`);assert.notEqual(getFoodName(piece.value,piece.foodType),String(piece.value),`${label}: defined name`);}}
verify(runRandomGame({maxActions:200}),"random");
verify(await runSmartGame({mode:SMART_AI_MODES.SURVIVAL,depth:2,beamWidth:20,maxActions:100,yieldEvery:100}),"survival");
verify(await runSmartGame({mode:SMART_AI_MODES.COLLECTION,depth:2,beamWidth:20,maxActions:100,yieldEvery:100}),"smart collection");
console.log("explorer smoke tests passed");
