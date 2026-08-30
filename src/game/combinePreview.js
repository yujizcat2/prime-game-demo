export function getCombinePreviewPlacement(outcome){
  if(!outcome)return {showThirdCell:false,drinkIndex:null,ingredientIndex:null,resultPiece:null};
  return {
    showThirdCell:outcome.kind==="new",
    drinkIndex:outcome.kind==="burst"?outcome.drinkIndex:null,
    ingredientIndex:outcome.kind==="burst"?outcome.ingredientIndex:null,
    resultPiece:null
  };
}
