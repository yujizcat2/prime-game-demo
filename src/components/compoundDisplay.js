export const COMPOUND_COOKING_LABELS = Object.freeze({
  A: "炒", B: "煎", C: "蒸", D: "烧", E: "烤", F: "焖",
  G: "炖", H: "烩", I: "拌", J: "煮", K: "卤", L: "炸"
});

export function getCompoundDisplayName(piece){
  const [firstName, secondName] = piece?.parentNames ?? [];
  const cookingLabel = COMPOUND_COOKING_LABELS[piece?.compoundType];
  return firstName && secondName && cookingLabel
    ? `${firstName}${cookingLabel}${secondName}`
    : "复合料理";
}

export function getCompoundParentSignature(piece){
  const [firstName, secondName] = piece?.parentNames ?? [];
  const [firstValue, secondValue] = piece?.parentValues ?? [];
  if(!firstName || !secondName || firstValue == null || secondValue == null) return "";
  const [firstSources = [], secondSources = []] = piece?.parentSourceNames ?? [];
  if(firstSources.length === 0 && secondSources.length === 0){
    return `由${firstName}${firstValue}与${secondName}${secondValue}复合`;
  }
  const describe = (name, value, sources) =>
    `${name}${value}（${sources.length ? sources.join("、") : "原生"}）`;
  return `由${describe(firstName, firstValue, firstSources)}与${describe(secondName, secondValue, secondSources)}复合`;
}
