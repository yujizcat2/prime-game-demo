import "./CollectionRewardModal.css";
import { createPortal } from "react-dom";
import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";

export default function CollectionRewardModal({reward, onClose}){
  if(!reward) return null;

  const typeLabel=FOOD_TYPE_LABELS[reward.foodType] ?? (reward.foodType === "drink" ? "饮品" : reward.foodType);
  const saleScore = reward.saleScore ?? reward.totalScore ?? 0;

  return createPortal(
    <div className="collection-reward-overlay">
      <section
        className="collection-reward-modal collection-reward-modal--new"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-reward-title"
      >
        <p className="collection-reward-kicker">✦ 售出成功</p>
        <h2 id="collection-reward-title">{reward.name} · {reward.value}</h2>
        {typeLabel && <p className="collection-reward-meta">{typeLabel} · ×{reward.collectionMultiplier ?? 1}路线</p>}
        <div className="collection-reward-details">
          <div><span>料理销售额</span><strong>+{saleScore}</strong></div>
          <div><span>今日售出序号</span><strong>第 {reward.todayCollectionNumber} 个</strong></div>
          <div><span>今日销售奖励</span><strong>+{reward.dailyCollectionBonus ?? 0}</strong></div>
          {reward.comboBonus > 0 && <div><span>连击奖励</span><strong>+{reward.comboBonus}</strong></div>}
        </div>
        <div className="collection-reward-total">
          <span>本次营业额</span>
          <strong>+{reward.totalScore ?? 0}</strong>
        </div>
        <p className="collection-reward-breakdown">
          料理基础 {reward.baseSaleScore ?? reward.baseScore ?? reward.collectionScore}
          {(reward.preCuisineSaleScore ?? reward.collectionScore) !== (reward.baseSaleScore ?? reward.baseScore ?? reward.collectionScore)
            ? ` · 同数字跨系调整 ${reward.preCuisineSaleScore ?? reward.collectionScore}`
            : ""}
          {` × 系列${Math.round((reward.cuisineScoreMultiplier ?? 1) * 100)}% × 时段${Math.round((reward.timeSaleMultiplier ?? 1) * 100)}% × 路线${Math.round((reward.collectionMultiplierRate ?? 1) * 100)}% = ${saleScore}`}
          {reward.timeSaleLabel ? ` · ${reward.timeSaleLabel}` : ""}
        </p>
        <button type="button" onClick={onClose}>确认</button>
      </section>
    </div>,
    document.body
  );
}
