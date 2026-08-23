import {
  GAME_CONFIG
} from "../game/config";

import "./ActionButtons.css";


export default function ActionButtons({

  numbers,

  selected,

  preview,

  onCombine,

  onReduce,

  onRemoveOne,

  gameOver,

  removingId = null,

}) {


  const busy =
    removingId !== null;



  const canCombine =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.combine &&

    numbers.length <
      GAME_CONFIG.MAX_NUMBERS;



  const canReduce =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;



  const selectedNumber =

    selected.length === 1

      ?

      numbers.find(

        item =>
          item.id === selected[0]

      )

      :

      null;



  const canRemoveOne =

    !gameOver &&

    !busy &&

    selected.length === 1 &&

    selectedNumber?.value === 1;



  return (

    <div
      className="
        action-controls
      "
    >


      <div
        className="
          action-controls-list
        "
      >



        {/* =========================
            搭配
            ========================= */}

        <button

          type="button"

          onClick={
            canCombine
              ? onCombine
              : undefined
          }

          disabled={
            !canCombine
          }

          className={`
            action-node
            action-node-combine

            ${
              canCombine
                ? "is-active"
                : "is-disabled"
            }
          `}

        >


          <span
            className="
              action-node-core
            "
          >

            <span
              className="
                action-node-icon
              "
            >

              ＋

            </span>

          </span>


          <span
            className="
              action-node-label
            "
          >

            搭配

          </span>


        </button>





        {/* =========================
            处理
            ========================= */}

        <button

          type="button"

          onClick={
            canReduce
              ? onReduce
              : undefined
          }

          disabled={
            !canReduce
          }

          className={`
            action-node
            action-node-reduce

            ${
              canReduce
                ? "is-active"
                : "is-disabled"
            }
          `}

        >


          <span
            className="
              action-node-core
            "
          >

            <span
              className="
                action-node-icon
              "
            >

              ↓

            </span>

          </span>


          <span
            className="
              action-node-label
            "
          >

            处理

          </span>


        </button>





        {/* =========================
            获取调料
            ========================= */}

        <button

          type="button"

          onClick={

            canRemoveOne

              ?

              () =>
                onRemoveOne(
                  selected[0]
                )

              :

              undefined

          }

          disabled={
            !canRemoveOne
          }

          className={`
            action-node
            action-node-seasoning

            ${
              canRemoveOne
                ? "is-active"
                : "is-disabled"
            }
          `}

        >


          <span
            className="
              action-node-core
            "
          >

            <span
              className="
                action-node-icon
                action-node-icon-small
              "
            >

              ◇

            </span>

          </span>


          <span
            className="
              action-node-label
              action-node-label-small
            "
          >

            获取调料

          </span>


        </button>


      </div>





      {/* =========================
          满格提示
          ========================= */}

      {

        numbers.length >=
        GAME_CONFIG.MAX_NUMBERS && (

          <div
            className="
              action-capacity-warning
            "
          >

            操作台已满
            <br />
            先处理食材

          </div>

        )

      }


    </div>

  );

}