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


  activityReduceLegal = 0,

  activityReduceTotal = 0,


  activityRemoveLegal = 0,

  activityRemoveTotal = 0,

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
  // 点击活性区域外
  // 自动关闭详情
  // =========================

  useEffect(
    () => {


      function handleOutsideClick(
        event
      ) {


        if (
          !showActivityDetail
        ) {

          return;

        }


        if (
          activityRef.current &&
          !activityRef.current.contains(
            event.target
          )
        ) {

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


            {/* =====================
                活性标题
                ===================== */}

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



            {/* =====================
                活性百分比
                ===================== */}

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
                    详情标题
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

                    活性

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
                    总动作
                    ===================== */}

                <div
                  className="
                    activity-detail-main
                  "
                >


                  <span
                    className="
                      activity-detail-legal
                    "
                  >

                    {activityLegal}

                  </span>



                  <span
                    className="
                      activity-detail-divider
                    "
                  >

                    /

                  </span>



                  <span
                    className="
                      activity-detail-total
                    "
                  >

                    {activityTotal}

                  </span>



                  <span
                    className="
                      activity-detail-text
                    "
                  >

                    种动作可执行

                  </span>


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
                    动作分类
                    ===================== */}

                <div
                  className="
                    activity-detail-list
                  "
                >


                  {/* ===================
                      合成
                      =================== */}

                  <div
                    className="
                      activity-detail-row
                    "
                  >


                    <span>

                      合成

                    </span>


                    <span>

                      <strong>

                        {activityCombineLegal}

                      </strong>

                      {" / "}

                      {activityCombineTotal}

                    </span>


                  </div>



                  {/* ===================
                      约分
                      =================== */}

                  <div
                    className="
                      activity-detail-row
                    "
                  >


                    <span>

                      约分

                    </span>


                    <span>

                      <strong>

                        {activityReduceLegal}

                      </strong>

                      {" / "}

                      {activityReduceTotal}

                    </span>


                  </div>



                  {/* ===================
                      消除
                      =================== */}

                  <div
                    className="
                      activity-detail-row
                    "
                  >


                    <span>

                      消除

                    </span>


                    <span>

                      <strong>

                        {activityRemoveLegal}

                      </strong>

                      {" / "}

                      {activityRemoveTotal}

                    </span>


                  </div>


                </div>


              </div>

            )

          }


        </div>


      </div>


    </div>

  );

}