import "./ActionButtons.css";
import { BASE_FOOD_TYPES } from "../game/rules";
import { FOOD_TYPE_LABELS } from "../data/specialOneRegistry";


export default function ActionButtons({

  selected = [],

  preview,

  onCombine,

  onReduce,

  gameOver,

  removingId = null,

  allowedFoodTypes = BASE_FOOD_TYPES,

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



  return (

    <div
      className="
        action-toolbar
      "
    >


      {/* ======================================================
          组合
      ====================================================== */}

      <button

        type="button"

        onClick={
          canCombine && !preview?.combine?.requiresTypeChoice
            ? onCombine
            : undefined
        }

        disabled={
          !canCombine || preview?.combine?.requiresTypeChoice
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

          组合

        </span>


      </button>

      {canCombine && preview?.combine?.requiresTypeChoice && <div className="action-toolbar-type-grid">
        {allowedFoodTypes.map(foodType=><button type="button" className="action-toolbar-type-choice" key={foodType} onClick={()=>onCombine(foodType)}>{FOOD_TYPE_LABELS[foodType]}</button>)}
      </div>}



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


    </div>

  );

}
