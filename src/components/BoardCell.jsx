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
    foodType === "seasoning"
  ){

    return getSeasoningName(
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


  const isSeasoning =
    foodType === "seasoning";


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
  // 是否为纯系
  //
  // ◆ = pure
  // ==========================================================

  const isPure =

    piece.purity === "pure"

    &&

    (
      isMeat ||
      isVegetable ||
      isSeasoning
    )

    &&

    !isOne;





  // ==========================================================
  // 当前料理名
  //
  // 1 = 水
  // ==========================================================

  const foodName =

    isOne

      ? "水"

      : getFoodName(
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
  //
  // A + B
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
  // 普通约分来源
  //
  // 例如：
  //
  // 牛肉12
  // ↓
  // 牛肉3
  //
  // 当前3卡片底部显示：
  //
  // 牛肉
  // ==========================================================

  const reducePreviousRecord =

    piece.origin?.type === "reduce"

      ?

      piece.origin.parent

      :

      null;



  const reducePreviousValue =

    reducePreviousRecord?.value
    ?? null;



  const reducePreviousFoodType =

    reducePreviousRecord?.foodType

    ??

    foodType

    ??

    null;



  const reducePreviousFoodName =

    reducePreviousValue !== null

      ?

      getFoodName(

        reducePreviousValue,

        reducePreviousFoodType

      )

      :

      null;





  // ==========================================================
  // 水的直接来源
  //
  // 例如：
  //
  // 牛肉6
  // ↓
  // 水1
  //
  // 显示：
  //
  // 牛肉 · 6
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



  const onePreviousFoodType =

    onePreviousRecord?.foodType

    ??

    foodType

    ??

    null;



  const onePreviousFoodName =

    onePreviousValue !== null

      ?

      getFoodName(

        onePreviousValue,

        onePreviousFoodType

      )

      :

      null;





  // ==========================================================
  // 类型class
  // ==========================================================

  const typeClass =

    isOne

      ? "board-piece--one"

      : isVegetable

      ? "board-piece--vegetable"

      : isMeat

      ? "board-piece--meat"

      : isSeasoning

      ? "board-piece--seasoning"

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

                ? "board-piece--new-discovery"

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
              纯系标记
          ================================================== */}

          {

            isPure &&

            <div

              className="
                board-piece-pure
              "

              aria-label="纯系"

            >

              ◆

            </div>

          }





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
              料理名 / 水
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

              {foodName}

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

                    ? "水"

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
              原材料
              ==================================================

              真正没有合成来源、
              也没有约分来源的初始棋子：

              不再显示：

              荤 / 素 / 调 / 甜

              统一显示：

              原材料
          ================================================== */}

          {

            !isOne &&
            !parentFoodNames &&
            !reducePreviousRecord &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                原材料

              </span>


            </div>

          }





          {/* ==================================================
              合成来源
              ==================================================

              A + B

              例如：

              牛肉 + 白菜
          ================================================== */}

          {

            !isOne &&
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
              普通约分来源
              ==================================================

              只显示一个直接来源。

              例如：

              牛肉12
              ↓
              牛肉3

              当前牛肉3下面显示：

              牛肉
          ================================================== */}

          {

            !isOne &&
            reducePreviousRecord &&
            reducePreviousFoodName &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                {reducePreviousFoodName}

              </span>


            </div>

          }





          {/* ==================================================
              水的来源
          ================================================== */}

          {

            isOne &&
            onePreviousValue !== null &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                {
                  onePreviousFoodName
                  ?? "来源"
                }

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