export default function PreviewPanel({

  preview,

}) {


  const hasPreview =

    preview?.combine ||
    preview?.reduce;


  const combineAnimal =
    preview?.combine?.animal ?? null;


  const combineIsCat =
    combineAnimal === "cat";


  const combineIsDog =
    combineAnimal === "dog";



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
                  combineIsCat

                    ? `
                      bg-violet-50
                      border-violet-100
                    `

                    : combineIsDog

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
                    combineIsCat

                      ? "text-violet-400"

                      : combineIsDog

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
                    combineIsCat

                      ? "text-violet-600"

                      : combineIsDog

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

                  preview.reduce

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