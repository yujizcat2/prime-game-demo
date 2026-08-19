import NumberCard from "./NumberCard";

import { gcd } from "../utils/math";

import { SCORE_CONFIG } from "../game/scoreConfig";


export default function NumberList({

  numbers,

  selected,

  onSelect,

  preview,

  collection = [],

  removingId = null,

}) {


  // =========================
  // 固定 10 个位置
  // =========================

  const slots =
    Array.from({

      length: 10

    });



  // =========================
  // 约分预览
  // =========================

  const reducePreviewMap = {};


  if (
    selected.length === 2
  ) {


    const firstItem =

      numbers.find(

        item =>
          item.id === selected[0]

      );


    const secondItem =

      numbers.find(

        item =>
          item.id === selected[1]

      );


    if (
      firstItem &&
      secondItem
    ) {


      const divisor =

        gcd(

          firstItem.value,

          secondItem.value

        );


      // =========================
      // 只要 gcd > 1
      // 就显示约分预览
      // =========================

      if (
        divisor > 1
      ) {


        reducePreviewMap[
          firstItem.id
        ] =

          firstItem.value /
          divisor;


        reducePreviewMap[
          secondItem.id
        ] =

          secondItem.value /
          divisor;

      }

    }

  }





  return (

    <div

      className="
        grid
        grid-cols-5

        gap-3

        place-items-center
      "

    >


      {

        slots.map(
          (_, index) => {


            const item =
              numbers[index];



            // =========================
            // 潜在合成位置
            // =========================

            if (

              !item &&

              preview?.combine &&

              index === numbers.length

            ) {


              const combineValue =
                preview.combine.value;


              const combineAnimal =
                preview.combine.animal;


              const isCat =
                combineAnimal === "cat";


              const isDog =
                combineAnimal === "dog";


              return (

                <div

                  key={
                    `preview-${index}`
                  }

                  className={`
                    number-slot

                    relative

                    flex
                    items-center
                    justify-center

                    rounded-[22px]

                    border
                    border-dashed

                    combine-preview-slot

                    ${
                      isCat

                        ? `
                          border-orange-300/70
                          bg-orange-50/35
                          text-orange-500
                        `

                        : isDog

                        ? `
                          border-teal-300/70
                          bg-teal-50/35
                          text-teal-500
                        `

                        : `
                          border-blue-300/70
                          bg-blue-50/35
                          text-blue-500
                        `
                    }
                  `}

                >



                  {/* =====================
                      即将生成的数字
                      ===================== */}

                  <span

                    className="
                      text-[30px]

                      font-black

                      tracking-tight

                      opacity-75
                    "

                  >

                    {combineValue}

                  </span>



                  {/* =====================
                      NEW 标记
                      ===================== */}

                  <span

                    className="
                      absolute

                      bottom-1.5
                      left-1/2

                      -translate-x-1/2

                      text-[7px]

                      font-bold

                      tracking-[0.14em]

                      opacity-45
                    "

                  >

                    NEW

                  </span>


                </div>

              );

            }





            // =========================
            // 正常数字
            // =========================

            if (item) {


              // =========================
              // 是否已经成功发现过
              // =========================

              const discovered =

                item.value !== 1 &&

                collection.includes(
                  item.value
                );



              // =========================
              // 是否是新发现的 1
              // =========================

              const isNewDiscovery =

                item.value === 1 &&

                item.reduceFrom !== null &&

                !collection.includes(
                  item.reduceFrom
                );



              // =========================
              // 即将获得的积分
              // =========================

              let scorePreview =
                null;


              if (

                item.value === 1 &&

                item.reduceFrom !== null

              ) {


                // =========================
                // 新发现
                // =========================

                if (
                  isNewDiscovery
                ) {


                  scorePreview =

                    (
                      collection.length + 1
                    )

                    *

                    SCORE_CONFIG
                      .NEW_NUMBER_GROWTH;

                }


                // =========================
                // 重复发现
                // =========================

                else {


                  scorePreview =

                    SCORE_CONFIG
                      .REPEAT_SCORE;

                }

              }





              return (

                <NumberCard

                  key={
                    `number-${item.id}`
                  }

                  item={
                    item
                  }

                  selected={
                    selected.includes(
                      item.id
                    )
                  }

                  onClick={() =>
                    onSelect(
                      item.id
                    )
                  }

                  reducePreview={
                    reducePreviewMap[
                      item.id
                    ] ?? null
                  }

                  isNewDiscovery={
                    isNewDiscovery
                  }

                  scorePreview={
                    scorePreview
                  }

                  discovered={
                    discovered
                  }

                  removing={
                    removingId ===
                    item.id
                  }

                />

              );

            }





            // =========================
            // 空位置
            // =========================

            return (

              <div

                key={
                  `slot-${index}`
                }

                className="
                  number-slot

                  rounded-[22px]

                  border
                  border-dashed
                  border-gray-200

                  bg-gray-50/70
                "

              />

            );

          }
        )

      }


    </div>

  );

}