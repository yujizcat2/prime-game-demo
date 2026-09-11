export function getReduceButtonLabel(_selected = [], preview = null){
  const terminalSale = preview?.reduce?.kind !== "equalEliminate"
    && preview?.reduce?.results?.some(result => result?.value === 1 || result?.clear === true);
  return terminalSale ? "售出" : "处理";
}
