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

  gameOver,

  removingId = null,

}) {


  const busy =

    removingId !== null;



  const canCombine =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.combine;



  const canReduce =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;

  const canTryBlockedCombine =
    !gameOver &&
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

      <button
        type="button"
        onClick={canSwap ? onSwap : undefined}
        disabled={!canSwap}
        className={`action-toolbar-button ${canSwap?"action-toolbar-button--swap-active":"action-toolbar-button--disabled"}`}
      >
        <span className="action-toolbar-icon">⇄</span>
        <span className="action-toolbar-label">{canSwap?"交换 · 15分钟":"交换"}</span>
      </button>

      <button type="button" onClick={onFridge} className="action-toolbar-button action-toolbar-button--fridge">
        <span className="action-toolbar-icon">▣</span>
        <span className="action-toolbar-label">冰箱<small>{fridgeActionCount > 0 ? `可存 ${fridgeActionCount}` : `${fridgeCount}/3`}</small></span>
      </button>

      <button
        type="button"
        onClick={canReduce ? onReduce : undefined}
        disabled={!canReduce}
        className={`action-toolbar-button ${canReduce ? "action-toolbar-button--reduce-active" : "action-toolbar-button--disabled"}`}
      >
        <span className="action-toolbar-icon">↓</span>
        <span className="action-toolbar-label">
          {canReduce ? `${reduceLabel} · ${preview.reduce.durationMinutes}分钟` : reduceLabel}
        </span>
      </button>

    </div>

  );

}
