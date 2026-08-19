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


        {/* 合成 */}

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
                  bg-blue-500
                  text-white

                  shadow-[0_8px_22px_rgba(59,130,246,0.19)]

                  hover:bg-blue-600
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
            合成
          </span>

        </button>



        {/* 约分 */}

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
              text-[18px]
              leading-none
            "
          >
            ↓
          </span>

          <span>
            约分
          </span>

        </button>



        {/* 消除 */}

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
                  bg-amber-400
                  text-white

                  shadow-[0_8px_22px_rgba(245,158,11,0.20)]

                  hover:bg-amber-500

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
            ✦
          </span>

          <span>
            消除
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

          数字槽已满 · 先进行约分

        </div>

      }


    </div>

  );

}