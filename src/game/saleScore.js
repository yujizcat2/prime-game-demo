export function getSaleValueMultiplier(baseSalePrice){
  if(baseSalePrice < 100) return .8;
  if(baseSalePrice < 200) return 1;
  if(baseSalePrice < 300) return 1.1;
  return 1.2;
}

export function getSaleScore({baseSalePrice = 0, qualityMultiplier = 1, daySaleCount = 1} = {}){
  const productivityBonus = Math.max(0, daySaleCount - 5) * .1;
  return Number((getSaleValueMultiplier(baseSalePrice) * qualityMultiplier + productivityBonus).toFixed(2));
}
