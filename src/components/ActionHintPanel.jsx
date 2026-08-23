import {
  getActionStatus
} from "../game/actionStatus";

import {
  combineFoodType
} from "../game/rules";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";

import {
  getEmptyText,
  getSingleText,
  getWaterText,
  getCombineText,
  getReduceText,
  getCombineAndReduceText,
  getCombineBlockedText,
  getBlockedButReducibleText
} from "../game/kitchenText";





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





export default function ActionHintPanel({

  numbers,

  selected

}) {


  const status =

    getActionStatus(

      numbers,

      selected

    );



  let message =
    getEmptyText();





  // ==========================================================
  // 获取某个节点对应的料理名称
  // ==========================================================

  function getItemName(
    item
  ) {


    if(
      !item
    ){

      return null;

    }



    return getFoodName(

      item.value,

      item.foodType

    );

  }





  // ==========================================================
  // 选中1
  // ==========================================================

  if(
    status.type === "one"
  ){


    const oneItem =

      numbers.find(

        item =>
          item.id === selected[0]

      )

      ??

      status.item;



    // ========================================================
    // 1的直接来源
    // ========================================================

    const previousRecord =

      oneItem?.origin?.type === "reduce"

        ? oneItem.origin.parent

        : null;



    const previousValue =

      previousRecord?.value
      ?? null;



    // ========================================================
    // 来源料理类型
    // ========================================================

    const previousFoodType =

      previousRecord?.foodType

      ??

      oneItem?.foodType

      ??

      null;



    const previousFoodName =

      previousValue !== null

        ? getFoodName(

            previousValue,

            previousFoodType

          )

        : null;



    message =

      getWaterText(

        previousFoodName

      );

  }





  // ==========================================================
  // 只选择一个普通料理
  // ==========================================================

  else if(
    status.type === "single"
  ){


    const selectedItem =

      status.item

      ??

      numbers.find(

        item =>
          item.id === selected[0]

      );



    const selectedName =

      getItemName(

        selectedItem

      );



    message =

      getSingleText(

        selectedName

      );

  }





  // ==========================================================
  // 选择两个料理
  // ==========================================================

  else if(
    status.type === "pair"
  ){


    const {

      combine,

      reduce

    } = status;



    const selectedItems =

      numbers.filter(

        item =>
          selected.includes(
            item.id
          )

      );



    const firstItem =
      selectedItems[0] ?? null;


    const secondItem =
      selectedItems[1] ?? null;



    const firstName =

      getItemName(
        firstItem
      );


    const secondName =

      getItemName(
        secondItem
      );





    const resultFoodType =

      firstItem &&
      secondItem

        ? combineFoodType(

            firstItem,

            secondItem

          )

        : firstItem?.foodType ?? null;





    const combineResultName =

      combine?.result !== null &&
      combine?.result !== undefined

        ? getFoodName(

            combine.result,

            resultFoodType

          )

        : null;





    const firstReduceResultName =

      reduce.allowed &&
      reduce.firstResult !== null &&
      firstItem

        ? getFoodName(

            reduce.firstResult,

            firstItem.foodType

          )

        : null;





    const secondReduceResultName =

      reduce.allowed &&
      reduce.secondResult !== null &&
      secondItem

        ? getFoodName(

            reduce.secondResult,

            secondItem.foodType

          )

        : null;





    if(
      combine.allowed &&
      reduce.allowed
    ){


      message =

        getCombineAndReduceText({

          firstName,

          secondName,

          combineResultName,

          firstReduceResultName,

          secondReduceResultName

        });

    }





    else if(
      combine.allowed &&
      !reduce.allowed
    ){


      message =

        getCombineText({

          firstName,

          secondName,

          resultName:
            combineResultName

        });

    }





    else if(
      !combine.allowed &&
      reduce.allowed
    ){


      const blockedText =

        getCombineBlockedText({

          reason:
            combine.reason,

          firstName,

          secondName

        });



      message =

        getBlockedButReducibleText({

          blockedText,

          firstResultName:
            firstReduceResultName,

          secondResultName:
            secondReduceResultName

        });

    }





    else{


      message =

        getCombineBlockedText({

          reason:
            combine.reason,

          firstName,

          secondName

        });

    }

  }





  return (

    <div

      className="
        relative

        w-full
        h-full
        min-h-0

        flex
        items-center
        justify-center

        rounded-[20px]

        bg-white

        border
        border-gray-100

        shadow-[0_4px_14px_rgba(15,23,42,0.035)]

        px-4
        py-2.5

        overflow-hidden
      "

    >



      {/* =========================
          TIP
          ========================= */}

      <div

        className="
          absolute
          left-3

          h-7

          px-2.5

          flex
          items-center

          gap-1.5

          rounded-xl

          bg-gray-50

          border
          border-gray-100

          text-gray-400

          pointer-events-none
        "

      >


        <span

          className="
            text-[12px]
            leading-none
          "

        >

          ✦

        </span>


        <span

          className="
            text-[9px]

            font-bold

            tracking-[0.14em]
          "

        >

          TIP

        </span>


      </div>



      {/* =========================
          提示文字
          ========================= */}

      <div

        className="
          max-w-[68%]

          text-center

          text-[13px]
          font-medium

          leading-[1.45]

          text-gray-500

          transition-all
          duration-200
        "

      >

        {message}

      </div>


    </div>

  );

}