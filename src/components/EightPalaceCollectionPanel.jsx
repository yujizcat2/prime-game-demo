import "./EightPalaceCollectionPanel.css";
import {
  getFoodCardDisplayName,
  getFoodCardTypeLabel,
  getFoodOriginDescription
} from "./foodCardDisplay";
import { getFoodTypeShortName } from "../data/food/foodRegistry";
import { getSaleSummary, SALE_FOOD_TYPES } from "./saleSummary";
import { formatDisplayNumber } from "../utils/formatDisplayNumber";
import { useState } from "react";

function formatMinutes(minutes = 0){
  const hours=Math.floor(minutes/60);
  const remainder=Math.round(minutes%60);
  return `${hours}小时${remainder ? `${remainder}分` : ""}`;
}

export default function EightPalaceCollectionPanel({cards = [], score = 0}){
  const saleSummary = getSaleSummary(cards);
  const [selectedCard,setSelectedCard]=useState(null);
  const detail=selectedCard?.firstSaleSnapshot;

  return (
    <section className="eight-collection-panel">
      <div className="eight-collection-heading">
        <div>
          <h2>售出料理记录</h2>
        </div>
        <strong>{cards.length} 张 · {formatDisplayNumber(score)} 分</strong>
      </div>

      <div className="eight-collection-summary" aria-label="各系销售汇总">
        <div className="eight-collection-summary-title">各系销售汇总</div>
        {SALE_FOOD_TYPES.map(foodType => (
          <div className={`eight-collection-summary-cell eight-collection-summary-cell--${foodType}`} key={foodType}>
            <span className="eight-collection-summary-type">{getFoodTypeShortName(foodType)}</span>
            <span className="eight-collection-summary-metric">能量 <strong>{saleSummary[foodType].value}</strong></span>
            <span className="eight-collection-summary-metric">总额 <strong>{saleSummary[foodType].revenue}</strong></span>
          </div>
        ))}
      </div>

      {cards.length === 0 ? (
        <p className="eight-collection-empty">通过约分售出第一道具体料理。</p>
      ) : (
        <div className="eight-collection-list">
          {[...cards].reverse().map(card => {
            const displayCard = {
              ...card,
              parentFoods: card.parentFoods ?? card.parents ?? null
            };
            const name = card.name ?? getFoodCardDisplayName(displayCard);
            return <button type="button" className="eight-collection-card" key={card.id} onClick={()=>setSelectedCard(card)}>
              <div className="eight-collection-card-heading">
                <strong>{name} {card.value}</strong>
                <em>{getFoodCardTypeLabel(displayCard)}</em>
              </div>
              <small>{getFoodOriginDescription(displayCard, name)}</small>
              <div className="eight-collection-card-meta">
                <span>{card.collectedAt}</span>
                <span>+{card.scoreGain ?? card.value}</span>
              </div>
            </button>;
          })}
        </div>
      )}
      {detail && (
        <div className="sale-detail-overlay" onClick={()=>setSelectedCard(null)}>
          <section className="sale-detail" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title" onClick={event=>event.stopPropagation()}>
            <button type="button" className="sale-detail-close" aria-label="关闭售出料理详情" onClick={()=>setSelectedCard(null)}>×</button>
            <small>料理名称</small>
            <h3 id="sale-detail-title">{detail.name} · {detail.value}</h3>
            <dl>
              <div><dt>首次售出</dt><dd>Day {detail.firstSaleDay} · {detail.firstSaleTime}</dd></div>
            </dl>
            <h4>售出结果</h4>
            <dl>
              <div><dt>营业额</dt><dd>{detail.finalRevenue}</dd></div>
              <div><dt>基础营业额</dt><dd>{detail.baseRevenue}</dd></div>
              <div><dt>额外营业额</dt><dd>{detail.extraRevenue >= 0 ? "+" : ""}{detail.extraRevenue}</dd></div>
              <div><dt>积分</dt><dd>+{Number(detail.pointGain).toFixed(2)}</dd></div>
            </dl>
            <h4>当时状态</h4>
            <dl>
              <div><dt>烹饪方式</dt><dd>{detail.cookingMethod ?? "无"}</dd></div>
              <div><dt>时段</dt><dd>{detail.timePeriod.range ?? detail.timePeriod.label} · ×{detail.timePeriod.multiplier}</dd></div>
              <div><dt>保质期</dt><dd>{formatMinutes(detail.foodAgeMinutes)} · {detail.shelfLifeStatus} · ×{detail.shelfLifeMultiplier}</dd></div>
              <div><dt>等级</dt><dd>Lv.{detail.rewardLevel} · ×{detail.rewardLevelMultiplier}</dd></div>
              <div><dt>同数字状态</dt><dd>{detail.sameNumberSale.discounted ? `已有 ${detail.sameNumberSale.existingFoodTypeCount} 系` : "未折价"} · ×{formatDisplayNumber(detail.sameNumberSale.multiplier)}</dd></div>
              <div><dt>单系污染</dt><dd>{detail.singleFlavorPenalty.triggered ? "触发" : "未触发"} · ×{detail.singleFlavorPenalty.multiplier}</dd></div>
              {detail.dailyFirstSaleBonus !== 0 && <div><dt>当日首次售出奖励</dt><dd>+{detail.dailyFirstSaleBonus}</dd></div>}
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}
