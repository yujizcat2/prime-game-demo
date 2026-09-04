import {
  isPrime
} from "../game/prime";

import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  getFoodTypeShortName,
  getFoodName
} from "../data/food/foodRegistry";
import { getSpecialOneName } from "../data/specialOneRegistry";
import { getFoodCardDisplayName, getFoodOriginDescription } from "./foodCardDisplay";
import { getNativeFoodType } from "../game/nativeFoodTypes";
import {
  getCompoundDisplayName,
  getCompoundDisplayValue,
  getCompoundParentSignature
} from "./compoundDisplay";

import "./Board.css";





export default function BoardCell({

  index,

  piece,

  price = 0,

  scoreMode = false,
  availableScore = null,

  selected = false,
  selectionRole = null,
  combinePreviewRole = null,

  combineCandidate = false,

  reduceCandidate = false,

  removeCandidate = false,
  applyOneCandidate = false,
  heaterTargetState = null,
  restoreTargetState = null,

  reducePreview = null,

  mutationPreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

  animationState = null,

  clearFeedback = null,

  onClick,

}) {
  const nativeFoodType = getNativeFoodType(index);
  const nativeFoodTypeName = getFoodTypeShortName(nativeFoodType);
  const nativePositionLabel = nativeFoodType ? `原 · ${nativeFoodTypeName}` : "中心";
  const nativeCellClass = nativeFoodType
    ? `board-cell--native-${nativeFoodType}`
    : "board-cell--native-neutral";

  const previousPriceRef = useRef(price);
  const [priceDelta, setPriceDelta] = useState(null);

  useEffect(() => {
    const previousPrice = previousPriceRef.current;
    previousPriceRef.current = price;

    if(scoreMode || previousPrice === price){
      return undefined;
    }

    setPriceDelta(price - previousPrice);
    const timer = window.setTimeout(() => setPriceDelta(null), 750);
    return () => window.clearTimeout(timer);
  }, [price, scoreMode]);

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
          ${nativeCellClass}
          ${
            clearFeedback
              ? `board-cell--cleared board-cell--cleared-${clearFeedback.foodType ?? "default"}`
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

          <span className="board-native-label">{nativePositionLabel}</span>


          <div
            className="
              board-empty-dot
            "
          />


        </div>

        {
          clearFeedback?.reward != null &&
          <div className="board-cell-money-reward">
            {scoreMode
              ? clearFeedback.reward > 0
                ? `+${clearFeedback.reward}分`
                : "+0分"
              : clearFeedback.reward > 0
                ? `+¥${clearFeedback.reward}`
                : clearFeedback.reward < 0
                  ? `-¥${Math.abs(clearFeedback.reward)}`
                  : "¥0"}
          </div>
        }


      </div>

    );

  }

  if(piece.isCompound === true){
    const compoundName = getCompoundDisplayName(piece);
    const compoundDisplayValue = getCompoundDisplayValue(piece);
    const compoundNameSizeClass = compoundName.length >= 9
      ? "board-piece-compound-name--very-long"
      : compoundName.length >= 7
        ? "board-piece-compound-name--long"
        : "";
    return (
      <div
        className={`board-cell board-cell--occupied ${selected ? "board-cell--selected" : ""} ${nativeCellClass}`}
        data-index={index}
      >
        <div className="board-piece-wrapper board-piece-wrapper--enter">
          <button
            type="button"
            disabled={removing}
            onClick={removing ? undefined : onClick}
            className={`board-piece board-piece--compound ${selected ? "board-piece--selected" : ""}`}
            aria-label={`复合料理 ${compoundDisplayValue}`}
          >
            {selected && <div className="board-piece-selected-ring" />}
            <div className="board-piece-cuisine-type board-piece-compound-type">复合系</div>
            <div className="board-piece-number board-piece-compound-number">
              <span className="board-piece-compound-letter">{piece.compoundType}</span>
              <span>{compoundDisplayValue}</span>
            </div>
            <div className="board-piece-main board-piece-compound-main">
              <span className={`board-piece-name board-piece-compound-name ${compoundNameSizeClass}`}>
                {compoundName}
              </span>
            </div>
            <div className="board-piece-origin board-piece-compound-signature">
              <span>{getCompoundParentSignature(piece)}</span>
            </div>
          </button>
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

  const showsReducedPiece =
    reducePreview !== null &&
    reducePreview?.autoCollect !== true &&
    reducePreview?.clear !== true;

  const displayedFoodType =
    showsReducedPiece
      ? reducePreview?.foodType ?? foodType
      : foodType;

  const displayedPurity =
    showsReducedPiece
      ? reducePreview?.purity ?? null
      : piece.purity;


  const isMeat =
    displayedFoodType === "meat";


  const isVegetable =
    displayedFoodType === "vegetable";


  const isSeasoning =
    displayedFoodType === "seasoning";


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

  const equalClearPreview=reducePreview?.clear===true;
  const collectScorePreview =
    scoreMode &&
    autoCollectPreview &&
    !equalClearPreview &&
    scorePreview !== null;



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

    displayedPurity === "pure"

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

  const foodName = getFoodCardDisplayName(piece);





  // ==========================================================
  // 约分后的真实 foodType
  // ==========================================================

  const reduceResultFoodType =

    isMutationTarget

      ?

        mutationToType

      :

        reducePreview?.foodType
        ?? foodType;





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





  const originText = getFoodOriginDescription(piece, foodName);





  // ==========================================================
  // 当前真实类型 class
  // ==========================================================

  const typeClass =

    isOne

      ? "board-piece--one"

      : `board-piece--${displayedFoodType ?? "default"}`;





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
          "--combine-shift-x": `${Math.sign((animationState.targetIndex % 3) - (index % 3)) * 12}px`,
          "--combine-shift-y": `${Math.sign(Math.floor(animationState.targetIndex / 3) - Math.floor(index / 3)) * 10}px`
        }

      : undefined;





  return (

    <div

      className={`
        board-cell
        board-cell--occupied

        ${heaterTargetState === "available" ? "board-cell--heater-available" : ""}
        ${heaterTargetState === "unavailable" ? "board-cell--heater-unavailable" : ""}
        ${restoreTargetState === "available" ? "board-cell--restore-available" : ""}
        ${restoreTargetState === "unavailable" ? "board-cell--restore-unavailable" : ""}

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

        ${combinePreviewRole?`board-cell--combine-preview board-cell--combine-preview-${combinePreviewRole}`:""}

        ${nativeCellClass}

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

      <span className="board-native-label">{nativePositionLabel}</span>

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
              animationState.targetIndex === index &&
              animationState.combineKind === "new"
              ? "board-piece-wrapper--created"
              : ""
          }
        `}

      >



        {

          (isOne || collectScorePreview) &&
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

              ${
                collectScorePreview
                  ? `board-piece-score--collect-preview${scorePreview === 0 ? " board-piece-score--collect-repeat" : ""}`
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

            ${applyOneCandidate?"board-piece--apply-one-candidate":""}

            ${animationState?.type==="remove"&&animationState.index===index?"board-piece--remove-action":""}

            ${animationState?.type==="heater"?"board-piece--heating":""}

            ${animationState?.type==="restore"?"board-piece--restoring":""}

            ${animationState?.type==="super-heater"?"board-piece--super-heating":""}

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
                ? animationState.combineKind==="wrap"
                  ? animationState.drinkIndex===index
                    ? "board-piece--wrap-drink"
                    : "board-piece--wrap-ingredient-stay"
                  : "board-piece--combine-source"
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

            <>
              <div className="board-piece-selected-ring" />
              {selectionRole&&<span className={`board-piece-selection-role board-piece-selection-role--${selectionRole}`}>{selectionRole==="main"?"主料理":"搭配"}</span>}
            </>

          }


          {

            (
              showCombineCandidate ||
              showReduceCandidate ||
              showRemoveCandidate ||
              applyOneCandidate
            ) &&

            <div
              className="board-piece-candidate-markers"
              aria-hidden="true"
            >

              {
                showCombineCandidate &&
                <span className="board-piece-candidate-marker board-piece-candidate-marker--combine">
                  +
                </span>
              }

              {applyOneCandidate&&<span className="board-piece-candidate-marker board-piece-candidate-marker--apply-one">+1</span>}

              {
                showRemoveCandidate
                  ? <span className="board-piece-candidate-marker board-piece-candidate-marker--remove">✦</span>
                  : showReduceCandidate &&
                    <span className="board-piece-candidate-marker board-piece-candidate-marker--reduce">÷</span>
              }

            </div>

          }


          <div
            className="
              board-piece-type-bar
            "
          />

          {
            !isOne && displayedFoodType &&
            <span
              className="board-piece-cuisine-mark"
              aria-hidden="true"
            />
          }





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
                    : animationState?.type === "heater"
                      ? "board-piece-number--heated"
                      : animationState?.type === "restore"
                        ? "board-piece-number--restored"
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

          {isOne && piece.specialOne && <div className="board-piece-special-one">
            <strong>{piece.specialOne.kind==="key"?"🔑 点击领取":"+1 选择目标"}</strong>
            <span>{getSpecialOneName(piece.specialOne)}</span>
          </div>}

          {
            !isOne &&
            <div className={`board-piece-price${scoreMode ? " board-piece-locked-score" : ""}`}>
              {scoreMode
                ? `+${availableScore}`
                : price < 0
                  ? `-¥${Math.abs(price)}`
                  : `¥${price}`}
              {!scoreMode && price > 0 && priceDelta !== null && (
                <span className={priceDelta > 0 ? "board-piece-price-delta--up" : "board-piece-price-delta--down"}>
                  {priceDelta > 0 ? "↑" : "↓"}{Math.abs(priceDelta)}
                </span>
              )}
              {scoreMode && piece.singleFlavorPenalty === true && (
                <span className="board-piece-single-flavor">风味单一</span>
              )}
            </div>
          }





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
            className={`
              board-piece-main
              ${displayedFoodType === "drink" && piece.drinkOriginValue != null
                ? "board-piece-main--with-drink-origin"
                : ""}
            `}
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

            {displayedFoodType === "drink" && piece.drinkOriginValue != null && (
              <span className="board-piece-drink-origin">
                <span className="board-piece-drink-origin-label">原液</span>
                <strong className="board-piece-drink-origin-value">
                  {piece.drinkOriginValue}
                </strong>
              </span>
            )}


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

                {equalClearPreview?"一起清掉":reduceFoodName}

              </span>


              <span
                className="
                  board-piece-reduce-number
                "
              >

                {equalClearPreview?"清除":reduceResultValue}

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





          <div className="board-piece-origin">
            <span>{originText}</span>
          </div>


          {
            !isOne &&
            displayedFoodType &&

            <div className="board-piece-cuisine-type">
              {getFoodTypeShortName(displayedFoodType)}
            </div>
          }


        </button>


      </div>


    </div>

  );

}
