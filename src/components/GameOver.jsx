export default function GameOver({

  steps,

  stepLimit,

  score,

  collection,

  onRestart

}) {


  return (

    <div

      className="
        fixed
        inset-0

        z-50

        flex
        items-center
        justify-center

        px-5

        bg-slate-900/40

        backdrop-blur-[3px]

        game-over-backdrop
      "

    >


      <div

        className="
          w-full
          max-w-sm

          rounded-[32px]

          bg-white

          px-7
          py-8

          shadow-[0_30px_80px_rgba(15,23,42,0.25)]

          text-center

          game-over-card
        "

      >


        <div

          className="
            w-14
            h-14

            mx-auto

            rounded-2xl

            bg-blue-50

            flex
            items-center
            justify-center

            text-2xl
          "

        >

          ✦

        </div>



        <h2

          className="
            mt-4

            text-2xl
            font-black
            text-gray-800
          "

        >

          探索结束

        </h2>



        <p

          className="
            mt-1

            text-sm
            text-gray-400
          "

        >

          本次数字路径已经完成

        </p>



        {/* =========================
            最终积分
            ========================= */}

        <div

          className="
            mt-7
          "

        >

          <div

            className="
              text-xs
              tracking-widest
              text-gray-300
            "

          >

            FINAL SCORE

          </div>


          <div

            className="
              mt-1

              text-5xl
              font-black

              text-amber-500
            "

          >

            {score}

          </div>

        </div>



        {/* =========================
            数据
            ========================= */}

        <div

          className="
            mt-7

            grid
            grid-cols-2

            gap-3
          "

        >


          <div

            className="
              rounded-2xl

              bg-gray-50

              py-4
            "

          >

            <div

              className="
                text-xs
                text-gray-400
              "

            >

              步数

            </div>


            <div

              className="
                mt-1

                text-xl
                font-black
                text-gray-700
              "

            >

              {steps}

              <span

                className="
                  text-xs
                  text-gray-300
                  ml-1
                "

              >

                / {stepLimit}

              </span>

            </div>

          </div>



          <div

            className="
              rounded-2xl

              bg-gray-50

              py-4
            "

          >

            <div

              className="
                text-xs
                text-gray-400
              "

            >

              发现

            </div>


            <div

              className="
                mt-1

                text-xl
                font-black
                text-gray-700
              "

            >

              {collection.length}

            </div>

          </div>


        </div>



        <button

          onClick={onRestart}

          className="
            mt-7

            w-full
            h-14

            rounded-2xl

            bg-blue-500

            text-white

            text-base
            font-black

            shadow-[0_8px_22px_rgba(59,130,246,0.25)]

            transition-all
            duration-150

            hover:bg-blue-600

            active:scale-[0.96]
          "

        >

          再来一局

        </button>


      </div>


    </div>

  );

}