import { getLandName } from "../ingredients/landData";
import { getAquaticName } from "../ingredients/aquaticData";
import { getVegetableName } from "../ingredients/vegetableData";
import { getGrainBeanName } from "../ingredients/grainBeanData";
import { getDairyEggName } from "../ingredients/dairyEggData";
import { getFruitName } from "../ingredients/fruitData";
import { getSeasoningName } from "../ingredients/seasoningData";
import { getSpiceName } from "../ingredients/spiceData";
import { getDrinkName } from "../ingredients/drinkData";

const NAME_GETTERS={land:getLandName,aquatic:getAquaticName,vegetable:getVegetableName,grainBean:getGrainBeanName,dairyEgg:getDairyEggName,fruit:getFruitName,seasoning:getSeasoningName,spice:getSpiceName,drink:getDrinkName};
const TYPE_NAMES={land:"陆产",aquatic:"水产",vegetable:"蔬菜",grainBean:"谷物",dairyEgg:"蛋奶",fruit:"水果",seasoning:"调料",spice:"香辛料",drink:"饮品"};
const TYPE_ICONS={land:"🍖",aquatic:"🐟",vegetable:"🥬",grainBean:"🌾",dairyEgg:"🥚",fruit:"🍎",seasoning:"🧂",spice:"🌶️",drink:"🥤"};
export function getFoodName(value,foodType){return (NAME_GETTERS[foodType]?.(value))??String(value);}
export function getFoodDisplayName(item,fallbackFoodType=null){if(item?.value==null)return null;if(item.value===1)return "水";return getFoodName(item.value,item.foodType??item.type??fallbackFoodType);}
export function getFoodTypeName(foodType){return TYPE_NAMES[foodType]?`${TYPE_NAMES[foodType]}系`:"";}
export function getFoodTypeShortName(foodType){return TYPE_NAMES[foodType]??"";}
export function getFoodTypeIcon(foodType){return TYPE_ICONS[foodType]??"";}
