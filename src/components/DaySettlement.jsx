import { useState } from "react";
import "./DaySettlement.css";
import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function Metric({label, value}){
  return <div className="day-settlement-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function DaySettlement({settlement, onContinue}){
  const [showClosing, setShowClosing] = useState(true);
  if(!settlement || !showClosing) return null;
  const isWeekComplete = settlement.day >= 7 && settlement.passed;
  return <div className="day-settlement-backdrop" role="dialog" aria-modal="true" aria-labelledby="day-settlement-title">
    <section className="day-settlement-card">
      <div className="day-settlement-kicker">DAY {settlement.day} · {settlement.weekday} · 打烊</div>
      <h2 id="day-settlement-title">{settlement.passed ? "今日营业完成" : "今日营业额不足"}</h2>
      <div className="day-settlement-rule" />
      <Metric label="今日获得积分" value={`+${numberFormatter.format(settlement.scoreGainToday)}`} />
      <Metric label={`今日营业额 · ${settlement.scoreTargetMet ? "已达成" : "未达成"}`} value={`${numberFormatter.format(settlement.scoreGainToday)} / ${settlement.targetScore}`} />
      <Metric label="今日新增收藏" value={numberFormatter.format(settlement.collectionGainToday)} />
      <Metric label="今日效率" value={settlement.efficiency.toFixed(2)} />
      <Metric label="打烊盘面" value={`${settlement.boardCount} 张 · 总和 ${numberFormatter.format(settlement.boardSum)}`} />
      {settlement.passed && !isWeekComplete && <div className="day-settlement-prep">
        <strong>明日备料</strong>
        <div>{settlement.nextDayCards.map((card, index) => <span key={`${card.source}-${index}`}>
          <small>{index < 4 ? `${card.round}轮结晶` : "当日最大"}</small>
          <b>{card.value}</b>
          <em>{FOOD_TYPE_LABELS[card.foodType] ?? card.foodType}</em>
        </span>)}</div>
      </div>}
      {settlement.passed && !isWeekComplete
        ? <button type="button" onClick={onContinue}>进入第{settlement.day + 1}天</button>
        : <button type="button" className="day-settlement-summary-button" onClick={() => setShowClosing(false)}>查看本局总结</button>}
    </section>
  </div>;
}
