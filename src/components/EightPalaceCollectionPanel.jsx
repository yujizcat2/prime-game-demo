import "./EightPalaceCollectionPanel.css";
import { getCollectionSourceText } from "./collectionDisplay";

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
          {[...cards].reverse().map(card => (
            <article className="eight-collection-card" key={card.id}>
              <strong>{card.name}</strong>
              <small>{getCollectionSourceText(card)}</small>
              <span>+{card.scoreGain ?? card.value}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
