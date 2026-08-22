import {
  GAME_CONFIG
} from "../game/config";


export default function ActionButtons({

  numbers,

  selected,

  preview,

  onCombine,

  onReduce,

  onRemoveOne,

  gameOver,

  removingId = null,

}) {


  const busy =
    removingId !== null;


  const canCombine =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.combine &&

    numbers.length <
      GAME_CONFIG.MAX_NUMBERS;


  const canReduce =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;


  const selectedNumber =

    selected.length === 1

      ?

      numbers.find(

        item =>
          item.id === selected[0]

      )

      :

      null;


  const canRemoveOne =

    !gameOver &&

    !busy &&

    selected.length === 1 &&

    selectedNumber?.value === 1;



  return (

    <div>


      <div

        className="
          grid
          grid-cols-3

          gap-2.5
          sm:gap-3
        "

      >


        {/* =========================
            搭配
            原：合成
            ========================= */}

        <button

          onClick={
            canCombine
              ? onCombine
              : undefined
          }

          disabled={
            !canCombine
          }

          className={`
            game-action-button

            ${
              canCombine

                ?

                `
                  bg-orange-500
                  text-white

                  shadow-[0_8px_22px_rgba(249,115,22,0.18)]

                  hover:bg-orange-600
                `

                :

                `
                  bg-white
                  text-gray-300

                  border
                  border-gray-100
                `
            }
          `}

        >

          <span
            className="
              text-[20px]
              leading-none
            "
          >
            ＋
          </span>

          <span>
            搭配
          </span>

        </button>



        {/* =========================
            处理
            原：约分
            ========================= */}

        <button

          onClick={
            canReduce
              ? onReduce
              : undefined
          }

          disabled={
            !canReduce
          }

          className={`
            game-action-button

            ${
              canReduce

                ?

                `
                  bg-emerald-500
                  text-white

                  shadow-[0_8px_22px_rgba(16,185,129,0.18)]

                  hover:bg-emerald-600
                `

                :

                `
                  bg-white
                  text-gray-300

                  border
                  border-gray-100
                `
            }
          `}

        >

          <span
            className="
              text-[18px]
              leading-none
            "
          >
            ↓
          </span>

          <span>
            处理
          </span>

        </button>



        {/* =========================
            收取水
            原：消除 1
            ========================= */}

        <button

          onClick={

            canRemoveOne

              ?

              () =>
                onRemoveOne(
                  selected[0]
                )

              :

              undefined

          }

          disabled={
            !canRemoveOne
          }

          className={`
            game-action-button

            ${
              canRemoveOne

                ?

                `
                  bg-sky-400
                  text-white

                  shadow-[0_8px_22px_rgba(56,189,248,0.20)]

                  hover:bg-sky-500

                  remove-ready
                `

                :

                `
                  bg-white
                  text-gray-300

                  border
                  border-gray-100
                `
            }
          `}

        >

          <span
            className="
              text-[15px]
            "
          >
            ◇
          </span>

          <span>
            获取调料
          </span>

        </button>


      </div>



      {

        numbers.length >=
        GAME_CONFIG.MAX_NUMBERS &&

        <div

          className="
            mt-3

            text-center

            text-[11px]
            font-semibold

            text-rose-400

            capacity-warning
          "

        >

          操作台已满 · 先处理食材

        </div>

      }


    </div>

  );

}