export default function PreviewPanel({

  preview,

}) {


  const hasPreview =

    preview?.combine ||
    preview?.reduce;



  return (

    <div

      className="
        h-[62px]

        mt-3

        flex
        items-center
        justify-center
      "

    >


      {

        !hasPreview

        ?

        <div

          className="
            text-sm
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
            gap-2

            preview-enter
          "

        >



          {/* =========================
              合成
              ========================= */}

          {

            preview?.combine &&

            <div

              className="
                flex
                items-center
                gap-2

                h-10

                px-4

                rounded-full

                bg-blue-50

                border
                border-blue-100
              "

            >

              <span

                className="
                  text-xs
                  font-bold
                  text-blue-400
                "

              >

                ＋

              </span>


              <span

                className="
                  text-sm
                  text-blue-400
                "

              >

                合成

              </span>


              <span

                className="
                  text-lg
                  font-black
                  text-blue-600
                "

              >

                {preview.combine}

              </span>

            </div>

          }



          {/* =========================
              约分
              ========================= */}

          {

            preview?.reduce &&

            <div

              className="
                flex
                items-center
                gap-2

                h-10

                px-4

                rounded-full

                bg-orange-50

                border
                border-orange-100
              "

            >

              <span

                className="
                  text-xs
                  font-bold
                  text-orange-400
                "

              >

                ↓

              </span>


              <span

                className="
                  text-sm
                  text-orange-400
                "

              >

                约分

              </span>


              <span

                className="
                  text-lg
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