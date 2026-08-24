import {
  useState
} from "react";

import "./StartScreen.css";

import {
  createRandomInitialValues
} from "../game/initialValues";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getSeasoningName
} from "../data/food/seasoningData";



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



const FOOD_GROUPS = {

  meat: {

    label:
      "荤",

    getName:
      getMeatName

  },

  vegetable: {

    label:
      "素",

    getName:
      getVegetableName

  },

  seasoning: {

    label:
      "调料",

    getName:
      getSeasoningName

  }

};



export default function StartScreen({

  onStart,

  onOpenTest

}) {


  // =========================
  // 自选开局
  //
  // 第1个 → 荤
  // 第2个 → 素
  // 第3个 → 调料
  // =========================

  const [

    selected,

    setSelected

  ] = useState({

    meat:
      null,

    vegetable:
      null,

    seasoning:
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
  //
  // 保留原来的规则：
  // 开局三个数字互不相同
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


    if (
      isValueUsed(
        value,
        group
      )
    ) {

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

    selected.meat !== null &&

    selected.vegetable !== null &&

    selected.seasoning !== null;



  // =========================
  // 自选开始
  // =========================

  function customStart() {


    if (
      !canCustomStart
    ) {

      return;

    }


    onStart([

      selected.meat,

      selected.vegetable,

      selected.seasoning

    ]);

  }



  // =========================
  // 当前展开组
  // =========================

  const activeConfig =

    activeGroup
      ? FOOD_GROUPS[
          activeGroup
        ]
      : null;



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
            自选开局
            ========================= */}

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



          {/* =========================
              三个类型槽
              ========================= */}

          <div
            className="
              start-picker-groups
            "
          >


            {Object.entries(
              FOOD_GROUPS
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

                        {
                          config.label
                        }

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
                                  config.getName(
                                    value
                                  )
                                }

                              </span>


                              <span
                                className="
                                  start-picker-number
                                "
                              >

                                {
                                  value
                                }

                              </span>


                            </>

                          )
                      }


                    </button>

                  );

                }
              )}


          </div>



          {/* =========================
              2～9 选择面板
              ========================= */}

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

                            {
                              value
                            }

                          </span>


                          <span
                            className="
                              start-value-name
                            "
                          >

                            {
                              activeConfig.getName(
                                value
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



          {/* =========================
              自选开始
              ========================= */}

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



        {/* =========================
            随机入口
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



        {/* =========================
            测试实验室入口
            ========================= */}

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