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
  return firstName && secondName && firstValue != null && secondValue != null
    ? `${firstName}${firstValue} ◇ ${secondName}${secondValue}`
    : "";
}
