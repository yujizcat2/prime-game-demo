import "./StepPanel.css";
import { useState } from "react";
import { getScoreEfficiency } from "../game/scoreEfficiency";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function StepPanel({
  steps = 0,
  score = 0,
  money = 0,
  stepLimit = 100,
  gameMode = null,
  collectionEfficiencyTimeline = []
}) {
  const isEightPalace = gameMode === "eightPalace" || gameMode === "simpleEightPalace";
  const displayStep = isEightPalace ? steps : steps % 12;
  const displayStepLimit = isEightPalace ? stepLimit : 12;
  const timeLabel = isEightPalace ? "步数" : "时间";
  const scoreEfficiency = getScoreEfficiency(score, steps);
  const stepProgress = displayStepLimit > 0
    ? Math.min(100, Math.max(0, (displayStep / displayStepLimit) * 100))
    : 0;
  const [showEfficiency, setShowEfficiency] = useState(false);

  return (
    <div className={`step-panel${isEightPalace ? " step-panel--game-hud" : ""}`}>
      <div className="step-panel-stats">
        <div className="step-panel-stat step-panel-stat--primary">
          <strong className="step-panel-value">
            {!isEightPalace && <span className="step-panel-currency">¥</span>}
            {numberFormatter.format(score)}
          </strong>
          <span className="step-panel-label">
            {isEightPalace ? "积分" : "金钱"}
          </span>
        </div>

        {isEightPalace && <>
          <div className="step-panel-divider" />

          <div className="step-panel-stat step-panel-stat--money">
            <strong className="step-panel-value step-panel-money">
              <span className="step-panel-currency">¥</span>
              {numberFormatter.format(money)}
            </strong>
            <span className="step-panel-label">金钱</span>
          </div>

          <div className="step-panel-divider" />

          <div className="step-panel-stat step-panel-stat--efficiency">
            <strong className="step-panel-value">{scoreEfficiency.toFixed(2)}</strong>
            <button
              type="button"
              className="step-panel-label collection-efficiency-trigger"
              aria-expanded={showEfficiency}
              onClick={() => setShowEfficiency(current => !current)}
            >
              效率
            </button>

            {showEfficiency && <div className="collection-efficiency-popover">
              <div className="collection-efficiency-heading">
                <strong>效率记录</strong>
                <span>当前效率 {scoreEfficiency.toFixed(2)}</span>
              </div>
              {collectionEfficiencyTimeline.length === 0
                ? <p>完成 10 Step 后生成第一条效率记录</p>
                : <div className="collection-efficiency-list">
                  {collectionEfficiencyTimeline.map(snapshot => <div key={snapshot.step}>
                    Step {snapshot.step}　积分 {snapshot.cumulativeScore}　收藏 {snapshot.cumulativeCollections}　效率 {snapshot.collectionEfficiency.toFixed(2)}　近10步 +{snapshot.recent10Collections}
                  </div>)}
                </div>}
            </div>}
          </div>
        </>}

        <div className="step-panel-divider" />

        <div className="step-panel-stat step-panel-stat--step">
          <strong className="step-panel-value step-panel-step-value">
            {displayStep}
            <span className="step-panel-time-max"> / {displayStepLimit}</span>
          </strong>
          <span className="step-panel-label">
            {isEightPalace ? "STEP" : timeLabel}
          </span>
        </div>
      </div>

      <div
        className="step-panel-progress"
        role="progressbar"
        aria-label="本局 Step 进度"
        aria-valuemin="0"
        aria-valuemax={displayStepLimit}
        aria-valuenow={displayStep}
      >
        <span style={{ width: `${stepProgress}%` }} />
      </div>
    </div>
  );
}
