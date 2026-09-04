import "./EightPalaceCollectionPanel.css";
import {
  getFoodCardDisplayName,
  getFoodCardTypeLabel,
  getFoodOriginDescription
} from "./foodCardDisplay";

export default function EightPalaceCollectionPanel({cards = [], score = 0}){
  return (
    <section className="eight-collection-panel">
      <div className="eight-collection-heading">
        <div>
          <div className="eight-collection-kicker">100 STEP COLLECTION</div>
          <h2>本局料理收藏</h2>
        </div>
        <strong>{cards.length} 张 · {score} 分</strong>
      </div>

      {cards.length === 0 ? (
        <p className="eight-collection-empty">通过约分获得第一张具体料理卡。</p>
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
