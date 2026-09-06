export function getCombinePreviewPlacement(outcome){
  if(!outcome)return {showThirdCell:false,drinkIndex:null,ingredientIndex:null,resultPiece:null};
  return {
    showThirdCell:outcome.kind==="new",
    drinkIndex:outcome.kind==="absorb"?outcome.drinkIndex:null,
    ingredientIndex:outcome.kind==="absorb"?outcome.ingredientIndex:null,
    resultPiece:outcome.kind==="absorb"?outcome.piece:null
  };
}
