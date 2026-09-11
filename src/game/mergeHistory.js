import { getFoodDisplayName } from "../data/food/foodRegistry";

function isSameHistoryIdentity(left, right){
  return left?.value === right?.value && left?.foodType === right?.foodType;
}

export function hasMergeHistoryFoodType(card, foodType){
  return (card?.mergeHistory ?? []).some(item => item?.role === "result" && item.foodType === foodType);
}

export function createMergedHistory(resultFoodType, ...cards){
  const history=[];
  const add=item=>{
    if(item?.value == null || history.some(entry=>isSameHistoryIdentity(entry,item)))return;
    history.push({value:item.value,foodType:item.foodType??resultFoodType,name:getFoodDisplayName(item),role:"parent"});
  };
  cards.forEach(add);
  return history;
}

export function updateMergeHistory(card, ...relatedCards){
  const history=(card?.mergeHistory ?? []).map(item=>({...item}));
  const add=item=>{
    if(item?.value == null)return;
    const existingIndex=history.findIndex(entry=>isSameHistoryIdentity(entry,item));
    const entry={value:item.value,foodType:item.foodType,name:getFoodDisplayName(item),role:item.role};
    if(existingIndex===-1){
      history.push(entry);
    }else if(item.role==="result"&&history[existingIndex]?.role!=="result"){
      history[existingIndex]=entry;
    }
  };
  relatedCards.forEach(add);
  return history;
}
