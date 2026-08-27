import {
  useEffect,
  useState
} from "react";

import {
  getFoodDisplayName
} from "../data/food/foodRegistry";





const COLLECTION_TYPES = [

  {
    key:
      "meat",

    label:
      "荤"
  },

  {
    key:
      "vegetable",

    label:
      "素"
  },

  {
    key:
      "seasoning",

    label:
      "调料"
  }

];





export default function CollectionPanel({

  collection = [],

  collectionPaths = {},

  collectionOrigins = {},

  collectionParents = {},

  latestCollection = null

}) {

  const [showMoneyFeedback, setShowMoneyFeedback] = useState(false);

  useEffect(() => {
    if(latestCollection?.eventId == null){
      return undefined;
    }

    setShowMoneyFeedback(true);
    const timer = window.setTimeout(() => setShowMoneyFeedback(false), 850);
    return () => window.clearTimeout(timer);
  }, [latestCollection?.eventId]);


  // ==========================================================
  // 当前展开的数字
  // ==========================================================

  const [

    selectedValue,

    setSelectedValue

  ] = useState(
    null
  );





  // ==========================================================
  // 当前展开的收藏槽
  //
  // meat
  // vegetable
  // seasoning
  // ==========================================================

  const [

    selectedFoodType,

    setSelectedFoodType

  ] = useState(
    null
  );





  // ==========================================================
  // 当前数字三个路径槽
  // ==========================================================

  const selectedSlots =

    selectedValue !== null

      ?

        collectionPaths[
          selectedValue
        ]

        ??

        {}

      :

        {};





  // ==========================================================
  // 当前数字三个父母槽
  // ==========================================================

  const selectedParentSlots =

    selectedValue !== null

      ?

        collectionParents[
          selectedValue
        ]

        ??

        {}

      :

        {};





  // ==========================================================
  // 当前选中槽路径
  // ==========================================================

  const selectedPath =

    selectedFoodType !== null

      ?

        selectedSlots[
          selectedFoodType
        ]

        ??

        []

      :

        [];





  // ==========================================================
  // 当前选中槽父母
  // ==========================================================

  const selectedParents =

    selectedFoodType !== null

      ?

        selectedParentSlots[
          selectedFoodType
        ]

        ??

        null

      :

        null;





  const selectedOrigin =

    selectedValue !== null
    &&
    selectedFoodType !== null

      ? collectionOrigins?.[
          selectedValue
        ]?.[
          selectedFoodType
        ]

        ?? null

      : null;





  const selectedParentFoods =

    getParentFoodRecords(
      selectedParents,
      selectedOrigin
    );





  // ==========================================================
  // 打开数字
  // ==========================================================

  function openCollection(
    value
  ){


    const valueSlots =

      collectionPaths[
        value
      ];



    if(
      !valueSlots ||
      Array.isArray(
        valueSlots
      )
    ){


      return;

    }



    setSelectedValue(
      value
    );


    setSelectedFoodType(
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


    setSelectedFoodType(
      null
    );

  }





  // ==========================================================
  // 选择收藏槽
  // ==========================================================

  function selectFoodType(
    foodType
  ){


    const path =

      selectedSlots[
        foodType
      ];



    if(
      !Array.isArray(
        path
      ) ||
      path.length === 0
    ){


      return;

    }



    if(
      selectedFoodType ===
      foodType
    ){


      setSelectedFoodType(
        null
      );


      return;

    }



    setSelectedFoodType(
      foodType
    );

  }





  // ==========================================================
  // 路径箭头
  // ==========================================================

  function getArrow(
    fromType
  ){


    if(
      fromType ===
      "combine"
    ){


      return "⇐";

    }



    if(
      fromType ===
      "reduce"
    ){


      return "←";

    }



    return null;

  }





  // ==========================================================
  // 料理名称
  // ==========================================================

  function getItemFoodName(
    item,
    fallbackFoodType = null
  ){


    return getFoodDisplayName(
      item,
      fallbackFoodType
    );

  }





  // ==========================================================
  // 父母料理快照
  //
  // 新旧状态均只读兼容：优先使用专用父母槽；若旧快照没有该槽，
  // 则沿约分来源回溯到最近一次合成，并读取其中保存的双方快照。
  // ==========================================================

  function getParentFoodRecords(
    parentInfo,
    originRecord
  ){


    if(
      Array.isArray(
        parentInfo?.parentFoods
      )
      &&
      parentInfo.parentFoods.length >= 2
    ){


      return parentInfo.parentFoods;

    }



    let current =
      originRecord;


    while(
      current
    ){


      if(
        Array.isArray(
          current.parentFoods
        )
        &&
        current.parentFoods.length >= 2
      ){


        return current.parentFoods;

      }


      if(
        current.origin?.type === "combine"
        &&
        Array.isArray(
          current.origin.parents
        )
        &&
        current.origin.parents.length >= 2
      ){


        return current.origin.parents;

      }


      current =
        current.origin?.type === "reduce"

          ? current.origin.parent

          : null;

    }



    return [];

  }





  // ==========================================================
  // 获取某数字收藏槽数量
  // ==========================================================

  function getSlotCount(
    value
  ){


    const slots =

      collectionPaths[
        value
      ];



    if(
      !slots ||
      Array.isArray(
        slots
      )
    ){


      return 0;

    }



    let count =
      0;



    for(
      const type
      of COLLECTION_TYPES
    ){


      const path =

        slots[
          type.key
        ];



      if(
        Array.isArray(
          path
        )
        &&
        path.length > 0
      ){


        count++;

      }

    }



    return count;

  }





  // ==========================================================
  // 总收藏槽数量
  // ==========================================================

  const totalSlotCount =

    collection.reduce(

      (
        total,
        value
      ) =>

        total

        +

        getSlotCount(
          value
        ),

      0

    );





  // ==========================================================
  // 三槽完成数量
  // ==========================================================

  const completedCount =

    collection.reduce(

      (
        total,
        value
      ) => {


        return (

          total

          +

          (
            getSlotCount(
              value
            )

            ===

            3

              ? 1

              : 0
          )

        );

      },

      0

    );





  return (

    <div
      className="
        mt-7
        px-1
      "
    >


      {/* ======================================================
          标题
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          flex-wrap
          gap-2
          mb-3
        "
      >


        <div
          className="
            flex
            items-center
            flex-wrap
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

            已获得的料理包

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

            {totalSlotCount}

          </span>

          {
            showMoneyFeedback &&
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">
              {latestCollection?.reward > 0
                ? `+¥${latestCollection.reward}`
                : latestCollection?.reward < 0
                  ? `-¥${Math.abs(latestCollection.reward)}`
                  : "¥0"}
              {latestCollection?.sameSourceRepeat ? " · 同源重复" : ""}
            </span>
          }

          {
            showMoneyFeedback && latestCollection?.trendFrom != null &&
            <span className="text-[10px] font-bold text-amber-600">
              收藏趋势 ↓ {latestCollection.trendFrom} → {latestCollection.value}
            </span>
          }



          <span
            className="
              px-2
              py-0.5
              rounded-full
              bg-gray-50
              text-[9px]
              font-bold
              text-gray-400
            "
          >

            完成 {completedCount}

          </span>


        </div>



        <span
          className="
            hidden
            sm:inline
            text-[10px]
            tracking-wider
            text-gray-300
          "
        >

          OBTAINED DISH PACKS

        </span>


      </div>





      {/* ======================================================
          空收藏
      ====================================================== */}

      {

        collection.length ===
        0

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

          尚未获得料理包

        </div>

        :


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


                const slots =

                  collectionPaths[
                    value
                  ]

                  ??

                  {};



                const slotCount =

                  getSlotCount(
                    value
                  );



                const isComplete =

                  slotCount ===
                  3;



                const isLatestValue =

                  latestCollection?.value

                  ===

                  value;



                const foodNames =

                  COLLECTION_TYPES.flatMap(

                    type => {


                      const path =
                        slots[type.key];


                      if(
                        !Array.isArray(path)
                        ||
                        path.length === 0
                      ){


                        return [];

                      }


                      const name =
                        getItemFoodName(
                          path[0],
                          type.key
                        );


                      return name
                        ? [name]
                        : [];

                    }

                  );



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

                    className={`
                      collection-item
                      relative
                      min-w-[96px]
                      min-h-[68px]
                      px-2
                      rounded-xl
                      border
                      shadow-sm
                      flex
                      flex-col
                      items-center
                      justify-center
                      cursor-pointer

                      ${
                        isComplete

                          ? `
                            bg-amber-50
                            border-amber-200
                          `

                          : `
                            bg-white
                            border-gray-100
                          `
                      }
                    `}

                  >


                    <span
                      className="
                        max-w-[112px]
                        text-sm
                        font-black
                        text-gray-700
                        leading-tight
                        break-words
                        text-center
                      "
                    >

                      {
                        foodNames.join(" · ")

                        || value
                      }

                    </span>


                    <span
                      className="mt-1 text-[10px] font-bold leading-none text-gray-400"
                    >

                      {value}

                    </span>





                    <div
                      className="
                        mt-1
                        flex
                        items-center
                        gap-1
                      "
                    >


                      {

                        COLLECTION_TYPES.map(

                          type => {


                            const path =

                              slots[
                                type.key
                              ];



                            const filled =

                              Array.isArray(
                                path
                              )

                              &&

                              path.length > 0;



                            return (

                              <span

                                key={
                                  type.key
                                }

                                className={`
                                  w-3
                                  h-3
                                  rounded-full
                                  border
                                  flex
                                  items-center
                                  justify-center
                                  text-[6px]
                                  font-black

                                  ${
                                    filled

                                      ? `
                                        bg-gray-700
                                        border-gray-700
                                        text-white
                                      `

                                      : `
                                        bg-white
                                        border-gray-200
                                        text-gray-300
                                      `
                                  }
                                `}

                              >

                                {
                                  type.label[
                                    0
                                  ]
                                }

                              </span>

                            );

                          }

                        )

                      }


                    </div>





                    {

                      isComplete &&

                      <span
                        className="
                          absolute
                          top-1
                          right-1.5
                          text-[8px]
                          text-amber-400
                        "
                      >

                        ★

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





      {/* ======================================================
          收藏详情
      ====================================================== */}

      {

        selectedValue !==
        null

        &&

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


            {/* ==================================================
                标题
            ================================================== */}

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
                  flex-col
                  items-start
                  gap-2
                "
              >


                <span
                  className="text-[10px] font-bold text-gray-400"
                >

                  已获得的料理包详情

                </span>


                <div className="flex items-end gap-2">


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

                  {
                    getSlotCount(
                      selectedValue
                    )
                  }

                  {" / 3"}

                </span>


                </div>


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





            {/* ==================================================
                三槽
            ================================================== */}

            <div
              className="
                grid
                grid-cols-3
                gap-2
              "
            >


              {

                COLLECTION_TYPES.map(

                  type => {


                    const path =

                      selectedSlots[
                        type.key
                      ];



                    const filled =

                      Array.isArray(
                        path
                      )

                      &&

                      path.length >
                      0;



                    const active =

                      selectedFoodType

                      ===

                      type.key;



                    const isLatestSlot =

                      latestCollection?.value

                      ===

                      selectedValue

                      &&

                      latestCollection?.foodType

                      ===

                      type.key;



                    const finalState =

                      filled

                        ? path[0]

                        : null;



                    const stateName =

                      getItemFoodName(
                        finalState,
                        type.key
                      );



                    const parentInfo =

                      selectedParentSlots[
                        type.key
                      ]

                      ??

                      null;



                    const slotOrigin =

                      collectionOrigins?.[
                        selectedValue
                      ]?.[
                        type.key
                      ]

                      ?? null;



                    const slotParentFoods =

                      getParentFoodRecords(
                        parentInfo,
                        slotOrigin
                      );



                    return (

                      <button

                        key={
                          type.key
                        }

                        type="button"

                        disabled={
                          !filled
                        }

                        onClick={
                          () =>
                            selectFoodType(
                              type.key
                            )
                        }

                        className={`
                          relative
                          min-h-[82px]
                          px-2
                          py-3
                          rounded-2xl
                          border
                          flex
                          flex-col
                          items-center
                          justify-center
                          transition

                          ${
                            filled

                              ?

                                active

                                  ? `
                                    bg-gray-100
                                    border-gray-300
                                    cursor-pointer
                                  `

                                  : `
                                    bg-gray-50
                                    border-gray-100
                                    cursor-pointer
                                  `

                              : `
                                bg-white
                                border-dashed
                                border-gray-200
                                cursor-default
                              `
                          }
                        `}

                      >


                        <span
                          className={`
                            text-xs
                            font-bold

                            ${
                              filled

                                ? `
                                  text-gray-500
                                `

                                : `
                                  text-gray-300
                                `
                            }
                          `}
                        >

                          {
                            filled
                              ? type.label
                              : `${type.label}料理`
                          }

                        </span>



                        <span
                          className={`
                            mt-1
                            max-w-full
                            text-sm
                            font-black
                            leading-tight
                            break-words
                            text-center

                            ${
                              filled

                                ? `
                                  text-gray-700
                                `

                                : `
                                  text-gray-200
                                `
                            }
                          `}
                        >

                          {
                            filled

                              ? stateName

                              : "—"
                          }

                        </span>



                        {

                          filled
                          &&
                          stateName
                          &&

                          <span
                            className="
                              mt-1
                              text-[10px]
                              font-bold
                              leading-none
                              text-gray-400
                            "
                          >

                            {selectedValue}

                          </span>

                        }



                        {

                          filled
                          &&
                          slotParentFoods.length >= 2
                          &&

                          <span
                            className="
                              mt-1
                              text-[9px]
                              font-bold
                              leading-none
                              text-gray-300
                            "
                          >

                            {
                              slotParentFoods
                                .slice(0, 2)
                                .map(parent =>
                                  getItemFoodName(parent)
                                  ?? parent.value
                                )
                                .join(" + ")
                            }

                          </span>

                        }



                        {

                          isLatestSlot &&

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





            {/* ==================================================
                三槽完成
            ================================================== */}

            {

              getSlotCount(
                selectedValue
              )

              ===

              3

              &&

              <div
                className="
                  mt-4
                  h-9
                  rounded-xl
                  bg-amber-50
                  border
                  border-amber-100
                  flex
                  items-center
                  justify-center
                  text-[10px]
                  font-bold
                  text-amber-600
                "
              >

                ★ 三系料理包已获得

              </div>

            }





            {/* ==================================================
                当前槽详情
            ================================================== */}

            {

              selectedPath.length >
              0

              &&

              <div
                className="
                  mt-5
                  pt-5
                  border-t
                  border-gray-100
                "
              >


                {/* ==============================================
                    首次父母
                ============================================== */}

                <div
                  className="
                    mb-5
                  "
                >


                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                    "
                  >


                    <span
                      className="
                        text-[10px]
                        font-bold
                        text-gray-400
                      "
                    >

                      合成来源

                    </span>



                    <span
                      className="
                        text-[9px]
                        font-bold
                        text-gray-300
                      "
                    >

                      {
                        COLLECTION_TYPES.find(

                          type =>
                            type.key ===
                            selectedFoodType

                        )?.label

                        ??

                        ""
                      }

                    </span>


                  </div>





                  {

                    selectedParentFoods.length >= 2

                    ?

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >


                      {

                        selectedParentFoods.slice(0, 2).map(

                          (
                            parent,
                            index
                          ) => {


                            const parentFoodName =

                              getItemFoodName(
                                parent
                              );



                            return (

                              <div

                                key={
                                  `${parent.value}-${index}`
                                }

                                className="
                                  flex
                                  items-center
                                "

                              >


                                <div
                                  className="
                                    min-w-20
                                    min-h-14
                                    px-2
                                    rounded-xl
                                    bg-gray-50
                                    border
                                    border-gray-100
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                  "
                                >


                                  <span
                                    className="
                                      max-w-[84px]
                                      text-sm
                                      font-black
                                      text-gray-700
                                      leading-tight
                                      break-words
                                      text-center
                                    "
                                  >

                                    {
                                      parentFoodName
                                      ?? parent.value
                                    }

                                  </span>



                                  {

                                    parent.value != null &&

                                    <span
                                      className="
                                        mt-1
                                        text-[10px]
                                        font-bold
                                        text-gray-400
                                      "
                                    >

                                      {parent.value}

                                    </span>

                                  }


                                </div>



                                {

                                  index === 0

                                  &&

                                  <span
                                    className="
                                      mx-2
                                      text-xs
                                      font-bold
                                      text-gray-300
                                    "
                                  >

                                    +

                                  </span>

                                }


                              </div>

                            );

                          }

                        )

                      }


                    </div>

                    :

                    Array.isArray(
                      selectedParents?.parents
                    )

                    &&

                    selectedParents.parents.length >
                    0

                    ?

                    <div
                      className="
                        text-sm
                        font-black
                        text-gray-600
                      "
                    >

                      {
                        selectedParents.parents.join(
                          " + "
                        )
                      }

                    </div>

                    :

                    <div
                      className="
                        text-[10px]
                        font-bold
                        text-gray-300
                      "
                    >

                      单路径

                    </div>

                  }


                </div>





                {/* ==============================================
                    首次获得路径
                ============================================== */}

                <div
                  className="
                    pt-5
                    border-t
                    border-gray-100
                  "
                >


                  <div
                    className="
                      mb-3
                      flex
                      items-center
                      justify-between
                    "
                  >


                    <span
                      className="
                        text-[10px]
                        font-bold
                        text-gray-400
                      "
                    >

                      首次获得路径

                    </span>



                    <span
                      className="
                        text-[9px]
                        font-bold
                        text-gray-300
                      "
                    >

                      {
                        COLLECTION_TYPES.find(

                          type =>
                            type.key ===
                            selectedFoodType

                        )?.label

                        ??

                        ""
                      }

                    </span>


                  </div>



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



                          const foodName =

                            getItemFoodName(
                              item,
                              selectedFoodType
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
                                  min-w-20
                                  min-h-12
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
                                    max-w-[92px]
                                    text-sm
                                    font-black
                                    leading-tight
                                    break-words
                                    text-center
                                  "
                                >

                                  {
                                    foodName
                                    ?? item.value
                                  }

                                </span>



                                {

                                  item.value != null

                                  &&

                                  <span
                                    className="
                                      mt-1
                                      text-[10px]
                                      font-bold
                                      leading-none
                                      text-gray-400
                                    "
                                  >

                                    {item.value}

                                  </span>

                                }


                              </div>





                              {

                                index

                                <

                                selectedPath.length -
                                1

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
                                      item.fromType

                                      ===

                                      "combine"

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


              </div>

            }


          </div>


        </div>

      }


    </div>

  );

}
