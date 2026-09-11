export function getNextSelectionIndexes(selectedIndexes,index){
  const selected=Array.isArray(selectedIndexes)?selectedIndexes:[];
  if(index===selected[0])return [];
  if(index===selected[1])return [selected[0]];
  if(selected.length===0)return [index];
  return [selected[0],index];
}
