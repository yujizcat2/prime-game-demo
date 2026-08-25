// src/data/animal/animalRegistry.js


import {
  getCatName
} from "./catData";


import {
  getDogName
} from "./dogData";


import {
  getMammalName
} from "./mammalData";


import {
  getBirdName
} from "./birdData";





// ============================================================
// 动物名称统一入口
//
// animalType:
//
// dog     = 狗系
// cat     = 猫系
// mammal  = 哺乳系
// bird    = 鸟系
//
// 数字 value 决定该系中的具体动物。
// ============================================================

export function getAnimalName(
  value,
  animalType
) {


  switch (
    animalType
  ) {


    case "dog":

      return getDogName(
        value
      );



    case "cat":

      return getCatName(
        value
      );



    case "mammal":

      return getMammalName(
        value
      );



    case "bird":

      return getBirdName(
        value
      );



    default:

      return String(
        value
      );

  }

}





// ============================================================
// 动物系名称
// ============================================================

export function getAnimalTypeName(
  animalType
) {


  switch (
    animalType
  ) {


    case "dog":

      return "狗系";



    case "cat":

      return "猫系";



    case "mammal":

      return "哺乳系";



    case "bird":

      return "鸟系";



    default:

      return "";

  }

}





// ============================================================
// 动物系简称
//
// 主要用于收藏、状态等空间较小的 UI。
// ============================================================

export function getAnimalTypeShortName(
  animalType
) {


  switch (
    animalType
  ) {


    case "dog":

      return "狗";



    case "cat":

      return "猫";



    case "mammal":

      return "哺乳";



    case "bird":

      return "鸟";



    default:

      return "";

  }

}





// ============================================================
// 动物系图标
// ============================================================

export function getAnimalTypeIcon(
  animalType
) {


  switch (
    animalType
  ) {


    case "dog":

      return "🐶";



    case "cat":

      return "🐱";



    case "mammal":

      return "🐼";



    case "bird":

      return "🐦";



    default:

      return "";

  }

}