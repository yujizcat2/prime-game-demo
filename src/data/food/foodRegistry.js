// src/data/food/foodRegistry.js


import {
  getVegetableName
} from "./vegetableData";


import {
  getMeatName
} from "./meatData";


import {
  getSeasoningName
} from "./seasoningData";


import {
  getDessertName
} from "./dessertData";





// ============================================================
// 食物名称统一入口
//
// foodType:
//
// meat     = 荤系
// vegetable     = 素系
// seasoning  = 调料系
// dessert    = 甜食系
//
// 数字 value 决定该系中的具体食物。
// ============================================================

export function getFoodName(
  value,
  foodType
) {


  switch (
    foodType
  ) {


    case "meat":

      return getMeatName(
        value
      );



    case "vegetable":

      return getVegetableName(
        value
      );



    case "seasoning":

      return getSeasoningName(
        value
      );



    case "dessert":

      return getDessertName(
        value
      );



    default:

      return String(
        value
      );

  }

}





// ============================================================
// 棋子展示名称
//
// BoardCell、料理包和来源路径统一走这里，避免同一个历史节点
// 因展示位置不同而得到不同名称。foodType 优先读取节点自身，
// 只有旧记录缺少类型时才使用调用方提供的回退类型。
// ============================================================

export function getFoodDisplayName(
  item,
  fallbackFoodType = null
){


  if(
    item?.value == null
  ){


    return null;

  }



  if(
    item.value === 1
  ){


    return "水";

  }



  return getFoodName(

    item.value,

    item.foodType
    ?? item.type
    ?? fallbackFoodType

  );

}





// ============================================================
// 食物系名称
// ============================================================

export function getFoodTypeName(
  foodType
) {


  switch (
    foodType
  ) {


    case "meat":

      return "荤系";



    case "vegetable":

      return "素系";



    case "seasoning":

      return "调料系";



    case "dessert":

      return "甜食系";



    default:

      return "";

  }

}





// ============================================================
// 食物系简称
//
// 主要用于收藏、状态等空间较小的 UI。
// ============================================================

export function getFoodTypeShortName(
  foodType
) {


  switch (
    foodType
  ) {


    case "meat":

      return "荤";



    case "vegetable":

      return "素";



    case "seasoning":

      return "调料";



    case "dessert":

      return "甜食";



    default:

      return "";

  }

}





// ============================================================
// 食物系图标
// ============================================================

export function getFoodTypeIcon(
  foodType
) {


  switch (
    foodType
  ) {


    case "meat":

      return "🍖";



    case "vegetable":

      return "🥬";



    case "seasoning":

      return "🧂";



    case "dessert":

      return "🍰";



    default:

      return "";

  }

}
