import { consumeStep } from "./gameState";
import { FOOD_TYPES } from "./rules";
import { getNativeFoodType } from "./nativeFoodTypes";
import { getCurrentRestorePrice } from "./restorePricing";

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
  if(!state || state.gameOver || state.steps >= state.stepLimit) return false;
  return Boolean(
    Number.isInteger(index)
    && getRestoreOutcome(state.board?.[index], index)
    && (state.money ?? 0) >= getCurrentRestorePrice(state)
  );
}

export function getLegalRestoreActions(state){
  if(!state || state.gameOver || state.steps >= state.stepLimit) return [];
  return (state.board ?? []).flatMap((piece, index) =>
    piece && canRestorePiece(state, index) ? [{type: "restore", indexes: [index]}] : []
  );
}

export function applyRestore(state, index){
  if(!canRestorePiece(state, index)) return state;
  const price = getCurrentRestorePrice(state);
  const outcome = getRestoreOutcome(state.board[index], index);
  const board = [...state.board];
  board[index] = outcome.piece;
  const stepped = consumeStep({
    ...state,
    board,
    money: (state.money ?? 0) - price,
    restoreUseCount: (state.restoreUseCount ?? 0) + 1,
    gameOver: false,
    gameOverReason: null
  });
  return {
    ...stepped,
    latestRestoreUse: {
      targetIndex: index,
      price,
      cost: price,
      moneyBefore: state.money ?? 0,
      moneyAfter: (state.money ?? 0) - price,
      stepBefore: state.steps,
      stepAfter: stepped.steps,
      scoreBefore: state.score,
      scoreAfter: stepped.score,
      ...outcome
    }
  };
}
