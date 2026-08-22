import {
  getSeasoningName
} from "../data/food/seasoningData";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";

import "./SeasoningTray.css";





// ============================================================
// 根据料理类型获取名称
// ============================================================

function getFoodName(
  value,
  foodType
) {


  if(
    value === null ||
    value === undefined
  ){

    return null;

  }



  if(
    foodType === "meat"
  ){

    return getMeatName(
      value
    );

  }



  if(
    foodType === "vegetable"
  ){

    return getVegetableName(
      value
    );

  }



  if(
    foodType === "dessert"
  ){

    return getDessertName(
      value
    );

  }



  return String(
    value
  );

}





export default function SeasoningTray({

  seasoningTray = [],

  numbers = []

}) {


  // ==========================================================
  // 固定3格
  // ==========================================================

  const slots =
    Array.from({

      length: 3

    });





  // ==========================================================
  // 当前第一个调料
  //
  // 只有它可以使用。
  // ==========================================================

  const firstSeasoning =
    seasoningTray[0] ?? null;





  // ==========================================================
  // 当前主菜盘第一道菜
  //
  // 只有它可以和第一个调料搭配。
  // ==========================================================

  const firstDish =
    numbers[0] ?? null;





  // ==========================================================
  // 当前第一个调料名称
  // ==========================================================

  const firstSeasoningName =

    firstSeasoning

      ?

      getSeasoningName(
        firstSeasoning.value
      )

      :

      null;





  // ==========================================================
  // 当前主菜盘第一道料理名称
  // ==========================================================

  const firstDishName =

    firstDish

      ?

      getFoodName(

        firstDish.value,

        firstDish.foodType

      )

      :

      null;





  // ==========================================================
  // 当前是否存在可使用调料
  // ==========================================================

  const hasFirstSeasoning =
    firstSeasoning !== null;





  return (

    <div className="seasoning-tray">


      {/* ======================================================
          标题栏
          ====================================================== */}

      <div className="seasoning-tray-header">


        <div className="seasoning-tray-title">

          调料盘

        </div>


        <div className="seasoning-tray-count">

          {seasoningTray.length}/3

        </div>


      </div>





      {/* ======================================================
          当前可搭配提示
          ====================================================== */}

      <div className="seasoning-current-hint">


        {

          firstSeasoningName &&
          firstDishName

            ?

            <>

              <span className="seasoning-current-hint-name">

                「{firstSeasoningName}」

              </span>


              <span>

                现在可以搭配主菜盘第一道

              </span>


              <span className="seasoning-current-hint-dish">

                「{firstDishName}」

              </span>

            </>


            : firstSeasoningName

            ?

            <>

              <span className="seasoning-current-hint-name">

                「{firstSeasoningName}」

              </span>


              <span>

                等待主菜

              </span>

            </>


            :

            <span className="seasoning-current-hint-empty">

              等待可用调料

            </span>

        }


      </div>





      {/* ======================================================
          调料流动区域
          ====================================================== */}

      <div className="seasoning-flow">


        {/* ====================================================
            左侧
            当前第一格向左出菜
            ==================================================== */}

        <div

          className={`
            seasoning-flow-side
            seasoning-flow-left

            ${
              hasFirstSeasoning

                ? "seasoning-flow-active"

                : ""
            }
          `}

        >

          <div className="seasoning-arrow-track seasoning-arrow-track-out">

            <span>←</span>
            <span>←</span>
            <span>←</span>

          </div>

        </div>





        {/* ====================================================
            三格调料队列
            ==================================================== */}

        <div className="seasoning-tray-grid">


          {

            slots.map(
              (_, index) => {


                const seasoning =
                  seasoningTray[index];



                // =================================================
                // 空格
                // =================================================

                if(
                  !seasoning
                ){


                  return (

                    <div

                      key={
                        `seasoning-empty-${index}`
                      }

                      className="
                        seasoning-slot
                        seasoning-slot-empty
                      "

                    >

                      <span className="seasoning-empty-text">

                        空

                      </span>

                    </div>

                  );

                }





                const value =
                  seasoning.value;



                const seasoningName =

                  getSeasoningName(
                    value
                  );



                // =================================================
                // 第一格
                //
                // 当前唯一可用调料。
                // =================================================

                const isFirst =
                  index === 0;



                return (

                  <div

                    key={
                      `seasoning-${seasoning.id}`
                    }

                    className={`
                      seasoning-slot
                      seasoning-slot-filled
                      seasoning-enter

                      ${
                        isFirst

                          ? "seasoning-slot-current"

                          : "seasoning-slot-waiting"
                      }
                    `}

                  >



                    {/* ===========================================
                        当前可用状态点
                        =========================================== */}

                    {

                      isFirst &&

                      <span className="seasoning-current-dot" />

                    }





                    {/* ===========================================
                        左上角编号
                        =========================================== */}

                    <span className="seasoning-number">

                      {value}

                    </span>





                    {/* ===========================================
                        调料名称
                        =========================================== */}

                    <span className="seasoning-name">

                      {seasoningName}

                    </span>





                    {/* ===========================================
                        状态
                        =========================================== */}

                    <span className="seasoning-type">

                      {
                        isFirst

                          ? "可出菜"

                          : "等待"
                      }

                    </span>


                  </div>

                );

              }
            )

          }


        </div>





        {/* ====================================================
            右侧
            新调料从右向左进入
            ==================================================== */}

        <div

          className="
            seasoning-flow-side
            seasoning-flow-right
          "

        >

          <div className="seasoning-arrow-track seasoning-arrow-track-in">

            <span>←</span>
            <span>←</span>
            <span>←</span>

          </div>

        </div>


      </div>


    </div>

  );

}