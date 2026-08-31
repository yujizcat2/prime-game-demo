import assert from "node:assert/strict";
import { createGameState } from "../game/gameState";
import { applyHeater, canUseHeater, canUseHeaterOnPiece } from "../game/heater";
import {
  BASE_HEATER_PRICE,
  getAffordableHeaterTargets,
  getHeaterFatigue,
  getHeaterPriceBreakdown,
  getHeaterTargetOpportunity,
  getOpportunityPremium,
  roundUpToNearest10
} from "../game/heaterPricing";
import { BASE_FOOD_TYPES } from "../game/rules";
import { createCombinePairKey } from "../game/combineHistory";
import { getScoreCandidateActions } from "../ai/eightPalaceScoreAI";

const [land, aquatic] = BASE_FOOD_TYPES;
const makeState = (values, extra = {}) => ({
  ...createGameState(values.map((value, index) => ({
    value,
    foodType: index % 2 ? aquatic : land,
    boardIndex: index,
    gameMode: "eightPalace"
  }))),
  ...extra
});

assert.equal(BASE_HEATER_PRICE, 10);
assert.equal(makeState([17]).heaterPricingMode, "dynamicV1");
assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(getHeaterFatigue), [0, 10, 20, 30, 50, 70, 110, 140]);
assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(getOpportunityPremium), [0, 10, 20, 30, 30, 50, 50, 70]);
assert.equal(roundUpToNearest10(10), 10);
assert.equal(roundUpToNearest10(11), 20);

const rich = makeState([17, 5], {money: 500});
const opportunity = getHeaterTargetOpportunity(rich, 0);
const dynamic = getHeaterPriceBreakdown(rich, 0, "dynamicV1");
assert.equal(dynamic.basePrice, 10);
assert.equal(dynamic.fatigue, 0);
assert.equal(dynamic.opportunityPremium, getOpportunityPremium(opportunity.opportunityScore));
assert.equal(dynamic.price, dynamic.basePrice + dynamic.fatigue + dynamic.opportunityPremium);

const tired = getHeaterPriceBreakdown({...rich, heaterUseCount: 4}, 0, "dynamicV1");
assert.equal(tired.fatigue, 50);
assert.equal(tired.price - dynamic.price, 50);

const fixed = getHeaterPriceBreakdown({...rich, heaterUseCount: 2}, 0, "fixed");
assert.equal(fixed.price, 30);
assert.equal(fixed.opportunityPremium, 0);

const applied = applyHeater(rich, 0, "dynamicV1");
assert.equal(applied.money, rich.money - dynamic.price);
assert.equal(applied.heaterUseCount, 1);
assert.equal(applied.latestHeaterUse.price, dynamic.price);
assert.deepEqual(applied.latestHeaterUse.priceBreakdown, dynamic);

const exactMoney = {...rich, money: dynamic.price};
assert.equal(canUseHeaterOnPiece(exactMoney, 0, "dynamicV1"), true);
assert.equal(canUseHeaterOnPiece({...exactMoney, money: dynamic.price - 1}, 0, "dynamicV1"), false);
assert.equal(canUseHeater(exactMoney, "dynamicV1"), true);
assert.ok(getAffordableHeaterTargets(exactMoney, "dynamicV1").some(target => target.index === 0));

const invalid = makeState([101], {money: 500});
assert.equal(getHeaterPriceBreakdown(invalid, 0, "dynamicV1"), null);
assert.equal(canUseHeater(invalid, "dynamicV1"), false);

const aiState = {...rich, money: dynamic.price};
const dynamicActions = getScoreCandidateActions(aiState, {allowHeater: true, heaterPricingMode: "dynamicV1"});
assert.ok(dynamicActions.some(action => action.type === "heater" && action.pricingMode === "dynamicV1"));
const poorActions = getScoreCandidateActions({...aiState, money: 0}, {allowHeater: true, heaterPricingMode: "dynamicV1"});
assert.equal(poorActions.some(action => action.type === "heater"), false);

