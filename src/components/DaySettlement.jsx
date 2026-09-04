import { useState } from "react";
import "./DaySettlement.css";
import { getDayScoreTarget } from "../game/dayCycle";
import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function Metric({label, value}){
  return <div className="day-settlement-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function DaySettlement({settlement, onContinue}){
  const [showFailedClosing, setShowFailedClosing] = useState(true);
  if(!settlement || (!settlement.passed && !showFailedClosing)) return null;
  const lead = settlement.finalScore - settlement.targetScore;
  return <div className="day-settlement-backdrop" role="dialog" aria-modal="true" aria-labelledby="day-settlement-title">
    <section className="day-settlement-card">
      <div className="day-settlement-kicker">DAY {settlement.day} · 打烊</div>
      <h2 id="day-settlement-title">{settlement.passed ? "今日营业完成" : "今日营业未完成"}</h2>
      <div className="day-settlement-rule" />
      <Metric label="最终积分" value={numberFormatter.format(settlement.finalScore)} />
      <Metric label={`营业目标 · ${settlement.scoreTargetMet ? "已达成" : "未达成"}`} value={numberFormatter.format(settlement.targetScore)} />
      <Metric label={lead >= 0 ? "领先" : "还差"} value={numberFormatter.format(Math.abs(lead))} />
      <div className="day-settlement-rule" />
      <Metric label="今日新增积分" value={`+${numberFormatter.format(settlement.scoreGainToday)}`} />
      <Metric label={`当日新增收藏 · ${settlement.collectionTargetMet ? "已达成" : "未达成"}`} value={`${numberFormatter.format(settlement.collectionGainToday)} / ${settlement.minimumCollectionCount}`} />
      <Metric label="打烊盘面总和" value={numberFormatter.format(settlement.boardSum)} />
      <Metric label="今日营业" value="营业完成" />
      {settlement.passed && <div className="day-settlement-prep">
        <strong>明日备料</strong>
        <div>{settlement.nextDayCards.map((card, index) => <span key={`${card.source}-${index}`}>
          <small>{index < 4 ? `${card.round}轮结晶` : "当日最大"}</small>
          <b>{card.value}</b>
          <em>{FOOD_TYPE_LABELS[card.foodType] ?? card.foodType}</em>
        </span>)}</div>
      </div>}
      <p>明日目标：{numberFormatter.format(getDayScoreTarget(settlement.day + 1))} 分</p>
      {settlement.passed
        ? <button type="button" onClick={onContinue}>进入第{settlement.day + 1}天</button>
        : <button type="button" className="day-settlement-summary-button" onClick={() => setShowFailedClosing(false)}>查看本局总结</button>}
    </section>
  </div>;
}
