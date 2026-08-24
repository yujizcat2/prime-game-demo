import {
  gcd
} from "../utils/math";

import {
  SCORE_CONFIG
} from "../game/scoreConfig";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";

import BoardCell from "./BoardCell";

import "./Board.css";



// ============================================================
// 获取料理名称
// ============================================================

function getFoodName(
  value,
  foodType
){


  if(
    value === null ||
    value === undefined
  ){

    return null;

  }



  if(
    foodType === "meat"
  ){

    return getMeatName(
      value
    );

  }



  if(
    foodType === "vegetable"
  ){

    return getVegetableName(
      value
    );

  }



  if(
    foodType === "dessert"
  ){

    return getDessertName(
      value
    );

  }



  return String(
    value
  );

}





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

}) {


  // ==========================================================
  // 固定9格
  // ==========================================================

  const cells =

    Array.from(

      {
        length: 9
      },

      (
        _,
        index
      ) =>

        board[index]
        ?? null

    );





  // ==========================================================
  // selected安全处理
  // ==========================================================

  const selected =

    Array.isArray(
      selectedIndexes
    )

      ?

      selectedIndexes

      :

      [];





  // ==========================================================
  // 当前选择棋子
  // ==========================================================

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
  // 双选约分Preview
  // ==========================================================

  const reducePreviewMap = {};



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


        reducePreviewMap[
          firstEntry.index
        ] =

          firstPiece.value /
          divisor;



        reducePreviewMap[
          secondEntry.index
        ] =

          secondPiece.value /
          divisor;

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
  // 合成Preview
  // ==========================================================

  const combinePreview =

    preview?.combine
    ?? null;



  const combinePreviewName =

    combinePreview

      ?

      getFoodName(

        combinePreview.value,

        combinePreview.foodType

      )

      :

      null;





  const combinePreviewTypeClass =

    combinePreview?.foodType === "meat"

      ?

      "board-preview--meat"

      :

    combinePreview?.foodType === "vegetable"

      ?

      "board-preview--vegetable"

      :

    combinePreview?.foodType === "dessert"

      ?

      "board-preview--dessert"

      :

      "board-preview--default";





  return (

    <div
      className="
        board
      "
    >


      {

        cells.map(

          (
            piece,
            index
          ) => {


            // ==================================================
            // 合成Preview
            // ==================================================

            if(

              !piece &&

              combinePreview &&

              index === nextEmptyIndex

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
                      `点击搭配 ${
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

                      {
                        combinePreview.value
                      }

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

                        {
                          combinePreviewName
                        }

                      </span>


                    </div>



                    <div
                      className="
                        board-preview-action
                      "
                    >

                      + 搭配

                    </div>


                  </button>


                </div>

              );

            }





            // ==================================================
            // 正式棋子状态
            // ==================================================

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



            const removing =

              removingIndex ===
              index;



            // ==================================================
            // 已发现
            // ==================================================

            const discovered =

              piece?.value !== undefined &&

              piece.value !== 1 &&

              collection.includes(
                piece.value
              );



            // ==================================================
            // 1的来源
            // ==================================================

            const reduceFrom =

              piece?.value === 1 &&

              piece.origin?.type === "reduce"

                ?

                (
                  piece.origin
                    ?.parent
                    ?.value

                  ?? null
                )

                :

                null;



            // ==================================================
            // 是否新发现
            // ==================================================

            const isNewDiscovery =

              piece?.value === 1 &&

              reduceFrom !== null &&

              !collection.includes(
                reduceFrom
              );



            // ==================================================
            // 分数Preview
            // ==================================================

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





            // ==================================================
            // 点击
            // ==================================================

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