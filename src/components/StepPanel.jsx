import "./StepPanel.css";
import { useState } from "react";
import { getScoreEfficiency } from "../game/scoreEfficiency";


export default function StepPanel({

  steps = 0,

  score = 0,

  money = 0,

  stepLimit = 100,

  gameMode = null,

  collectionEfficiencyTimeline = []

}) {


  // =========================
  // 12小时制
  // =========================

  const isEightPalace = gameMode === "eightPalace" || gameMode === "simpleEightPalace";
  const displayStep = isEightPalace ? steps : steps % 12;
  const scoreEfficiency = getScoreEfficiency(score, steps);
  const [showEfficiency, setShowEfficiency] = useState(false);



  return (

    <div
      className="
        step-panel
      "
    >


      {/* =========================
          {isEightPalace ? "积分" : "金钱"}
          ========================= */}

      <div
        className="
          step-panel-stat
        "
      >


        <span
          className="
            step-panel-label
          "
        >

          {isEightPalace ? "积分" : "金钱"}

        </span>


        <strong
          className="
            step-panel-value
            step-panel-money
          "
        >

          {!isEightPalace && <span
            className="
              step-panel-currency
            "
          >

            ¥

          </span>}


          {score}

        </strong>


      </div>


      {isEightPalace && <>
        <div className="step-panel-divider" />

        <div className="step-panel-stat">
          <span className="step-panel-label">金钱</span>
          <strong className="step-panel-value step-panel-money">
            <span className="step-panel-currency">¥</span>{money}
          </strong>
        </div>

        <div className="step-panel-divider" />

        <div className="step-panel-stat step-panel-stat--efficiency">
          <span className="step-panel-label">得分效率</span>
          <strong className="step-panel-value">{scoreEfficiency.toFixed(2)}</strong>
        </div>
      </>}



      {/* =========================
          分隔
          ========================= */}

      <div
        className="
          step-panel-divider
        "
      />



      {/* =========================
          {isEightPalace ? "步数" : "时间"}
          ========================= */}

      <div
        className="
          step-panel-stat
        "
      >


        <span
          className="
            step-panel-label
          "
        >

          {isEightPalace ? "步数" : "时间"}

        </span>


        <strong
          className="
            step-panel-value
          "
        >

          {displayStep}


          <span
            className="
              step-panel-time-max
            "
          >

            / {isEightPalace ? stepLimit : 12}

          </span>


        </strong>


      </div>

      {isEightPalace && <div className="collection-efficiency-control">
        <button
          type="button"
          className="collection-efficiency-trigger"
          aria-expanded={showEfficiency}
          onClick={() => setShowEfficiency(current => !current)}
        >
          效率记录
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
      </div>}


    </div>

  );

}
