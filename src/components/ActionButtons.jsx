import "./ActionButtons.css";


export default function ActionButtons({

  selected = [],

  preview,

  onCombine,

  onBlockedCombine,

  onReduce,

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

          {canReduce ? `处理 · ${preview.reduce.durationMinutes}分钟` : "处理"}

        </span>


      </button>

    </div>

  );

}
