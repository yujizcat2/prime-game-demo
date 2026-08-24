import {
  useState
} from "react";


export default function CollectionPanel({

  collection,

  collectionPaths = {},

  latestCollection = null

}) {


  // ==========================================================
  // 当前打开的收藏数字
  // ==========================================================

  const [
    selectedValue,
    setSelectedValue
  ] = useState(
    null
  );



  // ==========================================================
  // 当前打开的第几条收藏记录
  // ==========================================================

  const [
    selectedPathIndex,
    setSelectedPathIndex
  ] = useState(
    null
  );



  // ==========================================================
  // 当前数字所有父系路径
  // ==========================================================

  const paths =

    selectedValue !== null

      ? collectionPaths[
          selectedValue
        ] ?? []

      : [];



  // ==========================================================
  // 当前具体路径
  // ==========================================================

  const selectedPath =

    selectedPathIndex !== null

      ? paths[
          selectedPathIndex
        ] ?? []

      : [];





  // ==========================================================
  // 打开某个收藏数字
  // ==========================================================

  function openCollection(
    value
  ){


    const valuePaths =

      collectionPaths[
        value
      ];



    if(
      !Array.isArray(
        valuePaths
      ) ||
      valuePaths.length === 0
    ){

      return;

    }



    setSelectedValue(
      value
    );


    setSelectedPathIndex(
      null
    );

  }





  // ==========================================================
  // 关闭弹窗
  // ==========================================================

  function closeModal(){


    setSelectedValue(
      null
    );


    setSelectedPathIndex(
      null
    );

  }





  // ==========================================================
  // 点击某一次收藏
  // ==========================================================

  function selectPath(
    index
  ){


    if(
      selectedPathIndex === index
    ){


      setSelectedPathIndex(
        null
      );


      return;

    }



    setSelectedPathIndex(
      index
    );

  }





  // ==========================================================
  // 根据来源类型显示箭头
  //
  // ← = 约分
  // ⇐ = 合成
  // ==========================================================

  function getArrow(
    fromType
  ){


    if(
      fromType === "combine"
    ){

      return "⇐";

    }



    if(
      fromType === "reduce"
    ){

      return "←";

    }



    return null;

  }





  // ==========================================================
  // 食物类型名称
  // ==========================================================

  function getFoodTypeName(
    foodType
  ){


    if(
      foodType === "meat"
    ){

      return "肉";

    }



    if(
      foodType === "vegetable"
    ){

      return "素";

    }



    if(
      foodType === "seasoning"
    ){

      return "调料";

    }



    if(
      foodType === "dessert"
    ){

      return "甜食";

    }



    return null;

  }





  // ==========================================================
  // 获取状态名称
  //
  // pure + meat
  // → 纯肉
  //
  // mixed + meat
  // → 半纯肉
  //
  // dessert
  // → 甜食
  //
  // 旧历史没有foodType时：
  // → 不显示状态
  // ==========================================================

  function getFoodStateName(
    item
  ){


    if(
      !item?.foodType
    ){

      return null;

    }



    if(
      item.foodType === "dessert"
    ){

      return "甜食";

    }



    const foodTypeName =

      getFoodTypeName(
        item.foodType
      );



    if(
      !foodTypeName
    ){

      return null;

    }



    if(
      item.purity === "pure"
    ){

      return `纯${foodTypeName}`;

    }



    if(
      item.purity === "mixed"
    ){

      return `半纯${foodTypeName}`;

    }



    return foodTypeName;

  }





  return (

    <div

      className="
        mt-7
        px-1
      "

    >


      {/* =====================================================
          标题
          ===================================================== */}

      <div

        className="
          flex
          items-center
          justify-between

          mb-3
        "

      >

        <div

          className="
            flex
            items-center
            gap-2
          "

        >

          <span

            className="
              text-sm
              font-bold
              text-gray-600
            "

          >

            发现记录

          </span>


          <span

            className="
              px-2
              py-0.5

              rounded-full

              bg-white

              text-[10px]
              font-bold
              text-gray-400
            "

          >

            {collection.length}

          </span>

        </div>


        <span

          className="
            text-[10px]
            tracking-wider
            text-gray-300
          "

        >

          DISCOVERY

        </span>

      </div>



      {/* =====================================================
          没有收藏
          ===================================================== */}

      {

        collection.length === 0

        ?

        <div

          className="
            h-20

            rounded-2xl

            border
            border-dashed
            border-gray-200

            flex
            items-center
            justify-center

            text-xs
            text-gray-300
          "

        >

          尚未发现新的数字

        </div>


        :


        // ====================================================
        // 收藏数字
        // ====================================================

        <div

          className="
            flex
            flex-wrap
            gap-2
          "

        >

          {

            collection.map(

              value => {


                const valuePaths =

                  collectionPaths[
                    value
                  ] ?? [];



                const count =
                  valuePaths.length;



                const isLatestValue =

                  latestCollection?.value ===
                  value;



                return (

                  <button

                    key={
                      value
                    }

                    type="button"

                    onClick={
                      () =>
                        openCollection(
                          value
                        )
                    }

                    className="
                      collection-item

                      relative

                      min-w-12
                      h-11

                      px-3

                      rounded-xl

                      bg-white

                      border
                      border-gray-100

                      shadow-sm

                      flex
                      items-center
                      justify-center

                      text-sm
                      font-black
                      text-gray-700

                      cursor-pointer
                    "

                  >


                    {value}



                    <span

                      className="
                        absolute

                        top-0.5
                        right-1

                        text-[7px]

                        text-amber-400
                      "

                    >

                      ✦

                    </span>



                    {

                      count > 0 &&

                      <span

                        className="
                          absolute

                          bottom-0.5
                          right-1

                          text-[8px]
                          font-bold

                          text-gray-400
                        "

                      >

                        {count}

                      </span>

                    }



                    {

                      isLatestValue &&

                      <span

                        className="
                          absolute

                          -top-0.5
                          -left-0.5

                          w-1.5
                          h-1.5

                          rounded-full

                          bg-rose-500
                        "

                      />

                    }


                  </button>

                );

              }

            )

          }

        </div>

      }





      {/* =====================================================
          弹窗
          ===================================================== */}

      {

        selectedValue !== null &&

        <div

          className="
            fixed
            inset-0

            z-50

            bg-black/20

            flex
            items-center
            justify-center

            px-5
          "

          onClick={
            closeModal
          }

        >


          <div

            className="
              w-full
              max-w-sm

              max-h-[80vh]

              overflow-y-auto

              rounded-3xl

              bg-white

              px-5
              py-5

              shadow-xl

              border
              border-gray-100
            "

            onClick={
              event =>
                event.stopPropagation()
            }

          >


            {/* ===============================================
                顶部
                =============================================== */}

            <div

              className="
                flex
                items-center
                justify-between

                mb-5
              "

            >


              <div

                className="
                  flex
                  items-end
                  gap-1
                "

              >

                <span

                  className="
                    text-2xl
                    font-black
                    text-gray-700
                  "

                >

                  {selectedValue}

                </span>


                <span

                  className="
                    mb-0.5

                    text-[10px]
                    font-bold
                    text-gray-400
                  "

                >

                  {paths.length}

                </span>

              </div>



              <button

                type="button"

                onClick={
                  closeModal
                }

                className="
                  w-8
                  h-8

                  rounded-full

                  bg-gray-50

                  flex
                  items-center
                  justify-center

                  text-sm
                  text-gray-400
                "

              >

                ×

              </button>


            </div>



            {/* ===============================================
                同数字所有收藏记录
                =============================================== */}

            <div

              className="
                flex
                flex-wrap
                gap-2
              "

            >

              {

                paths.map(

                  (
                    path,
                    index
                  ) => {


                    const active =

                      selectedPathIndex ===
                      index;



                    const isLatestPath =

                      latestCollection?.value ===
                        selectedValue &&

                      latestCollection?.index ===
                        index;



                    // =========================================
                    // 每次收藏的最终状态
                    //
                    // path[0]就是这次被收藏数字本身。
                    // =========================================

                    const finalState =

                      Array.isArray(
                        path
                      )

                        ? path[0]

                        : null;



                    const finalStateName =

                      getFoodStateName(
                        finalState
                      );



                    return (

                      <button

                        key={
                          `${selectedValue}-${index}`
                        }

                        type="button"

                        onClick={
                          () =>
                            selectPath(
                              index
                            )
                        }

                        className={`
                          relative

                          min-w-14
                          h-12

                          px-3

                          rounded-xl

                          border

                          ${
                            active

                              ? `
                                bg-gray-100
                                border-gray-300
                              `

                              : `
                                bg-gray-50
                                border-gray-100
                              `
                          }

                          flex
                          flex-col
                          items-center
                          justify-center

                          text-gray-600
                        `}

                      >


                        <span

                          className="
                            text-sm
                            font-black
                            leading-none
                          "

                        >

                          {selectedValue}

                        </span>



                        {

                          finalStateName &&

                          <span

                            className="
                              mt-1

                              text-[8px]
                              font-bold
                              leading-none

                              text-gray-400
                            "

                          >

                            {finalStateName}

                          </span>

                        }



                        <span

                          className="
                            absolute

                            bottom-0.5
                            right-1

                            text-[7px]
                            font-bold
                            text-gray-300
                          "

                        >

                          {index + 1}

                        </span>



                        {

                          isLatestPath &&

                          <span

                            className="
                              absolute

                              -top-0.5
                              -left-0.5

                              w-1.5
                              h-1.5

                              rounded-full

                              bg-rose-500
                            "

                          />

                        }


                      </button>

                    );

                  }

                )

              }

            </div>



            {/* ===============================================
                父系单线路径
                =============================================== */}

            {

              selectedPath.length > 0 &&

              <div

                className="
                  mt-5
                  pt-5

                  border-t
                  border-gray-100
                "

              >


                <div

                  className="
                    flex
                    flex-wrap
                    items-center

                    gap-y-2
                  "

                >

                  {

                    selectedPath.map(

                      (
                        item,
                        index
                      ) => {


                        const arrow =

                          getArrow(
                            item.fromType
                          );



                        const stateName =

                          getFoodStateName(
                            item
                          );



                        return (

                          <div

                            key={
                              `${item.value}-${index}`
                            }

                            className="
                              flex
                              items-center
                            "

                          >


                            <div

                              className="
                                min-w-14
                                h-12

                                px-2

                                rounded-xl

                                bg-gray-50

                                border
                                border-gray-100

                                flex
                                flex-col
                                items-center
                                justify-center

                                text-gray-700

                                shrink-0
                              "

                            >


                              <span

                                className="
                                  text-sm
                                  font-black
                                  leading-none
                                "

                              >

                                {item.value}

                              </span>



                              {

                                stateName &&

                                <span

                                  className="
                                    mt-1

                                    text-[8px]
                                    font-bold
                                    leading-none

                                    text-gray-400
                                  "

                                >

                                  {stateName}

                                </span>

                              }


                            </div>



                            {

                              index <
                              selectedPath.length - 1

                              &&

                              arrow

                              &&

                              <div

                                className={`
                                  w-7

                                  flex
                                  items-center
                                  justify-center

                                  text-sm

                                  shrink-0

                                  ${
                                    item.fromType === "combine"

                                      ? `
                                        text-gray-500
                                        font-bold
                                      `

                                      : `
                                        text-gray-300
                                        font-normal
                                      `
                                  }
                                `}

                              >

                                {arrow}

                              </div>

                            }


                          </div>

                        );

                      }

                    )

                  }


                </div>


              </div>

            }


          </div>


        </div>

      }


    </div>

  );

}