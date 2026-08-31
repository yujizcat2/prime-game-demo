import { getLegalActions } from "./gameActions";

export const HEATER_PRICING_MODES = Object.freeze({
  FIXED: "fixed",
  DYNAMIC_V1: "dynamicV1"
});

export const BASE_HEATER_PRICE = 10;
export const HEATER_RESCUE_BONUS = 4;

export function getHeaterFatigue(heaterUseCount = 0){
  if(heaterUseCount <= 0) return 0;
  if(heaterUseCount === 1) return 10;
  if(heaterUseCount === 2) return 20;
  if(heaterUseCount === 3) return 30;
  if(heaterUseCount === 4) return 50;
  if(heaterUseCount === 5) return 70;
  return (heaterUseCount - 4) * 30 + 50;
}

export function getOpportunityPremium(opportunityScore){
  if(opportunityScore <= 0) return 0;
  if(opportunityScore === 1) return 10;
  if(opportunityScore === 2) return 20;
  if(opportunityScore <= 4) return 30;
  if(opportunityScore <= 6) return 50;
  return 70;
}

export function roundUpToNearest10(value){
  return Math.ceil(value / 10) * 10;
}

function actionKey(action){
  if(action.index !== undefined) return `${action.type}:${action.index}`;
  return `${action.type}:${(action.indexes ?? []).join("-")}`;
}

function countNewActions(beforeActions, afterActions, type){
  const before = new Set(beforeActions.filter(action => action.type === type).map(actionKey));
  return afterActions.filter(action => action.type === type && !before.has(actionKey(action))).length;
}

export function getHeaterTargetOpportunity(state, targetIndex){
  const piece = state?.board?.[targetIndex];
  if(!Number.isInteger(piece?.value) || piece.value < 2 || piece.value > 100) return null;

  const activeState = {...state, gameOver: false, gameOverReason: null};
  const board = [...state.board];
  board[targetIndex] = {...piece, value: piece.value + 1};
  const beforeActions = getLegalActions(activeState);
  const afterActions = getLegalActions({...activeState, board});
  const newReduceCount = countNewActions(beforeActions, afterActions, "reduce");
  const newCombineCount = ["combine", "combine_ordered"].reduce(
    (sum, type) => sum + countNewActions(beforeActions, afterActions, type),
    0
  );
  const deadlockRescue = beforeActions.length === 0 && afterActions.length > 0;
  const rescueBonus = deadlockRescue ? HEATER_RESCUE_BONUS : 0;

  return {
    newReduceCount,
    newCombineCount,
    deadlockRescue,
    rescueBonus,
    opportunityScore: newReduceCount * 2 + newCombineCount + rescueBonus
  };
}

export function getFixedHeaterPrice(state){
  return ((state?.heaterUseCount ?? 0) + 1) * BASE_HEATER_PRICE;
}

export function getHeaterPriceBreakdown(
  state,
  targetIndex,
  pricingMode = state?.heaterPricingMode ?? HEATER_PRICING_MODES.DYNAMIC_V1
){
  const opportunity = getHeaterTargetOpportunity(state, targetIndex);
  if(!opportunity) return null;

  if(pricingMode === HEATER_PRICING_MODES.FIXED){
    const price = getFixedHeaterPrice(state);
    return {
      pricingMode,
      price,
      basePrice: BASE_HEATER_PRICE,
      fatigue: price - BASE_HEATER_PRICE,
      opportunityPremium: 0,
      opportunity: null
    };
  }

  const fatigue = getHeaterFatigue(state?.heaterUseCount ?? 0);
  const opportunityPremium = getOpportunityPremium(opportunity.opportunityScore);
  const rawPrice = BASE_HEATER_PRICE + fatigue + opportunityPremium;
  return {
    pricingMode: HEATER_PRICING_MODES.DYNAMIC_V1,
    price: roundUpToNearest10(rawPrice),
    rawPrice,
    basePrice: BASE_HEATER_PRICE,
    fatigue,
    opportunityPremium,
    opportunity
  };
}

export function getAffordableHeaterTargets(
  state,
  pricingMode = state?.heaterPricingMode ?? HEATER_PRICING_MODES.DYNAMIC_V1
){
  return (state?.board ?? []).flatMap((piece, index) => {
    if(!piece || piece.value < 2 || piece.value > 100) return [];
    const breakdown = getHeaterPriceBreakdown(state, index, pricingMode);
    return breakdown && (state.money ?? 0) >= breakdown.price
      ? [{index, ...breakdown}]
      : [];
  });
}

export function getHeaterAvailability(
  state,
  pricingMode = state?.heaterPricingMode ?? HEATER_PRICING_MODES.DYNAMIC_V1
){
  const targets = (state?.board ?? []).map((piece, index) => {
    if(!piece || piece.value < 2 || piece.value > 100) return null;
    const breakdown = getHeaterPriceBreakdown(state, index, pricingMode);
    return breakdown
      ? {index, ...breakdown, affordable: (state.money ?? 0) >= breakdown.price}
      : null;
  });

  return {
    targets,
    affordableTargets: targets.filter(target => target?.affordable),
    canEnter: targets.some(target => target?.affordable)
  };
}
