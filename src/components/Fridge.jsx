import { getFoodTypeShortName } from "../data/food/foodRegistry";
import "./Fridge.css";

export default function Fridge({cards = [], storeActions = [], selectedIndex = null, canRetrieve = false, disabled = false, onStore, onSelectCard}){
  const slots = Array.from({length: 3}, (_, index) => cards[index] ?? null);
  return (
    <div className="fridge" aria-label="冰箱">
      <div className="fridge-header">
        <span>冰箱</span>
        {storeActions.length > 0 && !disabled && (
          <div className="fridge-store-actions">
            {storeActions.map(action => (
              <button key={action.indexes.join("-")} type="button" onClick={() => onStore(action.indexes)}>
                放入冰箱（{action.indexes.map(index => index + 1).join("-")}）
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="fridge-slots">
        {slots.map((card, index) => (
          <button
            key={card?.id ?? `empty-${index}`}
            type="button"
            className={`fridge-slot ${selectedIndex === index ? "fridge-slot--selected" : ""}`}
            disabled={disabled || !card || !canRetrieve}
            onClick={() => onSelectCard(index)}
          >
            {card ? <><strong>{card.value}</strong><small>{getFoodTypeShortName(card.foodType)}</small></> : <span>空</span>}
          </button>
        ))}
      </div>
      {selectedIndex !== null && <div className="fridge-help">请选择九宫格中的空位</div>}
    </div>
  );
}
