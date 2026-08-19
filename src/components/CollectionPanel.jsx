export default function CollectionPanel({

  collection

}) {


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

              value => (

                <div

                  key={value}

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

                </div>

              )

            )

          }

        </div>

      }


    </div>

  );

}