import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { applyAction, resolveGameOver } from "../game/gameEngine";
import { getLegalActions } from "../game/gameActions";
import { getFoodAgeMinutes } from "../game/foodShelfLife";
import { applySimulationAction, createSimulationState, getSimulationLegalActions } from "./simulationEngine";

function stateWith(cards){
  const state = createGameState([]);
  state.board = Array(9).fill(null);
  cards.forEach(({index, ...card}, offset) => {
    state.board[index] = {id: offset + 10, bornAt: 20, value: offset + 2, ...card};
  });
  state.stepLimit = 100;
  return state;
}

const row = stateWith([
  {index: 0, foodType: "meat"}, {index: 1, foodType: "meat"}, {index: 2, foodType: "meat"}
]);
const store = getLegalActions(row).find(action => action.type === "fridge_store");
assert.deepEqual(store.indexes, [0, 1, 2]);
const stored = applyAction({...row, totalActionMinutes: 100}, store);
assert.equal(stored.board.filter(Boolean).length, 0);
assert.deepEqual(stored.fridgeCards.map(card => card.id), [10, 11, 12]);
assert.equal(stored.score, row.score);
assert.equal(stored.steps, row.steps);
assert.equal(stored.gameOver, false, "retrieval keeps a depleted board playable");
assert.equal(getLegalActions(stored).some(action => action.type === "fridge_store"), false);

const oneOut = applyAction({...stored, totalActionMinutes: 400}, {type: "fridge_retrieve", fridgeIndex: 1, boardIndex: 8});
assert.equal(oneOut.board[8].id, 11);
assert.equal(getFoodAgeMinutes(oneOut.board[8], oneOut), 80, "300 frozen minutes are excluded from age");
assert.equal(oneOut.fridgeBatchActive, true);
assert.equal(getLegalActions(oneOut).some(action => action.type === "fridge_store"), false);
let empty = applyAction(oneOut, {type: "fridge_retrieve", fridgeIndex: 0, boardIndex: 7});
empty = applyAction(empty, {type: "fridge_retrieve", fridgeIndex: 2, boardIndex: 6});
assert.deepEqual(empty.fridgeCards, []);
assert.equal(empty.fridgeBatchActive, false);

const mixed = stateWith([
  {index: 0, foodType: "meat"}, {index: 1, foodType: "meat"}, {index: 2, foodType: "vegetable"}
]);
assert.equal(getLegalActions(mixed).some(action => action.type === "fridge_store"), false);

const fullWithFridge = {...mixed, board: Array(9).fill(null).map((_, i) => ({id: i, value: i + 2, foodType: i < 3 ? "meat" : `type-${i}`})), heaterCount: 0, superHeaterCount: 0};
const storedFromFull = applyAction(fullWithFridge, {type: "fridge_store", indexes: [0, 1, 2]});
assert.equal(resolveGameOver(storedFromFull).gameOver, false);

const sim = createSimulationState([2, 3, 4]);
sim.board.filter(Boolean).forEach(card => { card.foodType = "meat"; });
const simStore = getSimulationLegalActions(sim).find(action => action.type === "fridge_store");
assert.equal(applySimulationAction(sim, simStore), true);
assert.equal(getSimulationLegalActions(sim).some(action => action.type === "fridge_retrieve"), true);

console.log("fridge tests passed");
