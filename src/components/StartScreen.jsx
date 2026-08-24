import "./StartScreen.css";


export default function StartScreen({

  onStart

}) {


  // =========================
  // 快速开始
  //
  // 随机生成 3 个不同的 2～9
  //
  // gameEngine 会自动解释为：
  //
  // 第1个 → 荤
  // 第2个 → 素
  // 第3个 → 调料
  // =========================

  function quickStart() {


    const pool = [

      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9

    ];


    const shuffled = [

      ...pool

    ];


    for (
      let i = shuffled.length - 1;
      i > 0;
      i--
    ) {


      const j =

        Math.floor(

          Math.random() *
          (i + 1)

        );


      [

        shuffled[i],

        shuffled[j]

      ] = [

        shuffled[j],

        shuffled[i]

      ];

    }


    onStart(

      shuffled.slice(
        0,
        3
      )

    );

  }



  return (

    <div
      className="
        start-screen
      "
    >


      {/* =========================
          背景装饰
          ========================= */}

      <div
        className="
          start-background
        "
        aria-hidden="true"
      >


        <div
          className="
            start-glow
          "
        />


        <div
          className="
            start-orbit
            start-orbit--one
          "
        />


        <div
          className="
            start-orbit
            start-orbit--two
          "
        />


        <div
          className="
            start-orbit
            start-orbit--three
          "
        />


        <div
          className="
            start-path
            start-path--left
          "
        />


        <div
          className="
            start-path
            start-path--right
          "
        />


        <span
          className="
            start-background-dot
            start-background-dot--one
          "
        />


        <span
          className="
            start-background-dot
            start-background-dot--two
          "
        />


        <span
          className="
            start-background-dot
            start-background-dot--three
          "
        />


        <span
          className="
            start-background-dot
            start-background-dot--four
          "
        />


      </div>



      {/* =========================
          主内容
          ========================= */}

      <main
        className="
          start-content
        "
      >


        {/* =========================
            Logo
            ========================= */}

        <div
          className="
            start-logo-area
          "
        >


          <div
            className="
              start-logo-outer
            "
          >


            <div
              className="
                start-logo
              "
            >

              ✦

            </div>


          </div>


          <div
            className="
              start-logo-caption
            "
          >

            PRIME SYSTEM

          </div>


        </div>



        {/* =========================
            标题
            ========================= */}

        <div
          className="
            start-title-area
          "
        >


          <h1
            className="
              start-title
            "
          >

            料理迷宫

          </h1>


          <div
            className="
              start-title-en
            "
          >

            CULINARY LABYRINTH

          </div>


        </div>



        {/* =========================
            简介
            ========================= */}

        <p
          className="
            start-description
          "
        >

          从简单的选择开始

          <br />

          走进不断变化的料理迷宫

        </p>



        {/* =========================
            中央装饰
            ========================= */}

        <div
          className="
            start-divider
          "
          aria-hidden="true"
        >


          <span
            className="
              start-divider-line
            "
          />


          <span
            className="
              start-divider-symbol
            "
          >

            ✦

          </span>


          <span
            className="
              start-divider-line
            "
          />


        </div>



        {/* =========================
            唯一入口
            ========================= */}

        <button

          type="button"

          className="
            start-button
          "

          onClick={
            quickStart
          }

        >


          <span
            className="
              start-button-space
            "
          />


          <span
            className="
              start-button-label
            "
          >

            开始探索

          </span>


          <span
            className="
              start-button-arrow
            "
          >

            →

          </span>


        </button>



        {/* =========================
            Footer
            ========================= */}

        <div
          className="
            start-footer
          "
        >

          EVERY PATH IS UNIQUE

        </div>


      </main>


    </div>

  );

}