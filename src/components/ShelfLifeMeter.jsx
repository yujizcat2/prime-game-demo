import { FOOD_SHELF_LIFE_MINUTES, getFoodExpiryState } from "../game/foodShelfLife";

import "./ShelfLifeMeter.css";

function getShelfLifeTone(expiryState){
  if(expiryState.expired) return "expired";
  if(expiryState.multiplier === 1) return "fresh";
  if(expiryState.multiplier === .8) return "lime";
  if(expiryState.multiplier === .7) return "warm";
  return "urgent";
}

export default function ShelfLifeMeter({piece, atMinutes, className = ""}){
  const expiryState = getFoodExpiryState(piece, atMinutes);
  const ratio = Math.min(1, expiryState.remainingMinutes / FOOD_SHELF_LIFE_MINUTES);
  const hours = expiryState.expired ? 0 : Math.ceil(expiryState.remainingMinutes / 60);
  const tone = getShelfLifeTone(expiryState);

  return (
    <div
      className={`shelf-life-meter shelf-life-meter--${tone}${className ? ` ${className}` : ""}`}
      aria-label={`剩余保质期 ${hours} 小时`}
    >
      <span className="shelf-life-meter__track" aria-hidden="true">
        <span className="shelf-life-meter__fill" style={{width: `${ratio * 100}%`}} />
      </span>
      <span className="shelf-life-meter__time">{hours}h</span>
    </div>
  );
}
