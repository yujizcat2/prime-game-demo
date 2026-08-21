import {
  getActionStatus
} from "../game/actionStatus";

import {
  getIngredientName
} from "../game/ingredientCatalog";

import {
  combineAnimal
} from "../game/rules";

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
  // animal -> 料理类型
  //
  // cat -> 素类
  // dog -> 荤类
  // ==========================================================

  function getTypeFromAnimal(
    animal
  ) {


    if (
      animal === "cat"
    ) {

      return "veg";

    }


    if (
      animal === "dog"
    ) {

      return "meat";

    }


    return "veg";

  }



  // ==========================================================
  // 获取某个节点对应的料理名称
  // ==========================================================

  function getItemName(
    item
  ) {


    if (
      !item
    ) {

      return null;

    }


    return getIngredientName(

      item.value,

      getTypeFromAnimal(
        item.animal
      )

    );

  }



  // ==========================================================
  // 选中水
  // ==========================================================

  if(
    status.type === "one"
  ){


    const waterItem =

      numbers.find(

        item =>
          item.id === selected[0]

      )

      ??

      status.item;



    const ingredientType =

      getTypeFromAnimal(

        waterItem?.animal

      );



    // ========================================================
    // 水的直接来源
    // ========================================================

    const previousValue =

      waterItem?.origin?.type === "reduce"

        ? waterItem.origin.parent?.value ?? null

        : waterItem?.reduceFrom ?? null;



    const previousIngredientName =

      previousValue !== null

        ? getIngredientName(

            previousValue,

            ingredientType

          )

        : null;



    message =

      getWaterText(

        previousIngredientName

      );

  }



  // ==========================================================
  // 只选择一种普通食材
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
  // 选择两种食材
  // ==========================================================

  else if(
    status.type === "pair"
  ){


    const {

      combine,

      reduce

    } = status;



    // ========================================================
    // 按玩家选择顺序获取两个节点
    // ========================================================

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



    // ========================================================
    // 当前两个食材名称
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
    // 料理结果 animal
    //
    // 直接复用真实游戏规则
    // ========================================================

    const resultAnimal =

      firstItem &&
      secondItem

        ? combineAnimal(

            firstItem,

            secondItem

          )

        : firstItem?.animal ?? null;



    const resultType =

      getTypeFromAnimal(

        resultAnimal

      );



    // ========================================================
    // 料理结果名称
    // ========================================================

    const combineResultName =

      combine?.result !== null &&
      combine?.result !== undefined

        ? getIngredientName(

            combine.result,

            resultType

          )

        : null;



    // ========================================================
    // 处理后的两个结果名称
    //
    // actionStatus 已经计算好了结果
    // ========================================================

    const firstReduceResultName =

      reduce.allowed &&
      reduce.firstResult !== null &&
      firstItem

        ? getIngredientName(

            reduce.firstResult,

            getTypeFromAnimal(
              firstItem.animal
            )

          )

        : null;



    const secondReduceResultName =

      reduce.allowed &&
      reduce.secondResult !== null &&
      secondItem

        ? getIngredientName(

            reduce.secondResult,

            getTypeFromAnimal(
              secondItem.animal
            )

          )

        : null;



    // ========================================================
    // 可以料理 + 可以处理
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
    // 可以料理
    // 不能处理
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
    // 不能料理
    // 可以处理
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