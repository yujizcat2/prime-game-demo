import "./DayPanel.css";
import { ACTIONS_PER_DAY } from "../game/dayCycle";
import { getScoreEfficiency } from "../game/scoreEfficiency";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function DayPanel({day, weekday, time, period, dayStep, score, steps}){
  const remaining = Math.max(0, ACTIONS_PER_DAY - dayStep);
  const urgency = remaining <= 2 ? " day-panel--urgent" : remaining <= 5 ? " day-panel--near" : "";
  const efficiency = getScoreEfficiency(score, steps);

  return <section className={`day-panel${urgency}`} aria-label={`${weekday}营业日`}>
    <div className="day-panel-heading">
      <div><strong>DAY {day}</strong><span>{weekday}</span></div>
      <div className="day-panel-clock"><strong>{time}</strong><span>{period}</span></div>
    </div>
    <div className="day-panel-business">
      <div><span>当前积分</span><strong>{numberFormatter.format(score)}</strong></div>
      <span className="day-panel-complete">效率 {efficiency.toFixed(2)}</span>
    </div>
    <div className="day-panel-progress" role="progressbar" aria-label="今日行动进度" aria-valuemin="0" aria-valuemax={ACTIONS_PER_DAY} aria-valuenow={dayStep}>
      <span style={{width: `${dayStep / ACTIONS_PER_DAY * 100}%`}} />
    </div>
    <div className="day-panel-remaining">距离打烊 <strong>{remaining}</strong> 次行动</div>
  </section>;
}
