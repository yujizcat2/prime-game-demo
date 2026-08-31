import { createOriginSnapshot } from "./numberOrigin";
import {
  getHeaterAvailability,
  getCurrentHeaterPrice,
  isHeaterTarget
} from "./heaterPricing";

export const HEATER_COST_STEP = 10;

export function getHeaterCost(state){
  return getCurrentHeaterPrice(state);
}

export { isHeaterTarget };

export function canUseHeaterOnPiece(state, targetIndex){
  const price = getCurrentHeaterPrice(state);
  return Boolean(
    state
    && price
    && (state.money ?? 0) >= price
    && Number.isInteger(targetIndex)
    && isHeaterTarget(state.board?.[targetIndex])
  );
}

export function canUseHeater(state){
  return getHeaterAvailability(state).canEnter;
}

export function applyHeater(state, targetIndex){
  if(!canUseHeaterOnPiece(state, targetIndex)) return state;

  const cost = getCurrentHeaterPrice(state);
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
      price: cost
    }
  };
}
