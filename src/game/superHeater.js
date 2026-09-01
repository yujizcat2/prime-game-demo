import { applyHeaterIncrement, isHeaterTarget } from "./heater";
import { getCurrentSuperHeaterPrice } from "./superHeaterPricing";

export function canUseSuperHeater(state){
  const pieces = (state?.board ?? []).filter(Boolean);
  return Boolean(
    state
    && !state.gameOver
    && state.steps < state.stepLimit
    && pieces.length > 0
    && pieces.every(isHeaterTarget)
    && (state.money ?? 0) >= getCurrentSuperHeaterPrice(state)
  );
}

export function applySuperHeater(state){
  if(!canUseSuperHeater(state)) return state;

  const price = getCurrentSuperHeaterPrice(state);
  const board = state.board.map(piece => piece ? applyHeaterIncrement(piece) : null);
  return {
    ...state,
    board,
    money: (state.money ?? 0) - price,
    superHeaterUseCount: (state.superHeaterUseCount ?? 0) + 1,
    gameOver: false,
    gameOverReason: null,
    latestSuperHeaterUse: {
      price,
      cost: price,
      affectedCount: board.filter(Boolean).length,
      moneyBefore: state.money ?? 0,
      moneyAfter: (state.money ?? 0) - price,
      stepBefore: state.steps,
      stepAfter: state.steps,
      scoreBefore: state.score,
      scoreAfter: state.score
    }
  };
}
