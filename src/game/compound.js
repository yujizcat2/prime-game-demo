import { getNativeFoodType } from "./nativeFoodTypes";

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

function isOrdinaryPiece(piece){
  return Boolean(piece && !isCompoundPiece(piece) && Number.isFinite(piece.value) && piece.value !== 1);
}

function getValidPartner(state, compound){
  const partner = compound?.compoundPartner;
  const current = state?.board?.[partner?.index];
  return partner
    && isOrdinaryPiece(current)
    && current.id === partner.id
    && current.value === partner.value
    && current.foodType === partner.foodType
    && (current.purity ?? null) === partner.purity
    ? current
    : null;
}

export function getCompoundRecombination(state, indexA, indexB){
  if(!state || state.gameOver || state.daySettlement || !getCompoundType(indexA, indexB)) return null;
  const first = state.board?.[indexA];
  const second = state.board?.[indexB];
  if(!isCompoundPiece(first) || !isCompoundPiece(second)) return null;
  const firstPartner = getValidPartner(state, first);
  const secondPartner = getValidPartner(state, second);
  if(!firstPartner || !secondPartner) return null;
  const consumedIndexes = [first.compoundPartner.index, second.compoundPartner.index];
  if(new Set([indexA, indexB, ...consumedIndexes]).size !== 4) return null;
  return {
    kind: "recombine",
    firstValue: first.value + secondPartner.value,
    secondValue: second.value + firstPartner.value,
    firstFoodType: getNativeFoodType(indexA),
    secondFoodType: getNativeFoodType(indexB),
    consumedIndexes,
    targetIndexes: [indexA, indexB]
  };
}

export function canCompoundCells(state, indexA, indexB){
  if(!state || state.gameOver || state.daySettlement || !getCompoundType(indexA, indexB)) return false;
  const first = state.board?.[indexA];
  const second = state.board?.[indexB];
  if(isCompoundPiece(first) || isCompoundPiece(second)){
    return Boolean(getCompoundRecombination(state, indexA, indexB));
  }
  return isOrdinaryPiece(first) && isOrdinaryPiece(second) && first.value !== second.value;
}

function createRecombinedPiece(source, value, foodType){
  return {
    id: source.id,
    value,
    foodType,
    purity: "pure",
    parents: null,
    parentFoods: null,
    sourceKey: null,
    origin: null,
    singleFlavorPenalty: false
  };
}

export function compoundCells(state, indexA, indexB){
  if(!canCompoundCells(state, indexA, indexB)) return state;
  const recombination = getCompoundRecombination(state, indexA, indexB);
  const board = [...state.board];
  if(recombination){
    board[indexA] = createRecombinedPiece(state.board[indexA], recombination.firstValue, recombination.firstFoodType);
    board[indexB] = createRecombinedPiece(state.board[indexB], recombination.secondValue, recombination.secondFoodType);
    recombination.consumedIndexes.forEach(index => { board[index] = null; });
    return {...state, board};
  }

  const first = state.board[indexA];
  const partner = state.board[indexB];
  board[indexA] = {
    ...first,
    isCompound: true,
    compoundPartner: {
      id: partner.id,
      index: indexB,
      value: partner.value,
      foodType: partner.foodType,
      purity: partner.purity ?? null
    }
  };
  return {...state, board};
}
