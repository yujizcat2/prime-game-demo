import "./ActionButtons.css";


export default function ActionButtons({

  selected = [],

  preview,

  onCombine,

  onBlockedCombine,

  onReduce,

  onCompound,

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

  const canCompound =
    !gameOver &&
    !busy &&
    selected.length === 2 &&
    !!preview?.compound;

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

          搭配

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

          处理

        </span>


      </button>

      <button
        type="button"
        onClick={canCompound ? onCompound : undefined}
        disabled={!canCompound}
        className={`action-toolbar-button ${canCompound
          ? "action-toolbar-button--compound-active"
          : "action-toolbar-button--disabled"}`}
      >
        <span className="action-toolbar-icon">◇</span>
        <span className="action-toolbar-label">复合</span>
      </button>


    </div>

  );

}
