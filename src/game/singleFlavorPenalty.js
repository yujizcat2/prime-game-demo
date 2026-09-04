import { isNormalFoodType } from "./rules";
import { isCompoundPiece } from "./compound";

export const MIN_SINGLE_FLAVOR_NORMAL_PIECES = 5;

export function getSingleFlavorNormalPieces(board){
  return (board ?? []).filter(piece =>
    piece && !isCompoundPiece(piece) && piece.value !== 1 && isNormalFoodType(piece.foodType)
  );
}

export function areAllNormalPiecesSameFoodType(board){
  const normalPieces = getSingleFlavorNormalPieces(board);
  return normalPieces.length > 0
    && new Set(normalPieces.map(piece => piece.foodType)).size === 1;
}

export function isSingleFlavorBoard(board){
  const normalPieces = getSingleFlavorNormalPieces(board);
  return normalPieces.length >= MIN_SINGLE_FLAVOR_NORMAL_PIECES
    && areAllNormalPiecesSameFoodType(board);
}

export function markSingleFlavorBoardPieces(state){
  if(!state || !isSingleFlavorBoard(state.board)) return state;

  let newlyPenalizedCount = 0;
  const board = state.board.map(piece => {
    if(!piece || isCompoundPiece(piece) || piece.singleFlavorPenalty === true) return piece;
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
    firstSingleFlavorNormalPieceCount:
      state.firstSingleFlavorNormalPieceCount
      ?? getSingleFlavorNormalPieces(board).length,
    singleFlavorTriggerCount: (state.singleFlavorTriggerCount ?? 0) + 1
  };
}
