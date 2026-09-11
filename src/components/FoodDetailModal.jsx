import { getFoodCardDisplayName, getFoodOriginDescription } from "./foodCardDisplay";
import { getFoodTypeShortName, getFoodName } from "../data/food/foodRegistry";
import { getCookingMethod } from "../game/cookingMethods";
import { formatShelfLife, getFoodExpiryState } from "../game/foodShelfLife";
import "./FoodDetailModal.css";
import "./FoodDetailHistory.css";

function parentLabel(parent){
  if(parent == null) return null;
  if(typeof parent === "object") return `${getFoodName(parent.value, parent.foodType)} ${parent.value}`;
  return String(parent);
}

export default function FoodDetailModal({piece, index, totalActionMinutes = 0, onClose}){
  if(!piece) return null;
  const expiry = getFoodExpiryState(piece, totalActionMinutes);
  const parents = (piece.parentFoods ?? piece.parents ?? piece.origin?.parents ?? []).map(parentLabel).filter(Boolean);
  const mergeHistoryNames = (piece.mergeHistory ?? []).map(item => item?.name).filter(Boolean);
  const price = piece.baseSalePrice ?? piece.salePrice ?? piece.scoreValue ?? null;
  return <div className="food-detail-overlay" onClick={onClose}>
    <section className="food-detail-dialog" role="dialog" aria-modal="true" aria-label="料理详情" onClick={event => event.stopPropagation()}>
      <button className="food-detail-close" type="button" aria-label="关闭料理详情" onClick={onClose}>×</button>
      <header><span>{piece.value}</span><div><h2>{getFoodCardDisplayName(piece)}</h2><p>{getFoodTypeShortName(piece.foodType)} · {getCookingMethod(index)}</p></div></header>
      <dl>
        <div><dt>新鲜度</dt><dd>{expiry.status} · {formatShelfLife(expiry.remainingMinutes)}</dd></div>
        {piece.bornAt != null && <div><dt>生成时间</dt><dd>{piece.bornAt} 分钟</dd></div>}
        {price != null && <div><dt>当前基础售价</dt><dd>¥{price}</dd></div>}
        {piece.discovered != null && <div><dt>发现状态</dt><dd>{piece.discovered ? "已发现" : "未发现"}</dd></div>}
        <div className="food-detail-wide"><dt>来源</dt><dd>{getFoodOriginDescription(piece)}</dd></div>
        {parents.length > 0 && <div className="food-detail-wide"><dt>父母料理</dt><dd>{parents.join(" ＋ ")}</dd></div>}
        {mergeHistoryNames.length > 0 && <div className="food-detail-wide"><dt>合成历史</dt><dd className="food-detail-history">{mergeHistoryNames.map((name,index)=><span key={`${name}-${index}`}>{name}</span>)}</dd></div>}
      </dl>
    </section>
  </div>;
}
