import {
  gcd
} from "../utils/math";

import {
  SCORE_CONFIG
} from "../game/scoreConfig";

import {
  ANIMAL_TYPES,
  getBirdMutationAnimalType,
  isNormalAnimalType
} from "../game/rules";

import {
  getAnimalName
} from "../data/animal/animalRegistry";

import BoardCell from "./BoardCell";

import "./Board.css";





// ============================================================
// Board
// ============================================================

export default function Board({

  board = [],

  selectedIndexes = [],

  onSelectCell,

  onRemoveOne,

  onCombine,

  collection = [],

  removingIndex = null,

  preview = null,

  mazeTurn = null,

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
  // 单选后的可约分候选
  // ==========================================================

  const reduceCandidateIndexes =
    new Set();



  if(
    selectedCells.length === 1
  ){


    const selectedEntry =
      selectedCells[0];


    const selectedPiece =
      selectedEntry.piece;



    cells.forEach(

      (
        piece,
        index
      ) => {


        if(
          !piece
        ){

          return;

        }



        if(
          index ===
          selectedEntry.index
        ){

          return;

        }



        if(
          piece.value === 1 ||
          selectedPiece.value === 1
        ){

          return;

        }



        const divisor =

          gcd(

            selectedPiece.value,

            piece.value

          );



        if(
          divisor > 1
        ){


          reduceCandidateIndexes.add(
            index
          );

        }

      }

    );

  }





  // ==========================================================
  // 双选约分 Preview
  //
  // reducePreviewMap
  //
  // {
  //   [index]: resultValue
  // }
  //
  //
  // mutationPreviewMap
  //
  // {
  //   [index]: {
  //
  //     triggered: true,
  //
  //     role:
  //       "target" | "bird",
  //
  //     fromType,
  //     toType,
  //
  //     resultValue
  //
  //   }
  // }
  //
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
          firstResult;



        reducePreviewMap[
          secondEntry.index
        ] =
          secondResult;





        // ======================================================
        // 情况 A
        //
        // first = 鸟
        // firstResult = 1
        //
        // second 发生变种
        // ======================================================

        if(
          firstPiece.animalType ===
          ANIMAL_TYPES.BIRD

          &&

          firstResult ===
          1

          &&

          isNormalAnimalType(
            secondPiece.animalType
          )
        ){


          const mutatedType =

            getBirdMutationAnimalType(
              secondPiece.animalType
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
                "bird",

              fromType:
                ANIMAL_TYPES.BIRD,

              toType:
                ANIMAL_TYPES.BIRD,

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
                secondPiece.animalType,

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
        // second = 鸟
        // secondResult = 1
        //
        // first 发生变种
        // ======================================================

        else if(
          secondPiece.animalType ===
          ANIMAL_TYPES.BIRD

          &&

          secondResult ===
          1

          &&

          isNormalAnimalType(
            firstPiece.animalType
          )
        ){


          const mutatedType =

            getBirdMutationAnimalType(
              firstPiece.animalType
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
                "bird",

              fromType:
                ANIMAL_TYPES.BIRD,

              toType:
                ANIMAL_TYPES.BIRD,

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
                firstPiece.animalType,

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



  const combinePreviewName =

    combinePreview

      ? getAnimalName(

          combinePreview.value,

          combinePreview.animalType

        )

      : null;





  // ==========================================================
  // Preview 动物类型 CSS
  // ==========================================================

  const combinePreviewTypeClass =

    combinePreview?.animalType === "dog"

      ? "board-preview--dog"

      :

    combinePreview?.animalType === "cat"

      ? "board-preview--cat"

      :

    combinePreview?.animalType === "mammal"

      ? "board-preview--mammal"

      :

    combinePreview?.animalType === "bird"

      ? "board-preview--bird"

      :

        "board-preview--default";





  // ==========================================================
  // 是否显示纯系标记
  // ==========================================================

  const combinePreviewPure =

    combinePreview?.purity === "pure"

    &&

    (
      combinePreview?.animalType === "dog"
      ||
      combinePreview?.animalType === "cat"
      ||
      combinePreview?.animalType === "mammal"
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
            // 新动物组合 Preview
            // ==================================================

            if(

              !piece &&

              combinePreview &&

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

                    type="button"

                    onClick={
                      onCombine
                    }

                    className={`
                      board-preview

                      ${combinePreviewTypeClass}
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


                  </button>


                </div>

              );

            }





            const isSelected =

              selected.includes(
                index
              );





            const reduceCandidate =

              reduceCandidateIndexes.has(
                index
              );





            const reducePreview =

              reducePreviewMap[
                index
              ]

              ?? null;





            // ==================================================
            // 鸟变种 Preview
            // ==================================================

            const mutationPreview =

              mutationPreviewMap[
                index
              ]

              ?? null;





            const removing =

              removingIndex ===
              index;





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

              piece?.value === 1 &&

              piece.origin?.type === "reduce"

                ? (
                    piece.origin
                      ?.parent
                      ?.value

                    ?? null
                  )

                : null;





            const isNewDiscovery =

              piece?.value === 1 &&

              reduceFrom !== null &&

              !collection.includes(
                reduceFrom
              );





            let scorePreview =
              null;



            if(

              piece?.value === 1 &&

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
                  piece
                }

                selected={
                  isSelected
                }

                reduceCandidate={
                  reduceCandidate
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