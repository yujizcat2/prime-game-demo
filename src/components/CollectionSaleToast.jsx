import "./CollectionSaleToast.css";
import { formatDisplayNumber } from "../utils/formatDisplayNumber";

function formatSigned(value){
  const number=Number(value) || 0;
  if(number === 0) return "0";
  return `${number > 0 ? "+" : ""}${formatDisplayNumber(number)}`;
}

export default function CollectionSaleToast({reward}){
  if(!reward) return null;
  const baseRevenue=reward.firstSaleSnapshot?.baseRevenue ?? reward.baseScore ?? 0;
  const finalRevenue=reward.firstSaleSnapshot?.finalRevenue ?? reward.totalScore ?? 0;
  const extraRevenue=reward.firstSaleSnapshot?.extraRevenue ?? finalRevenue-baseRevenue;
  const pointGain=reward.firstSaleSnapshot?.pointGain ?? reward.salePointScore ?? 0;
  return (
    <div className="collection-sale-toast-layer" aria-live="polite" aria-atomic="true">
      <section className="collection-sale-toast" key={reward.collectionKey ?? reward.name} role="status">
        <span className="collection-sale-toast__name">售出料理 · {reward.name}</span>
        <strong className="collection-sale-toast__revenue">{formatSigned(finalRevenue)}</strong>
        <span className="collection-sale-toast__revenue-label">营业额</span>
        <span className="collection-sale-toast__breakdown">基础 {formatDisplayNumber(baseRevenue)} · 额外 {formatSigned(extraRevenue)}</span>
        <em className="collection-sale-toast__points">积分 {formatSigned(pointGain)}</em>
      </section>
    </div>
  );
}
