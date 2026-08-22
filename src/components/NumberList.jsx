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

        gap-x-1.5
        gap-y-3.5
      "

    >


      {

        slots.map(
          (_, index) => {


            const item =
              numbers[index];





            // ==================================================
            // 潜在三拼位置
            //
            // 当玩家选择两道料理后：
            //
            // A + B = C
            //
            // C不是“A和B做出来的菜”，
            // 而是与A、B形成三拼关系的第三道料理。
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



              // =================================================
              // 三拼中的第三道料理名称
              // =================================================

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

                    rounded-[20px]

                    border
                    border-dashed

                    combine-preview-slot

                    ${
                      isVegetable

                        ? `
                          border-emerald-300/70
                          bg-emerald-50/40
                          text-emerald-600
                        `

                        : isMeat

                        ? `
                          border-orange-300/70
                          bg-orange-50/40
                          text-orange-600
                        `

                        : isDessert

                        ? `
                          border-violet-300/70
                          bg-violet-50/40
                          text-violet-600
                        `

                        : `
                          border-gray-300/70
                          bg-gray-50/40
                          text-gray-500
                        `
                    }
                  `}

                >



                  {/* ===========================================
                      左上角数字
                      =========================================== */}

                  <span

                    className="
                      absolute

                      top-2.5
                      left-3

                      text-[14px]
                      sm:text-[15px]

                      font-black

                      tracking-tight

                      opacity-70
                    "

                  >

                    {combineValue}

                  </span>





                  {/* ===========================================
                      三拼第三道料理
                      =========================================== */}

                  <span

                    className="
                      px-2

                      text-[17px]
                      sm:text-[19px]

                      font-black

                      whitespace-nowrap

                      tracking-[-0.04em]

                      opacity-80
                    "

                  >

                    {foodName}

                  </span>





                  {/* ===========================================
                      三拼标记
                      =========================================== */}

                  <span

                    className="
                      absolute

                      bottom-2

                      left-1/2

                      -translate-x-1/2

                      text-[8px]

                      font-bold

                      tracking-[0.14em]

                      opacity-45
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


              // =================================================
              // 是否已经成功发现过
              // =================================================

              const discovered =

                item.value !== 1 &&

                collection.includes(
                  item.value
                );



              // =================================================
              // 1的直接前身
              // =================================================

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



              // =================================================
              // 是否为新发现的1
              // =================================================

              const isNewDiscovery =

                item.value === 1 &&

                reduceFrom !== null &&

                !collection.includes(
                  reduceFrom
                );



              // =================================================
              // 即将获得积分
              // =================================================

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

                  rounded-[20px]

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