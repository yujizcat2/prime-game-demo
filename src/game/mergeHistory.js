import { getFoodDisplayName } from "../data/food/foodRegistry";

export function getMergeHistoryIdentityKey(card){
  return card?.value == null || !card?.foodType ? null : `${card.value}:${card.foodType}`;
}

export function getMergeHistory(mergeHistoryByIdentity, card){
  const key=getMergeHistoryIdentityKey(card);
  return key ? (mergeHistoryByIdentity?.[key] ?? []) : [];
}

export function hasMergeHistoryFoodType(mergeHistoryByIdentity, card, foodType){
  return getMergeHistory(mergeHistoryByIdentity,card).some(item=>item?.role==="result"&&item.foodType===foodType);
}

function appendRelations(history, relatedCards){
  const next=history.map(item=>({...item}));
  relatedCards.forEach(item=>{
    if(item?.value==null||!item.foodType)return;
    const existingIndex=next.findIndex(entry=>entry.value===item.value&&entry.foodType===item.foodType);
    const entry={value:item.value,foodType:item.foodType,name:getFoodDisplayName(item),role:item.role};
    if(existingIndex===-1)next.push(entry);
    else if(item.role==="result"&&next[existingIndex]?.role!=="result")next[existingIndex]=entry;
  });
  return next;
}

export function updateMergeHistoryByIdentity(mergeHistoryByIdentity, card, ...relatedCards){
  const key=getMergeHistoryIdentityKey(card);
  if(!key)return mergeHistoryByIdentity??{};
  return {...(mergeHistoryByIdentity??{}),[key]:appendRelations(getMergeHistory(mergeHistoryByIdentity,card),relatedCards)};
}
