import {
  isPrime
} from "../game/prime";

import {
  getAnimalTypeShortName,
  getAnimalName
} from "../data/animal/animalRegistry";

import "./Board.css";





export default function BoardCell({

  index,

  piece,

  selected = false,

  reduceCandidate = false,

  reducePreview = null,

  mutationPreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

  onClick,

}) {


  // ==========================================================
  // 空格
  // ==========================================================

  if(
    !piece
  ){


    return (

      <div

        className="
          board-cell
          board-cell--empty
        "

        data-index={
          index
        }

      >


        <div
          className="
            board-empty-tile
          "
        >


          <div
            className="
              board-empty-dot
            "
          />


        </div>


      </div>

    );

  }





  // ==========================================================
  // 基础数据
  // ==========================================================

  const value =
    piece.value;


  const animalType =
    piece.animalType
    ?? null;


  const isDog =
    animalType === "dog";


  const isCat =
    animalType === "cat";


  const isMammal =
    animalType === "mammal";


  const isBird =
    animalType === "bird";


  const isOne =
    value === 1;


  const reducing =
    reducePreview !== null;


  const prime =
    isPrime(
      value
    );





  // ==========================================================
  // 鸟变种 Preview
  // ==========================================================

  const mutationTriggered =

    mutationPreview?.triggered ===
    true;



  const mutationRole =

    mutationPreview?.role

    ??

    null;



  const isMutationTarget =

    mutationTriggered

    &&

    mutationRole ===
    "target";



  const isMutationBird =

    mutationTriggered

    &&

    mutationRole ===
    "bird";



  const mutationFromType =

    mutationPreview?.fromType

    ??

    null;



  const mutationToType =

    mutationPreview?.toType

    ??

    null;





  // ==========================================================
  // 变种文字
  // ==========================================================

  const mutationFromName =

    mutationFromType

      ?

        getAnimalTypeShortName(
          mutationFromType
        )

      :

        null;



  const mutationToName =

    mutationToType

      ?

        getAnimalTypeShortName(
          mutationToType
        )

      :

        null;





  // ==========================================================
  // 即将变成的目标类型 class
  //
  // 例：
  //
  // 当前狗：
  // board-piece--dog
  //
  // 即将变猫：
  // board-piece--mutation-to-cat
  //
  // CSS 会强制目标颜色覆盖当前颜色。
  // ==========================================================

  const mutationTargetTypeClass =

    isMutationTarget

      ?

        mutationToType === "dog"

          ? "board-piece--mutation-to-dog"

          :

        mutationToType === "cat"

          ? "board-piece--mutation-to-cat"

          :

        mutationToType === "mammal"

          ? "board-piece--mutation-to-mammal"

          :

            ""

      :

        "";





  // ==========================================================
  // 是否为纯系
  // ==========================================================

  const isPure =

    piece.purity === "pure"

    &&

    (
      isDog ||
      isCat ||
      isMammal
    )

    &&

    !isOne;





  // ==========================================================
  // 当前动物名称
  // ==========================================================

  const animalName =

    isOne

      ? "水"

      : getAnimalName(

          value,

          animalType

        );





  // ==========================================================
  // 约分后的真实 animalType
  // ==========================================================

  const reduceResultAnimalType =

    isMutationTarget

      ?

        mutationToType

      :

        animalType;





  // ==========================================================
  // 约分后的动物名称
  // ==========================================================

  const reduceAnimalName =

    reducing &&
    reducePreview !== 1

      ?

        getAnimalName(

          reducePreview,

          reduceResultAnimalType

        )

      :

        null;





  // ==========================================================
  // 组合来源
  // ==========================================================

  const parentAnimalNames =

    Array.isArray(
      piece.parentAnimals
    )

    &&

    piece.parentAnimals.length >=
    2

      ?

        piece.parentAnimals.map(

          parent => {


            if(
              !parent
            ){


              return null;

            }



            return getAnimalName(

              parent.value,

              parent.animalType

            );

          }

        )

      :

        null;





  // ==========================================================
  // 约分来源
  // ==========================================================

  const reducePreviousRecord =

    piece.origin?.type ===
    "reduce"

      ?

        piece.origin.parent

      :

        null;



  const reducePreviousValue =

    reducePreviousRecord?.value

    ??

    null;



  const reducePreviousAnimalType =

    reducePreviousRecord?.animalType

    ??

    animalType

    ??

    null;



  const reducePreviousAnimalName =

    reducePreviousValue !==
    null

      ?

        getAnimalName(

          reducePreviousValue,

          reducePreviousAnimalType

        )

      :

        null;





  // ==========================================================
  // 水的直接来源
  // ==========================================================

  const onePreviousRecord =

    isOne &&
    piece.origin?.type ===
    "reduce"

      ?

        piece.origin.parent

      :

        null;



  const onePreviousValue =

    onePreviousRecord?.value

    ??

    null;



  const onePreviousAnimalType =

    onePreviousRecord?.animalType

    ??

    animalType

    ??

    null;



  const onePreviousAnimalName =

    onePreviousValue !==
    null

      ?

        getAnimalName(

          onePreviousValue,

          onePreviousAnimalType

        )

      :

        null;





  // ==========================================================
  // 当前真实类型 class
  // ==========================================================

  const typeClass =

    isOne

      ? "board-piece--one"

      : isDog

      ? "board-piece--dog"

      : isCat

      ? "board-piece--cat"

      : isMammal

      ? "board-piece--mammal"

      : isBird

      ? "board-piece--bird"

      : "board-piece--default";





  const showReduceCandidate =

    reduceCandidate

    &&

    !selected

    &&

    !removing

    &&

    !reducing;





  return (

    <div

      className={`
        board-cell
        board-cell--occupied

        ${
          selected
            ? "board-cell--selected"
            : ""
        }

        ${
          removing
            ? "board-cell--removing"
            : ""
        }

        ${
          isMutationTarget
            ? "board-cell--mutation-target"
            : ""
        }

        ${
          isMutationBird
            ? "board-cell--mutation-bird"
            : ""
        }
      `}

      data-index={
        index
      }

    >


      <div

        className={`
          board-piece-wrapper

          ${
            removing

              ? "board-piece-wrapper--removing"

              : "board-piece-wrapper--enter"
          }
        `}

      >



        {

          isOne &&
          scorePreview !==
          null &&

          <div

            className={`
              board-piece-score

              ${
                removing

                  ? "board-piece-score--fly"

                  : "board-piece-score--preview"
              }

              ${
                isNewDiscovery

                  ? "board-piece-score--new"

                  : ""
              }
            `}

          >

            +{scorePreview}

          </div>

        }





        {

          removing &&

          <div
            className="
              board-piece-remove-flash
            "
          />

        }





        <button

          type="button"

          disabled={
            removing
          }

          onClick={
            removing

              ? undefined

              : onClick
          }

          className={`
            board-piece

            ${typeClass}

            ${mutationTargetTypeClass}

            ${
              selected &&
              !removing

                ? "board-piece--selected"

                : ""
            }

            ${
              reducing &&
              !removing

                ? "board-piece--reducing"

                : ""
            }

            ${
              removing

                ? "board-piece--remove"

                : ""
            }

            ${
              isOne &&
              isNewDiscovery

                ? "board-piece--new-discovery"

                : ""
            }

            ${
              isMutationTarget &&
              !removing

                ? "board-piece--mutation-target"

                : ""
            }

            ${
              isMutationBird &&
              !removing

                ? "board-piece--mutation-bird"

                : ""
            }
          `}

        >


          {

            selected &&
            !removing &&

            <div
              className="
                board-piece-selected-ring
              "
            />

          }





          <div
            className="
              board-piece-type-bar
            "
          />





          {

            isPure &&

            <div

              className="
                board-piece-pure
              "

              aria-label="纯系"

            >

              ◆

            </div>

          }





          {

            isMutationTarget &&
            mutationFromName &&
            mutationToName &&
            !removing &&

            <div
              className="
                board-piece-mutation-preview
              "
            >


              <span
                className="
                  board-piece-mutation-label
                "
              >

                变种

              </span>



              <strong
                className="
                  board-piece-mutation-change
                "
              >

                {mutationFromName}

                <span>
                  →
                </span>

                {mutationToName}

              </strong>


            </div>

          }





          {

            isMutationBird &&
            !removing &&

            <div
              className="
                board-piece-bird-trigger
              "
            >

              鸟归1

            </div>

          }





          <div

            className={`
              board-piece-number

              ${
                showReduceCandidate

                  ? "board-piece-number--reduce-candidate"

                  : ""
              }
            `}

          >

            {value}

          </div>





          {

            prime &&
            !isOne &&

            <div
              className="
                board-piece-prime
              "
            />

          }





          <div
            className="
              board-piece-main
            "
          >


            <span

              className={`
                board-piece-name

                ${
                  reducing

                    ? "board-piece-name--reducing"

                    : ""
                }
              `}

            >

              {animalName}

            </span>


          </div>





          {

            reducing &&
            !removing &&

            <div
              className="
                board-piece-reduce-preview
              "
            >


              <span
                className="
                  board-piece-reduce-name
                "
              >

                {
                  reducePreview ===
                  1

                    ? "水"

                    : reduceAnimalName
                }

              </span>



              <span
                className="
                  board-piece-reduce-number
                "
              >

                {reducePreview}

              </span>


            </div>

          }





          {

            !isOne &&
            !parentAnimalNames &&
            !reducePreviousRecord &&

            <div
              className="
                board-piece-origin
              "
            >

              <span>
                原生
              </span>

            </div>

          }





          {

            !isOne &&
            parentAnimalNames &&
            parentAnimalNames[0] &&
            parentAnimalNames[1] &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>
                {parentAnimalNames[0]}
              </span>


              <span
                className="
                  board-piece-origin-plus
                "
              >
                +
              </span>


              <span>
                {parentAnimalNames[1]}
              </span>


            </div>

          }





          {

            !isOne &&
            reducePreviousRecord &&
            reducePreviousAnimalName &&

            <div
              className="
                board-piece-origin
              "
            >

              <span>
                {reducePreviousAnimalName}
              </span>

            </div>

          }





          {

            isOne &&
            onePreviousValue !==
            null &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>

                {
                  onePreviousAnimalName
                  ?? "来源"
                }

              </span>


              <span
                className="
                  board-piece-origin-plus
                "
              >
                ·
              </span>


              <strong>
                {onePreviousValue}
              </strong>


            </div>

          }


        </button>


      </div>


    </div>

  );

}