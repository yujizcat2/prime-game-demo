import "./StepPanel.css";
import { useState } from "react";
import { getScoreEfficiency } from "../game/scoreEfficiency";

const numberFormatter = new Intl.NumberFormat("zh-CN");

export default function StepPanel({
  steps = 0,
  score = 0,
  totalActionMinutes = 0,
  stepLimit = 100,
  gameMode = null,
  checkpoint = null,
  collectionCount = 0,
  collectionEfficiencyTimeline = []
}) {
  const isEightPalace = gameMode === "eightPalace" || gameMode === "simpleEightPalace";
  const displayStep = isEightPalace ? steps : steps % 12;
  const displayStepLimit = isEightPalace ? stepLimit : 12;
  const timeLabel = isEightPalace ? "步数" : "时间";
  const scoreEfficiency = getScoreEfficiency(score, totalActionMinutes);
  const stepProgress = displayStepLimit > 0
    ? Math.min(100, Math.max(0, (displayStep / displayStepLimit) * 100))
    : 0;
  const isCollectionCheckpoint = checkpoint?.type === "collection";
  const checkpointTarget = isCollectionCheckpoint
    ? checkpoint?.requiredCollectionCount ?? 1
    : checkpoint?.requiredScore ?? 0;
  const checkpointCurrent = isCollectionCheckpoint ? collectionCount : score;
  const checkpointProgress = checkpointTarget > 0
    ? Math.min(1, Math.max(0, checkpointCurrent / checkpointTarget))
    : 0;
  const checkpointDifference = checkpointCurrent - checkpointTarget;
  const remainingSteps = Math.max(0, (checkpoint?.step ?? steps) - steps);
  const proximityClass = remainingSteps <= 2
    ? " checkpoint-card--imminent"
    : remainingSteps <= 5
      ? " checkpoint-card--near"
      : "";
  const [showEfficiency, setShowEfficiency] = useState(false);

  return (
    <div className={`step-panel${isEightPalace ? " step-panel--game-hud" : ""}`}>
      <div className="step-panel-stats">
        <div className="step-panel-stat step-panel-stat--primary">
          <strong className="step-panel-value">
            {numberFormatter.format(score)}
          </strong>
          <span className="step-panel-label">
            积分
          </span>
        </div>

        {isEightPalace && <>
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
            {!isEightPalace && <span className="step-panel-time-max"> / {displayStepLimit}</span>}
          </strong>
          <span className="step-panel-label">
            {isEightPalace ? "STEP" : timeLabel}
          </span>
        </div>
      </div>

      {isEightPalace && checkpoint && <section className={`checkpoint-card${checkpointDifference >= 0 ? " checkpoint-card--ready" : ""}${proximityClass}`}>
        <div className="checkpoint-card-heading">
          <div className="checkpoint-card-identity">
            <span className="checkpoint-card-marker" aria-hidden="true" />
            <span>CHECKPOINT</span>
            <strong>第 {checkpoint.index} 检查站</strong>
          </div>
          <span className="checkpoint-card-step"><small>STEP</small><strong>{checkpoint.step}</strong></span>
        </div>
        <div className="checkpoint-card-score-row">
          <div>
            <span className="checkpoint-card-caption">{isCollectionCheckpoint ? "任务" : "目标"}</span>
            <strong className="checkpoint-card-target">
              {isCollectionCheckpoint
                ? "获得至少 1 个收藏"
                : `${numberFormatter.format(checkpointTarget)} 分`}
            </strong>
          </div>
          <div className="checkpoint-card-current">
            <span>当前 {numberFormatter.format(checkpointCurrent)}{isCollectionCheckpoint ? " 个收藏" : " 分"}</span>
            <strong>{checkpointDifference >= 0
              ? checkpointDifference === 0 ? "已达标" : isCollectionCheckpoint ? `${checkpointCurrent} / ${checkpointTarget} · 已完成` : `已达标 · 领先 ${numberFormatter.format(checkpointDifference)} 分`
              : `还差 ${numberFormatter.format(-checkpointDifference)}${isCollectionCheckpoint ? " 个" : " 分"}`}</strong>
          </div>
        </div>
        <div className="checkpoint-score-progress" role="progressbar" aria-label="检查站目标进度" aria-valuemin="0" aria-valuemax={checkpointTarget} aria-valuenow={Math.min(checkpointCurrent, checkpointTarget)}>
          <span style={{width: `${checkpointProgress * 100}%`}} />
        </div>
        <div className="checkpoint-card-footer">
          {remainingSteps === 0 ? "正在检查" : <><span>剩余</span><strong>{remainingSteps}</strong><span>STEP</span></>}
        </div>
      </section>}

      {!isEightPalace && <div
        className="step-panel-progress"
        role="progressbar"
        aria-label="本局 Step 进度"
        aria-valuemin="0"
        aria-valuemax={displayStepLimit}
        aria-valuenow={displayStep}
      >
        <span style={{ width: `${stepProgress}%` }} />
      </div>}
    </div>
  );
}
