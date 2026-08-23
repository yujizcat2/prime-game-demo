import NumberCard from "./NumberCard";

import {
  gcd
} from "../utils/math";

import {
  SCORE_CONFIG
} from "../game/scoreConfig";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";





// ============================================================
// 根据料理类型获取名称
// ============================================================

function getFoodName(
  value,
  foodType
) {


  if(
    value === null ||
    value === undefined
  ){

    return null;

  }



  if(
    foodType === "meat"
  ){

    return getMeatName(
      value
    );

  }



  if(
    foodType === "vegetable"
  ){

    return getVegetableName(
      value
    );

  }



  if(
    foodType === "dessert"
  ){

    return getDessertName(
      value
    );

  }



  return String(
    value
  );

}





export default function NumberList({

  numbers,

  selected,

  onSelect,

  preview,

  collection = [],

  removingId = null,

}) {


  // ==========================================================
  // 固定10个主菜盘位置
  // ==========================================================

  const slots =
    Array.from({

      length: 10

    });





  // ==========================================================
  // 约分预览
  // ==========================================================

  const reducePreviewMap = {};



  if(
    selected.length === 2
  ){


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



    if(
      firstItem &&
      secondItem
    ){


      const divisor =

        gcd(

          firstItem.value,

          secondItem.value

        );



      if(
        divisor > 1
      ){


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

        grid-cols-[repeat(5,max-content)]

        justify-center

        gap-x-2
        gap-y-4

        max-[560px]:gap-x-1.5
        max-[560px]:gap-y-3
      "

    >


      {

        slots.map(
          (_, index) => {


            const item =
              numbers[index];





            // ==================================================
            // 潜在三拼位置
            // ==================================================

            if(

              !item &&

              preview?.combine &&

              index === numbers.length

            ){


              const combineValue =
                preview.combine.value;


              const foodType =
                preview.combine.foodType;



              const isMeat =
                foodType === "meat";


              const isVegetable =
                foodType === "vegetable";


              const isDessert =
                foodType === "dessert";



              const foodName =

                getFoodName(

                  combineValue,

                  foodType

                );



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

                    rounded-[23px]

                    overflow-hidden

                    border
                    border-dashed

                    combine-preview-slot

                    ${
                      isVegetable

                        ? `
                          border-emerald-300/65
                          bg-emerald-50/35
                          text-emerald-700
                        `

                        : isMeat

                        ? `
                          border-orange-300/65
                          bg-orange-50/35
                          text-orange-700
                        `

                        : isDessert

                        ? `
                          border-violet-300/65
                          bg-violet-50/35
                          text-violet-700
                        `

                        : `
                          border-gray-300/65
                          bg-gray-50/35
                          text-gray-500
                        `
                    }
                  `}

                >



                  {/* ===========================================
                      数字
                      =========================================== */}

                  <span

                    className="
                      absolute

                      top-[9px]
                      left-[11px]

                      text-[11px]

                      font-black

                      tracking-tight

                      opacity-50

                      max-[560px]:top-[7px]
                      max-[560px]:left-[8px]
                      max-[560px]:text-[9px]
                    "

                  >

                    {combineValue}

                  </span>





                  {/* ===========================================
                      菜名
                      =========================================== */}

                  <span

                    className="
                      px-1

                      text-[21px]

                      font-black

                      whitespace-nowrap

                      tracking-[-0.06em]

                      opacity-75

                      max-[720px]:text-[19px]
                      max-[560px]:text-[17px]
                    "

                  >

                    {foodName}

                  </span>





                  {/* ===========================================
                      三拼
                      =========================================== */}

                  <span

                    className="
                      absolute

                      bottom-[7px]

                      left-1/2

                      -translate-x-1/2

                      text-[7px]

                      font-bold

                      tracking-[0.16em]

                      opacity-35

                      max-[560px]:bottom-[5px]
                      max-[560px]:text-[6px]
                    "

                  >

                    三拼

                  </span>


                </div>

              );

            }





            // ==================================================
            // 正常料理
            // ==================================================

            if(
              item
            ){


              const discovered =

                item.value !== 1 &&

                collection.includes(
                  item.value
                );



              const reduceFrom =

                item.value === 1 &&
                item.origin?.type === "reduce"

                  ? (
                      item.origin
                        .parent
                        ?.value
                      ?? null
                    )

                  : null;



              const isNewDiscovery =

                item.value === 1 &&

                reduceFrom !== null &&

                !collection.includes(
                  reduceFrom
                );



              let scorePreview =
                null;



              if(

                item.value === 1 &&

                reduceFrom !== null

              ){


                if(
                  isNewDiscovery
                ){


                  scorePreview =

                    (
                      collection.length + 1
                    )

                    *

                    SCORE_CONFIG
                      .NEW_NUMBER_GROWTH;

                }


                else{


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





            // ==================================================
            // 空位置
            // ==================================================

            return (

              <div

                key={
                  `slot-${index}`
                }

                className="
                  number-slot

                  rounded-[23px]

                  border
                  border-dashed
                  border-slate-200/80

                  bg-slate-50/45

                  max-[560px]:rounded-[18px]
                "

              />

            );

          }
        )

      }


    </div>

  );

}