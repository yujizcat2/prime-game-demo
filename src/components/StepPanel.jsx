import "./StepPanel.css";


export default function StepPanel({

  steps = 0,

  score = 0

}) {


  // =========================
  // 12小时制
  // =========================

  const displayHour =
    steps % 12;



  return (

    <div
      className="
        step-panel
      "
    >


      {/* =========================
          金钱
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

          金钱

        </span>


        <strong
          className="
            step-panel-value
            step-panel-money
          "
        >

          <span
            className="
              step-panel-currency
            "
          >

            ¥

          </span>


          {score}

        </strong>


      </div>



      {/* =========================
          分隔
          ========================= */}

      <div
        className="
          step-panel-divider
        "
      />



      {/* =========================
          时间
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

          时间

        </span>


        <strong
          className="
            step-panel-value
          "
        >

          {displayHour}


          <span
            className="
              step-panel-time-max
            "
          >

            / 12

          </span>


        </strong>


      </div>


    </div>

  );

}