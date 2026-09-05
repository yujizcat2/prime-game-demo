import "./DayPanel.css";
import { ACTIONS_PER_DAY, DAY_SCORE_TARGET } from "../game/dayCycle";
import { getScoreEfficiency } from "../game/scoreEfficiency";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function DayPanel({day, weekday, time, period, dayStep, score, scoreGainToday, steps}){
  const remaining = Math.max(0, ACTIONS_PER_DAY - dayStep);
  const urgency = remaining <= 2 ? " day-panel--urgent" : remaining <= 5 ? " day-panel--near" : "";
  const efficiency = getScoreEfficiency(score, steps);

  return <section className={`day-panel${urgency}`} aria-label={`${weekday}营业日`}>
    <div className="day-panel-heading">
      <div><strong>DAY {day}</strong><span>{weekday}</span></div>
      <div className="day-panel-clock"><strong>{time}</strong><span>{period}</span></div>
    </div>
    <div className="day-panel-business">
      <div><span>今日营业额</span><strong>{numberFormatter.format(scoreGainToday)} <small>/ {DAY_SCORE_TARGET}</small></strong></div>
      <span className="day-panel-complete">效率 {efficiency.toFixed(2)}</span>
    </div>
    <div className="day-panel-progress" role="progressbar" aria-label="今日营业额目标进度" aria-valuemin="0" aria-valuemax={DAY_SCORE_TARGET} aria-valuenow={Math.min(scoreGainToday, DAY_SCORE_TARGET)}>
      <span style={{width: `${Math.min(100, scoreGainToday / DAY_SCORE_TARGET * 100)}%`}} />
    </div>
    <div className="day-panel-remaining">距离打烊 <strong>{remaining}</strong> 次行动</div>
  </section>;
}
