import { getNativeFoodType } from "./nativeFoodTypes";
import { getFoodName } from "../data/food/foodRegistry";
import { consumeStep } from "./gameState";

export const COMPOUND_EDGES = Object.freeze({
  "0-1": "A", "1-2": "B", "3-4": "C", "4-5": "D", "6-7": "E", "7-8": "F",
  "0-3": "G", "3-6": "H", "1-4": "I", "4-7": "J", "2-5": "K", "5-8": "L"
});

export const COMPOUND_COOKING_METHODS = Object.freeze({
  A: "炒", B: "煎", C: "蒸", D: "烧", E: "烤", F: "焖",
  G: "炖", H: "烩", I: "拌", J: "煮", K: "卤", L: "炸"
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

function getPieceName(piece){
  return piece?.displayName ?? piece?.name ?? getFoodName(piece?.value, piece?.foodType);
}

function getStoredPartner(compound){
  const partner = compound?.compoundPartner;
  return partner && Number.isFinite(partner.value) ? partner : null;
}

export function getCompoundRecombination(state, indexA, indexB){
  if(!state || state.gameOver || state.daySettlement || !getCompoundType(indexA, indexB)) return null;
  const first = state.board?.[indexA];
  const second = state.board?.[indexB];
  if(!isCompoundPiece(first) || !isCompoundPiece(second)) return null;
  const firstPartner = getStoredPartner(first);
  const secondPartner = getStoredPartner(second);
  if(!firstPartner || !secondPartner) return null;
  const exchangedFirst = first.value + secondPartner.value;
  const exchangedSecond = second.value + firstPartner.value;
  const difference = Math.abs(exchangedFirst - exchangedSecond);
  if(difference === 0) return null;
  const total = first.value + firstPartner.value + second.value + secondPartner.value;
  return {
    kind: "recombine",
    firstValue: difference,
    secondValue: total - difference,
    firstFoodType: getNativeFoodType(indexA),
    secondFoodType: getNativeFoodType(indexB),
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
  const displayName = getFoodName(value, foodType);
  return {
    id: source.id,
    value,
    name: displayName,
    displayName,
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
    return consumeStep({...state, steps: state.steps ?? 0, board});
  }

  const first = state.board[indexA];
  const partner = state.board[indexB];
  const compoundType = getCompoundType(indexA, indexB);
  const compoundCookingMethod = COMPOUND_COOKING_METHODS[compoundType];
  const firstName = getPieceName(first);
  const partnerName = getPieceName(partner);
  board[indexA] = {
    ...first,
    isCompound: true,
    compoundType,
    compoundCookingMethod,
    compoundDishName: `${firstName}${compoundCookingMethod}${partnerName}`,
    compoundPartner: {
      id: partner.id,
      index: indexB,
      value: partner.value,
      foodType: partner.foodType,
      purity: partner.purity ?? null,
      name: partnerName
    }
  };
  board[indexB] = null;
  return consumeStep({...state, steps: state.steps ?? 0, board});
}
