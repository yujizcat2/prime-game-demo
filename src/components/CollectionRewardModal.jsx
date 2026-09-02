import "./CollectionRewardModal.css";
import { useEffect } from "react";
import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";

export default function CollectionRewardModal({reward, onClose}){
  useEffect(()=>{
    if(!reward)return undefined;
    const timer=window.setTimeout(onClose,1800);
    return()=>window.clearTimeout(timer);
  },[reward,onClose]);

  if(!reward) return null;

  const first=reward.isNewCollection ?? !reward.duplicate;
  const typeLabel=FOOD_TYPE_LABELS[reward.foodType] ?? (reward.foodType === "drink" ? "饮品" : reward.foodType);

  return (
    <div className="collection-reward-overlay">
      <section
        className={`collection-reward-modal collection-reward-modal--${first ? "new" : "repeat"}`}
        role="status"
        aria-live="polite"
        aria-labelledby="collection-reward-title"
      >
        <p className="collection-reward-kicker">✦ {first ? "新料理收藏" : "已经收录"}</p>
        <h2 id="collection-reward-title">{reward.name} · {reward.value}</h2>
        {typeLabel && <p className="collection-reward-meta">{typeLabel}</p>}
        <div className="collection-reward-total">
          {reward.totalScore != null && <strong>+{reward.totalScore}分</strong>}
          {reward.moneyGain != null && <strong>{reward.moneyGain > 0 ? "+" : ""}¥{reward.moneyGain}</strong>}
        </div>
        {reward.totalScore > 0 && (
          <p className="collection-reward-breakdown">
            收藏{reward.collectionScore}
            {reward.isFirstNumber && !reward.collectedPieceSingleFlavorPenalty
              ? ` · 首次发现 +${Math.round(reward.firstDiscoveryRate * 100)}%`
              : ""}
            {reward.newFoodTypeBonus > 0 ? ` · 新料理系 +${reward.newFoodTypeBonus}` : ""}
          </p>
        )}
      </section>
    </div>
  );
}
