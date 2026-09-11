import "./ActionButtons.css";
import { getReduceButtonLabel } from "./actionButtonLabel";

export default function ActionButtons({

  selected = [],

  preview,

  onCombine,

  onBlockedCombine,

  onReduce,

  onSwap,
  canSwap = false,

  onFridge,
  fridgeCount = 0,
  fridgeActionCount = 0,

  sellMode = false,
  sellCount = 0,
  sellMinutes = 0,
  canStartSell = false,
  onSell,

  gameOver,

  removingId = null,

}) {


  const busy =

    removingId !== null;



  const canCombine =

    !gameOver &&

    !sellMode &&

    !busy &&

    selected.length === 2 &&

    !!preview?.combine;



  const canReduce =

    !gameOver &&

    !sellMode &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;

  const canTryBlockedCombine =
    !gameOver &&
    !sellMode &&
    !busy &&
    selected.length === 2 &&
    !canCombine &&
    typeof onBlockedCombine === "function";
  const reduceLabel = getReduceButtonLabel(selected, preview);



  return (

    <div
      className="
        action-toolbar
      "
    >


      {/* ======================================================
          搭配
      ====================================================== */}

      <button

        type="button"

        onClick={
          canCombine
            ? onCombine
            : canTryBlockedCombine
              ? onBlockedCombine
              : undefined
        }

        disabled={
          !canCombine && !canTryBlockedCombine
        }

        className={`
          action-toolbar-button

          ${
            canCombine

              ?

              "action-toolbar-button--combine-active"

              :

              "action-toolbar-button--disabled"
          }
        `}

      >


        <span
          className="
            action-toolbar-icon
          "
        >

          +

        </span>


        <span
          className="
            action-toolbar-label
          "
        >

          {canCombine ? `搭配 · ${preview.combine.durationMinutes}分钟` : "搭配"}

        </span>


      </button>


      {/* ======================================================
          处理
      ====================================================== */}

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
          action-toolbar-button

          ${
            canReduce

              ?

              "action-toolbar-button--reduce-active"

              :

              "action-toolbar-button--disabled"
          }
        `}

      >


        <span
          className="
            action-toolbar-icon
          "
        >

          ↓

        </span>


        <span
          className="
            action-toolbar-label
          "
        >

          {canReduce ? `${reduceLabel} · ${preview.reduce.durationMinutes}分钟` : reduceLabel}

        </span>


      </button>

      <button
        type="button"
        onClick={!sellMode&&canSwap ? onSwap : undefined}
        disabled={sellMode||!canSwap}
        className={`action-toolbar-button ${!sellMode&&canSwap?"action-toolbar-button--swap-active":"action-toolbar-button--disabled"}`}
      >
        <span className="action-toolbar-icon">⇄</span>
        <span className="action-toolbar-label">{canSwap?"交换 · 15分钟":"交换"}</span>
      </button>

      <button type="button" onClick={!sellMode?onFridge:undefined} disabled={sellMode} className={`action-toolbar-button action-toolbar-button--fridge ${sellMode?"action-toolbar-button--disabled":""}`}>
        <span className="action-toolbar-icon">▣</span>
        <span className="action-toolbar-label">冰箱<small>{fridgeActionCount > 0 ? `可存 ${fridgeActionCount}` : `${fridgeCount}/3`}</small></span>
      </button>


      <button
        type="button"
        onClick={canStartSell || sellCount > 0 ? onSell : undefined}
        disabled={!canStartSell && sellCount === 0}
        className={`action-toolbar-button ${sellMode ? "action-toolbar-button--reduce-active" : (!canStartSell ? "action-toolbar-button--disabled" : "")}`}
      >
        <span className="action-toolbar-icon">¥</span>
        <span className="action-toolbar-label">{sellCount > 0 ? `卖出 · ${sellMinutes}分钟` : "卖出"}</span>
      </button>

    </div>

  );

}
