import "./ActionButtons.css";





// ============================================================
// 食物类型中文
// ============================================================

function getFoodTypeLabel(
  foodType
){


  switch(
    foodType
  ){


    case "meat":

      return "荤";


    case "vegetable":

      return "素";


    case "seasoning":

      return "调料";


    case "dessert":

      return "甜食";


    default:

      return "";

  }

}





export default function ActionButtons({

  selected = [],

  preview,

  onCombine,

  onReduce,

  gameOver,

  removingId = null,

}) {


  const busy =

    removingId !== null;



  const canCombine =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.combine;



  const canReduce =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;



  // ==========================================================
  // 约分额外析出物
  //
  // 例如：
  //
  // 12 / 18
  //
  // → 2 / 3
  //
  // 同时：
  //
  // +6 调料
  // ==========================================================

  const reduceExtract =

    canReduce

      ?

      preview
        ?.reduce
        ?.extract

      :

      null;



  const reduceExtractTypeLabel =

    reduceExtract

      ?

      getFoodTypeLabel(
        reduceExtract.foodType
      )

      :

      "";



  return (

    <div
      className="
        action-toolbar
      "
    >


      {/* ======================================================
          组合
      ====================================================== */}

      <button

        type="button"

        onClick={
          canCombine
            ? onCombine
            : undefined
        }

        disabled={
          !canCombine
        }

        className={`
          action-toolbar-button

          ${
            canCombine

              ?

              "action-toolbar-button--combine-active"

              :

              "action-toolbar-button--disabled"
          }
        `}

      >


        <span
          className="
            action-toolbar-icon
          "
        >

          +

        </span>


        <span
          className="
            action-toolbar-label
          "
        >

          组合

        </span>


      </button>



      {/* ======================================================
          约分析出物

          不占棋盘空格。

          与“组合幽灵卡”完全分离。
      ====================================================== */}

      {

        reduceExtract &&

        <div
          className={`
            reduce-extract-preview

            reduce-extract-preview--${
              reduceExtract.foodType
              ?? "default"
            }
          `}
        >


          <div
            className="
              reduce-extract-preview-kicker
            "
          >
            析出
          </div>


          <div
            className="
              reduce-extract-preview-main
            "
          >

            <span
              className="
                reduce-extract-preview-plus
              "
            >
              +
            </span>


            <span
              className="
                reduce-extract-preview-number
              "
            >
              {reduceExtract.value}
            </span>


          </div>


          <div
            className="
              reduce-extract-preview-type
            "
          >
            {reduceExtractTypeLabel}
          </div>


        </div>

      }



      {/* ======================================================
          处理
      ====================================================== */}

      <button

        type="button"

        onClick={
          canReduce
            ? onReduce
            : undefined
        }

        disabled={
          !canReduce
        }

        className={`
          action-toolbar-button

          ${
            canReduce

              ?

              "action-toolbar-button--reduce-active"

              :

              "action-toolbar-button--disabled"
          }
        `}

      >


        <span
          className="
            action-toolbar-icon
          "
        >

          ↓

        </span>


        <span
          className="
            action-toolbar-label
          "
        >

          处理

        </span>


      </button>


    </div>

  );

}