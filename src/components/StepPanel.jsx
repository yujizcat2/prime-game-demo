export default function StepPanel({

  steps,

  stepLimit,

  score,

  gameOver,

  checkpointPending,

  checkpointRequiredScore,

  checkpointNumber

}) {


  const progress =

    Math.min(

      (steps / stepLimit) * 100,

      100

    );


  const scoreReached =

    checkpointRequiredScore > 0

      ?

      score >= checkpointRequiredScore

      :

      false;


  const remainingScore =

    Math.max(

      checkpointRequiredScore - score,

      0

    );



  return (

    <div

      className="
        rounded-[26px]

        bg-white

        shadow-[0_8px_30px_rgba(15,23,42,0.06)]

        border
        border-white

        px-5
        py-4
      "

    >



      {/* =========================
          第一行 HUD
          ========================= */}

      <div

        className="
          flex
          items-center
          justify-between
        "

      >


        {/* 积分 */}

        <div

          className="
            flex
            items-center
            gap-2
          "

        >

          <div

            className="
              w-9
              h-9

              rounded-xl

              bg-amber-50

              flex
              items-center
              justify-center

              text-lg
            "

          >

            ★

          </div>


          <div>

            <div

              className="
                text-[10px]
                uppercase
                tracking-wider
                text-gray-400
              "

            >

              SCORE

            </div>


            <div

              className="
                text-xl
                font-black
                text-gray-800

                leading-tight

                score-value
              "

            >

              {score}

            </div>

          </div>

        </div>



        {/* 阶段 */}

        <div

          className="
            text-center
          "

        >

          <div

            className="
              text-[10px]
              tracking-wider
              text-gray-400
            "

          >

            STAGE

          </div>


          <div

            className="
              mt-0.5

              text-lg
              font-black
              text-gray-700
            "

          >

            {checkpointNumber}

          </div>

        </div>



        {/* 步数 */}

        <div

          className="
            flex
            items-center
            gap-2
          "

        >

          <div

            className="
              text-right
            "

          >

            <div

              className="
                text-[10px]
                tracking-wider
                text-gray-400
              "

            >

              STEP

            </div>


            <div

              className="
                text-lg
                font-black
                text-gray-800
              "

            >

              {steps}

              <span

                className="
                  text-xs
                  text-gray-400
                  ml-1
                "

              >

                / {stepLimit}

              </span>

            </div>

          </div>


          <div

            className="
              w-9
              h-9

              rounded-xl

              bg-blue-50

              flex
              items-center
              justify-center

              text-blue-500
              font-bold
            "

          >

            ⚡

          </div>

        </div>


      </div>



      {/* =========================
          步数进度条
          ========================= */}

      <div

        className="
          mt-4

          h-1.5

          rounded-full

          bg-gray-100

          overflow-hidden
        "

      >

        <div

          className="
            h-full

            rounded-full

            bg-blue-500

            transition-all
            duration-500
            ease-out
          "

          style={{

            width: `${progress}%`

          }}

        />

      </div>



      {/* =========================
          当前阶段目标
          ========================= */}

      {

        checkpointRequiredScore > 0 &&

        <div

          className="
            mt-3

            flex
            items-center
            justify-between

            text-xs
          "

        >

          <span

            className="
              text-gray-400
            "

          >

            阶段目标 {checkpointRequiredScore}

          </span>


          {

            scoreReached

            ?

            <span

              className="
                font-bold
                text-emerald-500
              "

            >

              ✓ 已完成

            </span>

            :

            <span

              className="
                text-gray-500
              "

            >

              还差

              <span

                className="
                  mx-1
                  font-bold
                  text-amber-500
                "

              >

                {remainingScore}

              </span>

            </span>

          }

        </div>

      }



      {/* =========================
          阶段结算提示
          ========================= */}

      {

        checkpointPending &&
        !gameOver &&

        <div

          className="
            mt-3

            rounded-xl

            bg-blue-50

            px-3
            py-2

            text-center

            text-xs
            font-semibold
            text-blue-500

            checkpoint-flash
          "

        >

          阶段结算 · 先处理当前的 1

        </div>

      }


    </div>

  );

}