import {
  isPrime
} from "../game/prime";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";

import {
  getSeasoningName
} from "../data/food/seasoningData";

import "./NumberCard.css";





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





export default function NumberCard({

  item,

  selected = false,

  reduceCandidate = false,

  displayMode = "food",

  onClick,

  reducePreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

}) {


  // ==========================================================
  // 安全保护
  // ==========================================================

  if(

    !item ||

    typeof item !== "object" ||

    item.value === undefined ||

    item.value === null

  ){

    return null;

  }





  // ==========================================================
  // 基础数据
  // ==========================================================

  const value =
    item.value;


  const foodType =
    item.foodType ?? null;


  const isMeat =
    foodType === "meat";


  const isVegetable =
    foodType === "vegetable";


  const isDessert =
    foodType === "dessert";


  const isOne =
    value === 1;


  const isReducing =
    reducePreview !== null;


  const prime =
    isPrime(
      value
    );





  // ==========================================================
  // 单选以后：
  // 可以潜在约分的其他数字
  // ==========================================================

  const showReduceCandidate =

    reduceCandidate &&

    !selected &&

    !removing &&

    !isReducing;





  // ==========================================================
  // 当前料理名称
  // ==========================================================

  const foodName =

    getFoodName(
      value,
      foodType
    );





  // ==========================================================
  // 约分后的料理名称
  // ==========================================================

  const reduceFoodName =

    isReducing &&
    reducePreview !== 1

      ?

      getFoodName(
        reducePreview,
        foodType
      )

      :

      null;





  // ==========================================================
  // 合成来源料理名称
  // ==========================================================

  const parentFoodNames =

    Array.isArray(
      item.parentFoods
    ) &&
    item.parentFoods.length >= 2

      ?

      item.parentFoods.map(

        parent => {


          if(

            !parent ||

            parent.value === undefined ||

            parent.value === null

          ){

            return null;

          }


          return getFoodName(

            parent.value,

            parent.foodType

          );

        }

      )

      :

      null;





  // ==========================================================
  // 1 的直接约分来源
  // ==========================================================

  const onePreviousRecord =

    isOne &&
    item.origin?.type === "reduce"

      ?

      item.origin.parent

      :

      null;


  const onePreviousValue =

    onePreviousRecord?.value
    ?? null;





  // ==========================================================
  // 1 对应的调料名称
  // ==========================================================

  const seasoningName =

    onePreviousValue !== null

      ?

      getSeasoningName(
        onePreviousValue
      )

      :

      null;





  // ==========================================================
  // 类型文字
  // ==========================================================

  const typeLabel =

    isMeat

      ? "荤"

      : isVegetable

      ? "素"

      : isDessert

      ? "甜"

      : "";





  // ==========================================================
  // 类型样式
  // ==========================================================

  const typeClass =

    isOne

      ? "food-card--seasoning"

      : isVegetable

      ? "food-card--vegetable"

      : isMeat

      ? "food-card--meat"

      : isDessert

      ? "food-card--dessert"

      : "food-card--default";





  // ==========================================================
  // 显示模式
  // ==========================================================

  const modeClass =

    displayMode === "number"

      ? "food-card--number-mode"

      : "food-card--food-mode";





  return (

    <div

      className={`
        food-card-wrapper

        ${
          removing

            ? "food-card-wrapper--removing"

            : "food-card-wrapper--enter"
        }
      `}

    >



      {/* ======================================================
          分数预览
          ====================================================== */}

      {

        isOne &&
        selected &&
        scorePreview !== null &&

        <div

          className={`
            food-card-score

            ${
              removing

                ? "food-card-score--fly"

                : "food-card-score--preview"
            }

            ${
              isNewDiscovery

                ? "food-card-score--new"

                : ""
            }
          `}

        >

          +{scorePreview}

        </div>

      }





      {/* ======================================================
          消除闪光
          ====================================================== */}

      {

        removing &&

        <div
          className="food-card-remove-flash"
        />

      }





      {/* ======================================================
          卡片主体
          ====================================================== */}

      <button

        type="button"

        onClick={
          removing
            ? undefined
            : onClick
        }

        disabled={
          removing
        }

        className={`
          food-card

          ${typeClass}

          ${modeClass}

          ${
            selected &&
            !removing

              ? "food-card--selected"

              : ""
          }

          ${
            isReducing &&
            !removing

              ? "food-card--reducing"

              : ""
          }

          ${
            removing

              ? "food-card--remove"

              : ""
          }

          ${
            isOne &&
            isNewDiscovery

              ? "food-card--new-seasoning"

              : ""
          }
        `}

      >



        {/* ====================================================
            选中边框
            ==================================================== */}

        {

          selected &&
          !removing &&

          <div
            className="
              food-card-selected-ring
            "
          />

        }





        {/* ====================================================
            高光
            ==================================================== */}

        <div
          className="food-card-highlight"
        />





        {/* ====================================================
            数字
            ==================================================== */}

        <div

          className={`
            food-card-number

            ${
              showReduceCandidate

                ? "food-card-number--reduce-candidate"

                : ""
            }
          `}

        >

          {value}

        </div>





        {/* ====================================================
            质数标记
            ==================================================== */}

        {

          prime &&
          !isOne &&

          <div
            className="food-card-prime"
          />

        }





        {/* ====================================================
            已发现
            ==================================================== */}

        {

          discovered &&
          !isOne &&

          <div
            className="food-card-discovered"
          >

            ✦

          </div>

        }





        {/* ====================================================
            调料标记
            ==================================================== */}

        {

          isOne &&

          <div
            className="food-card-discovered"
          >

            ✦

          </div>

        }





        {/* ====================================================
            料理名称
            ==================================================== */}

        <div
          className="food-card-main"
        >

          <span

            className={`
              food-card-name

              ${
                isReducing

                  ? "food-card-name--reducing"

                  : ""
              }
            `}

          >

            {
              isOne

                ? seasoningName ?? "调料"

                : foodName
            }

          </span>

        </div>





        {/* ====================================================
            约分预览
            ==================================================== */}

        {

          isReducing &&
          !removing &&

          <div
            className="
              food-card-reduce-preview
            "
          >

            <span
              className="
                food-card-reduce-name
              "
            >

              {
                reducePreview === 1

                  ? seasoningName ?? "调料"

                  : reduceFoodName
              }

            </span>


            <span
              className="
                food-card-reduce-number
              "
            >

              {reducePreview}

            </span>

          </div>

        }





        {/* ====================================================
            基础料理类型
            ==================================================== */}

        {

          !isOne &&
          !parentFoodNames &&

          <div
            className="
              food-card-meta
            "
          >

            {typeLabel}

          </div>

        }





        {/* ====================================================
            合成来源
            ==================================================== */}

        {

          parentFoodNames &&
          parentFoodNames[0] &&
          parentFoodNames[1] &&

          <div
            className="
              food-card-origin
            "
          >

            <span>

              {parentFoodNames[0]}

            </span>


            <span
              className="
                food-card-origin-plus
              "
            >

              +

            </span>


            <span>

              {parentFoodNames[1]}

            </span>

          </div>

        }





        {/* ====================================================
            调料来源
            ==================================================== */}

        {

          isOne &&
          onePreviousValue !== null &&
          seasoningName &&

          <div
            className="
              food-card-origin
            "
          >

            <span>

              {seasoningName}

            </span>


            <span
              className="
                food-card-origin-plus
              "
            >

              ·

            </span>


            <strong>

              {onePreviousValue}

            </strong>

          </div>

        }


      </button>


    </div>

  );

}