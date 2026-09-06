import "./DayPanel.css";
import { useState } from "react";
import { DAILY_COLLECTION_TARGET, DAY_DURATION_MINUTES, formatClosingTimeRemaining, getDayTargetScore } from "../game/dayCycle";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { getComboBonus } from "../game/scoreCombo";
import { getTimeSalePeriod, TIME_SALE_PERIODS } from "../game/timeSaleMultiplier";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function DayPanel({day, weekday, time, period, dayMinutesElapsed, timeSalePeriods = TIME_SALE_PERIODS, score, collectionsToday = 0, totalActionMinutes, comboCount}){
  const [showTimeSalePeriods, setShowTimeSalePeriods] = useState(false);
  const remaining = Math.max(0, DAY_DURATION_MINUTES - dayMinutesElapsed);
  const urgency = remaining <= 120 ? " day-panel--urgent" : remaining <= 300 ? " day-panel--near" : "";
  const efficiency = getScoreEfficiency(score, totalActionMinutes);
  const targetScore = getDayTargetScore(day);
  const scoreTargetMet = score >= targetScore;
  const collectionTargetMet = collectionsToday >= DAILY_COLLECTION_TARGET;
  const currentTimeSalePeriod = getTimeSalePeriod(time, timeSalePeriods);
  const formatMultiplier = multiplier => Number(multiplier).toFixed(2);

  return <section className={`day-panel${urgency}`} aria-label={`${weekday}营业日`}>
    <div className="day-panel-heading">
      <div><strong>DAY {day}</strong><span>{weekday}</span></div>
      <div className="day-panel-clock">
        <strong>{time}</strong><span>{period}</span>
        <button type="button" className="day-panel-price-button" onClick={() => setShowTimeSalePeriods(true)}>价格时段</button>
      </div>
    </div>
    {comboCount >= 2 && <div className="day-panel-combo" role="status">{comboCount} 连击 · +{getComboBonus(comboCount)}</div>}
    <div className="day-panel-business">
      <div className={scoreTargetMet ? "day-panel-target--met" : ""}><span>营业额</span><strong>{numberFormatter.format(score)} <small>/ {targetScore}</small>{scoreTargetMet && " ✓"}</strong></div>
      <div className={collectionTargetMet ? "day-panel-target--met" : ""}><span>今日收藏</span><strong>{collectionsToday} <small>/ {DAILY_COLLECTION_TARGET}</small>{collectionTargetMet && " ✓"}</strong></div>
      <span className="day-panel-complete">效率 {efficiency.toFixed(2)}</span>
    </div>
    <div className="day-panel-progress" role="progressbar" aria-label="营业额目标进度" aria-valuemin="0" aria-valuemax={targetScore} aria-valuenow={Math.min(score, targetScore)}>
      <span style={{width: `${Math.min(100, score / targetScore * 100)}%`}} />
    </div>
    {scoreTargetMet && collectionTargetMet && <div className="day-panel-goals-complete">今日目标已完成</div>}
    <div className="day-panel-remaining">{formatClosingTimeRemaining(remaining)}</div>
    {showTimeSalePeriods && (
      <div className="day-panel-price-overlay" onClick={() => setShowTimeSalePeriods(false)}>
        <div className="day-panel-price-dialog" role="dialog" aria-modal="true" aria-label="价格时段" onClick={event => event.stopPropagation()}>
          <div className="day-panel-price-header">
            <strong>当前时段：{currentTimeSalePeriod.displayName} · ×{formatMultiplier(currentTimeSalePeriod.multiplier)}</strong>
            <button type="button" aria-label="关闭价格时段" onClick={() => setShowTimeSalePeriods(false)}>×</button>
          </div>
          <div className="day-panel-price-list">
            {timeSalePeriods.map(item => (
              <div
                key={item.startMinutes}
                className={`day-panel-price-row day-panel-price-row--${item.multiplier < 1 ? "low" : item.multiplier > 1 ? "high" : "normal"}${item === currentTimeSalePeriod ? " day-panel-price-row--current" : ""}`}
              >
                <span>{item.range}</span>
                <strong>×{formatMultiplier(item.multiplier)}</strong>
                <span>{item.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </section>;
}
