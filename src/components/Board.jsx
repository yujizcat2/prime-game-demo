import {
  gcd
} from "../utils/math";


import {
  SCORE_CONFIG
} from "../game/scoreConfig";


import {
  FOOD_TYPES,
  getDessertMutationFoodType,
  isNormalFoodType,
  getReduceExtractFoodType
} from "../game/rules";


import {
  getFoodName
} from "../data/food/foodRegistry";


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


  // ==========================================================
  // 固定九宫格
  // ==========================================================

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





  // ==========================================================
  // 当前选择
  // ==========================================================

  const selected =

    Array.isArray(
      selectedIndexes
    )

      ? selectedIndexes

      : [];





  // ==========================================================
  // 当前选中的正式棋子
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
  //
  // 新核心：
  //
  // 不能再只判断：
  //
  // gcd > 1
  //
  //
  // 还必须判断：
  //
  // 当前空格
  // +
  // 本次约成1自动收藏释放的格子
  //
  // 是否足够容纳析出的 gcd。
  //
  //
  // ----------------------------------------------------------
  //
  // 满盘：
  //
  // 12 / 18
  //
  // → 2 / 3 + 6
  //
  // 没有自动释放
  //
  // → 不允许
  //
  //
  // 满盘：
  //
  // 16 / 4
  //
  // → 4 / 1 + 4
  //
  // 1自动收藏释放1格
  //
  // → 允许
  //
  //
  // 满盘：
  //
  // 8 / 8
  //
  // → 1 / 1
  //
  // 两格自动释放
  // 不析出8
  //
  // → 允许
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



    // ========================================================
    // 当前正式棋子数量
    // ========================================================

    const currentPieceCount =

      cells.filter(
        Boolean
      ).length;



    // ========================================================
    // 当前真实空格
    // ========================================================

    const currentEmptyCount =

      Math.max(

        0,

        9 -
        currentPieceCount

      );



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



        // ======================================================
        // 新系统理论上不会出现正式1。
        //
        // 这里仅作为旧状态兼容保护。
        // ======================================================

        if(
          piece.value === 1 ||
          selectedPiece.value === 1
        ){

          return;

        }



        // ======================================================
        // 最大公约数
        // ======================================================

        const divisor =

          gcd(

            selectedPiece.value,

            piece.value

          );



        // ======================================================
        // 数学上不可约
        // ======================================================

        if(
          divisor <= 1
        ){

          return;

        }



        // ======================================================
        // 约分后的结果
        // ======================================================

        const firstResult =

          selectedPiece.value /
          divisor;



        const secondResult =

          piece.value /
          divisor;



        // ======================================================
        // 本次会自动收藏几个1
        //
        // 一个结果变1
        // → 自动收藏
        // → 自动释放1格
        // ======================================================

        const autoCollectCount =

          (
            firstResult === 1

              ? 1

              : 0
          )

          +

          (
            secondResult === 1

              ? 1

              : 0
          );



        // ======================================================
        // 是否会析出 gcd
        //
        // 普通三系 + 异值
        // → 析出
        //
        // 同值
        // → 不析出
        //
        // 甜食
        // → 当前不析出
        // ======================================================

        let extractFoodType =
          null;



        if(
          selectedPiece.value !==
          piece.value
        ){


          extractFoodType =

            getReduceExtractFoodType(

              selectedPiece,

              piece

            );

        }



        const extract =

          Boolean(
            extractFoodType
          );



        // ======================================================
        // 析出物需要多少空间
        // ======================================================

        const requiredSpace =

          extract

            ? 1

            : 0;



        // ======================================================
        // 本次真正可使用空间
        //
        // 当前空格
        // +
        // 自动收藏释放格
        // ======================================================

        const availableSpace =

          currentEmptyCount +
          autoCollectCount;



        // ======================================================
        // 空间不足
        //
        // 不标记为约分候选。
        // ======================================================

        if(
          availableSpace <
          requiredSpace
        ){

          return;

        }



        // ======================================================
        // 真正可约候选
        // ======================================================

        reduceCandidateIndexes.add(
          index
        );

      }

    );

  }





  // ==========================================================
  // 双选约分 Preview
  //
  // 新版不再由 Board 自己重新生成约分结果。
  //
  // 直接读取：
  //
  // useGame.preview.reduce.results
  //
  //
  // 每边结构：
  //
  // {
  //
  //   value,
  //
  //   autoCollect,
  //
  //   collectValue,
  //
  //   foodType,
  //
  //   purity
  //
  // }
  //
  //
  // 这样 BoardCell 才能知道：
  //
  // 普通：
  //
  // 16 → 4
  //
  //
  // 特殊：
  //
  // 4 → 1
  // → 自动收藏
  // ==========================================================

  const reducePreviewMap =
    {};


  const mutationPreviewMap =
    {};



  const reducePreviewData =

    preview?.reduce
    ?? null;



  if(
    selectedCells.length === 2

    &&

    Array.isArray(
      reducePreviewData?.results
    )

    &&

    reducePreviewData.results.length === 2
  ){


    const firstEntry =
      selectedCells[0];


    const secondEntry =
      selectedCells[1];



    // ========================================================
    // 直接映射 useGame 的新版 preview
    // ========================================================

    reducePreviewMap[
      firstEntry.index
    ] =
      reducePreviewData.results[0];



    reducePreviewMap[
      secondEntry.index
    ] =
      reducePreviewData.results[1];





    // ========================================================
    // 甜食特殊变种 Preview
    //
    // 这一套旧规则继续保留。
    // ========================================================

    const firstPiece =
      firstEntry.piece;


    const secondPiece =
      secondEntry.piece;



    const firstResult =

      reducePreviewData
        .results?.[0]
        ?.value

      ?? null;



    const secondResult =

      reducePreviewData
        .results?.[1]
        ?.value

      ?? null;





    // ========================================================
    // 情况 A
    //
    // first = 甜食
    // first → 1
    //
    // second 普通类型发生变种
    // ========================================================

    if(
      firstPiece?.foodType ===
        FOOD_TYPES.DESSERT

      &&

      firstResult ===
        1

      &&

      isNormalFoodType(
        secondPiece?.foodType
      )
    ){


      const mutatedType =

        getDessertMutationFoodType(
          secondPiece.foodType
        );



      if(
        mutatedType
      ){


        // ====================================================
        // 甜食这一侧
        // ====================================================

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



        // ====================================================
        // 普通食物这一侧
        // ====================================================

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





    // ========================================================
    // 情况 B
    //
    // second = 甜食
    // second → 1
    //
    // first 普通类型发生变种
    // ========================================================

    else if(
      secondPiece?.foodType ===
        FOOD_TYPES.DESSERT

      &&

      secondResult ===
        1

      &&

      isNormalFoodType(
        firstPiece?.foodType
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





  // ==========================================================
  // 下一个空格
  //
  // 合成幽灵卡仍然只占真正的当前空格。
  //
  // 约分析出 gcd 不在这里预览，
  // 而是在 ActionButtons 附近显示小析出提示。
  // ==========================================================

  const nextEmptyIndex =

    cells.findIndex(

      piece =>
        piece === null

    );





  // ==========================================================
  // 合成 Preview
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





  // ==========================================================
  // 合成 Preview 食物类型 CSS
  // ==========================================================

  const combinePreviewTypeClass =

    combinePreview?.foodType ===
      "meat"

      ?

        "board-preview--meat"

      :

    combinePreview?.foodType ===
      "vegetable"

      ?

        "board-preview--vegetable"

      :

    combinePreview?.foodType ===
      "seasoning"

      ?

        "board-preview--seasoning"

      :

    combinePreview?.foodType ===
      "dessert"

      ?

        "board-preview--dessert"

      :

        "board-preview--default";





  // ==========================================================
  // 合成 Preview 是否为纯系
  // ==========================================================

  const combinePreviewPure =

    combinePreview?.purity ===
      "pure"

    &&

    (
      combinePreview?.foodType ===
        "meat"

      ||

      combinePreview?.foodType ===
        "vegetable"

      ||

      combinePreview?.foodType ===
        "seasoning"
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
            // 合成幽灵 Preview
            //
            // 只负责：
            //
            // A + B = C
            //
            // 约分析出物不会占这里。
            // ==================================================

            if(
              !piece

              &&

              combinePreview

              &&

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
                        ??
                        combinePreview.value

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





            // ==================================================
            // 当前是否选中
            // ==================================================

            const isSelected =

              selected.includes(
                index
              );





            // ==================================================
            // 是否为单选后的可约分候选
            // ==================================================

            const reduceCandidate =

              reduceCandidateIndexes.has(
                index
              );





            // ==================================================
            // 新版约分 Preview
            //
            // object | null
            // ==================================================

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





            // ==================================================
            // 旧版手动移除状态
            //
            // 新核心正常不会再使用。
            // ==================================================

            const removing =

              removingIndex ===
                index;





            // ==================================================
            // 当前数字是否已经收藏过
            // ==================================================

            const discovered =

              piece?.value !==
                undefined

              &&

              piece.value !==
                1

              &&

              collection.includes(
                piece.value
              );





            // ==================================================
            // 以下全部属于旧版正式1兼容逻辑
            //
            // 新核心：
            //
            // 约成1
            // → 自动收藏
            // → 不进入 board
            //
            // 所以正常游戏不会进入这里。
            // ==================================================

            const reduceFrom =

              piece?.value === 1

              &&

              piece.origin?.type ===
                "reduce"

                ?

                  (
                    piece.origin
                      ?.parent
                      ?.value

                    ?? null
                  )

                :

                  null;





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



            if(
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





            // ==================================================
            // 点击棋子
            // ==================================================

            function handlePieceClick(){


              if(
                !piece
              ){

                return;

              }



              // =================================================
              // 旧热更新状态兼容
              //
              // 新游戏不会产生正式1。
              // =================================================

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

                    ?

                      `piece-${piece.id}`

                    :

                      `empty-${index}`

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