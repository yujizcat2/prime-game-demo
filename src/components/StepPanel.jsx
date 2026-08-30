import "./StepPanel.css";
import { getScoreEfficiency } from "../game/scoreEfficiency";


export default function StepPanel({

  steps = 0,

  score = 0,

  stepLimit = 100,

  gameMode = null

}) {


  // =========================
  // 12小时制
  // =========================

  const isEightPalace = gameMode === "eightPalace" || gameMode === "simpleEightPalace";
  const displayStep = isEightPalace ? steps : steps % 12;
  const scoreEfficiency = getScoreEfficiency(score, steps);



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


    </div>

  );

}
