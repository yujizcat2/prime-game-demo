import { useState } from "react";
import "./DaySettlement.css";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function Metric({label, value}){
  return <div className="day-settlement-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export default function DaySettlement({settlement, onContinue}){
  const [showClosing, setShowClosing] = useState(true);
  if(!settlement || !showClosing) return null;
  const isWeekComplete = settlement.day >= 7 && settlement.passed;
  const marketRows = settlement.timeSaleMarketRows ?? [];
  const formatMultiplier = value => Number(value).toFixed(2);
  const formatRate = value => `+${(Number(value ?? 0) * 100).toFixed(1)}%`;
  return <div className="day-settlement-backdrop" role="dialog" aria-modal="true" aria-labelledby="day-settlement-title">
    <section className="day-settlement-card">
      <div className="day-settlement-kicker">DAY {settlement.day} · {settlement.weekday} · 打烊</div>
      <h2 id="day-settlement-title">{settlement.passed ? "今日营业完成" : "今日目标未完成"}</h2>
      <div className="day-settlement-rule" />
      <Metric label="今日基础积分" value={`+${Number(settlement.dayBaseScore ?? 0).toFixed(2)}`} />
      <div className="day-settlement-rule" />
      <Metric label="综合表现 · 效率" value={formatRate(settlement.efficiencyRate)} />
      <Metric label="综合表现 · 超额" value={formatRate(settlement.overflowRate)} />
      <Metric label="综合表现 · 售出质量" value={formatRate(settlement.qualityRate)} />
      <Metric label="综合表现 · 收盘盘面" value={formatRate(settlement.boardRate)} />
      <Metric label="综合加成" value={formatRate(settlement.performanceBonusRate)} />
      <Metric label="额外积分" value={`+${Number(settlement.performanceBonusScore ?? 0).toFixed(2)}`} />
      <Metric label="今日积分" value={`+${Number(settlement.dayFinalScore ?? 0).toFixed(2)}`} />
      <Metric label="累计积分" value={Number(settlement.cumulativeScore ?? settlement.finalScore ?? 0).toFixed(2)} />
      <Metric label="营业额" value={`${numberFormatter.format(settlement.dailyRevenue)} / ${settlement.targetScore} ${settlement.scoreTargetMet ? "✓" : "✕"}`} />
      <Metric label="今日售出" value={numberFormatter.format(settlement.collectionGainToday)} />
      <Metric label="今日销售奖励" value={`+${numberFormatter.format(settlement.dailyCollectionBonusTotal ?? 0)}`} />
      <Metric label="今日效率" value={settlement.efficiency.toFixed(2)} />
      <Metric label="当日最高连击" value={settlement.maxComboToday} />
      <Metric label="当日连击奖励" value={`+${numberFormatter.format(settlement.comboBonusToday)}`} />
      <Metric label="打烊盘面" value={`${settlement.boardCount} 张 · 总和 ${numberFormatter.format(settlement.boardSum)}`} />
      {marketRows.length > 0 && <section className="day-settlement-market" aria-label="今日销售行情">
        <h3>今日销售行情</h3>
        <div className="day-settlement-market-list">
          {marketRows.map(row => {
            const trend = row.nextMultiplier > row.multiplier + 1e-9
              ? "↑"
              : row.nextMultiplier < row.multiplier - 1e-9 ? "↓" : "—";
            return <div className="day-settlement-market-row" key={row.startMinutes}>
              <strong>{row.displayName}</strong>
              <span>销售 {numberFormatter.format(row.saleScore)}分 · {numberFormatter.format(row.saleIntensity)}分/h</span>
              <span>今日 ×{formatMultiplier(row.multiplier)}　明日 {trend} ×{formatMultiplier(row.nextMultiplier)}</span>
            </div>;
          })}
        </div>
        <div className="day-settlement-market-total">
          <span>全天价格总量：{Number(settlement.timeSalePriceTotal).toFixed(2)}</span>
          <span>平均倍率：×{(Number(settlement.timeSalePriceTotal) / 24).toFixed(2)}</span>
        </div>
      </section>}
      {settlement.passed && !isWeekComplete
        ? <button type="button" onClick={onContinue}>进入第{settlement.day + 1}天</button>
        : <button type="button" className="day-settlement-summary-button" onClick={() => setShowClosing(false)}>查看本局总结</button>}
    </section>
  </div>;
}
