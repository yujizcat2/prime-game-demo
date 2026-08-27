import {
  isPrime
} from "../game/prime";

import {
  getFoodTypeShortName,
  getFoodName
} from "../data/food/foodRegistry";

import "./Board.css";





export default function BoardCell({

  index,

  piece,

  selected = false,

  combineCandidate = false,

  reduceCandidate = false,

  removeCandidate = false,

  reducePreview = null,

  mutationPreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

  animationState = null,

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

        className={`
          board-cell
          board-cell--empty
          ${
            animationState?.removedIndexes?.includes(index)
              ? "board-cell--cleared"
              : ""
          }
        `}

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


  const foodType =
    piece.foodType
    ?? null;


  const isMeat =
    foodType === "meat";


  const isVegetable =
    foodType === "vegetable";


  const isSeasoning =
    foodType === "seasoning";


  const isDessert =
    foodType === "dessert";


  const isOne =
    value === 1;


  const reducing =
    reducePreview !== null;





  // ==========================================================
  // 新版约分预览
  // ==========================================================

  const reduceResultValue =

    reducePreview?.value

    ?? null;



  const autoCollectPreview =

    reducePreview?.autoCollect ===
    true;



  // ==========================================================
  // 自动获得的收藏物
  //
  // 例如：
  //
  // 16 / 4
  //
  // 4 → 1
  //
  // UI 不展示1，
  // 而是直接展示：
  //
  // GET!
  // 对应料理
  // ×1
  // ==========================================================

  const autoCollectValue =

    reducePreview?.collectValue

    ??

    value;



  const autoCollectFoodType =

    reducePreview?.foodType

    ??

    foodType;



  const autoCollectFoodName =

    autoCollectPreview

      ?

        getFoodName(

          autoCollectValue,

          autoCollectFoodType

        )

      :

        null;



  const prime =

    isPrime(
      value
    );





  // ==========================================================
  // 甜食变种 Preview
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



  const isMutationDessert =

    mutationTriggered

    &&

    mutationRole ===
    "dessert";



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

        getFoodTypeShortName(
          mutationFromType
        )

      :

        null;



  const mutationToName =

    mutationToType

      ?

        getFoodTypeShortName(
          mutationToType
        )

      :

        null;





  // ==========================================================
  // 即将变成的目标类型 class
  // ==========================================================

  const mutationTargetTypeClass =

    isMutationTarget

      ?

        mutationToType === "meat"

          ? "board-piece--mutation-to-meat"

          :

        mutationToType === "vegetable"

          ? "board-piece--mutation-to-vegetable"

          :

        mutationToType === "seasoning"

          ? "board-piece--mutation-to-seasoning"

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
      isMeat ||
      isVegetable ||
      isSeasoning
    )

    &&

    !isOne;





  // ==========================================================
  // 当前食物名称
  // ==========================================================

  const foodName =

    isOne

      ? "水"

      : getFoodName(

          value,

          foodType

        );





  // ==========================================================
  // 约分后的真实 foodType
  // ==========================================================

  const reduceResultFoodType =

    isMutationTarget

      ?

        mutationToType

      :

        foodType;





  // ==========================================================
  // 普通约分后的名称
  // ==========================================================

  const reduceFoodName =

    reducing
    &&
    !autoCollectPreview
    &&
    reduceResultValue !== null

      ?

        getFoodName(

          reduceResultValue,

          reduceResultFoodType

        )

      :

        null;





  // ==========================================================
  // 组合来源
  // ==========================================================

  const parentFoodNames =

    Array.isArray(
      piece.parentFoods
    )

    &&

    piece.parentFoods.length >=
    2

      ?

        piece.parentFoods.map(

          parent => {


            if(
              !parent
            ){

              return null;

            }



            return getFoodName(

              parent.value,

              parent.foodType

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



  const reducePreviousFoodType =

    reducePreviousRecord?.foodType

    ??

    foodType

    ??

    null;



  const reducePreviousFoodName =

    reducePreviousValue !==
    null

      ?

        getFoodName(

          reducePreviousValue,

          reducePreviousFoodType

        )

      :

        null;





  // ==========================================================
  // 旧版水来源
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



  const onePreviousFoodType =

    onePreviousRecord?.foodType

    ??

    foodType

    ??

    null;



  const onePreviousFoodName =

    onePreviousValue !==
    null

      ?

        getFoodName(

          onePreviousValue,

          onePreviousFoodType

        )

      :

        null;





  // ==========================================================
  // 当前真实类型 class
  // ==========================================================

  const typeClass =

    isOne

      ? "board-piece--one"

      : isMeat

      ? "board-piece--meat"

      : isVegetable

      ? "board-piece--vegetable"

      : isSeasoning

      ? "board-piece--seasoning"

      : isDessert

      ? "board-piece--dessert"

      : "board-piece--default";





  const showReduceCandidate =

    reduceCandidate

    &&

    !selected

    &&

    !removing

    &&

    !reducing;


  const showCombineCandidate =

    combineCandidate &&
    !selected &&
    !removing &&
    !reducing;


  const showRemoveCandidate =

    removeCandidate &&
    !selected &&
    !removing &&
    !reducing;


  const combineMotionStyle =

    animationState?.type === "combine" &&
    animationState.targetIndex !== undefined

      ? {
          "--combine-shift-x": `${Math.sign((animationState.targetIndex % 3) - (index % 3)) * 5}px`,
          "--combine-shift-y": `${Math.sign(Math.floor(animationState.targetIndex / 3) - Math.floor(index / 3)) * 4}px`
        }

      : undefined;





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
          isMutationDessert
            ? "board-cell--mutation-dessert"
            : ""
        }

        ${
          autoCollectPreview
            ? "board-cell--auto-collect-preview"
            : ""
        }

        ${
          animationState?.phase === "enter" ||
          animationState?.phase === "settle"
            ? "board-cell--operation-pulse"
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

          ${
            animationState?.type === "combine" &&
            animationState.phase === "enter" &&
            animationState.targetIndex === index
              ? "board-piece-wrapper--created"
              : ""
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

          style={
            combineMotionStyle
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
              showCombineCandidate
                ? "board-piece--combine-candidate"
                : ""
            }

            ${
              showReduceCandidate &&
              !showRemoveCandidate
                ? "board-piece--reduce-candidate"
                : ""
            }

            ${
              showRemoveCandidate
                ? "board-piece--remove-candidate"
                : ""
            }

            ${
              autoCollectPreview &&
              !removing

                ? "board-piece--auto-collect-preview"

                : ""
            }

            ${
              removing

                ? "board-piece--remove"

                : ""
            }

            ${
              animationState?.type === "combine" &&
              animationState.phase === "exit" &&
              animationState.indexes.includes(index)
                ? "board-piece--combine-source"
                : ""
            }

            ${
              animationState?.type === "reduce" &&
              animationState.phase === "compress" &&
              animationState.indexes.includes(index)
                ? animationState.removedIndexes.includes(index)
                  ? "board-piece--reduce-auto-exit"
                  : "board-piece--reduce-compress"
                : ""
            }

            ${
              animationState?.type === "reduce" &&
              animationState.phase === "settle" &&
              animationState.indexes.includes(index)
                ? "board-piece--reduce-settle"
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
              isMutationDessert &&
              !removing

                ? "board-piece--mutation-dessert"

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


          {

            (
              showCombineCandidate ||
              showReduceCandidate ||
              showRemoveCandidate
            ) &&

            <div
              className="board-piece-candidate-badges"
              aria-label="可执行操作"
            >

              {
                showCombineCandidate &&
                <span className="board-piece-candidate-badge board-piece-candidate-badge--combine">
                  +
                </span>
              }

              {
                showRemoveCandidate
                  ? <span className="board-piece-candidate-badge board-piece-candidate-badge--remove">✦</span>
                  : showReduceCandidate &&
                    <span className="board-piece-candidate-badge board-piece-candidate-badge--reduce">÷</span>
              }

            </div>

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

            isMutationDessert &&
            !removing &&

            <div
              className="
                board-piece-dessert-trigger
              "
            >

              自动处理

            </div>

          }





          <div

              className={`
                board-piece-number

                ${
                  animationState?.type === "reduce" &&
                  animationState.phase === "settle"
                    ? "board-piece-number--changed"
                    : ""
                }

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

              {foodName}

            </span>


          </div>





          {/* ==================================================
              普通约分预览
          ================================================== */}

          {

            reducing &&
            !autoCollectPreview &&
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

                {reduceFoodName}

              </span>


              <span
                className="
                  board-piece-reduce-number
                "
              >

                {reduceResultValue}

              </span>


            </div>

          }





          {/* ==================================================
              自动获得物品 Preview

              不显示：
              1
              →
              收藏

              直接显示：

              GET!
              料理名
              ×1
          ================================================== */}

          {

            autoCollectPreview &&
            !removing &&

            <div
              className="
                board-piece-auto-collect-preview
              "
            >


              <div
                className="
                  board-piece-auto-collect-reward
                "
              >


                <span
                  className="
                    board-piece-auto-collect-get
                  "
                >

                  GET!

                </span>



                <strong
                  className="
                    board-piece-auto-collect-reward-name
                  "
                >

                  {
                    autoCollectFoodName

                    ??

                    autoCollectValue
                  }

                </strong>



                <span
                  className="
                    board-piece-auto-collect-count
                  "
                >

                  ×1

                </span>


              </div>


            </div>

          }





          {

            !isOne &&
            !parentFoodNames &&
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
            parentFoodNames &&
            parentFoodNames[0] &&
            parentFoodNames[1] &&

            <div
              className="
                board-piece-origin
              "
            >


              <span>
                {parentFoodNames[0]}
              </span>


              <span
                className="
                  board-piece-origin-plus
                "
              >
                +
              </span>


              <span>
                {parentFoodNames[1]}
              </span>


            </div>

          }





          {

            !isOne &&
            reducePreviousRecord &&
            reducePreviousFoodName &&

            <div
              className="
                board-piece-origin
              "
            >

              <span>
                {reducePreviousFoodName}
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
                  onePreviousFoodName
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
