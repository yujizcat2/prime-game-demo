import {
  useState
} from "react";

import {
  getAnimalTypeShortName
} from "../data/animal/animalRegistry";





export default function CollectionPanel({

  collection,

  collectionPaths = {},

  latestCollection = null

}) {


  const [
    selectedValue,
    setSelectedValue
  ] = useState(
    null
  );



  const [
    selectedPathIndex,
    setSelectedPathIndex
  ] = useState(
    null
  );



  const paths =

    selectedValue !== null

      ? collectionPaths[
          selectedValue
        ] ?? []

      : [];



  const selectedPath =

    selectedPathIndex !== null

      ? paths[
          selectedPathIndex
        ] ?? []

      : [];





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





  function closeModal(){


    setSelectedValue(
      null
    );


    setSelectedPathIndex(
      null
    );

  }





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
  // 动物状态名称
  //
  // dog / cat / mammal：
  //
  // pure  → 纯狗 / 纯猫 / 纯哺乳
  // mixed → 半纯狗 / 半纯猫 / 半纯哺乳
  //
  // bird：
  //
  // 鸟系当前不参与 purity。
  // ==========================================================

  function getAnimalStateName(
    item
  ){


    if(
      !item?.animalType
    ){

      return null;

    }



    if(
      item.animalType === "bird"
    ){

      return "鸟系";

    }



    const animalTypeName =

      getAnimalTypeShortName(
        item.animalType
      );



    if(
      !animalTypeName
    ){

      return null;

    }



    if(
      item.purity === "pure"
    ){

      return `纯${animalTypeName}`;

    }



    if(
      item.purity === "mixed"
    ){

      return `半纯${animalTypeName}`;

    }



    return animalTypeName;

  }





  return (

    <div
      className="
        mt-7
        px-1
      "
    >


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



                    const finalState =

                      Array.isArray(
                        path
                      )

                        ? path[0]

                        : null;



                    const finalStateName =

                      getAnimalStateName(
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

                          getAnimalStateName(
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