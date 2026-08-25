import {
  useState
} from "react";

import "./StartScreen.css";

import {
  createRandomInitialValues
} from "../game/initialValues";

import {
  getAnimalName,
  getAnimalTypeIcon,
  getAnimalTypeName
} from "../data/animal/animalRegistry";



const START_VALUES = [
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9
];



const ANIMAL_GROUPS = {

  dog: {

    label:
      getAnimalTypeName(
        "dog"
      ),

    icon:
      getAnimalTypeIcon(
        "dog"
      )

  },

  cat: {

    label:
      getAnimalTypeName(
        "cat"
      ),

    icon:
      getAnimalTypeIcon(
        "cat"
      )

  },

  mammal: {

    label:
      getAnimalTypeName(
        "mammal"
      ),

    icon:
      getAnimalTypeIcon(
        "mammal"
      )

  }

};



export default function StartScreen({

  onStart,

  onOpenTest

}) {


  // =========================
  // 自选开局
  //
  // 第1个 → 狗系
  // 第2个 → 猫系
  // 第3个 → 哺乳系
  // =========================

  const [

    selected,

    setSelected

  ] = useState({

    dog:
      null,

    cat:
      null,

    mammal:
      null

  });



  // =========================
  // 当前展开哪一类
  // =========================

  const [

    activeGroup,

    setActiveGroup

  ] = useState(null);



  // =========================
  // 随机开始
  // =========================

  function quickStart() {


    onStart(

      createRandomInitialValues()

    );

  }



  // =========================
  // 打开 / 关闭某一类选择
  // =========================

  function toggleGroup(
    group
  ) {


    setActiveGroup(

      current =>

        current === group
          ? null
          : group

    );

  }



  // =========================
  // 判断数字是否已经被其他类型使用
  // =========================

  function isValueUsed(

    value,

    currentGroup

  ) {


    return Object.entries(
      selected
    )
      .some(
        ([
          group,
          selectedValue
        ]) => {

          return (
            group !== currentGroup &&
            selectedValue === value
          );

        }
      );

  }



  // =========================
  // 选择数字
  // =========================

  function chooseValue(

    group,

    value

  ) {


    if(
      isValueUsed(
        value,
        group
      )
    ){

      return;

    }


    setSelected(

      current => ({

        ...current,

        [group]:
          value

      })

    );


    setActiveGroup(
      null
    );

  }



  // =========================
  // 是否完成三项选择
  // =========================

  const canCustomStart =

    selected.dog !== null &&

    selected.cat !== null &&

    selected.mammal !== null;



  // =========================
  // 自选开始
  //
  // createGameState 会按：
  //
  // 第0个 → dog
  // 第1个 → cat
  // 第2个 → mammal
  //
  // 自动赋予 animalType。
  // =========================

  function customStart() {


    if(
      !canCustomStart
    ){

      return;

    }


    onStart([

      selected.dog,

      selected.cat,

      selected.mammal

    ]);

  }



  // =========================
  // 当前展开组
  // =========================

  const activeConfig =

    activeGroup
      ? ANIMAL_GROUPS[
          activeGroup
        ]
      : null;



  return (

    <div
      className="
        start-screen
      "
    >


      <div
        className="
          start-background
        "
        aria-hidden="true"
      >


        <div className="start-glow" />

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



      <main
        className="
          start-content
        "
      >


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
            动物迷宫
          </h1>


          <div
            className="
              start-title-en
            "
          >
            ANIMAL LABYRINTH
          </div>


        </div>



        <p
          className="
            start-description
          "
        >

          从简单的选择开始

          <br />

          走进不断变化的动物迷宫

        </p>



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



        <section
          className="
            start-picker
          "
        >


          <div
            className="
              start-picker-title
            "
          >
            自选开局
          </div>



          <div
            className="
              start-picker-groups
            "
          >


            {Object.entries(
              ANIMAL_GROUPS
            )
              .map(
                ([
                  group,
                  config
                ]) => {


                  const value =
                    selected[
                      group
                    ];


                  const isActive =
                    activeGroup === group;


                  return (

                    <button

                      key={
                        group
                      }

                      type="button"

                      className={[
                        "start-picker-group",
                        value !== null
                          ? "is-selected"
                          : "",
                        isActive
                          ? "is-active"
                          : ""
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}

                      onClick={
                        () =>
                          toggleGroup(
                            group
                          )
                      }

                    >


                      <span
                        className="
                          start-picker-type
                        "
                      >

                        {config.icon}

                        {" "}

                        {config.label}

                      </span>


                      {
                        value === null
                          ? (

                            <span
                              className="
                                start-picker-empty
                              "
                            >
                              请选择
                            </span>

                          )
                          : (

                            <>


                              <span
                                className="
                                  start-picker-name
                                "
                              >

                                {
                                  getAnimalName(
                                    value,
                                    group
                                  )
                                }

                              </span>


                              <span
                                className="
                                  start-picker-number
                                "
                              >
                                {value}
                              </span>


                            </>

                          )
                      }


                    </button>

                  );

                }
              )}


          </div>



          {
            activeConfig && (

              <div
                className="
                  start-value-panel
                "
              >


                <div
                  className="
                    start-value-panel-header
                  "
                >

                  选择{
                    activeConfig.label
                  }

                </div>


                <div
                  className="
                    start-value-grid
                  "
                >


                  {START_VALUES.map(
                    value => {


                      const disabled =
                        isValueUsed(
                          value,
                          activeGroup
                        );


                      const current =
                        selected[
                          activeGroup
                        ] === value;


                      return (

                        <button

                          key={
                            value
                          }

                          type="button"

                          disabled={
                            disabled
                          }

                          className={[
                            "start-value-option",
                            current
                              ? "is-current"
                              : ""
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )}

                          onClick={
                            () =>
                              chooseValue(
                                activeGroup,
                                value
                              )
                          }

                        >


                          <span
                            className="
                              start-value-number
                            "
                          >
                            {value}
                          </span>


                          <span
                            className="
                              start-value-name
                            "
                          >

                            {
                              getAnimalName(
                                value,
                                activeGroup
                              )
                            }

                          </span>


                        </button>

                      );

                    }
                  )}


                </div>


              </div>

            )
          }



          <button

            type="button"

            className="
              start-custom-button
            "

            disabled={
              !canCustomStart
            }

            onClick={
              customStart
            }

          >

            <span>
              使用自选开局
            </span>

            <span
              className="
                start-custom-button-arrow
              "
            >
              →
            </span>

          </button>


        </section>



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
            随机探索
          </span>


          <span
            className="
              start-button-arrow
            "
          >
            →
          </span>


        </button>



        <button

          type="button"

          className="
            start-test-button
          "

          onClick={
            onOpenTest
          }

        >
          TEST LAB
        </button>



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