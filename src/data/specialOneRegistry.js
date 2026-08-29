import { BASE_FOOD_TYPES, SPECIAL_ONE_KINDS } from "../game/rules";

export const FOOD_TYPE_LABELS=Object.freeze({land:"荤",aquatic:"水产",vegetable:"素",grainBean:"谷豆",dairyEgg:"乳蛋",fruit:"果物",seasoning:"调料",spice:"香辛"});

export const SPECIAL_ONE_NAMES=Object.freeze(Object.fromEntries(BASE_FOOD_TYPES.flatMap((type,index)=>[
  [`key:${type}`,`${FOOD_TYPE_LABELS[type]}钥匙`],
  ...BASE_FOOD_TYPES.slice(index+1).map(other=>[`function:${[type,other].sort().join("+")}`,`${FOOD_TYPE_LABELS[type]} × ${FOOD_TYPE_LABELS[other]}`])
])));

export function getSpecialOneName(specialOne){
  if(!specialOne)return null;
  return SPECIAL_ONE_NAMES[specialOne.identity]??(specialOne.kind===SPECIAL_ONE_KINDS.KEY?`${FOOD_TYPE_LABELS[specialOne.keyType]??specialOne.keyType}钥匙`:specialOne.sourceTypes.map(type=>FOOD_TYPE_LABELS[type]??type).join(" × "));
}
