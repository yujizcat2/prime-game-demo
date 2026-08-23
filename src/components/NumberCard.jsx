import {
  isPrime
} from "../game/prime";

import {
  getMeatName
} from "../data/food/meatData";

import {
  getVegetableName
} from "../data/food/vegetableData";

import {
  getDessertName
} from "../data/food/dessertData";

import {
  getSeasoningName
} from "../data/food/seasoningData";

import "./NumberCard.css";





function getFoodName(
  value,
  foodType
) {


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





export default function NumberCard({

  item,

  selected = false,

  reduceCandidate = false,

  displayMode = "food",

  onClick,

  reducePreview = null,

  isNewDiscovery = false,

  scorePreview = null,

  discovered = false,

  removing = false,

}) {


  if(

    !item ||

    typeof item !== "object" ||

    item.value === undefined ||

    item.value === null

  ){

    return null;

  }



  const value =
    item.value;


  const foodType =
    item.foodType ?? null;


  const isMeat =
    foodType === "meat";


  const isVegetable =
    foodType === "vegetable";


  const isDessert =
    foodType === "dessert";


  const isOne =
    value === 1;


  const isReducing =
    reducePreview !== null;


  const prime =
    isPrime(
      value
    );



  const showReduceCandidate =

    reduceCandidate &&

    !selected &&

    !removing &&

    !isReducing;



  const foodName =

    getFoodName(
      value,
      foodType
    );



  const reduceFoodName =

    isReducing &&
    reducePreview !== 1

      ?

      getFoodName(
        reducePreview,
        foodType
      )

      :

      null;



  const parentFoodNames =

    Array.isArray(
      item.parentFoods
    ) &&
    item.parentFoods.length >= 2

      ?

      item.parentFoods.map(

        parent => {


          if(

            !parent ||

            parent.value === undefined ||

            parent.value === null

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



  const onePreviousRecord =

    isOne &&
    item.origin?.type === "reduce"

      ?

      item.origin.parent

      :

      null;


  const onePreviousValue =

    onePreviousRecord?.value
    ?? null;



  const seasoningName =

    onePreviousValue !== null

      ?

      getSeasoningName(
        onePreviousValue
      )

      :

      null;



  const typeLabel =

    isMeat

      ? "荤"

      : isVegetable

      ? "素"

      : isDessert

      ? "甜"

      : "";



  const typeClass =

    isOne

      ? "food-card--seasoning"

      : isVegetable

      ? "food-card--vegetable"

      : isMeat

      ? "food-card--meat"

      : isDessert

      ? "food-card--dessert"

      : "food-card--default";



  const modeClass =

    displayMode === "number"

      ? "food-card--number-mode"

      : "food-card--food-mode";





  return (

    <div

      className={`
        food-card-wrapper

        ${
          removing

            ? "food-card-wrapper--removing"

            : "food-card-wrapper--enter"
        }
      `}

    >



      {

        isOne &&
        selected &&
        scorePreview !== null &&

        <div

          className={`
            food-card-score

            ${
              removing

                ? "food-card-score--fly"

                : "food-card-score--preview"
            }

            ${
              isNewDiscovery

                ? "food-card-score--new"

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
          className="food-card-remove-flash"
        />

      }





      <button

        type="button"

        onClick={
          removing
            ? undefined
            : onClick
        }

        disabled={
          removing
        }

        className={`
          food-card

          ${typeClass}

          ${modeClass}

          ${
            selected &&
            !removing

              ? "food-card--selected"

              : ""
          }

          ${
            isReducing &&
            !removing

              ? "food-card--reducing"

              : ""
          }

          ${
            removing

              ? "food-card--remove"

              : ""
          }

          ${
            isOne &&
            isNewDiscovery

              ? "food-card--new-seasoning"

              : ""
          }
        `}

      >



        {

          selected &&
          !removing &&

          <div
            className="
              food-card-selected-ring
            "
          />

        }



        <div
          className="food-card-highlight"
        />



        <div

          className={`
            food-card-number

            ${
              showReduceCandidate

                ? "food-card-number--reduce-candidate"

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
            className="food-card-prime"
          />

        }



        {

          discovered &&
          !isOne &&

          <div
            className="food-card-discovered"
          >

            ✦

          </div>

        }



        {

          isOne &&

          <div
            className="food-card-discovered"
          >

            ✦

          </div>

        }



        <div
          className="food-card-main"
        >

          <span

            className={`
              food-card-name

              ${
                isReducing

                  ? "food-card-name--reducing"

                  : ""
              }
            `}

          >

            {
              isOne

                ? seasoningName ?? "调料"

                : foodName
            }

          </span>

        </div>



        {

          isReducing &&
          !removing &&

          <div
            className="
              food-card-reduce-preview
            "
          >

            <span
              className="
                food-card-reduce-name
              "
            >

              {
                reducePreview === 1

                  ? seasoningName ?? "调料"

                  : reduceFoodName
              }

            </span>


            <span
              className="
                food-card-reduce-number
              "
            >

              {reducePreview}

            </span>

          </div>

        }



        {

          !isOne &&
          !parentFoodNames &&

          <div
            className="
              food-card-meta
            "
          >

            {typeLabel}

          </div>

        }



        {

          parentFoodNames &&
          parentFoodNames[0] &&
          parentFoodNames[1] &&

          <div
            className="
              food-card-origin
            "
          >

            <span>
              {parentFoodNames[0]}
            </span>


            <span
              className="
                food-card-origin-plus
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

          isOne &&
          onePreviousValue !== null &&
          seasoningName &&

          <div
            className="
              food-card-origin
            "
          >

            <span>
              {seasoningName}
            </span>


            <span
              className="
                food-card-origin-plus
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

  );

}