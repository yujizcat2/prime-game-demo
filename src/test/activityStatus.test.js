import assert from "node:assert/strict";

import {
  getActivityStatus,
  getActivityText
} from "../game/activityStatus";

import {
  applyAction,
  createGameState,
  resolveGameOver
} from "../game/gameEngine";

import {
  applySimulationAction,
  createSimulationState,
  getSimulationLegalActions
} from "./simulationEngine";


function pieces(values){
  return values.map((value, index) => ({
    id: `piece-${index}`,
    value,
    foodType: "meat",
    parents: null,
    parentFoods: null
  }));
}


function blockCombination(piece, parent){
  piece.parentFoods = [
    ...(piece.parentFoods ?? []),
    {
      value: parent.value,
      foodType: parent.foodType
    }
  ];
}


const healthyOpeningPieces =
  pieces([2, 3, 5, 7]);

const healthyOpening = getActivityStatus(
  healthyOpeningPieces,
  0,
  3
);

const sameBoardAfterOpening = getActivityStatus(
  healthyOpeningPieces,
  0,
  4
);

assert.equal(healthyOpening.openingBoost, 15);
assert.equal(
  healthyOpening.activity,
  Math.min(95, sameBoardAfterOpening.activity + 15)
);
assert.ok(healthyOpening.activity <= 95);


const threeRoads = getActivityStatus(
  pieces([2, 3, 5]),
  0,
  0
);

assert.equal(threeRoads.legal, 3);
assert.equal(threeRoads.openingBoost, 0);
assert.ok(threeRoads.activity <= 22);


const twoRoadPieces =
  pieces([2, 3, 5]);

blockCombination(twoRoadPieces[0], twoRoadPieces[1]);

const twoRoads = getActivityStatus(
  twoRoadPieces,
  0,
  0
);

assert.equal(twoRoads.legal, 2);
assert.ok(twoRoads.activity <= 12);


const oneRoadPieces =
  pieces([2, 3, 5]);

blockCombination(oneRoadPieces[0], oneRoadPieces[1]);
blockCombination(oneRoadPieces[2], oneRoadPieces[0]);

const oneRoad = getActivityStatus(
  oneRoadPieces,
  0,
  0
);

assert.equal(oneRoad.legal, 1);
assert.ok(oneRoad.activity <= 5);


const depletedActivity = getActivityStatus(
  pieces([2, 4]),
  0,
  0
);

assert.ok(depletedActivity.legal > 0);
assert.equal(depletedActivity.activity, 0);


const openFour = getActivityStatus(
  pieces([2, 4, 8, 16]),
  0
);

assert.ok(openFour.legal >= 8);
assert.ok(openFour.activity >= 85);


const openSix = getActivityStatus(
  pieces([2, 4, 8, 16, 32, 64]),
  0
);

assert.ok(openSix.activity >= 70);


const constrainedSeven = getActivityStatus(
  pieces([2, 3, 5, 7, 11, 13, 17]),
  0
);

assert.ok(constrainedSeven.activity < openSix.activity);
assert.ok(constrainedSeven.activity >= 55);


const crowdedEight = getActivityStatus(
  pieces([2, 3, 5, 7, 11, 13, 17, 19]),
  0
);

assert.ok(crowdedEight.legal > 0);
assert.ok(crowdedEight.activity <= 60);


const fullWithManyReductions = getActivityStatus(
  pieces([2, 4, 6, 8, 10, 12, 14, 16, 18]),
  0
);

assert.equal(fullWithManyReductions.combineLegal, 0);
assert.ok(fullWithManyReductions.reduceLegal > 1);
assert.equal(fullWithManyReductions.dead, false);
assert.ok(fullWithManyReductions.activity <= 35);


const fullWithOneReduction = getActivityStatus(
  pieces([2, 4, 3, 5, 7, 11, 13, 17, 19]),
  0
);

assert.equal(fullWithOneReduction.combineLegal, 0);
assert.equal(fullWithOneReduction.reduceLegal, 1);
assert.ok(
  fullWithOneReduction.activity <
  fullWithManyReductions.activity
);


const fullDead = getActivityStatus(
  pieces([2, 3, 5, 7, 11, 13, 17, 19, 23]),
  0
);

assert.equal(fullDead.combineLegal, 0);
assert.equal(fullDead.reduceLegal, 0);
assert.equal(fullDead.dead, true);
assert.equal(fullDead.activity, 0);


const partialDead = getActivityStatus(
  pieces([2]),
  0
);

assert.equal(partialDead.dead, true);
assert.equal(partialDead.activity, 0);


const densityZero = getActivityStatus(
  pieces([2, 4, 8, 16]),
  0
);

const densityNine = getActivityStatus(
  pieces([2, 4, 8, 16]),
  9
);

assert.equal(densityZero.activity, densityNine.activity);


assert.equal(getActivityText(100), "非常宽松");
assert.equal(getActivityText(85), "非常宽松");
assert.equal(getActivityText(84), "选择很多");
assert.equal(getActivityText(70), "选择很多");
assert.equal(getActivityText(69), "还有余地");
assert.equal(getActivityText(55), "还有余地");
assert.equal(getActivityText(54), "逐渐受限");
assert.equal(getActivityText(40), "逐渐受限");
assert.equal(getActivityText(39), "有些拥挤");
assert.equal(getActivityText(25), "有些拥挤");
assert.equal(getActivityText(24), "快没路了");
assert.equal(getActivityText(10), "快没路了");
assert.equal(getActivityText(9), "只剩一线");
assert.equal(getActivityText(1), "只剩一线");
assert.equal(getActivityText(0), "无路可走");


const liveThreePieceGame = resolveGameOver(
  createGameState([2, 3, 5])
);

assert.equal(liveThreePieceGame.gameOver, false);


const depletedStart = resolveGameOver(
  createGameState([2, 4])
);

assert.equal(depletedStart.gameOver, true);
assert.equal(depletedStart.gameOverReason, "board_depleted");


const reductionState = createGameState([2, 8, 4]);
const settledDepletion = applyAction(reductionState, {
  type: "reduce",
  indexes: [1, 2]
});

assert.equal(settledDepletion.steps, 1);
assert.equal(settledDepletion.board.filter(Boolean).length, 2);
assert.ok(settledDepletion.latestCollection);
assert.equal(settledDepletion.gameOver, true);
assert.equal(settledDepletion.gameOverReason, "board_depleted");
assert.strictEqual(
  applyAction(settledDepletion, {
    type: "combine",
    indexes: [0, 1]
  }),
  settledDepletion
);


const noLegalState = createGameState(
  [2, 3, 5]
);

noLegalState.board = pieces(
  [2, 3, 5, 7, 11, 13, 17, 19, 23]
);

const noLegalGameOver = resolveGameOver(noLegalState);

assert.equal(noLegalGameOver.gameOver, true);
assert.equal(noLegalGameOver.gameOverReason, "no_legal_actions");


for(const count of [0, 1, 2]){
  const state = createGameState([2, 4, 8]);
  state.board = state.board.map((piece, index) =>
    index < count ? piece : null
  );
  const ended = resolveGameOver(state);
  assert.equal(ended.gameOver, true);
  assert.equal(ended.gameOverReason, "board_depleted");
}


const simulationState = createSimulationState([2, 8, 4]);
assert.equal(
  applySimulationAction(simulationState, {
    type: "reduce",
    indexes: [1, 2]
  }),
  true
);
assert.equal(simulationState.steps, 1);
assert.equal(simulationState.board.filter(Boolean).length, 2);
assert.equal(getSimulationLegalActions(simulationState).length, 0);


console.log("activityStatus tests passed");
