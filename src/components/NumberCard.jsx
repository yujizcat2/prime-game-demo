import {
  isPrime
} from "../game/prime";


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
  // 选中时数字颜色
  // =========================

  const selectedNumberColor =

    isOne

      ? "text-rose-300"

      : isCat

      ? "text-orange-300"

      : isDog

      ? "text-teal-300"

      : "text-blue-300";



  // =========================
  // 约分新数字颜色
  // =========================

  const reduceNumberColor =

    isOne

      ? "text-rose-300"

      : isCat

      ? "text-orange-400"

      : isDog

      ? "text-teal-400"

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

            rounded-[18px]

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

          rounded-[18px]

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
              bg-orange-50
              text-gray-800

              border
              border-orange-100

              shadow-[0_6px_18px_rgba(15,23,42,0.045)]
            `


            :

            isDog

            ?

            `
              bg-teal-50
              text-gray-800

              border
              border-teal-100

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
            质数标记
            ========================= */}

        {

          prime &&
          !isOne &&

          <div

            className={`
              absolute

              top-2.5
              left-2.5

              w-1.5
              h-1.5

              rounded-full

              ${
                isCat

                  ? "bg-orange-300"

                  : isDog

                  ? "bg-teal-300"

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

              top-2
              right-2

              text-[9px]

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

              top-2
              right-2

              text-[9px]

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
            主数字区域
            ========================= */}

        <div

          className="
            absolute
            inset-0

            flex
            items-center
            justify-center
          "

        >



          {/* =========================
              原数字
              ========================= */}

          <span

            className={`
              text-[29px]
              sm:text-[32px]

              font-black

              tracking-[-0.04em]

              ${
                selected

                  ? selectedNumberColor

                  : ""
              }

              ${
                isReducing

                  ? "reduce-original"

                  : ""
              }
            `}

          >

            {value}

          </span>



          {/* =========================
              约分后的新数字
              ========================= */}

          {

            isReducing &&
            !removing &&

            <span

              className={`
                absolute
                inset-0

                z-10

                flex
                items-center
                justify-center

                text-[29px]
                sm:text-[32px]

                font-black

                tracking-[-0.04em]

                ${reduceNumberColor}

                reduce-preview
              `}

            >

              {reducePreview}

            </span>

          }


        </div>



        {/* =========================
            合成来源
            ========================= */}

        {

          Array.isArray(
            item.parents
          ) &&
          item.parents.length >= 2 &&

          <div

            className={`
              absolute

              bottom-2
              inset-x-0

              flex
              justify-center

              text-[8px]
              font-semibold

              ${
                selected

                  ? "text-slate-400"

                  :

                  isCat

                  ? "text-orange-300"

                  :

                  isDog

                  ? "text-teal-300"

                  : "text-gray-300"
              }
            `}

          >

            {item.parents[0]}

            <span
              className="
                mx-1
              "
            >
              +
            </span>

            {item.parents[1]}

          </div>

        }



        {/* =========================
            1 的来源
            ========================= */}

        {

          isOne &&
          item.reduceFrom !== null &&
          item.reduceFrom !== undefined &&

          <div

            className={`
              absolute

              bottom-2
              right-2

              text-[8px]
              font-bold

              ${
                selected

                  ? "text-rose-300/80"

                  : "text-rose-400"
              }
            `}

          >

            {item.reduceFrom}

          </div>

        }


      </button>


    </div>

  );

}