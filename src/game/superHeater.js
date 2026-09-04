import { applyHeaterIncrement, isHeaterTarget } from "./heater";
import { GAME_MODES } from "./eightPalaceKeys";

export function canUseSuperHeater(state){
  const pieces = (state?.board ?? []).filter(Boolean);
  return Boolean(
    state
    && !state.gameOver
    && ([GAME_MODES.EIGHT_PALACE, GAME_MODES.SIMPLE_EIGHT_PALACE].includes(state.gameMode)
      || state.steps < state.stepLimit)
    && pieces.length > 0
    && pieces.every(isHeaterTarget)
    && (state.superHeaterCount ?? 0) > 0
  );
}

export function applySuperHeater(state){
  if(!canUseSuperHeater(state)) return state;

  const board = state.board.map(piece => piece ? applyHeaterIncrement(piece) : null);
  return {
    ...state,
    board,
    superHeaterCount: 0,
    gameOver: false,
    gameOverReason: null,
    latestSuperHeaterUse: {
      affectedCount: board.filter(Boolean).length,
      stepBefore: state.steps,
      stepAfter: state.steps,
      scoreBefore: state.score,
      scoreAfter: state.score
    }
  };
}
