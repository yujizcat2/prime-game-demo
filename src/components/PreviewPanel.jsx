export default function PreviewPanel({

  preview,

}) {


  const hasPreview =

    preview?.combine ||
    preview?.reduce;


  const combineFood =
    preview?.combine?.food ?? null;


  const combineIsVegetable =
    combineFood === "vegetable";


  const combineIsMeat =
    combineFood === "meat";



  return (

    <div

      className="
        min-h-[72px]

        flex
        items-center
        justify-center

        px-2
      "

    >


      {

        !hasPreview

        ?

        <div

          className="
            text-[12px]
            font-medium

            text-gray-300

            select-none
          "

        >

          选择数字开始探索

        </div>


        :

        <div

          className="
            flex
            items-center
            justify-center
            flex-wrap

            gap-2

            preview-enter
          "

        >


          {/* 合成 */}

          {

            preview?.combine &&

            <div

              className={`
                flex
                items-center
                gap-2.5

                h-11

                px-4

                rounded-2xl

                border

                ${
                  combineIsVegetable

                    ? `
                      bg-violet-50
                      border-violet-100
                    `

                    : combineIsMeat

                    ? `
                      bg-sky-50
                      border-sky-100
                    `

                    : `
                      bg-blue-50
                      border-blue-100
                    `
                }
              `}

            >


              <span

                className={`
                  text-[11px]
                  font-bold

                  ${
                    combineIsVegetable

                      ? "text-violet-400"

                      : combineIsMeat

                      ? "text-sky-400"

                      : "text-blue-400"
                  }
                `}

              >

                合成

              </span>


              <span

                className={`
                  text-[21px]
                  font-black

                  ${
                    combineIsVegetable

                      ? "text-violet-600"

                      : combineIsMeat

                      ? "text-sky-600"

                      : "text-blue-600"
                  }
                `}

              >

                {preview.combine.value}

              </span>

            </div>

          }



          {/* 约分 */}

          {

            preview?.reduce &&

            <div

              className="
                flex
                items-center
                gap-2.5

                h-11

                px-4

                rounded-2xl

                bg-orange-50

                border
                border-orange-100
              "

            >


              <span

                className="
                  text-[11px]
                  font-bold
                  text-orange-400
                "

              >

                约分

              </span>


              <span

                className="
                  text-[20px]
                  font-black
                  text-orange-500
                "

              >

                {

                  (
                    preview.reduce.results
                    ?? preview.reduce
                  )

                    .map(
                      item => item?.value ?? item
                    )

                    .filter(
                      x => x !== 1
                    )

                    .join(" · ")

                }

              </span>

            </div>

          }


        </div>

      }


    </div>

  );

}
