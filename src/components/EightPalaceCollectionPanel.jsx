import "./EightPalaceCollectionPanel.css";
import {
  getFoodCardDisplayName,
  getFoodCardTypeLabel,
  getFoodOriginDescription
} from "./foodCardDisplay";
import { getFoodTypeShortName } from "../data/food/foodRegistry";
import { getSaleSummary, SALE_FOOD_TYPES } from "./saleSummary";

export default function EightPalaceCollectionPanel({cards = [], score = 0}){
  const saleSummary = getSaleSummary(cards);

  return (
    <section className="eight-collection-panel">
      <div className="eight-collection-heading">
        <div>
          <div className="eight-collection-kicker">100 STEP SALES</div>
          <h2>本局销售记录</h2>
        </div>
        <strong>{cards.length} 张 · {score} 分</strong>
      </div>

      <div className="eight-collection-summary" aria-label="各系销售汇总">
        <div className="eight-collection-summary-title">各系销售汇总</div>
        {SALE_FOOD_TYPES.map(foodType => (
          <div className={`eight-collection-summary-cell eight-collection-summary-cell--${foodType}`} key={foodType}>
            <span className="eight-collection-summary-type">{getFoodTypeShortName(foodType)}</span>
            <span className="eight-collection-summary-metric">数字 <strong>{saleSummary[foodType].value}</strong></span>
            <span className="eight-collection-summary-metric">积分 <strong>{saleSummary[foodType].score}</strong></span>
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
            const name = getFoodCardDisplayName(displayCard) ?? card.name;
            return <article className="eight-collection-card" key={card.id}>
              <div className="eight-collection-card-heading">
                <strong>{name} {card.value}</strong>
                <em>{getFoodCardTypeLabel(displayCard)}</em>
              </div>
              <small>{getFoodOriginDescription(displayCard, name)}</small>
              <div className="eight-collection-card-meta">
                <span>{card.collectedAt}</span>
                <span>+{card.scoreGain ?? card.value}</span>
              </div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
