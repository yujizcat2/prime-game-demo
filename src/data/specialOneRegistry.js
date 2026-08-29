import { BASE_FOOD_TYPES, SPECIAL_ONE_KINDS } from "../game/rules";

export const FOOD_TYPE_LABELS=Object.freeze({land:"荤",aquatic:"水产",vegetable:"素",grainBean:"谷豆",dairyEgg:"乳蛋",fruit:"果物",seasoning:"调料",spice:"香辛"});
export const SPECIAL_ONE_UNIT_NAMES=Object.freeze({land:"肉汁",aquatic:"鲜汁",vegetable:"菜汁",grainBean:"豆汁",dairyEgg:"奶汁",fruit:"果汁",seasoning:"料汁",spice:"香汁"});

export const SPECIAL_ONE_NAMES=Object.freeze(Object.fromEntries(BASE_FOOD_TYPES.flatMap((type,index)=>[
  [`key:${type}`,`${FOOD_TYPE_LABELS[type]}钥匙`],
  ...BASE_FOOD_TYPES.slice(index+1).map(other=>[`function:${[type,other].sort().join("+")}`,`${FOOD_TYPE_LABELS[type]} × ${FOOD_TYPE_LABELS[other]}`])
])));

export function getSpecialOneName(specialOne){
  if(!specialOne)return null;
  return SPECIAL_ONE_NAMES[specialOne.identity]??(specialOne.kind===SPECIAL_ONE_KINDS.KEY?`${FOOD_TYPE_LABELS[specialOne.keyType]??specialOne.keyType}钥匙`:specialOne.sourceTypes.map(type=>FOOD_TYPE_LABELS[type]??type).join(" × "));
}

export function getSpecialOneDisplayName(piece){
  const unit=SPECIAL_ONE_UNIT_NAMES[piece?.foodType]??"水";
  return piece?.specialOne?.kind===SPECIAL_ONE_KINDS.KEY?`纯${unit}`:unit;
}
