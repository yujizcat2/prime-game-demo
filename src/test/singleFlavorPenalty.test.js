import assert from "node:assert/strict";
import { applyAction, createGameState } from "../game/gameEngine";
import { applyEightPalaceCollection, getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { markSingleFlavorBoardPieces } from "../game/singleFlavorPenalty";
import { BASE_FOOD_TYPES, FOOD_TYPES } from "../game/rules";
import { cloneSimulationState, createSimulationState } from "./simulationEngine";
import { getRawBaseScore } from "../game/scoreValue";

const [land, aquatic, vegetable, grainBean, dairyEgg] = BASE_FOOD_TYPES;
const piece = (id, value, foodType, extra = {}) => ({
  id, value, foodType, purity: "pure", parents: null, parentFoods: null,
  sourceKey: null, origin: null, ...extra
});
const board = (...pieces) => [...pieces, ...Array(9 - pieces.length).fill(null)];
const baseState = pieces => ({
  ...createGameState([
    {value: 4, boardIndex: 0, gameMode: "simpleEightPalace"},
    {value: 6, boardIndex: 1, gameMode: "simpleEightPalace"}
  ]),
  board: board(...pieces), gameOver: false, gameOverReason: null
});

for(const count of [1, 2, 4]){
  const state = baseState(Array.from({length: count}, (_, index) =>
    piece(index + 1, 4 + index * 2, grainBean)
  ));
  assert.equal(markSingleFlavorBoardPieces(state), state, `${count} normal pieces do not trigger`);
}

{
  const marked = markSingleFlavorBoardPieces(baseState(
    Array.from({length: 5}, (_, index) => piece(index + 1, 4 + index * 2, grainBean))
  ));
  assert.ok(marked.board.filter(Boolean).every(card => card.singleFlavorPenalty === true));
  assert.equal(marked.firstSingleFlavorNormalPieceCount, 5);
}

{
  const state = baseState([
    ...Array.from({length: 4}, (_, index) => piece(index + 1, 4 + index * 2, grainBean)),
    piece(5, 20, FOOD_TYPES.DRINK), piece(6, 30, FOOD_TYPES.DRINK), piece(7, 40, FOOD_TYPES.DRINK)
  ]);
  assert.equal(markSingleFlavorBoardPieces(state), state);
}

for(const ignored of [
  [piece(6, 20, FOOD_TYPES.DRINK), piece(7, 30, FOOD_TYPES.DRINK)],
  [piece(6, 1, dairyEgg, {specialOne: {kind: "key", keyType: dairyEgg}})]
]){
  const marked = markSingleFlavorBoardPieces(baseState([
    ...Array.from({length: 5}, (_, index) => piece(index + 1, 4 + index * 2, grainBean)),
    ...ignored
  ]));
  assert.ok(marked.board.filter(Boolean).every(card => card.singleFlavorPenalty === true));
}

{
  const state = baseState([
    ...Array.from({length: 4}, (_, index) => piece(index + 1, 4 + index * 2, grainBean)),
    piece(5, 12, dairyEgg)
  ]);
  assert.equal(markSingleFlavorBoardPieces(state), state);
}

{
  const marked = markSingleFlavorBoardPieces(baseState([
    piece(1, 4, grainBean), piece(2, 6, grainBean), piece(3, 8, grainBean),
    piece(4, 10, grainBean), null, piece(5, 12, grainBean)
  ]));
  const restored = applyAction(marked, {type: "restore", indexes: [5]});
  assert.equal(restored.board[5].foodType, dairyEgg);
  assert.equal(restored.board[5].singleFlavorPenalty, true);
  assert.ok(restored.board.filter(Boolean).every(card => card.singleFlavorPenalty === true));
}

{
  const state = baseState([
    piece(1, 4, grainBean, {singleFlavorPenalty: true}),
    piece(2, 6, dairyEgg, {singleFlavorPenalty: true})
  ]);
  const combined = applyAction(state, {type: "combine_ordered", indexes: [0, 1]});
  const created = combined.board.find(card => card?.id === state.nextId);
  assert.equal(created.singleFlavorPenalty, false);
}

{
  const state = baseState([
    piece(1, 4, grainBean, {singleFlavorPenalty: true}),
    piece(2, 6, grainBean, {singleFlavorPenalty: true}),
    piece(3, 8, grainBean, {singleFlavorPenalty: true}),
    piece(4, 11, grainBean, {singleFlavorPenalty: true})
  ]);
  const combined = applyAction(state, {type: "combine", indexes: [0, 1]});
  const created = combined.board.find(card => card?.id === state.nextId);
  assert.equal(created.singleFlavorPenalty, true);
}

const collectible = (value, foodType, singleFlavorPenalty) => ({
  value: 1, foodType, singleFlavorPenalty,
  origin: {type: "reduce", parent: piece(20, value, foodType, {singleFlavorPenalty})}
});

{
  const normalState = baseState([piece(1, 14, land), piece(2, 2, aquatic)]);
  const penalizedState = baseState([
    piece(1, 14, land), piece(2, 2, aquatic, {singleFlavorPenalty: true})
  ]);
  const normal = applyAction(normalState, {type: "reduce", indexes: [0, 1]});
  const penalized = applyAction(penalizedState, {type: "reduce", indexes: [0, 1]});
  const rawBaseScore = getRawBaseScore(2);
  assert.equal(normal.latestCollection.baseScore, rawBaseScore);
  assert.equal(normal.latestCollection.collectionScore, rawBaseScore);
  assert.equal(penalized.latestCollection.baseScore, rawBaseScore);
  assert.equal(penalized.latestCollection.collectionScore, rawBaseScore);
  assert.equal(penalized.latestCollection.totalScore, rawBaseScore);
}

{
  const state = baseState([
    piece(1, 12, land, {singleFlavorPenalty: true}), piece(2, 8, aquatic)
  ]);
  const reduced = applyAction(state, {type: "reduce", indexes: [0, 1]});
  assert.equal(reduced.board[0].value, 3);
  assert.equal(reduced.board[0].singleFlavorPenalty, true);
}

{
  const state = baseState([]);
  const card = collectible(11, vegetable, true);
  const expectedCollectionScore = getRawBaseScore(11);
  assert.equal(getEightPalaceCollectionScoreGain(state, card), expectedCollectionScore);
  const settled = applyEightPalaceCollection(state, card);
  assert.equal(settled.latestCollection.collectionScore, expectedCollectionScore);
  assert.equal(settled.latestCollection.totalScore, expectedCollectionScore);
}

{
  const simulation = createSimulationState([4, 6, 8]);
  simulation.board[0].singleFlavorPenalty = true;
  simulation.singleFlavorTriggered = true;
  simulation.singleFlavorFirstTriggeredStep = 3;
  const cloned = cloneSimulationState(simulation);
  assert.equal(cloned.board[0].singleFlavorPenalty, true);
  assert.equal(cloned.singleFlavorFirstTriggeredStep, 3);
}

{
  const marked = markSingleFlavorBoardPieces(baseState(
    Array.from({length: 5}, (_, index) => piece(index + 1, 4 + index * 2, grainBean))
  ));
  const reducedBoard = [...marked.board];
  reducedBoard[4] = null;
  const checked = markSingleFlavorBoardPieces({...marked, board: reducedBoard});
  assert.ok(checked.board.filter(Boolean).every(card => card.singleFlavorPenalty === true));
}

{
  const marked = markSingleFlavorBoardPieces(baseState(
    Array.from({length: 5}, (_, index) => piece(index + 1, 4 + index * 2, grainBean))
  ));
  const mixedBoard = [...marked.board];
  mixedBoard[4] = piece(9, 13, dairyEgg);
  const checked = markSingleFlavorBoardPieces({...marked, board: mixedBoard});
  assert.ok(checked.board.slice(0, 4).every(card => card.singleFlavorPenalty === true));
  assert.equal(checked.board[4].singleFlavorPenalty, undefined);
}

console.log("single flavor penalty tests passed");
