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
        {typeLabel && <p className="collection-reward-meta">{typeLabel} · {reward.collectionRewardLevel ?? 2}级奖励 · ×{(reward.collectionMultiplierRate ?? 1).toFixed(2)}</p>}
        <div className="collection-reward-calculation">
          <strong>营业额计算</strong>
          {(reward.saleBreakdown ?? []).map((step, index) => <div key={`${step.label}-${index}`}>
            <span>{step.label}</span>
            <span>{step.operation ? `${step.operation} → ` : ""}{step.result}</span>
          </div>)}
        </div>
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
        <button type="button" onClick={onClose}>确认</button>
      </section>
    </div>,
    document.body
  );
}
