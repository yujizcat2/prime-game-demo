import {
  useState
} from "react";

import "./StartScreen.css";


export default function StartScreen({

  onStart,

  onOpenTest

}) {


  const [

    selected,

    setSelected

  ] = useState([]);



  function toggle(num) {


    if (
      selected.includes(num)
    ) {

      setSelected(

        selected.filter(

          n =>
            n !== num

        )

      );

      return;

    }



    if (
      selected.length >= 4
    ) {

      return;

    }



    setSelected([

      ...selected,

      num

    ]);

  }



  return (

    <div
      className="
        start-screen
      "
    >


      <div
        className="
          start-card
        "
      >


        <div
          className="
            start-logo
          "
        >

          ✦

        </div>



        <h1
          className="
            title
          "
        >

          PRIME GAME

        </h1>



        <p
          className="
            subtitle
          "
        >

          从数字中选择一条属于你的路径

        </p>



        <div
          className="
            select-counter
          "
        >

          选择 4 个起始数字

          <span>

            {selected.length} / 4

          </span>

        </div>



        <div
          className="
            number-grid
          "
        >

          {

            [
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9
            ].map(

              num => (

                <button

                  key={num}

                  onClick={() =>
                    toggle(num)
                  }

                  className={

                    selected.includes(num)

                      ? "number-btn active"

                      : "number-btn"

                  }

                >

                  {num}

                </button>

              )

            )

          }

        </div>



        <button

          className="
            start-btn
          "

          disabled={
            selected.length !== 4
          }

          onClick={() =>
            onStart(selected)
          }

        >

          开始探索

        </button>



        <button

          type="button"

          onClick={
            onOpenTest
          }

          className="
            lab-button
          "

        >

          测试实验室

        </button>


      </div>


    </div>

  );

}