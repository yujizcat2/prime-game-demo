export function getCombinePreviewPlacement(outcome){
  if(!outcome)return {showThirdCell:false,drinkIndex:null,ingredientIndex:null,resultPiece:null};
  return {
    showThirdCell:outcome.kind==="new",
    drinkIndex:outcome.kind==="wrap"?outcome.drinkIndex:null,
    ingredientIndex:outcome.kind==="wrap"?outcome.ingredientIndex:null,
    resultPiece:outcome.kind==="wrap"?outcome.piece:null
  };
}
