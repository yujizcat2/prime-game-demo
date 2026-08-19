import { isPrime } from "../game/prime";


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
  // 最重要的保护
  // 必须放在所有 item.xxx 之前
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
  // 从这里开始才能访问 item
  // =========================

  const value =
    item.value;


  const isOne =
    value === 1;


  const isReducing =
    reducePreview !== null;


  const prime =
    isPrime(value);



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

            -top-8
            left-1/2

            z-30

            whitespace-nowrap

            pointer-events-none

            text-base
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

            rounded-[22px]

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

        disabled={removing}

        className={`

          number-card

          relative

          flex
          items-center
          justify-center

          rounded-[22px]

          overflow-hidden

          select-none

          transition-all
          duration-200
          ease-out


          ${
            removing

              ?

              "remove-card"

              :

              "active:scale-[0.92]"
          }


          ${
            isOne &&
            isNewDiscovery &&
            selected

            ?

            `
              bg-amber-500
              text-white

              -translate-y-1
              scale-[1.06]

              shadow-[0_12px_28px_rgba(245,158,11,0.28)]

              ring-2
              ring-amber-200

              new-one-selected
            `


            :

            isOne &&
            isNewDiscovery

            ?

            `
              bg-amber-400
              text-white

              shadow-[0_8px_22px_rgba(245,158,11,0.20)]

              new-one-card
            `


            :

            selected

            ?

            `
              bg-blue-500
              text-white

              -translate-y-1
              scale-[1.06]

              shadow-[0_12px_28px_rgba(59,130,246,0.23)]

              ring-2
              ring-blue-200
            `


            :

            isOne

            ?

            `
              bg-amber-50
              text-amber-700

              border
              border-amber-100

              shadow-[0_5px_15px_rgba(15,23,42,0.055)]
            `


            :

            `
              bg-white
              text-gray-800

              border
              border-gray-100

              shadow-[0_5px_15px_rgba(15,23,42,0.06)]

              hover:-translate-y-0.5
              hover:shadow-[0_9px_22px_rgba(15,23,42,0.085)]
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
                selected

                  ? "bg-white/50"

                  : "bg-blue-300"
              }
            `}

          />

        }



        {/* =========================
            已发现
            ========================= */}

        {

          discovered &&
          !isOne &&

          <div

            className="
              absolute

              top-2
              right-2.5

              text-[9px]

              text-amber-400
            "

          >

            ✦

          </div>

        }



        {/* =========================
            1 标记
            ========================= */}

        {

          isOne &&

          <div

            className={`
              absolute

              top-2
              right-2.5

              text-[9px]

              ${
                isNewDiscovery ||
                selected

                  ? "text-white/80"

                  : "text-amber-400"
              }
            `}

          >

            ✦

          </div>

        }



        {/* =========================
            主数字
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


          <span

            className={`
              text-[28px]

              font-black

              tracking-tight

              transition-all
              duration-200

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
              约分预览
              ========================= */}

          {

            isReducing &&
            !removing &&

            <span

              className="
                absolute

                text-[28px]
                font-black

                text-white

                reduce-preview
              "

            >

              {reducePreview}

            </span>

          }


        </div>



        {/* =========================
            合成来源
            ========================= */}

        {

          Array.isArray(item.parents) &&
          item.parents.length >= 2 &&

          <div

            className={`
              absolute

              bottom-1.5
              inset-x-0

              flex
              justify-center

              text-[8px]

              ${
                selected

                  ? "text-white/50"

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

              bottom-1.5
              right-2

              text-[8px]
              font-bold

              ${
                isNewDiscovery ||
                selected

                  ? "text-white/60"

                  : "text-amber-400"
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