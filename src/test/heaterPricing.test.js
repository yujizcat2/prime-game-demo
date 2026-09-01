import assert from "node:assert/strict";
import { createGameState, resolveGameOver } from "../game/gameEngine";
import { applyHeater, canUseHeater, canUseHeaterOnPiece } from "../game/heater";
import {
  getCurrentHeaterPrice,
  getHeaterAvailability,
  getHeaterBoardAdjustment,
  getNormalLegalActionCount
} from "../game/heaterPricing";
import { BASE_FOOD_TYPES } from "../game/rules";
import { getScoreCandidateActions } from "../ai/eightPalaceScoreAI";

const foodTypes = BASE_FOOD_TYPES;
const makeState = (values, extra = {}) => ({
  ...createGameState(values.map((value, index) => ({
    value,
    foodType: foodTypes[0],
    boardIndex: index,
    gameMode: "eightPalace"
  }))),
  ...extra
});

const low = makeState([2, 3], {heaterUseCount: 1});
const medium = makeState([2, 3, 5], {heaterUseCount: 1});
const high = makeState([2, 3, 5, 7], {heaterUseCount: 1});

assert.equal(getCurrentHeaterPrice(makeState([2, 3])), 10, "first use is always ¥10");
assert.ok(getNormalLegalActionCount(low) <= 2);
assert.ok(getNormalLegalActionCount(medium) >= 6);
assert.ok(getNormalLegalActionCount(high) >= 6);
assert.deepEqual([0, 2, 3, 5, 6, 20].map(getHeaterBoardAdjustment), [0, 0, 5, 5, 10, 10]);
assert.equal(getCurrentHeaterPrice(low), 20);
assert.equal(getCurrentHeaterPrice(medium), 30);
assert.equal(getCurrentHeaterPrice(high), 30);
assert.equal(getCurrentHeaterPrice({...low, heaterUseCount: 2}), 30);
assert.equal(getCurrentHeaterPrice({...medium, heaterUseCount: 2}), 40);
assert.equal(getCurrentHeaterPrice({...high, heaterUseCount: 2}), 40);

const uniform = {...medium, money: 30};
assert.equal(getCurrentHeaterPrice(uniform), 30);
assert.equal(canUseHeaterOnPiece(uniform, 0), true);
assert.equal(canUseHeaterOnPiece(uniform, 1), true);
assert.equal(canUseHeaterOnPiece({...uniform, money: 29}, 0), false);
assert.equal(getHeaterAvailability(uniform).canEnter, true);
assert.equal(getHeaterAvailability({...uniform, money: 29}).canEnter, false);
assert.equal(getHeaterAvailability(makeState([101], {money: 100})).canEnter, false);

const heated = applyHeater(uniform, 1);
assert.equal(heated.board[1].value, 4);
assert.equal(heated.money, 0, "current tier is deducted exactly");
assert.equal(heated.heaterUseCount, 2);
assert.equal(heated.steps, uniform.steps);
assert.equal(heated.score, uniform.score);
assert.equal(heated.board[1].origin.type, "heater");
assert.equal(getCurrentHeaterPrice(heated), 40, "next price uses new count and board");

const rejected = applyHeater({...uniform, money: 29}, 1);
assert.equal(rejected.money, 29);
assert.equal(rejected.heaterUseCount, 1);
assert.equal(applyHeater(makeState([101], {money: 100}), 0).board[0].value, 101);

const rescued = resolveGameOver({...makeState([17]), money: 10});
assert.equal(rescued.gameOver, false, "uniform price allows heater rescue");
const unaffordableDeadlock = resolveGameOver({...makeState([17]), money: 9});
assert.equal(unaffordableDeadlock.gameOver, true);

const aiActions = getScoreCandidateActions(uniform, {allowHeater: true});
const heaterActions = aiActions.filter(action => action.type === "heater");
assert.equal(heaterActions.length, 3);
assert.ok(heaterActions.every(action => action.price === undefined));
assert.equal(
  getScoreCandidateActions({...uniform, money: 29}, {allowHeater: true}).some(action => action.type === "heater"),
  false
);
assert.equal(getScoreCandidateActions(uniform).some(action => action.type === "heater"), true);
assert.equal(canUseHeater(uniform), true);

console.log("heater unified pricing tests passed");