const scoreBefore = rich.score;
assert.equal(applied.score, scoreBefore);
assert.equal(applied.steps, rich.steps);

const samples = [];
for(let first = 2; first <= 14; first++){
  for(let second = 2; second <= 14; second++){
    for(let third = 2; third <= 14; third++){
      const state = makeState([first, second, third], {money: 500});
      for(let index = 0; index < 3; index++){
        samples.push({state, index, opportunity: getHeaterTargetOpportunity(state, index)});
      }
    }
  }
}
const noOpportunity = samples.find(sample => sample.opportunity.opportunityScore === 0);
const reduceOpportunity = samples.find(sample => sample.opportunity.newReduceCount >= 2);
const combineOnlyOpportunity = samples.map(sample => {
  const target = sample.state.board[sample.index];
  const combineHistoryKeys = Object.fromEntries(
    sample.state.board.filter(Boolean).filter(piece => piece !== target)
      .map(piece => [createCombinePairKey(target, piece), true])
  );
  const state = {...sample.state, combineHistoryKeys};
  return {...sample, state, opportunity: getHeaterTargetOpportunity(state, sample.index)};
}).find(sample => sample.opportunity.newReduceCount === 0 && sample.opportunity.newCombineCount > 0);
let rescueOpportunity = null;
for(let first = 2; first <= 30 && !rescueOpportunity; first++){
  for(let second = 2; second <= 30 && !rescueOpportunity; second++){
    const base = makeState([first, second], {money: 500});
    const state = {
      ...base,
      combineHistoryKeys: {[createCombinePairKey(base.board[0], base.board[1])]: true}
    };
    for(let index = 0; index < 2; index++){
      const candidate = {state, index, opportunity: getHeaterTargetOpportunity(state, index)};
      if(candidate.opportunity.deadlockRescue) rescueOpportunity = candidate;
    }
  }
}
assert.ok(noOpportunity, "finds an opportunity-0 target");
assert.equal(getHeaterPriceBreakdown(noOpportunity.state, noOpportunity.index).opportunityPremium, 0);
assert.ok(reduceOpportunity, "finds a target creating multiple reduce actions");
assert.ok(getHeaterPriceBreakdown(reduceOpportunity.state, reduceOpportunity.index).opportunityPremium > 0);
assert.ok(combineOnlyOpportunity, "finds a target creating combine without reduce");
assert.ok(getHeaterPriceBreakdown(combineOnlyOpportunity.state, combineOnlyOpportunity.index).opportunityPremium > 0);
assert.equal(reduceOpportunity.opportunity.newReduceCount * 2 > combineOnlyOpportunity.opportunity.newCombineCount, true);
assert.ok(rescueOpportunity, "finds a deadlock rescue target");
assert.equal(rescueOpportunity.opportunity.rescueBonus, 4);

const differentTargetPrices = samples.find(sample => {
  const prices = sample.state.board.slice(0, 3).map((piece, index) => getHeaterPriceBreakdown(sample.state, index)?.price);
  return new Set(prices).size > 1;
});
assert.ok(differentTargetPrices, "the same board can have target-level prices");
const prices = differentTargetPrices.state.board.slice(0, 3).map((piece, index) => getHeaterPriceBreakdown(differentTargetPrices.state, index).price);
const cheapIndex = prices.indexOf(Math.min(...prices));
const expensiveIndex = prices.indexOf(Math.max(...prices));
const selectiveMoney = {...differentTargetPrices.state, money: prices[cheapIndex]};
assert.equal(canUseHeaterOnPiece(selectiveMoney, cheapIndex), true);
assert.equal(canUseHeaterOnPiece(selectiveMoney, expensiveIndex), false);
assert.equal(canUseHeater(selectiveMoney), true);
const rejected = applyHeater(selectiveMoney, expensiveIndex);
assert.equal(rejected, selectiveMoney);
assert.equal(rejected.money, selectiveMoney.money);
assert.equal(rejected.heaterUseCount, selectiveMoney.heaterUseCount);

console.log("heater pricing tests passed");
