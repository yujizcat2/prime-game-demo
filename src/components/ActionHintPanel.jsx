import { getActionStatus } from "../game/actionStatus";
import {
  getFoodName,
  getFoodTypeShortName
} from "../data/food/foodRegistry";
import { getCookingDetails } from "../utils/cookingLanguage";
import "./ActionHintPanel.css";

function getItemName(item){
  if(!item) return null;
  if(item.value === 1) return "原汁";
  return getFoodName(item.value, item.foodType);
}

function getTypeShortName(foodType){
  return getFoodTypeShortName(foodType);
}

function EmptyHint(){
  return (
    <div className="cooking-hint cooking-hint--empty">
      <div className="cooking-hint__eyebrow">料理 TIPS</div>
      <strong>选择一道料理</strong>
      <span>查看它的风味与来源，再选择亮起的料理继续操作。</span>
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
      <div className="cooking-hint__dish">
        <div className="cooking-hint__identity">
          <strong className="cooking-hint__number">{item?.value}</strong>
          <span className="cooking-hint__name">{name}</span>
          <span className={`cooking-hint__type cooking-hint__type--${item?.foodType ?? "water"}`}>
            {typeName}
          </span>
          <small>{details?.kind}</small>
        </div>
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

      <div className="cooking-hint__next">
        <small>下一步</small>
        <span>选择亮起的料理继续搭配或处理。 <b>›</b></span>
      </div>
    </div>
  );
}

function PairHint({status,keyOutcome}){
  const {first, second, combine, reduce} = status;
  const firstName = getItemName(first);
  const secondName = getItemName(second);
  const canCombine = combine.allowed;
  const canReduce = reduce.allowed;
  let title = "暂不适合料理";
  let description = "换一道亮起的料理试试。";
  let instruction = "重新选择料理，寻找合适的搭配。";

  if(canCombine && canReduce){
    title = "多种料理方式";
    description = "可以一起烹制，也可以进行处理。";
    instruction = "选择下方预览，完成下一步料理。";
  }
  else if(canCombine){
    title = "料理搭配";
    description = "这两种食材适合一起烹制。";
    instruction = "点击预览料理完成烹制。";
  }
  else if(canReduce){
    title = "料理处理";
    description = "这两份同类料理可以进一步处理。";
    instruction = "点击预览确认处理结果。";
  }
  if(canReduce&&keyOutcome){
    const typeName=getTypeShortName(keyOutcome.foodType);
    if(keyOutcome.status==="available")description=`${keyOutcome.triggerValue} → 1 · 可获得：${typeName}钥匙`;
    else if(keyOutcome.status==="used")description=`${keyOutcome.triggerValue} → 1 · 已触发过钥匙，本次无新钥匙`;
    else if(keyOutcome.status==="owned")description=`${keyOutcome.triggerValue} → 1 · ${typeName}钥匙已获得，本次不会重复获得`;
    else description=`${keyOutcome.triggerValue} → 1 · 本次不会获得钥匙`;
  }
  else if(combine.reason === "没有空位，放不下新的数字"){
    description = "料理台已经放满，先处理一些料理。";
  }
  else if(
    combine.reason === "它不能再和组成自己的数字合成" ||
    combine.reason === "这两个数字已经合成过一次"
  ){
    description = "这两道料理已经有过直接搭配。";
  }
  else if(combine.reason === "1只能直接消除"){
    description = "原汁暂时不能参与普通料理。";
  }

  return (
    <div className="cooking-hint cooking-hint--pair">
      <div className="cooking-hint__dish cooking-hint__dish--pair">
        <div className="cooking-hint__pair-names">
          <span>{firstName}</span><i>＋</i><span>{secondName}</span>
        </div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <div className="cooking-hint__next">
        <small>下一步</small>
        <span>{instruction}</span>
      </div>
    </div>
  );
}

export default function ActionHintPanel({numbers, selected, keyOutcome=null}){
  const status = getActionStatus(numbers, selected);

  if(status.type === "pair") return <PairHint status={status} keyOutcome={keyOutcome} />;

  if(status.type === "single" || status.type === "one"){
    const item = status.item ?? numbers.find(number => number.id === selected[0]);
    return <SingleHint item={item} />;
  }

  return <EmptyHint />;
}
