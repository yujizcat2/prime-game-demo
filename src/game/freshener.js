export function isFreshenerTarget(piece){
  return Boolean(piece);
}

export function canUseFreshenerOnPiece(state, targetIndex){
  return Boolean(
    state
    && (state.freshenerCount ?? 0) > 0
    && Number.isInteger(targetIndex)
    && isFreshenerTarget(state.board?.[targetIndex])
  );
}

export function canUseFreshener(state){
  return Boolean((state?.freshenerCount ?? 0) > 0 && state?.board?.some(isFreshenerTarget));
}

export function applyFreshener(state, targetIndex){
  if(!canUseFreshenerOnPiece(state, targetIndex)) return state;

  const board = [...state.board];
  board[targetIndex] = {
    ...board[targetIndex],
    bornAt: state.totalActionMinutes ?? 0,
    ...(Number.isFinite(board[targetIndex].processedAgeMinutes) ? {processedAgeMinutes: 0} : {})
  };

  return {
    ...state,
    board,
    freshenerCount: (state.freshenerCount ?? 0) - 1,
    gameOver: false,
    gameOverReason: null,
    latestFreshenerUse: {targetIndex}
  };
}
