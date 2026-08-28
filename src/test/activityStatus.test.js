import assert from "node:assert/strict";

import {
  getActivityStatus
} from "../game/activityStatus";


function pieces(values){
  return values.map((value, index) => ({
    id: `piece-${index}`,
    value,
    foodType: "meat",
    parents: null,
    parentFoods: null
  }));
}


const activeBoard = getActivityStatus(
  pieces([2, 4]),
  0
);

assert.equal(activeBoard.dead, false);
assert.equal(activeBoard.combineLegal, 1);
assert.equal(activeBoard.reduceLegal, 1);
assert.ok(activeBoard.activity > 0);


const fullButPlayable = getActivityStatus(
  pieces([2, 4, 6, 8, 10, 12, 14, 16, 18]),
  0
);

assert.equal(fullButPlayable.combineLegal, 0);
assert.ok(fullButPlayable.reduceLegal > 0);
assert.equal(fullButPlayable.dead, false);
assert.equal(fullButPlayable.blockedCombineFactor, 0);


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


const maxDensity = getActivityStatus(
  pieces([2, 4]),
  9
);

assert.equal(maxDensity.primeDensity, 9);
assert.equal(maxDensity.densityFactor, 0.5);


console.log("activityStatus tests passed");
