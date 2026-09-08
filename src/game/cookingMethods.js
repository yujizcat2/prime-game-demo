// Position-owned cooking methods. Cards use the method of their current cell.
export const BOARD_COOKING_METHODS = Object.freeze([
  "炒", "烤", "煮",
  "煎", "调制", "蒸",
  "炖", "炸", "拌"
]);

export function getCookingMethod(index){
  return Number.isInteger(index) ? BOARD_COOKING_METHODS[index] ?? null : null;
}

export function getCookedFoodName(name, cookingMethod){
  return cookingMethod && name ? `${cookingMethod}${name}` : name;
}
