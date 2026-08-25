import {
  getActionStatus
} from "../game/actionStatus";

import {
  combineAnimalType
} from "../game/rules";

import {
  getAnimalName
} from "../data/animal/animalRegistry";

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
// 根据动物类型获取名称
// ============================================================

function getDisplayName(
  value,
  animalType
) {


  if(
    value === null ||
    value === undefined
  ){

    return null;

  }



  return getAnimalName(

    value,

    animalType

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
  // 获取某个节点对应的动物名称
  // ==========================================================

  function getItemName(
    item
  ) {


    if(
      !item
    ){

      return null;

    }



    return getDisplayName(

      item.value,

      item.animalType

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



    const previousAnimalType =

      previousRecord?.animalType

      ??

      oneItem?.animalType

      ??

      null;



    const previousAnimalName =

      previousValue !== null

        ? getDisplayName(

            previousValue,

            previousAnimalType

          )

        : null;



    message =

      getWaterText(

        previousAnimalName

      );

  }





  // ==========================================================
  // 只选择一个普通动物
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
  // 选择两个动物
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





    const resultAnimalType =

      firstItem &&
      secondItem

        ? combineAnimalType(

            firstItem,

            secondItem

          )

        : firstItem?.animalType ?? null;





    const combineResultName =

      combine?.result !== null &&
      combine?.result !== undefined

        ? getDisplayName(

            combine.result,

            resultAnimalType

          )

        : null;





    const firstReduceResultName =

      reduce.allowed &&
      reduce.firstResult !== null &&
      firstItem

        ? getDisplayName(

            reduce.firstResult,

            firstItem.animalType

          )

        : null;





    const secondReduceResultName =

      reduce.allowed &&
      reduce.secondResult !== null &&
      secondItem

        ? getDisplayName(

            reduce.secondResult,

            secondItem.animalType

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