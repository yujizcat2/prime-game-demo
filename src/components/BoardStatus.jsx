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

  activity = 0,

  activityLegal = 0,

  activityTotal = 0,

  activityCombineLegal = 0,

  activityCombineTotal = 0,

  activityCombinePrimeLegal = 0,

  activityReduceLegal = 0,

  activityReduceTotal = 0,

}) {


  const [

    showActivityDetail,

    setShowActivityDetail

  ] = useState(false);



  const activityRef =
    useRef(null);



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
            board-status-activity-card
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
              board-status-activity-top
            "
          >


            <span
              className="
                board-status-activity-label
              "
            >

              {getActivityText()}

            </span>


            <span
              className="
                board-status-arrow
              "
            >

              ›

            </span>


          </div>



          <div
            className="
              board-status-activity-value
            "
          >

            {activity}%

          </div>


        </button>



        {

          showActivityDetail && (

            <div
              className="
                board-status-activity-detail
              "
            >


              <div
                className="
                  activity-detail-header
                "
              >


                <div>

                  <div
                    className="
                      activity-detail-title
                    "
                  >

                    当前环境

                  </div>


                  <div
                    className="
                      activity-detail-status
                    "
                  >

                    {getActivityText()}

                  </div>

                </div>



                <div
                  className="
                    activity-detail-percent
                  "
                >

                  {activity}%

                </div>


              </div>



              <div
                className="
                  activity-detail-description
                "
              >

                活性表示当前局面还能产生多少有效变化。

              </div>



              <div
                className="
                  activity-detail-separator
                "
              />


              <div
                className="
                  activity-detail-section-title
                "
              >

                环境参数

              </div>



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  质能
                </span>

                <span>
                  {primeEnergy}
                </span>

              </div>



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  质密
                </span>

                <span>
                  {primeDensity}
                </span>

              </div>



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  质态
                </span>

                <span>
                  {primeState}
                </span>

              </div>



              <div
                className="
                  activity-detail-separator
                "
              />


              <div
                className="
                  activity-detail-section-title
                "
              >

                动作空间

              </div>



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



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  可以组合
                </span>

                <span>

                  {activityCombineLegal}

                  {" / "}

                  {activityCombineTotal}

                </span>

              </div>



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  可以处理
                </span>

                <span>

                  {activityReduceLegal}

                  {" / "}

                  {activityReduceTotal}

                </span>

              </div>



              {

                activityCombinePrimeLegal > 0 && (

                  <div
                    className="
                      activity-detail-note
                    "
                  >

                    当前有部分组合会生成质数，
                    后续变化空间可能进一步收紧。

                  </div>

                )

              }


            </div>

          )

        }


      </div>


    </div>

  );

}