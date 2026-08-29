import {
  getFoodTypeShortName
} from "../data/food/foodRegistry";

import {
  BASE_FOOD_TYPES
} from "../game/rules";

import {
  getEightPalaceKeyCount
} from "../game/eightPalaceKeys";

import "./EightPalaceKeyPanel.css";


function formatParents(key){
  if(Array.isArray(key.parentFoods) && key.parentFoods.length > 0){
    return key.parentFoods
      .map(parent => `${getFoodTypeShortName(parent.foodType)}${parent.value}`)
      .join(" + ");
  }

  if(Array.isArray(key.parents) && key.parents.length > 0){
    return key.parents.join(" + ");
  }

  return "无";
}


export default function EightPalaceKeyPanel({
  keys = {},
  usedKeyTriggerValues = [],
  targetFoodTypes = BASE_FOOD_TYPES,
  simple = false
}){
  const keyCount = getEightPalaceKeyCount(keys,targetFoodTypes);

  return (
    <section className="eight-key-panel">
      <div className="eight-key-heading">
        <div>
          <div className="eight-key-kicker">{simple?"BEGINNER COLLECTION":"EIGHT PALACE GATE"}</div>
          <h2>{simple?"两系收藏":"八系钥匙门"}</h2>
        </div>
        <strong>收藏 {keyCount} / {targetFoodTypes.length}</strong>
      </div>

      {!simple&&<div className="eight-key-used-values">已用钥匙数字：{usedKeyTriggerValues.length?usedKeyTriggerValues.join(" · "):"暂无"}</div>}

      <div className="eight-key-grid">
        {targetFoodTypes.map((foodType, index) => {
          const key = keys[foodType];

          return (
            <div
              key={foodType}
              className={`eight-key-cell${key ? " is-unlocked" : ""}${index === 4 ? " is-center-gap" : ""}`}
            >
              <span className="eight-key-type">{getFoodTypeShortName(foodType)}</span>
              {key
                ? <>
                    <strong>触发 {key.triggerValue}</strong>
                    <span>父母：{formatParents(key)}</span>
                  </>
                : <span>未解锁</span>
              }
            </div>
          );
        })}
        {!simple&&<div className="eight-key-center" aria-hidden="true">钥匙</div>}
      </div>
    </section>
  );
}
