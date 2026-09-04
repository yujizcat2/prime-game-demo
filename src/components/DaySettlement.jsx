import "./DaySettlement.css";
import { getDayScoreTarget } from "../game/dayCycle";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function Metric({label, value}){
  return <div className="day-settlement-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function DaySettlement({settlement, onContinue}){
  if(!settlement?.passed) return null;
  const lead = settlement.finalScore - settlement.targetScore;
  return <div className="day-settlement-backdrop" role="dialog" aria-modal="true" aria-labelledby="day-settlement-title">
    <section className="day-settlement-card">
      <div className="day-settlement-kicker">DAY {settlement.day} · 打烊</div>
      <h2 id="day-settlement-title">今日营业完成</h2>
      <div className="day-settlement-rule" />
      <Metric label="最终积分" value={numberFormatter.format(settlement.finalScore)} />
      <Metric label="营业目标" value={numberFormatter.format(settlement.targetScore)} />
      <Metric label="领先" value={numberFormatter.format(lead)} />
      <div className="day-settlement-rule" />
      <Metric label="今日新增积分" value={`+${numberFormatter.format(settlement.scoreGainToday)}`} />
      <Metric label="今日新料理包" value={`+${numberFormatter.format(settlement.collectionGainToday)}`} />
      <Metric label="打烊盘面总和" value={numberFormatter.format(settlement.boardSum)} />
      <p>明日目标：{numberFormatter.format(getDayScoreTarget(settlement.day + 1))} 分</p>
      <button type="button" onClick={onContinue}>开始第{settlement.day + 1}天</button>
    </section>
  </div>;
}
