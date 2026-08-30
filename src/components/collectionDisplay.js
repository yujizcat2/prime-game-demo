export function getCollectionSourceText(card){
  if(card?.originType === "reduce") return "被约分的";
  if(Array.isArray(card?.parents) && card.parents.length > 0){
    return card.parents.map(parent => parent.name).join(" · ");
  }
  return "原生";
}
