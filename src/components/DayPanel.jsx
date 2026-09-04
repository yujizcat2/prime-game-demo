import "./DayPanel.css";
import { ACTIONS_PER_DAY } from "../game/dayCycle";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function DayPanel({day, time, period, dayStep, score, target}){
  const remaining = Math.max(0, ACTIONS_PER_DAY - dayStep);
  const difference = score - target;
  const progress = target > 0 ? Math.min(1, Math.max(0, score / target)) : 1;
  const urgency = remaining <= 2 ? " day-panel--urgent" : remaining <= 5 ? " day-panel--near" : "";

  return <section className={`day-panel${urgency}`} aria-label={`第${day}营业日`}>
    <div className="day-panel-heading">
      <div>
        <strong>DAY {day}</strong>
        <span>第{day}营业日</span>
      </div>
      <div className="day-panel-clock">
        <strong>{time}</strong>
        <span>{period}</span>
      </div>
    </div>

    <div className="day-panel-business">
      <div>
        <span>今日营业</span>
        <strong>{numberFormatter.format(score)} <small>/ {numberFormatter.format(target)} 分</small></strong>
      </div>
      <span className={difference >= 0 ? "day-panel-complete" : "day-panel-gap"}>
        {difference >= 0 ? "今日目标已完成" : `还差 ${numberFormatter.format(-difference)}`}
      </span>
    </div>
    <div className="day-panel-progress" role="progressbar" aria-label="今日营业目标进度" aria-valuemin="0" aria-valuemax={target} aria-valuenow={Math.min(score, target)}>
      <span style={{width: `${progress * 100}%`}} />
    </div>
    <div className="day-panel-remaining">距离打烊 <strong>{remaining}</strong> 次行动</div>
  </section>;
}
