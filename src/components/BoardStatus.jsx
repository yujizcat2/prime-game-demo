import {
  useEffect,
  useRef,
  useState
} from "react";

import "./BoardStatus.css";

import {
  getActivityText
} from "../game/activityStatus";


export default function BoardStatus({
  activity = 0,
  activityCombineLegal = 0,
  activityReduceLegal = 0,

  numberCount = 0,
  abundance = 0,
  abundanceBonusRate = 0,

  dead = false,

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

              {dead ? "无路可走" : getActivityText(activity)}

            </span>


            <span
              className="board-status-activity-percent"
            >
              {activity}%
            </span>

            <span
              className="
                board-status-arrow
              "
            >

              ›

            </span>


          </div>



          <div className="board-status-metrics">
            <span>丰盛度 <strong>{abundance}</strong>{abundanceBonusRate > 0 && ` · 收藏 +${Math.round(abundanceBonusRate * 100)}%`}</span>
            <span>搭配 <strong>{activityCombineLegal}</strong></span>
            <span>处理 <strong>{activityReduceLegal}</strong></span>
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

                    当前局面

                  </div>


                  <div
                    className="
                      activity-detail-status
                    "
                  >

                    {dead
                      ? "无路可走 · 0%"
                      : `${getActivityText(activity)} · ${activity}%`}

                  </div>

                </div>

              </div>



              <div className="activity-detail-description">

                {dead
                  ? "当前没有可以进行的操作"
                  : numberCount >= 9
                    ? "暂时不能增加新料理，还可以继续处理"
                    : "活动空间表示当前还有多少可选操作。"}

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

                局面情况

              </div>



              <div className="activity-detail-row activity-detail-row-main">

                <span>
                  {numberCount >= 9 ? "料理台已满" : "料理台"}
                </span>

                <span>
                  <strong>{numberCount}</strong>
                  {" / 9"}
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

                可选操作

              </div>



              <div
                className="
                  activity-detail-row
                "
              >

                <span>
                  可以搭配
                </span>

                <span>

                  {activityCombineLegal}

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

                </span>

              </div>



            </div>

          )

        }


      </div>


    </div>

  );

}
