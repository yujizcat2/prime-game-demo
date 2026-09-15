import "./ActionButtons.css";
export default function ActionButtons({

  selected = [],

  preview,

  onCombine,


  onSellOrProcess,
  canSellSelected = false,

  itemEntry = null,

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



  const canProcess =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;
  const canSell = !gameOver && !busy && selected.length === 1 && canSellSelected;

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

        onClick={canCombine ? onCombine : undefined}

        disabled={
          !canCombine
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

          {canCombine ? `合成 · ${preview.combine.durationMinutes}分钟` : "合成"}

        </span>


      </button>

      {itemEntry}

      <button
        type="button"
        onClick={canSell || canProcess ? onSellOrProcess : undefined}
        disabled={!canSell && !canProcess}
        className={`action-toolbar-button ${canSell || canProcess ? "action-toolbar-button--reduce-active" : "action-toolbar-button--disabled"}`}
      >
        <span className="action-toolbar-icon">↓</span>
        <span className="action-toolbar-label">售出 / 处理</span>
      </button>

    </div>

  );

}
