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
  // 基础属性
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
  // 当前料理名称
  // ==========================================================

  const foodName =

    getFoodName(
      value,
      foodType
    );





  // ==========================================================
  // 约分后的料理名称
  //
  // 约分不改变foodType。
  //
  // 如果结果是1，
  // UI会直接显示“调料”。
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
  //
  // 必须读取parentFoods。
  //
  // 例如：
  //
  // 3素 + 6荤 → 9素
  //
  // 正确显示：
  //
  // 土豆 + 鸡猪烧
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
  // 1的直接来源记录
  //
  // 例如：
  //
  // 7 → 1
  //
  // parent.value = 7
  // ==========================================================

  const onePreviousRecord =

    isOne &&
    item.origin?.type === "reduce"

      ?

      item.origin.parent

      :

      null;





  // ==========================================================
  // 变成1之前的数字
  // ==========================================================

  const onePreviousValue =

    onePreviousRecord?.value
    ?? null;





  // ==========================================================
  // 对应调料名称
  //
  // 例如：
  //
  // 7  → 醋
  // 13 → 黑胡椒
  // 31 → 孜然
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
  // 主菜类型文字
  // ==========================================================

  const typeLabel =

    isMeat

      ? "荤"

      : isVegetable

      ? "素"

      : isDessert

      ? "甜食"

      : "";





  // ==========================================================
  // 选中时文字颜色
  // ==========================================================

  const selectedTextColor =

    isOne

      ? "text-cyan-300"

      : isVegetable

      ? "text-emerald-300"

      : isMeat

      ? "text-orange-300"

      : isDessert

      ? "text-violet-300"

      : "text-gray-300";





  // ==========================================================
  // 约分预览颜色
  // ==========================================================

  const reduceTextColor =

    reducePreview === 1

      ? "text-cyan-500"

      : isVegetable

      ? "text-emerald-500"

      : isMeat

      ? "text-orange-500"

      : isDessert

      ? "text-violet-500"

      : "text-gray-500";





  return (

    <div

      className={`
        relative

        ${
          removing

            ? "removing-card-wrapper"

            : "number-card-enter"
        }
      `}

    >



      {/* ======================================================
          积分提示
          ====================================================== */}

      {

        isOne &&
        selected &&
        scorePreview !== null &&

        <div

          className={`
            absolute

            -top-9
            left-1/2

            z-30

            whitespace-nowrap

            pointer-events-none

            text-[15px]
            font-black

            ${
              removing

                ? "remove-score-fly"

                : "new-score-preview"
            }

            ${
              isNewDiscovery

                ? "text-cyan-500"

                : "text-gray-500"
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

          className="
            absolute
            inset-0

            z-20

            rounded-[20px]

            pointer-events-none

            remove-flash
          "

        />

      }





      {/* ======================================================
          消除粒子
          ====================================================== */}

      {

        removing &&

        <>

          <span
            className="
              remove-particle
              remove-particle-1
            "
          >
            ✦
          </span>


          <span
            className="
              remove-particle
              remove-particle-2
            "
          >
            ✦
          </span>


          <span
            className="
              remove-particle
              remove-particle-3
            "
          >
            ✦
          </span>


          <span
            className="
              remove-particle
              remove-particle-4
            "
          >
            ✦
          </span>

        </>

      }





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

          number-card

          relative

          flex
          items-center
          justify-center

          rounded-[20px]

          overflow-hidden

          select-none

          transition-colors
          duration-200
          ease-out


          ${
            selected &&
            !removing

              ? "number-card-selected"

              : ""
          }


          ${
            removing

              ? "remove-card"

              : "active:opacity-85"
          }


          ${
            selected

            ?

            `
              bg-slate-700

              border
              border-slate-600

              shadow-[0_10px_24px_rgba(15,23,42,0.18)]
            `


            :

            isOne &&
            isNewDiscovery

            ?

            `
              bg-cyan-100
              text-cyan-800

              border
              border-cyan-200

              shadow-[0_8px_22px_rgba(6,182,212,0.14)]

              new-one-card
            `


            :

            isOne

            ?

            `
              bg-cyan-50
              text-cyan-700

              border
              border-cyan-100

              shadow-[0_6px_18px_rgba(6,182,212,0.07)]
            `


            :

            isVegetable

            ?

            `
              bg-emerald-50
              text-emerald-950

              border
              border-emerald-100

              shadow-[0_6px_18px_rgba(15,23,42,0.045)]
            `


            :

            isMeat

            ?

            `
              bg-orange-50
              text-orange-950

              border
              border-orange-100

              shadow-[0_6px_18px_rgba(15,23,42,0.045)]
            `


            :

            isDessert

            ?

            `
              bg-violet-50
              text-violet-950

              border
              border-violet-100

              shadow-[0_6px_18px_rgba(15,23,42,0.05)]
            `


            :

            `
              bg-white
              text-gray-800

              border
              border-gray-100

              shadow-[0_6px_18px_rgba(15,23,42,0.05)]
            `
          }


          ${
            isReducing &&
            !removing

              ? "reduce-card"

              : ""
          }

        `}

      >





        {/* ====================================================
            左上角数字
            ==================================================== */}

        <div

          className={`
            absolute

            top-2.5
            left-3

            z-10

            text-[14px]
            sm:text-[15px]

            font-black

            tracking-[-0.03em]

            ${
              selected

                ? selectedTextColor

                : isOne

                ? "text-cyan-600"

                : isVegetable

                ? "text-emerald-600"

                : isMeat

                ? "text-orange-600"

                : isDessert

                ? "text-violet-600"

                : "text-gray-500"
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

            className={`
              absolute

              top-3
              left-9

              w-1.5
              h-1.5

              rounded-full

              ${
                isVegetable

                  ? "bg-emerald-400"

                  : isMeat

                  ? "bg-orange-400"

                  : isDessert

                  ? "bg-violet-400"

                  : "bg-gray-300"
              }
            `}

          />

        }





        {/* ====================================================
            已发现标记
            ==================================================== */}

        {

          discovered &&
          !isOne &&

          <div

            className={`
              absolute

              top-2.5
              right-3

              text-[10px]

              ${
                selected

                  ? "text-amber-300"

                  : "text-amber-400"
              }
            `}

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

            className={`
              absolute

              top-2.5
              right-3

              text-[10px]

              ${
                selected

                  ? "text-cyan-300"

                  : "text-cyan-400"
              }
            `}

          >

            ✦

          </div>

        }





        {/* ====================================================
            主体
            ==================================================== */}

        <div

          className="
            absolute
            inset-0

            flex
            items-center
            justify-center

            px-2
          "

        >



          {/* ==================================================
              当前料理 / 调料
              ================================================== */}

          <span

            className={`
              text-[18px]
              sm:text-[20px]

              font-black

              whitespace-nowrap

              tracking-[-0.04em]

              ${
                selected

                  ? selectedTextColor

                  : ""
              }

              ${
                isReducing

                  ? "reduce-original"

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





          {/* ==================================================
              约分后的预览
              ================================================== */}

          {

            isReducing &&
            !removing &&

            <div

              className={`
                absolute
                inset-0

                z-10

                flex
                flex-col
                items-center
                justify-center

                ${reduceTextColor}

                reduce-preview
              `}

            >

              <span

                className="
                  text-[18px]
                  sm:text-[20px]

                  font-black

                  whitespace-nowrap

                  tracking-[-0.04em]
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
                  mt-0.5

                  text-[11px]
                  sm:text-[12px]

                  font-bold

                  opacity-70
                "

              >

                {reducePreview}

              </span>

            </div>

          }


        </div>





        {/* ====================================================
            当前料理类型
            ==================================================== */}

        {

          !isOne &&
          !parentFoodNames &&

          <div

            className={`
              absolute

              bottom-2.5
              left-1/2

              -translate-x-1/2

              text-[8px]

              font-bold

              tracking-[0.12em]

              ${
                selected

                  ? "text-slate-400"

                  : isVegetable

                  ? "text-emerald-400"

                  : isMeat

                  ? "text-orange-400"

                  : isDessert

                  ? "text-violet-400"

                  : "text-gray-300"
              }
            `}

          >

            {typeLabel}

          </div>

        }





        {/* ====================================================
            合成来源料理
            ==================================================== */}

        {

          parentFoodNames &&
          parentFoodNames[0] &&
          parentFoodNames[1] &&

          <div

            className={`
              absolute

              bottom-2.5
              inset-x-0

              flex
              items-center
              justify-center

              px-1

              text-[8px]
              sm:text-[9px]

              font-semibold

              whitespace-nowrap

              ${
                selected

                  ? "text-slate-400"

                  : isVegetable

                  ? "text-emerald-400"

                  : isMeat

                  ? "text-orange-400"

                  : isDessert

                  ? "text-violet-400"

                  : "text-gray-300"
              }
            `}

          >

            <span>
              {parentFoodNames[0]}
            </span>


            <span

              className="
                mx-1
                opacity-60
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
            //
            // 例如：
            //
            // 7 → 1
            //
            // 显示：
            //
            // 醋 · 7
            ==================================================== */}

        {

          isOne &&
          onePreviousValue !== null &&
          seasoningName &&

          <div

            className={`
              absolute

              bottom-2.5
              inset-x-0

              flex
              items-center
              justify-center

              px-1

              text-[8px]
              sm:text-[9px]

              font-bold

              whitespace-nowrap

              ${
                selected

                  ? "text-cyan-300/90"

                  : "text-cyan-600"
              }
            `}

          >

            <span>
              {seasoningName}
            </span>


            <span

              className="
                mx-1
                opacity-50
              "

            >

              ·

            </span>


            <span
              className="
                font-black
              "
            >

              {onePreviousValue}

            </span>

          </div>

        }


      </button>


    </div>

  );

}