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
  if(!firstName || !secondName) return "";
  const [firstSources = [], secondSources = []] = piece?.parentSourceNames ?? [];
  if(firstSources.length === 0 && secondSources.length === 0){
    return `由${firstName}与${secondName}复合`;
  }
  const sourceText = sources => sources.join("与");
  if(firstSources.length > 0 && secondSources.length === 0){
    return `${firstName}源自${sourceText(firstSources)}，再与${secondName}复合`;
  }
  if(firstSources.length === 0 && secondSources.length > 0){
    return `${secondName}源自${sourceText(secondSources)}，再与${firstName}复合`;
  }
  return `${firstName}源自${sourceText(firstSources)}，${secondName}源自${sourceText(secondSources)}，两者复合`;
}
