import { getFoodName } from "../data/food/foodRegistry";

export const COMPOUND_EDGES = Object.freeze({
  "0-1": "A", "1-2": "B", "3-4": "C", "4-5": "D", "6-7": "E", "7-8": "F",
  "0-3": "G", "3-6": "H", "1-4": "I", "4-7": "J", "2-5": "K", "5-8": "L"
});

export function isCompoundPiece(piece){
  return piece?.isCompound === true;
}

export function getCompoundType(indexA, indexB){
  if(indexA === indexB) return null;
  return COMPOUND_EDGES[[indexA, indexB].sort((left, right) => left - right).join("-")] ?? null;
}

export function canCompoundCells(state, indexA, indexB){
  if(!state || state.gameOver || state.daySettlement) return false;
  const first = state.board?.[indexA];
  const second = state.board?.[indexB];
  return Boolean(first && second && !isCompoundPiece(first) && !isCompoundPiece(second)
    && Number.isFinite(first.value) && Number.isFinite(second.value)
    && first.value !== 1 && second.value !== 1
    && first.value !== second.value && getCompoundType(indexA, indexB));
}

export function compoundCells(state, indexA, indexB){
  if(!canCompoundCells(state, indexA, indexB)) return state;
  const first = state.board[indexA];
  const second = state.board[indexB];
  const board = [...state.board];
  board[indexA] = {
    id: first.id,
    isCompound: true,
    compoundType: getCompoundType(indexA, indexB),
    value: Math.abs(first.value - second.value),
    parentNames: [
      getFoodName(first.value, first.foodType),
      getFoodName(second.value, second.foodType)
    ]
  };
  board[indexB] = null;
  return {...state, board};
}
