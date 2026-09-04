import { FOOD_TYPES } from "./rules";
import { getNativeFoodType } from "./nativeFoodTypes";
import { GAME_MODES } from "./eightPalaceKeys";

function isAtStepLimit(state){
  return ![GAME_MODES.EIGHT_PALACE, GAME_MODES.SIMPLE_EIGHT_PALACE].includes(state?.gameMode)
    && state.steps >= state.stepLimit;
}

export function getRestoreOutcome(piece, index){
  const nativeFoodType = getNativeFoodType(index);
  const restoredFoodType = index === 4 ? FOOD_TYPES.DRINK : nativeFoodType;
  if(!piece || !restoredFoodType || piece.foodType === restoredFoodType) return null;
  return {
    piece: {
      ...piece,
      value: index === 4 ? piece.value + 100 : piece.value,
      foodType: restoredFoodType
    },
    valueBefore: piece.value,
    valueAfter: index === 4 ? piece.value + 100 : piece.value,
    foodTypeBefore: piece.foodType,
    foodTypeAfter: restoredFoodType
  };
}

export function canRestorePiece(state, index){
  if(!state || state.gameOver || isAtStepLimit(state)) return false;
  return Boolean(
    Number.isInteger(index)
    && (state.restoreCount ?? 0) > 0
    && getRestoreOutcome(state.board?.[index], index)
  );
}

export function getLegalRestoreActions(state){
  if(!state || state.gameOver || isAtStepLimit(state)) return [];
  return (state.board ?? []).flatMap((piece, index) =>
    piece && canRestorePiece(state, index) ? [{type: "restore", indexes: [index]}] : []
  );
}

export function applyRestore(state, index){
  if(!canRestorePiece(state, index)) return state;
  const outcome = getRestoreOutcome(state.board[index], index);
  const board = [...state.board];
  board[index] = outcome.piece;
  const nextState = {
    ...state,
    board,
    restoreCount: 0,
    gameOver: false,
    gameOverReason: null
  };
  return {
    ...nextState,
    latestRestoreUse: {
      targetIndex: index,
      stepBefore: state.steps,
      stepAfter: state.steps,
      scoreBefore: state.score,
      scoreAfter: state.score,
      ...outcome
    }
  };
}
