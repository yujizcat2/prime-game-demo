import { createOriginSnapshot } from "./numberOrigin";

export const HEATER_COST_STEP = 10;

export function getHeaterCost(state){
  return ((state?.heaterUseCount ?? 0) + 1) * HEATER_COST_STEP;
}

export function isHeaterTarget(piece){
  return Number.isInteger(piece?.value) && piece.value >= 2 && piece.value <= 100;
}

export function canUseHeaterOnPiece(state, targetIndex){
  return Boolean(
    state
    && (state.money ?? 0) >= getHeaterCost(state)
    && Number.isInteger(targetIndex)
    && isHeaterTarget(state.board?.[targetIndex])
  );
}

export function canUseHeater(state){
  return Boolean(
    state
    && (state.money ?? 0) >= getHeaterCost(state)
    && state.board?.some(isHeaterTarget)
  );
}

export function applyHeater(state, targetIndex){
  if(!canUseHeaterOnPiece(state, targetIndex)) return state;

  const cost = getHeaterCost(state);
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
      cost
    }
  };
}
