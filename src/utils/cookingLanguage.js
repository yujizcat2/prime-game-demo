import { getFoodName } from "../data/food/foodRegistry";

function getSourceName(source){
  if(source?.value == null) return null;
  return getFoodName(source.value, source.foodType ?? source.type);
}

function getCombineSources(item){
  const sources = item?.origin?.type === "combine"
    ? item.origin.parents
    : item?.parentFoods;
  return Array.isArray(sources)
    ? sources.filter(source => source?.value != null).slice(0, 2)
    : [];
}

function getSourceFlavor(source){
  const name = getSourceName(source);
  switch(source?.foodType ?? source?.type){
    case "meat": return `${name}鲜味`;
    case "vegetable": return `${name}风味`;
    case "dessert": return `${name}甜香`;
    default: return `${name}的调味风格`;
  }
}

function describeRegularDish(sources){
  const ingredients = sources.filter(
    source => (source.foodType ?? source.type) !== "seasoning"
  );
  const seasonings = sources.filter(
    source => (source.foodType ?? source.type) === "seasoning"
  );
  const parts = [];

  if(ingredients.length === 2 && ingredients.every(
    source => (source.foodType ?? source.type) === "vegetable"
  )){
    parts.push(`搭配${ingredients.map(getSourceName).join("与")}烹制`);
  }
  else{
    ingredients.forEach(source => {
      const name = getSourceName(source);
      const type = source.foodType ?? source.type;
      if(type === "meat") parts.push(`融入${name}鲜味`);
      else if(type === "dessert") parts.push(`带有${name}甜香`);
      else parts.push(`搭配${name}`);
    });
  }

  seasonings.forEach(source => parts.push(`以${getSourceName(source)}调味`));
  return `${parts.join("，并")}。`;
}

function describeCombinedDish(item, sources){
  if(item.foodType === "seasoning"){
    const allSeasonings = sources.every(
      source => (source.foodType ?? source.type) === "seasoning"
    );
    return allSeasonings
      ? `融合了${sources.map(getSourceName).join("与")}的调味风格。`
      : `带有${sources.map(getSourceFlavor).join("与")}。`;
  }

  if(item.foodType === "dessert"){
    const seasonings = sources.filter(
      source => (source.foodType ?? source.type) === "seasoning"
    );
    const flavors = sources.filter(
      source => (source.foodType ?? source.type) !== "seasoning"
    );
    const parts = [];
    if(flavors.length > 0) parts.push(`融合${flavors.map(getSourceFlavor).join("与")}`);
    seasonings.forEach(source => parts.push(`以${getSourceName(source)}调味`));
    return `${parts.join("，并")}。`;
  }

  return describeRegularDish(sources);
}

function getTypeFlavorName(foodType){
  switch(foodType){
    case "meat": return "荤系";
    case "vegetable": return "素系";
    case "seasoning": return "调料系";
    case "dessert": return "甜食系";
    default: return "料理";
  }
}

export function getCookingDetails(item){
  if(!item) return null;

  if(item.origin?.type === "reduce"){
    return {
      kind: "处理料理",
      description: `这份料理经过处理后，呈现出了新的${getTypeFlavorName(item.foodType)}风味。`,
      sources: [{name: "处理所得", foodType: item.foodType}]
    };
  }

  const sources = getCombineSources(item);
  if(sources.length > 0){
    return {
      kind: "搭配料理",
      description: describeCombinedDish(item, sources),
      sources: sources.map(source => ({
        name: getSourceName(source),
        foodType: source.foodType ?? source.type
      }))
    };
  }

  return {
    kind: "原生料理",
    description: "保持着食材原本的风味。",
    sources: [{name: "原生", foodType: item.foodType}]
  };
}
