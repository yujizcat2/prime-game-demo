import { createOriginSnapshot } from "./numberOrigin";
import {
  getFixedHeaterPrice,
  getHeaterAvailability,
  getHeaterPriceBreakdown,
  HEATER_PRICING_MODES
} from "./heaterPricing";

export const HEATER_COST_STEP = 10;

export function getHeaterCost(state, targetIndex = null, pricingMode = state?.heaterPricingMode){
  if(Number.isInteger(targetIndex)) return getHeaterPriceBreakdown(state, targetIndex, pricingMode)?.price ?? 0;
  if((pricingMode ?? state?.heaterPricingMode) === HEATER_PRICING_MODES.FIXED) return getFixedHeaterPrice(state);
  const prices = (state?.board ?? []).flatMap((piece, index) => {
    const price = getHeaterPriceBreakdown(state, index, pricingMode)?.price;
    return price ? [price] : [];
  });
  return prices.length ? Math.min(...prices) : HEATER_COST_STEP;
}

export function isHeaterTarget(piece){
  return Number.isInteger(piece?.value) && piece.value >= 2 && piece.value <= 100;
}

export function canUseHeaterOnPiece(state, targetIndex, pricingMode = state?.heaterPricingMode){
  const price = getHeaterPriceBreakdown(state, targetIndex, pricingMode)?.price;
  return Boolean(
    state
    && price
    && (state.money ?? 0) >= price
    && Number.isInteger(targetIndex)
    && isHeaterTarget(state.board?.[targetIndex])
  );
}

export function canUseHeater(state, pricingMode = state?.heaterPricingMode){
  return Boolean(state && getHeaterAvailability(state, pricingMode).canEnter);
}

export function applyHeater(state, targetIndex, pricingMode = state?.heaterPricingMode){
  if(!canUseHeaterOnPiece(state, targetIndex, pricingMode)) return state;

  const priceBreakdown = getHeaterPriceBreakdown(state, targetIndex, pricingMode);
  const cost = priceBreakdown.price;
  const previousPiece = state.board[targetIndex];
  const board = [...state.board];
  board[targetIndex] = {
    ...previousPiece,
    value: previousPiece.value + 1,
    origin: {
      type: "heater",
      from: createOriginSnapshot(previousPiece)
    }
  };

  return {
    ...state,
    board,
    money: (state.money ?? 0) - cost,
    heaterUseCount: (state.heaterUseCount ?? 0) + 1,
    gameOver: false,
    gameOverReason: null,
    latestHeaterUse: {
      targetIndex,
      fromValue: previousPiece.value,
      toValue: previousPiece.value + 1,
      cost,
      price: cost,
      pricingMode: priceBreakdown.pricingMode,
      priceBreakdown
    }
  };
}
