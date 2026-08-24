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

import "./Board.css";



// ============================================================
// 料理名称
// ============================================================

function getFoodName(
  value,
  foodType
){


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





export default function BoardCell({

  index,

  piece,

  selected = false,

  reduceCandidate = false,

  reducePreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

  onClick,

}) {


  // ==========================================================
  // 空格
  // ==========================================================

  if(
    !piece
  ){


    return (

      <div

        className="
          board-cell
          board-cell--empty
        "

        data-index={
          index
        }

      >


        <div
          className="
            board-empty-tile
          "
        >


          <div
            className="
              board-empty-dot
            "
          />


        </div>


      </div>

    );

  }





  // ==========================================================
  // 基础数据
  // ==========================================================

  const value =
    piece.value;


  const foodType =
    piece.foodType ?? null;


  const isMeat =
    foodType === "meat";


  const isVegetable =
    foodType === "vegetable";


  const isDessert =
    foodType === "dessert";


  const isOne =
    value === 1;


  const reducing =
    reducePreview !== null;


  const prime =
    isPrime(
      value
    );





  // ==========================================================
  // 当前料理名
  // ==========================================================

  const foodName =

    getFoodName(
      value,
      foodType
    );





  // ==========================================================
  // 约分后的料理名
  // ==========================================================

  const reduceFoodName =

    reducing &&
    reducePreview !== 1

      ?

      getFoodName(
        reducePreview,
        foodType
      )

      :

      null;





  // ==========================================================
  // 合成来源
  // ==========================================================

  const parentFoodNames =

    Array.isArray(
      piece.parentFoods
    ) &&
    piece.parentFoods.length >= 2

      ?

      piece.parentFoods.map(

        parent => {


          if(
            !parent
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
  // 1的直接来源
  // ==========================================================

  const onePreviousRecord =

    isOne &&
    piece.origin?.type === "reduce"

      ?

      piece.origin.parent

      :

      null;



  const onePreviousValue =

    onePreviousRecord?.value
    ?? null;



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
  // 类型class
  // ==========================================================

  const typeClass =

    isOne

      ? "board-piece--seasoning"

      : isVegetable

      ? "board-piece--vegetable"

      : isMeat

      ? "board-piece--meat"

      : isDessert

      ? "board-piece--dessert"

      : "board-piece--default";





  // ==========================================================
  // 可约分候选
  // ==========================================================

  const showReduceCandidate =

    reduceCandidate &&
    !selected &&
    !removing &&
    !reducing;





  return (

    <div

      className={`
        board-cell
        board-cell--occupied

        ${
          selected

            ? "board-cell--selected"

            : ""
        }

        ${
          removing

            ? "board-cell--removing"

            : ""
        }
      `}

      data-index={
        index
      }

    >


      <div

        className={`
          board-piece-wrapper

          ${
            removing

              ? "board-piece-wrapper--removing"

              : "board-piece-wrapper--enter"
          }
        `}

      >



        {/* ====================================================
            得分
        ==================================================== */}

        {

          isOne &&
          scorePreview !== null &&

          <div

            className={`
              board-piece-score

              ${
                removing

                  ? "board-piece-score--fly"

                  : "board-piece-score--preview"
              }

              ${
                isNewDiscovery

                  ? "board-piece-score--new"

                  : ""
              }
            `}

          >

            +{scorePreview}

          </div>

        }





        {/* ====================================================
            消除闪光
        ==================================================== */}

        {

          removing &&

          <div
            className="
              board-piece-remove-flash
            "
          />

        }





        {/* ====================================================
            正式棋子
        ==================================================== */}

        <button

          type="button"

          disabled={
            removing
          }

          onClick={
            removing

              ? undefined

              : onClick
          }

          className={`
            board-piece

            ${typeClass}

            ${
              selected &&
              !removing

                ? "board-piece--selected"

                : ""
            }

            ${
              reducing &&
              !removing

                ? "board-piece--reducing"

                : ""
            }

            ${
              removing

                ? "board-piece--remove"

                : ""
            }

            ${
              isOne &&
              isNewDiscovery

                ? "board-piece--new-seasoning"

                : ""
            }
          `}

        >


          {/* ==================================================
              选中边框
          ================================================== */}

          {

            selected &&
            !removing &&

            <div
              className="
                board-piece-selected-ring
              "
            />

          }





          {/* ==================================================
              类型色条
          ================================================== */}

          <div
            className="
              board-piece-type-bar
            "
          />





          {/* ==================================================
              数字
          ================================================== */}

          <div

            className={`
              board-piece-number

              ${
                showReduceCandidate

                  ? "board-piece-number--reduce-candidate"

                  : ""
              }
            `}

          >

            {value}

          </div>





          {/* ==================================================
              质数
          ================================================== */}

          {

            prime &&
            !isOne &&

            <div
              className="
                board-piece-prime
              "
            />

          }





          {/* ==================================================
              已发现
          ================================================== */}

          {

            (
              discovered ||
              isOne
            ) &&

            <div
              className="
                board-piece-discovered
              "
            >

              ✦

            </div>

          }





          {/* ==================================================
              料理名称
          ================================================== */}

          <div
            className="
              board-piece-main
            "
          >


            <span

              className={`
                board-piece-name

                ${
                  reducing

                    ? "board-piece-name--reducing"

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





          {/* ==================================================
              约分Preview
          ================================================== */}

          {

            reducing &&
            !removing &&

            <div
              className="
                board-piece-reduce-preview
              "
            >


              <span
                className="
                  board-piece-reduce-name
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
                  board-piece-reduce-number
                "
              >

                {reducePreview}

              </span>


            </div>

          }





          {/* ==================================================
              基础类型
          ================================================== */}

          {

            !isOne &&
            !parentFoodNames &&

            <div
              className="
                board-piece-meta
              "
            >

              {typeLabel}

            </div>

          }





          {/* ==================================================
              合成来源
          ================================================== */}

          {

            parentFoodNames &&
            parentFoodNames[0] &&
            parentFoodNames[1] &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                {parentFoodNames[0]}

              </span>


              <span
                className="
                  board-piece-origin-plus
                "
              >

                +

              </span>


              <span>

                {parentFoodNames[1]}

              </span>


            </div>

          }





          {/* ==================================================
              调料来源
          ================================================== */}

          {

            isOne &&
            onePreviousValue !== null &&
            seasoningName &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                {seasoningName}

              </span>


              <span
                className="
                  board-piece-origin-plus
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


    </div>

  );

}