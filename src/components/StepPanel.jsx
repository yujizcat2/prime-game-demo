export default function StepPanel({

  steps = 0,

  score = 0

}) {


  // =========================
  // 12小时制时间
  // =========================

  const displayHour =
    steps % 12;



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
          grid-cols-2

          items-center
        "

      >


        {/* =========================
            金钱
            ========================= */}

        <div

          className="
            text-left

            pl-1
            pr-4
          "

        >


          <div

            className="
              text-[9px]

              font-bold

              tracking-[0.18em]

              text-gray-300
            "

          >

            MONEY

          </div>



          <div

            className="
              mt-1

              flex
              items-baseline

              gap-1
            "

          >


            <span

              className="
                text-[13px]

                font-black

                text-emerald-500
              "

            >

              ¥

            </span>



            <span

              className="
                score-value

                text-[24px]

                font-black

                leading-none

                tracking-[-0.045em]

                text-gray-800
              "

            >

              {score}

            </span>


          </div>



          <div

            className="
              mt-1.5

              text-[9px]

              font-semibold

              tracking-[0.04em]

              text-gray-300
            "

          >

            当前营业额

          </div>


        </div>





        {/* =========================
            时间
            ========================= */}

        <div

          className="
            text-right

            pl-4
            pr-1

            border-l
            border-gray-100
          "

        >


          <div

            className="
              text-[9px]

              font-bold

              tracking-[0.18em]

              text-gray-300
            "

          >

            TIME

          </div>



          <div

            className="
              mt-1

              flex
              items-baseline
              justify-end

              gap-1
            "

          >


            <span

              className="
                text-[24px]

                font-black

                leading-none

                tracking-[-0.045em]

                text-gray-800
              "

            >

              {displayHour}

            </span>



            <span

              className="
                text-[10px]

                font-bold

                text-gray-300
              "

            >

              / 12

            </span>


          </div>



          <div

            className="
              mt-1.5

              text-[9px]

              font-semibold

              tracking-[0.04em]

              text-gray-300
            "

          >

            营业时间

          </div>


        </div>


      </div>


    </div>

  );

}