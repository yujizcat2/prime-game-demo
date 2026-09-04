import { createOriginSnapshot } from "./numberOrigin";
export function isHeaterTarget(piece){
  return Boolean(piece && Number.isInteger(piece.value) && piece.value >= 2 && piece.value <= 100);
}

export function canUseHeaterOnPiece(state, targetIndex){
  return Boolean(
    state
    && !state.gameOver
    && (state.heaterCount ?? 0) > 0
    && Number.isInteger(targetIndex)
    && isHeaterTarget(state.board?.[targetIndex])
  );
}

export function canUseHeater(state){
  return Boolean((state?.heaterCount ?? 0) > 0 && state?.board?.some(isHeaterTarget));
}

export function applyHeaterIncrement(piece){
  if(!isHeaterTarget(piece)) return null;
  return {
    ...piece,
    value: piece.value + 1,
    origin: {
      type: "heater",
      from: createOriginSnapshot(piece)
    }
  };
}

export function applyHeater(state, targetIndex){
  if(!canUseHeaterOnPiece(state, targetIndex)) return state;

  const previousPiece = state.board[targetIndex];
  const board = [...state.board];
  board[targetIndex] = applyHeaterIncrement(previousPiece);

  return {
    ...state,
    board,
    heaterCount: 0,
    gameOver: false,
    gameOverReason: null,
    latestHeaterUse: {
      targetIndex,
      fromValue: previousPiece.value,
      toValue: previousPiece.value + 1
    }
  };
}
