import {
  isPrime
} from "../game/prime";

import {
  getIngredientName
} from "../game/ingredientCatalog";


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


  // =========================
  // 安全保护
  // =========================

  if (
    !item ||
    typeof item !== "object" ||
    item.value === undefined ||
    item.value === null
  ) {

    return null;

  }



  // =========================
  // 基础属性
  // =========================

  const value =
    item.value;


  const animal =
    item.animal ?? null;


  const isCat =
    animal === "cat";


  const isDog =
    animal === "dog";


  const isOne =
    value === 1;


  const isReducing =
    reducePreview !== null;


  const prime =
    isPrime(
      value
    );



  // =========================
  // 料理类型映射
  //
  // 暂时保留底层 cat / dog
  //
  // cat -> 素类
  // dog -> 荤类
  // =========================

  const ingredientType =

    isCat

      ? "veg"

      : isDog

      ? "meat"

      : "veg";



  // =========================
  // 当前食材名称
  // =========================

  const ingredientName =
    getIngredientName(
      value,
      ingredientType
    );



  // =========================
  // 约分后食材名称
  // =========================

  const reduceIngredientName =

    isReducing

      ? getIngredientName(
          reducePreview,
          ingredientType
        )

      : null;



  // =========================
  // 合成来源食材名称
  //
  // 当前版本 parents 只保存数字，
  // 没有保存当时父节点的 animal。
  //
  // 因此暂时按照当前卡片类型
  // 映射两个父食材。
  // =========================

  const parentIngredientNames =

    Array.isArray(
      item.parents
    ) &&
    item.parents.length >= 2

      ? [
          getIngredientName(
            item.parents[0],
            ingredientType
          ),

          getIngredientName(
            item.parents[1],
            ingredientType
          ),
        ]

      : null;



  // =========================
  // 1 的直接来源
  // =========================

  const onePreviousValue =

    isOne &&
    item.origin?.type === "reduce"

      ? item.origin.parent?.value ?? null

      : null;



  // =========================
  // 1 的来源食材名称
  // =========================

  const onePreviousIngredientName =

    onePreviousValue !== null

      ? getIngredientName(
          onePreviousValue,
          ingredientType
        )

      : null;



  // =========================
  // 选中时文字颜色
  // =========================

  const selectedTextColor =

    isOne

      ? "text-rose-300"

      : isCat

      ? "text-emerald-300"

      : isDog

      ? "text-orange-300"

      : "text-blue-300";



  // =========================
  // 约分预览颜色
  // =========================

  const reduceTextColor =

    isOne

      ? "text-rose-400"

      : isCat

      ? "text-emerald-500"

      : isDog

      ? "text-orange-500"

      : "text-blue-400";



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



      {/* =========================
          积分提示
          ========================= */}

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

                ? "text-amber-500"

                : "text-gray-500"
            }
          `}

        >

          +{scorePreview}

        </div>

      }



      {/* =========================
          消除闪光
          ========================= */}

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



      {/* =========================
          消除粒子
          ========================= */}

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
              bg-rose-100
              text-rose-700

              border
              border-rose-200

              shadow-[0_8px_22px_rgba(244,63,94,0.14)]

              new-one-card
            `


            :

            isOne

            ?

            `
              bg-rose-50
              text-rose-600

              border
              border-rose-100

              shadow-[0_6px_18px_rgba(244,63,94,0.06)]
            `


            :

            isCat

            ?

            `
              bg-emerald-50
              text-emerald-950

              border
              border-emerald-100

              shadow-[0_6px_18px_rgba(15,23,42,0.045)]
            `


            :

            isDog

            ?

            `
              bg-orange-50
              text-orange-950

              border
              border-orange-100

              shadow-[0_6px_18px_rgba(15,23,42,0.045)]
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



        {/* =========================
            左上角数字
            ========================= */}

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

                ? "text-rose-500"

                : isCat

                ? "text-emerald-600"

                : isDog

                ? "text-orange-600"

                : "text-gray-500"
            }
          `}

        >

          {value}

        </div>



        {/* =========================
            质数标记
            ========================= */}

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
                isCat

                  ? "bg-emerald-400"

                  : isDog

                  ? "bg-orange-400"

                  : "bg-blue-300"
              }
            `}

          />

        }



        {/* =========================
            已发现标记
            ========================= */}

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



        {/* =========================
            数字 1 标记
            ========================= */}

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

                  ? "text-rose-300"

                  : "text-rose-400"
              }
            `}

          >

            ✦

          </div>

        }



        {/* =========================
            食材名称主体
            ========================= */}

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



          {/* =========================
              当前食材
              ========================= */}

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

            {ingredientName}

          </span>



          {/* =========================
              约分后的食材
              ========================= */}

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
                {reduceIngredientName}
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



        {/* =========================
            合成来源食材
            ========================= */}

        {

          parentIngredientNames &&

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

                  :

                  isCat

                  ? "text-emerald-400"

                  :

                  isDog

                  ? "text-orange-400"

                  : "text-gray-300"
              }
            `}

          >

            <span>
              {
                parentIngredientNames[0]
              }
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
              {
                parentIngredientNames[1]
              }
            </span>

          </div>

        }



        {/* =========================
            水的直接来源
            ========================= */}

        {

          isOne &&
          onePreviousValue !== null &&

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

                  ? "text-rose-300/80"

                  : "text-rose-400"
              }
            `}

          >

            <span
              className="
                mr-1
                opacity-60
              "
            >
              ←
            </span>

            <span>
              {onePreviousIngredientName}
            </span>

          </div>

        }


      </button>


    </div>

  );

}