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

      ? score >= checkpointRequiredScore

      : false;


  const remainingScore =

    Math.max(

      checkpointRequiredScore - score,

      0

    );



  return (

    <div

      className="
        rounded-[24px]

        bg-white

        shadow-[0_8px_28px_rgba(15,23,42,0.045)]

        border
        border-white

        px-4
        py-3.5

        sm:px-5
      "

    >


      <div

        className="
          grid
          grid-cols-3

          items-center
        "

      >


        {/* 积分 */}

        <div

          className="
            text-left
            pl-1
          "

        >

          <div

            className="
              text-[9px]
              font-bold

              tracking-[0.16em]

              text-gray-300
            "

          >

            SCORE

          </div>


          <div

            className="
              mt-0.5

              text-[21px]
              font-black

              leading-none

              text-gray-800

              score-value
            "

          >

            {score}

          </div>

        </div>



        {/* 阶段 */}

        <div

          className="
            text-center

            border-x
            border-gray-100
          "

        >

          <div

            className="
              text-[9px]
              font-bold

              tracking-[0.16em]

              text-gray-300
            "

          >

            STAGE

          </div>


          <div

            className="
              mt-0.5

              text-[19px]
              font-black

              leading-none

              text-gray-700
            "

          >

            {checkpointNumber}

          </div>

        </div>



        {/* 步数 */}

        <div

          className="
            text-right
            pr-1
          "

        >

          <div

            className="
              text-[9px]
              font-bold

              tracking-[0.16em]

              text-gray-300
            "

          >

            STEP

          </div>


          <div

            className="
              mt-0.5

              text-[19px]
              font-black

              leading-none

              text-gray-800
            "

          >

            {steps}

            <span

              className="
                ml-1

                text-[10px]
                font-bold

                text-gray-300
              "

            >

              / {stepLimit}

            </span>

          </div>

        </div>


      </div>



      {/* =========================
          进度条
          ========================= */}

      <div

        className="
          mt-3.5

          h-[4px]

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
          阶段目标
          ========================= */}

      {

        checkpointRequiredScore > 0 &&

        <div

          className="
            mt-2.5

            flex
            items-center
            justify-between

            text-[10px]
          "

        >

          <span
            className="
              text-gray-300
            "
          >

            目标 {checkpointRequiredScore}

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

              ✓ 完成

            </span>

            :

            <span
              className="
                text-gray-400
              "
            >

              还差

              <span

                className="
                  ml-1

                  font-black
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
          阶段结算
          ========================= */}

      {

        checkpointPending &&
        !gameOver &&

        <div

          className="
            mt-2.5

            rounded-xl

            bg-blue-50

            px-3
            py-2

            text-center

            text-[10px]
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