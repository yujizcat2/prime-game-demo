import "./DayPanel.css";
import { DAY_DURATION_MINUTES, getDayTargetScore } from "../game/dayCycle";
import { getScoreEfficiency } from "../game/scoreEfficiency";
import { getComboBonus } from "../game/scoreCombo";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function DayPanel({day, weekday, time, period, dayMinutesElapsed, score, totalActionMinutes, comboCount}){
  const remaining = Math.max(0, DAY_DURATION_MINUTES - dayMinutesElapsed);
  const urgency = remaining <= 120 ? " day-panel--urgent" : remaining <= 300 ? " day-panel--near" : "";
  const efficiency = getScoreEfficiency(score, totalActionMinutes);
  const targetScore = getDayTargetScore(day);

  return <section className={`day-panel${urgency}`} aria-label={`${weekday}营业日`}>
    <div className="day-panel-heading">
      <div><strong>DAY {day}</strong><span>{weekday}</span></div>
      <div className="day-panel-clock"><strong>{time}</strong><span>{period}</span></div>
    </div>
    {comboCount >= 2 && <div className="day-panel-combo" role="status">{comboCount} 连击 · +{getComboBonus(comboCount)}</div>}
    <div className="day-panel-business">
      <div><span>营业额</span><strong>{numberFormatter.format(score)} <small>/ {targetScore}</small></strong></div>
      <span className="day-panel-complete">效率 {efficiency.toFixed(2)}</span>
    </div>
    <div className="day-panel-progress" role="progressbar" aria-label="营业额目标进度" aria-valuemin="0" aria-valuemax={targetScore} aria-valuenow={Math.min(score, targetScore)}>
      <span style={{width: `${Math.min(100, score / targetScore * 100)}%`}} />
    </div>
    <div className="day-panel-remaining">距离打烊 <strong>{remaining}</strong> 分钟</div>
  </section>;
}
