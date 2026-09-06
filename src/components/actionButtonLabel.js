export function getReduceButtonLabel(selected = [], preview = null){
  if(selected.length !== 2 || !preview?.reduce) return "处理/售出";
  return preview.reduce.createsEffectiveSale ? "售出" : "处理";
}
