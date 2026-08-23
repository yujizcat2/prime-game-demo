import "./ActionButtons.css";


export default function ActionButtons({

  selected = [],

  preview,

  onReduce,

  gameOver,

  removingId = null,

}) {


  const busy =
    removingId !== null;



  const canReduce =

    !gameOver &&

    !busy &&

    selected.length === 2 &&

    !!preview?.reduce;



  return (

    <div
      className="
        action-toolbar
      "
    >


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


    </div>

  );

}