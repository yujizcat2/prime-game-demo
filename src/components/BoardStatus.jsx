import "./BoardStatus.css";


export default function BoardStatus({

  primeEnergy = 0,

  primeDensity = 0,

  primeState = "沉寂"

}) {


  return (

    <div
      className="
        board-status
      "
    >


      {/* =========================
          标题
          ========================= */}

      <div
        className="
          board-status-header
        "
      >

        环境

      </div>



      {/* =========================
          环境属性
          ========================= */}

      <div
        className="
          board-status-list
        "
      >


        {/* =========================
            质能
            ========================= */}

        <div
          className="
            board-status-item
          "
        >

          <div
            className="
              board-status-label
            "
          >

            质能

          </div>


          <div
            className="
              board-status-value
            "
          >

            {primeEnergy}

          </div>

        </div>



        {/* =========================
            质密
            ========================= */}

        <div
          className="
            board-status-item
          "
        >

          <div
            className="
              board-status-label
            "
          >

            质密

          </div>


          <div
            className="
              board-status-value
            "
          >

            {primeDensity}

          </div>

        </div>



        {/* =========================
            质态
            ========================= */}

        <div
          className="
            board-status-item
            board-status-state-item
          "
        >

          <div
            className="
              board-status-label
            "
          >

            质态

          </div>


          <div
            className="
              board-status-state
            "
          >

            {primeState}

          </div>

        </div>


      </div>


    </div>

  );

}