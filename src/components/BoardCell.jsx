import {
  isPrime
} from "../game/prime";

import {
  getAnimalName
} from "../data/animal/animalRegistry";

import "./Board.css";





export default function BoardCell({

  index,

  piece,

  selected = false,

  reduceCandidate = false,

  reducePreview = null,

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
    piece.animalType ?? null;


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
  // 是否为纯系
  //
  // 当前普通三系：
  //
  // dog
  // cat
  // mammal
  //
  // bird 为特殊系，
  // 当前 purity = null。
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
  //
  // 1 当前继续表现为“水”
  // ==========================================================

  const animalName =

    isOne

      ? "水"

      : getAnimalName(
          value,
          animalType
        );





  // ==========================================================
  // 约分后的动物名称
  //
  // 约分不改变 animalType。
  // ==========================================================

  const reduceAnimalName =

    reducing &&
    reducePreview !== 1

      ? getAnimalName(
          reducePreview,
          animalType
        )

      : null;





  // ==========================================================
  // 组合来源
  //
  // parentAnimals 保存当前节点的两个直接来源。
  // ==========================================================

  const parentAnimalNames =

    Array.isArray(
      piece.parentAnimals
    ) &&
    piece.parentAnimals.length >= 2

      ? piece.parentAnimals.map(

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

      : null;





  // ==========================================================
  // 普通约分来源
  // ==========================================================

  const reducePreviousRecord =

    piece.origin?.type === "reduce"

      ? piece.origin.parent

      : null;



  const reducePreviousValue =

    reducePreviousRecord?.value
    ?? null;



  const reducePreviousAnimalType =

    reducePreviousRecord?.animalType

    ??

    animalType

    ??

    null;



  const reducePreviousAnimalName =

    reducePreviousValue !== null

      ? getAnimalName(

          reducePreviousValue,

          reducePreviousAnimalType

        )

      : null;





  // ==========================================================
  // 水的直接来源
  // ==========================================================

  const onePreviousRecord =

    isOne &&
    piece.origin?.type === "reduce"

      ? piece.origin.parent

      : null;



  const onePreviousValue =

    onePreviousRecord?.value
    ?? null;



  const onePreviousAnimalType =

    onePreviousRecord?.animalType

    ??

    animalType

    ??

    null;



  const onePreviousAnimalName =

    onePreviousValue !== null

      ? getAnimalName(

          onePreviousValue,

          onePreviousAnimalType

        )

      : null;





  // ==========================================================
  // 动物类型 class
  //
  // dog     = 狗系
  // cat     = 猫系
  // mammal  = 哺乳系
  // bird    = 鸟系
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





  // ==========================================================
  // 单选时的约分候选提示
  // ==========================================================

  const showReduceCandidate =

    reduceCandidate &&
    !selected &&
    !removing &&
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



        {/* ====================================================
            分数预览
        ==================================================== */}

        {

          isOne &&
          scorePreview !== null &&

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





        {/* ====================================================
            移除闪光
        ==================================================== */}

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
          `}

        >


          {/* ==================================================
              选中环
          ================================================== */}

          {

            selected &&
            !removing &&

            <div
              className="
                board-piece-selected-ring
              "
            />

          }





          {/* ==================================================
              动物系颜色条
          ================================================== */}

          <div
            className="
              board-piece-type-bar
            "
          />





          {/* ==================================================
              纯系标记
          ================================================== */}

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





          {/* ==================================================
              数字
          ================================================== */}

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





          {/* ==================================================
              质数标记
          ================================================== */}

          {

            prime &&
            !isOne &&

            <div
              className="
                board-piece-prime
              "
            />

          }





          {/* ==================================================
              当前动物名称
          ================================================== */}

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





          {/* ==================================================
              约分 Preview
          ================================================== */}

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
                  reducePreview === 1

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





          {/* ==================================================
              原生节点
          ================================================== */}

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





          {/* ==================================================
              组合来源
          ================================================== */}

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





          {/* ==================================================
              约分来源
          ================================================== */}

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





          {/* ==================================================
              水的直接来源
          ================================================== */}

          {

            isOne &&
            onePreviousValue !== null &&

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