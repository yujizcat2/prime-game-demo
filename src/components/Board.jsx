import {
  gcd
} from "../utils/math";

import {
  SCORE_CONFIG
} from "../game/scoreConfig";

import {
  FOOD_TYPES,
  getDessertMutationFoodType,
  isNormalFoodType
} from "../game/rules";

import {
  getFoodName,
  getFoodTypeShortName
} from "../data/food/foodRegistry";

import BoardCell from "./BoardCell";
import { getCombinePreviewPlacement } from "../game/combinePreview";
import { getEightPalaceCollectionScoreGain } from "../game/collectionRules";
import { BOARD_NATIVE_FOOD_TYPES } from "../game/nativeFoodTypes";

import "./Board.css";





// ============================================================
// Board
// ============================================================

export default function Board({

  board = [],

  selectedIndexes = [],
  functionOneIndex = null,
  heaterSelectMode = false,
  restoreSelectMode = false,

  onSelectCell,

  onRemoveOne,

  onCombine,

  collection = [],

  collectionCards = [],

  prices = [],

  scoreMode = false,

  removingIndex = null,

  preview = null,

  mazeTurn = null,

  animationState = null,

  actionCandidates = {},

  clearedCells = [],

}) {


  const cells =

    Array.from(

      {
        length:
          9
      },

      (
        _,
        index
      ) =>

        board[index]
        ?? null

    );





  const selected =

    Array.isArray(
      selectedIndexes
    )

      ? selectedIndexes

      : [];





  const selectedCells =

    selected

      .map(

        index => ({

          index,

          piece:

            cells[index]
            ?? null

        })

      )

      .filter(

        entry =>
          entry.piece

      );





  // ==========================================================
  // 双选约分 Preview
  // ==========================================================

  const reducePreviewMap =
    {};


  const mutationPreviewMap =
    {};



  if(
    selectedCells.length === 2
  ){


    const firstEntry =
      selectedCells[0];


    const secondEntry =
      selectedCells[1];


    const firstPiece =
      firstEntry.piece;


    const secondPiece =
      secondEntry.piece;



    if(
      firstPiece &&
      secondPiece
    ){


      const divisor =

        gcd(

          firstPiece.value,

          secondPiece.value

        );



      if(
        divisor > 1
      ){


        const firstResult =

          firstPiece.value /
          divisor;



        const secondResult =

          secondPiece.value /
          divisor;





        reducePreviewMap[
          firstEntry.index
        ] =
          preview?.reduce?.results?.[0]
          ?? {
            value: firstResult,
            autoCollect: firstResult === 1,
            collectValue: firstResult === 1
              ? firstPiece.value
              : null,
            foodType: firstPiece.foodType,
            purity: firstPiece.purity ?? null
          };



        reducePreviewMap[
          secondEntry.index
        ] =
          preview?.reduce?.results?.[1]
          ?? {
            value: secondResult,
            autoCollect: secondResult === 1,
            collectValue: secondResult === 1
              ? secondPiece.value
              : null,
            foodType: secondPiece.foodType,
            purity: secondPiece.purity ?? null
          };





        // ======================================================
        // 情况 A
        //
        // first = 甜食
        // firstResult = 1
        //
        // second 发生变种
        // ======================================================

        if(
          firstPiece.foodType ===
          FOOD_TYPES.DESSERT

          &&

          firstResult ===
          1

          &&

          isNormalFoodType(
            secondPiece.foodType
          )
        ){


          const mutatedType =

            getDessertMutationFoodType(
              secondPiece.foodType
            );



          if(
            mutatedType
          ){


            mutationPreviewMap[
              firstEntry.index
            ] = {

              triggered:
                true,

              role:
                "dessert",

              fromType:
                FOOD_TYPES.DESSERT,

              toType:
                FOOD_TYPES.DESSERT,

              resultValue:
                firstResult

            };



            mutationPreviewMap[
              secondEntry.index
            ] = {

              triggered:
                true,

              role:
                "target",

              fromType:
                secondPiece.foodType,

              toType:
                mutatedType,

              resultValue:
                secondResult

            };

          }

        }





        // ======================================================
        // 情况 B
        //
        // second = 甜食
        // secondResult = 1
        //
        // first 发生变种
        // ======================================================

        else if(
          secondPiece.foodType ===
          FOOD_TYPES.DESSERT

          &&

          secondResult ===
          1

          &&

          isNormalFoodType(
            firstPiece.foodType
          )
        ){


          const mutatedType =

            getDessertMutationFoodType(
              firstPiece.foodType
            );



          if(
            mutatedType
          ){


            mutationPreviewMap[
              secondEntry.index
            ] = {

              triggered:
                true,

              role:
                "dessert",

              fromType:
                FOOD_TYPES.DESSERT,

              toType:
                FOOD_TYPES.DESSERT,

              resultValue:
                secondResult

            };



            mutationPreviewMap[
              firstEntry.index
            ] = {

              triggered:
                true,

              role:
                "target",

              fromType:
                firstPiece.foodType,

              toType:
                mutatedType,

              resultValue:
                firstResult

            };

          }

        }

      }

    }

  }





  // ==========================================================
  // 下一个空格
  // ==========================================================

  const nextEmptyIndex =

    cells.findIndex(

      piece =>
        piece === null

    );





  // ==========================================================
  // 组合 Preview
  // ==========================================================

  const combinePreview =

    preview?.combine
    ?? null;

  const combinePreviewPlacement=getCombinePreviewPlacement(combinePreview);



  const combinePreviewName =

    combinePreview

      ? getFoodName(

          combinePreview.value,

          combinePreview.foodType

        )

      : null;

  const combinePreviewParents=(combinePreview?.parentFoods??[]).map(parent=>({
    ...parent,
    name:getFoodName(parent.value,parent.foodType)
  }));
  const combinePreviewKey=combinePreviewParents.map(parent=>`${parent.foodType}:${parent.value}`).join("+");





  // ==========================================================
  // Preview 食物类型 CSS
  // ==========================================================

  const combinePreviewTypeClass =

    `board-preview--${combinePreview?.foodType ?? "default"}`;





  // ==========================================================
  // 是否显示纯系标记
  // ==========================================================

  const combinePreviewPure =

    combinePreview?.purity === "pure"

    &&

    (
      combinePreview?.foodType !== "drink"
    );





  // ==========================================================
  // 迷宫回转
  // ==========================================================

  const mazeTurnActive =

    mazeTurn?.triggered ===
    true;





  return (

    <div
      className={`
        board

        ${
          mazeTurnActive

            ? "board--maze-turn"

            : ""
        }
        ${animationState?.type === "super-heater" ? "board--super-heating" : ""}
      `}
    >



      {/* ======================================================
          迷宫回转
      ====================================================== */}

      {

        mazeTurnActive &&

        <div

          key={
            `maze-turn-${mazeTurn.count ?? 0}`
          }

          className="
            board-maze-turn
          "

          aria-live="polite"

        >


          <div
            className="
              board-maze-turn-flash
            "
          />


          <div
            className="
              board-maze-turn-message
            "
          >


            <div
              className="
                board-maze-turn-title
              "
            >
              迷宫回转
            </div>


            <div
              className="
                board-maze-turn-subtitle
              "
            >
              MAZE TURN
            </div>


            <div
              className="
                board-maze-turn-change
              "
            >
              全盘 +1
            </div>


          </div>


        </div>

      }





      {/* ======================================================
          九宫格
      ====================================================== */}

      {

        cells.map(

          (
            piece,
            index
          ) => {


            // ==================================================
            // 新食物组合 Preview
            // ==================================================

            if(

              !piece &&

              combinePreview &&

              combinePreviewPlacement.showThirdCell &&

              index ===
              nextEmptyIndex

            ){


              return (

                <div

                  key={
                    `preview-${index}`
                  }

                  className="
                    board-cell
                    board-cell--preview
                  "

                  data-index={
                    index
                  }

                >


                  <button

                    key={combinePreviewKey}

                    type="button"

                    onClick={() =>
                      onCombine?.()
                    }

                    className={`
                      board-preview

                      ${combinePreviewTypeClass}

                      ${scoreMode ? "board-preview--score-mode" : ""}
                    `}

                    aria-label={
                      `点击组合 ${
                        combinePreviewName
                        ?? combinePreview.value
                      }`
                    }

                  >


                    <div
                      className="
                        board-preview-type-bar
                      "
                    />

                    <span
                      className="board-piece-cuisine-mark"
                      aria-hidden="true"
                    />



                    {

                      combinePreviewPure &&

                      <div

                        className="
                          board-preview-pure
                        "

                        aria-label="纯系"

                      >
                        ◆
                      </div>

                    }



                    <div
                      className="
                        board-preview-status
                      "
                    >
                      NEW
                    </div>



                    <div
                      className="
                        board-preview-number
                      "
                    >
                      {combinePreview.value}
                    </div>

                    {scoreMode && combinePreview.piece?.scoreValue != null && (
                      <div className="board-piece-locked-score board-preview-locked-score">
                        +{getEightPalaceCollectionScoreGain(
                          {collectionCards, board},
                          {value: 1, origin: {type: "reduce", parent: combinePreview.piece}}
                        )}
                      </div>
                    )}

                    <div className="board-preview-meta">
                      {getFoodTypeShortName(combinePreview.foodType)}
                      {combinePreview.purity?` · ${combinePreview.purity==="pure"?"纯系":"混合"}`:""}
                    </div>



                    <div
                      className="
                        board-preview-main
                      "
                    >

                      <span
                        className="
                          board-preview-name
                        "
                      >
                        {combinePreviewName}
                      </span>

                    </div>



                    <div
                      className="
                        board-preview-action
                      "
                    >
                      + 组合
                    </div>

                    <div className="board-preview-parents">
                      由料理烹制：{combinePreviewParents.map(parent=>`${parent.name} ${parent.value}`).join(" + ")}
                    </div>


                  </button>


                </div>

              );

            }





            const isSelected =

              selected.includes(
                index
              )

              ||

              functionOneIndex ===
              index;

            const combinePreviewRole=combinePreviewPlacement.drinkIndex===index
              ? "wrap-drink"
              : combinePreviewPlacement.ingredientIndex===index
                ? "wrap-ingredient"
                : null;





            const candidate =

              actionCandidates[index]

              ?? {};





            const reducePreview =

              reducePreviewMap[
                index
              ]

              ?? null;





            // ==================================================
            // 甜食变种 Preview
            // ==================================================

            const mutationPreview =

              mutationPreviewMap[
                index
              ]

              ?? null;





            const removing =

              removingIndex ===
              index;


            const animation =

              animationState?.indexes?.includes(index)

              ||

              animationState?.sourceIndexes?.includes(index)

              ||

              animationState?.targetIndexes?.includes(index)

              ||

              animationState?.targetIndex === index

              ||

              animationState?.removedIndexes?.includes(index)

                ? animationState

                : null;


            const clearFeedback =

              clearedCells.find(

                entry =>
                  entry.index === index

              )

              ?? null;





            const discovered =

              piece?.value !==
              undefined

              &&

              piece.value !== 1

              &&

              collection.includes(
                piece.value
              );





            // ==================================================
            // 数字1的直接来源
            // ==================================================

            const reduceFrom =

              piece?.value === 1

              &&

              piece.origin?.type === "reduce"

                ? (
                    piece.origin
                      ?.parent
                      ?.value

                    ?? null
                  )

                : null;





            const isNewDiscovery =

              piece?.value === 1

              &&

              reduceFrom !== null

              &&

              !collection.includes(
                reduceFrom
              );





            let scorePreview =
              null;

            const availableScore = scoreMode
              ? getEightPalaceCollectionScoreGain(
                  {collectionCards, board},
                  {
                    value: 1,
                    origin: {type: "reduce", parent: piece}
                  }
                )
              : null;

            if(
              scoreMode &&
              reducePreview?.autoCollect === true &&
              reducePreview?.clear !== true
            ){
              scorePreview = availableScore;
            }



            if(

              !scoreMode &&

              piece?.value === 1

              &&

              reduceFrom !== null

            ){


              if(
                isNewDiscovery
              ){


                scorePreview =

                  (
                    collection.length + 1
                  )

                  *

                  SCORE_CONFIG
                    .NEW_NUMBER_GROWTH;

              }


              else{


                scorePreview =

                  SCORE_CONFIG
                    .REPEAT_SCORE;

              }

            }





            function handlePieceClick(){

              if(heaterSelectMode || restoreSelectMode){
                onSelectCell?.(index);
                return;
              }


              if(
                !piece
              ){


                return;

              }



              if(
                piece.value === 1
              ){


                onRemoveOne?.(
                  index
                );


                return;

              }



              onSelectCell?.(
                index
              );

            }





            return (

              <BoardCell

                key={

                  piece

                    ? `piece-${piece.id}`

                    : `empty-${index}`
                }

                index={
                  index
                }

                piece={
                  combinePreviewPlacement.drinkIndex===index
                    ? combinePreviewPlacement.resultPiece
                    : piece
                }

                combinePreviewRole={combinePreviewRole}

                price={
                  prices[index] ?? 0
                }

                scoreMode={scoreMode}

                availableScore={availableScore}

                selected={
                  isSelected
                }

                selectionRole={selected[0]===index?"main":selected[1]===index?"pairing":null}

                combineCandidate={
                  candidate.combine === true
                }

                reduceCandidate={
                  candidate.reduce === true
                }

                removeCandidate={
                  candidate.remove === true
                }

                applyOneCandidate={
                  candidate.applyOne === true
                }

                heaterTargetState={
                  heaterSelectMode
                    ? !piece?.isCompound && piece?.value >= 2 && piece?.value <= 100
                      ? "available"
                      : "unavailable"
                    : null
                }
                restoreTargetState={
                  restoreSelectMode
                    ? piece && !piece.isCompound && piece.foodType !== BOARD_NATIVE_FOOD_TYPES[index]
                      ? "available"
                      : "unavailable"
                    : null
                }

                reducePreview={
                  reducePreview
                }

                mutationPreview={
                  mutationPreview
                }

                isNewDiscovery={
                  isNewDiscovery
                }

                scorePreview={
                  scorePreview
                }

                discovered={
                  discovered
                }

                removing={
                  removing
                }

                animationState={
                  animation
                }

                clearFeedback={
                  clearFeedback
                }

                onClick={
                  handlePieceClick
                }

              />

            );

          }

        )

      }


    </div>

  );

}
