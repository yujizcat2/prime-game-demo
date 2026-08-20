import {
  useEffect,
  useRef,
  useState
} from "react";

import "./BoardStatus.css";


export default function BoardStatus({

  primeEnergy = 0,

  primeDensity = 0,

  primeState = "沉寂",


  // =========================
  // 活性
  // =========================

  activity = 0,

  activityLegal = 0,

  activityTotal = 0,

  activityCombineLegal = 0,

  activityCombineTotal = 0,

  activityCombinePrimeLegal = 0,

  activityReduceLegal = 0,

  activityReduceTotal = 0,

}) {


  // =========================
  // 活性详情开关
  // =========================

  const [

    showActivityDetail,

    setShowActivityDetail

  ] = useState(false);



  // =========================
  // 活性区域引用
  // =========================

  const activityRef =
    useRef(null);



  // =========================
  // 点击外部关闭
  // =========================

  useEffect(
    () => {


      function handleOutsideClick(
        event
      ) {


        if(
          !showActivityDetail
        ){

          return;

        }


        if(
          activityRef.current &&
          !activityRef.current.contains(
            event.target
          )
        ){

          setShowActivityDetail(
            false
          );

        }


      }



      document.addEventListener(
        "pointerdown",
        handleOutsideClick
      );



      return () => {

        document.removeEventListener(
          "pointerdown",
          handleOutsideClick
        );

      };


    },
    [
      showActivityDetail
    ]
  );



  // =========================
  // 活性文字状态
  // =========================

  function getActivityText() {


    if(
      activity >= 70
    ){

      return "非常活跃";

    }


    if(
      activity >= 45
    ){

      return "比较活跃";

    }


    if(
      activity >= 25
    ){

      return "略显安静";

    }


    if(
      activity > 0
    ){

      return "接近沉寂";

    }


    return "已经沉寂";

  }



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



        {/* =========================
            活性
            ========================= */}

        <div

          ref={
            activityRef
          }

          className="
            board-status-activity-wrapper
          "

        >


          <button

            type="button"

            className="
              board-status-item
              board-status-activity-item
            "

            onClick={() =>

              setShowActivityDetail(

                current =>
                  !current

              )

            }

          >


            <div
              className="
                board-status-label
                board-status-activity-label
              "
            >

              活性


              <span
                className="
                  board-status-info-icon
                "
              >

                i

              </span>

            </div>



            <div
              className="
                board-status-value
                board-status-activity-value
              "
            >

              {activity}%

            </div>


          </button>



          {/* =========================
              活性详情
              ========================= */}

          {

            showActivityDetail && (

              <div
                className="
                  board-status-activity-detail
                "
              >


                {/* =====================
                    顶部
                    ===================== */}

                <div
                  className="
                    activity-detail-header
                  "
                >


                  <div
                    className="
                      activity-detail-title
                    "
                  >

                    当前活性

                  </div>



                  <div
                    className="
                      activity-detail-percent
                    "
                  >

                    {activity}%

                  </div>


                </div>



                {/* =====================
                    状态说明
                    ===================== */}

                <div
                  className="
                    activity-detail-status
                  "
                >

                  {getActivityText()}

                </div>



                <div
                  className="
                    activity-detail-description
                  "
                >

                  活性越高，
                  当前局面可继续变化的空间越大。

                </div>



                {/* =====================
                    分隔线
                    ===================== */}

                <div
                  className="
                    activity-detail-separator
                  "
                />



                {/* =====================
                    可行动作
                    ===================== */}

                <div
                  className="
                    activity-detail-row
                    activity-detail-row-main
                  "
                >


                  <span>

                    可行动作

                  </span>


                  <span>

                    <strong>

                      {activityLegal}

                    </strong>

                    {" / "}

                    {activityTotal}

                  </span>


                </div>



                {/* =====================
                    合成
                    ===================== */}

                <div
                  className="
                    activity-detail-row
                  "
                >


                  <span>

                    可以合成

                  </span>


                  <span>

                    {activityCombineLegal}

                  </span>


                </div>



                {/* =====================
                    约分
                    ===================== */}

                <div
                  className="
                    activity-detail-row
                  "
                >


                  <span>

                    可以约分

                  </span>


                  <span>

                    {activityReduceLegal}

                  </span>


                </div>



                {/* =====================
                    质数提示
                    ===================== */}

                {

                  activityCombinePrimeLegal > 0 && (

                    <div
                      className="
                        activity-detail-note
                      "
                    >

                      有部分合成会生成质数，
                      后续变化空间相对较小。

                    </div>

                  )

                }


              </div>

            )

          }


        </div>


      </div>


    </div>

  );

}