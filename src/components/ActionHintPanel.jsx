import { getActionStatus } from "../game/actionStatus";
import { combineFoodType } from "../game/rules";
import {
  getFoodName
} from "../data/food/foodRegistry";
import { getCombineBlockedText } from "../game/kitchenText";
import { getCookingDetails } from "../utils/cookingLanguage";
import "./ActionHintPanel.css";

function getItemName(item){
  if(!item) return null;
  if(item.value === 1) return "原汁";
  return getFoodName(item.value, item.foodType);
}

function getTypeShortName(foodType){
  switch(foodType){
    case "meat": return "荤";
    case "vegetable": return "素";
    case "seasoning": return "调";
    case "dessert": return "甜";
    default: return "";
  }
}

function EmptyHint(){
  return (
    <div className="cooking-hint cooking-hint--empty">
      <div className="cooking-hint__eyebrow">TIPS</div>
      <strong>选择一个数字</strong>
      <span>查看料理信息，并寻找可以合成或约分的对象。</span>
    </div>
  );
}

function SingleHint({item}){
  const name = getItemName(item);
  const details = getCookingDetails(item);
  const typeName = item?.value === 1
    ? "水"
    : getTypeShortName(item?.foodType);

  return (
    <div className="cooking-hint cooking-hint--single" key={item?.id}>
      <div className="cooking-hint__identity">
        <strong className="cooking-hint__number">{item?.value}</strong>
        <span className="cooking-hint__name">{name}</span>
        <span className={`cooking-hint__type cooking-hint__type--${item?.foodType ?? "water"}`}>
          {typeName}
        </span>
        <small>{details?.kind}</small>
      </div>

      <div className="cooking-hint__detail">
        <p>{details?.description}</p>
        <div className="cooking-hint__sources" aria-label="料理来源">
          <span className="cooking-hint__source-label">料理来源</span>
          {details?.sources.map((source, index) => (
            <span key={`${source.name}-${index}`} className="cooking-hint__source-group">
              {index > 0 && <i>＋</i>}
              <span className={`cooking-hint__chip cooking-hint__chip--${source.foodType ?? "default"}`}>
                {source.name}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="cooking-hint__next">选择高亮料理继续操作 <b>›</b></div>
    </div>
  );
}

function PairHint({status}){
  const {first, second, combine, reduce} = status;
  const firstName = getItemName(first);
  const secondName = getItemName(second);
  const resultFoodType = combineFoodType(first, second);
  const combineResultName = combine.result != null
    ? getFoodName(combine.result, resultFoodType)
    : null;
  const canCombine = combine.allowed;
  const canReduce = reduce.allowed;
  const operator = canReduce && !canCombine ? "÷" : "＋";
  let title = "暂时无法操作";
  let instruction = getCombineBlockedText({
    reason: combine.reason,
    firstName,
    secondName
  });

  if(canCombine && canReduce){
    title = "可以合成，也可以约分";
    instruction = "选择下方预览料理，完成对应操作。";
  }
  else if(canCombine){
    title = "可以合成";
    instruction = "点击预览料理完成合成。";
  }
  else if(canReduce){
    title = "可以约分";
    instruction = "点击预览料理完成约分。";
  }

  return (
    <div className="cooking-hint cooking-hint--pair">
      <div className="cooking-hint__pair-names">
        <span>{firstName}</span><i>{operator}</i><span>{secondName}</span>
      </div>

      <div className="cooking-hint__operation">
        <strong>{title}</strong>
        <div className="cooking-hint__results">
          {canCombine && <span>→ {combine.result} · {combineResultName}</span>}
          {canReduce && (
            <span>{first.value} → {reduce.firstResult}<i>·</i>{second.value} → {reduce.secondResult}</span>
          )}
        </div>
      </div>

      <div className="cooking-hint__next">{instruction}</div>
    </div>
  );
}

export default function ActionHintPanel({numbers, selected}){
  const status = getActionStatus(numbers, selected);

  if(status.type === "pair") return <PairHint status={status} />;

  if(status.type === "single" || status.type === "one"){
    const item = status.item ?? numbers.find(number => number.id === selected[0]);
    return <SingleHint item={item} />;
  }

  return <EmptyHint />;
}
