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
    //
    // 优先读取来源节点当时的foodType。
    //
    // 如果旧origin中还没存foodType，
    // 再退回当前1节点的foodType。
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



    // ========================================================
    // 根据主菜盘实际位置获取两个节点
    //
    // 这里不能使用玩家点击顺序决定前后。
    // ========================================================

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



    // ========================================================
    // 当前两个料理名称
    // ========================================================

    const firstName =

      getItemName(
        firstItem
      );


    const secondName =

      getItemName(
        secondItem
      );





    // ========================================================
    // 合成结果类型
    //
    // 直接复用真正游戏规则。
    //
    // firstItem就是主菜盘更靠前的节点。
    // ========================================================

    const resultFoodType =

      firstItem &&
      secondItem

        ? combineFoodType(

            firstItem,

            secondItem

          )

        : firstItem?.foodType ?? null;





    // ========================================================
    // 合成结果名称
    // ========================================================

    const combineResultName =

      combine?.result !== null &&
      combine?.result !== undefined

        ? getFoodName(

            combine.result,

            resultFoodType

          )

        : null;





    // ========================================================
    // 约分后的第一个结果名称
    //
    // 约分不改变料理类型。
    // ========================================================

    const firstReduceResultName =

      reduce.allowed &&
      reduce.firstResult !== null &&
      firstItem

        ? getFoodName(

            reduce.firstResult,

            firstItem.foodType

          )

        : null;





    // ========================================================
    // 约分后的第二个结果名称
    // ========================================================

    const secondReduceResultName =

      reduce.allowed &&
      reduce.secondResult !== null &&
      secondItem

        ? getFoodName(

            reduce.secondResult,

            secondItem.foodType

          )

        : null;





    // ========================================================
    // 可以合成 + 可以约分
    // ========================================================

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





    // ========================================================
    // 可以合成
    // 不能约分
    // ========================================================

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





    // ========================================================
    // 不能合成
    // 可以约分
    // ========================================================

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





    // ========================================================
    // 两种操作都不可以
    // ========================================================

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
        min-h-12

        flex
        items-center
        justify-center

        rounded-2xl

        bg-white

        border
        border-gray-100

        shadow-[0_4px_14px_rgba(15,23,42,0.035)]

        px-4
        py-2

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
          max-w-[72%]

          text-center

          text-[13px]
          font-medium

          leading-snug

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