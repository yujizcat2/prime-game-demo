import { getFoodDisplayName } from "../data/food/foodRegistry";

export function getMergeHistoryIdentityKey(card){
  if(card?.id != null)return `card:${card.id}`;
  return card?.value == null || !card?.foodType ? null : `${card.value}:${card.foodType}`;
}

export function getMergeHistory(mergeHistoryByIdentity, card){
  const key=getMergeHistoryIdentityKey(card);
  return key ? (mergeHistoryByIdentity?.[key] ?? []) : [];
}

function appendRelations(history, relatedCards){
  const next=history.map(item=>({...item}));
  relatedCards.forEach(item=>{
    if(item?.value==null||!item.foodType)return;
    const existingIndex=next.findIndex(entry=>entry.id===item.id&&entry.role===item.role);
    const entry={id:item.id,value:item.value,foodType:item.foodType,name:getFoodDisplayName(item),role:item.role};
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
