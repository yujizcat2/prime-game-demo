import assert from "node:assert/strict";

import {
  getActivityStatus,
  getActivityText
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


console.log("activityStatus tests passed");
