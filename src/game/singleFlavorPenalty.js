import { isNormalFoodType } from "./rules";

export function isSingleFlavorBoard(board){
  const normalPieces = (board ?? []).filter(piece =>
    piece && piece.value !== 1 && isNormalFoodType(piece.foodType)
  );
  return normalPieces.length > 0
    && new Set(normalPieces.map(piece => piece.foodType)).size === 1;
}

export function markSingleFlavorBoardPieces(state){
  if(!state || !isSingleFlavorBoard(state.board)) return state;

  let newlyPenalizedCount = 0;
  const board = state.board.map(piece => {
    if(!piece || piece.singleFlavorPenalty === true) return piece;
    newlyPenalizedCount++;
    return {...piece, singleFlavorPenalty: true};
  });

  if(newlyPenalizedCount === 0) return state;

  return {
    ...state,
    board,
    singleFlavorTriggered: true,
    singleFlavorFirstTriggeredStep:
      state.singleFlavorFirstTriggeredStep ?? state.steps ?? 0,
    singleFlavorFirstTriggeredBoardCount:
      state.singleFlavorFirstTriggeredBoardCount
      ?? board.filter(Boolean).length,
    singleFlavorTriggerCount: (state.singleFlavorTriggerCount ?? 0) + 1
  };
}
