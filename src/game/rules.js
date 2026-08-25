import {
  gcd
} from "../utils/math";



// ============================================================
// 动物类型
//
// dog     = 狗系
// cat     = 猫系
// mammal  = 哺乳系
// bird    = 鸟系
//
// 狗 / 猫 / 哺乳
// 三种全部存在于主棋盘。
//
// bird 为特殊类型。
// ============================================================

export const ANIMAL_TYPES = {

  DOG:
    "dog",

  CAT:
    "cat",

  MAMMAL:
    "mammal",

  BIRD:
    "bird"

};





// ============================================================
// 纯度类型
//
// pure
// = 纯系
//
// mixed
// = 半纯系 / 混合系
//
// purity 只描述当前这一代的生成方式。
// 不追踪更早祖先。
// ============================================================

export const ANIMAL_PURITY = {

  PURE:
    "pure",

  MIXED:
    "mixed"

};





// ============================================================
// 是否可以约分
// ============================================================

export function canReduce(
  a,
  b
) {


  return gcd(
    a.value,
    b.value
  ) > 1;

}





// ============================================================
// 是否跨过101
//
// 判断原始相加值是否 > 101。
// ============================================================

export function isCrossing101(
  a,
  b
) {


  return (
    a + b > 101
  );

}





// ============================================================
// 判断组合后的数字
//
// a + b
//
// >101 时不断 -100
//
// 例如：
//
// 60 + 50 = 110
// → 10
//
// 101 + 101 = 202
// → 102
// → 2
// ============================================================

export function combineValue(
  a,
  b
) {


  let value =
    a + b;


  while(
    value > 101
  ){

    value -= 100;

  }


  return value;

}





// ============================================================
// 判断是否属于普通三系
//
// 普通三系：
//
// 狗
// 猫
// 哺乳
//
// 鸟不属于普通三系。
// ============================================================

export function isNormalAnimalType(
  animalType
) {


  return [

    ANIMAL_TYPES.DOG,

    ANIMAL_TYPES.CAT,

    ANIMAL_TYPES.MAMMAL

  ].includes(
    animalType
  );

}





// ============================================================
// 判断组合后的动物类型
//
// ============================================================
// 第一层：鸟系规则
// ============================================================
//
// 鸟 + 狗
// → 狗
//
// 鸟 + 猫
// → 猫
//
// 鸟 + 哺乳
// → 哺乳
//
// 鸟 + 鸟
// → 鸟
//
//
// ============================================================
// 第二层：普通跨101
// ============================================================
//
// 双方都属于：
//
// 狗 / 猫 / 哺乳
//
// 且原始相加值 > 101：
//
// → 鸟
//
//
// ============================================================
// 第三层：普通三循环
// ============================================================
//
// 同类：
//
// 狗 + 狗
// → 狗
//
// 猫 + 猫
// → 猫
//
// 哺乳 + 哺乳
// → 哺乳
//
//
// 异类：
//
// 狗 + 猫
// → 哺乳
//
// 猫 + 哺乳
// → 狗
//
// 哺乳 + 狗
// → 猫
// ============================================================

export function combineAnimalType(
  front,
  back
) {


  if(
    !front ||
    !back
  ){

    return null;

  }



  const frontType =
    front.animalType;


  const backType =
    back.animalType;



  if(
    !frontType ||
    !backType
  ){

    return null;

  }



  // ==========================================================
  // 1. 鸟 + 鸟
  // ==========================================================

  if(
    frontType === ANIMAL_TYPES.BIRD &&
    backType === ANIMAL_TYPES.BIRD
  ){


    return ANIMAL_TYPES.BIRD;

  }



  // ==========================================================
  // 2. 鸟 + 普通
  //
  // 结果继承普通类型。
  // ==========================================================

  if(
    frontType === ANIMAL_TYPES.BIRD &&
    isNormalAnimalType(
      backType
    )
  ){


    return backType;

  }



  if(
    backType === ANIMAL_TYPES.BIRD &&
    isNormalAnimalType(
      frontType
    )
  ){


    return frontType;

  }



  // ==========================================================
  // 3. 双方必须属于普通三系
  // ==========================================================

  const bothNormal =

    isNormalAnimalType(
      frontType
    )

    &&

    isNormalAnimalType(
      backType
    );



  if(
    !bothNormal
  ){


    return null;

  }



  // ==========================================================
  // 4. 普通 + 普通跨101
  //
  // → 鸟
  // ==========================================================

  const crossed101 =

    isCrossing101(

      front.value,

      back.value

    );



  if(
    crossed101
  ){


    return ANIMAL_TYPES.BIRD;

  }



  // ==========================================================
  // 5. 普通同类
  // ==========================================================

  if(
    frontType === backType
  ){


    return frontType;

  }



  // ==========================================================
  // 6. 狗 + 猫
  //
  // → 哺乳
  // ==========================================================

  if(
    (
      frontType === ANIMAL_TYPES.DOG &&
      backType === ANIMAL_TYPES.CAT
    )
    ||
    (
      frontType === ANIMAL_TYPES.CAT &&
      backType === ANIMAL_TYPES.DOG
    )
  ){


    return ANIMAL_TYPES.MAMMAL;

  }



  // ==========================================================
  // 7. 猫 + 哺乳
  //
  // → 狗
  // ==========================================================

  if(
    (
      frontType === ANIMAL_TYPES.CAT &&
      backType === ANIMAL_TYPES.MAMMAL
    )
    ||
    (
      frontType === ANIMAL_TYPES.MAMMAL &&
      backType === ANIMAL_TYPES.CAT
    )
  ){


    return ANIMAL_TYPES.DOG;

  }



  // ==========================================================
  // 8. 哺乳 + 狗
  //
  // → 猫
  // ==========================================================

  if(
    (
      frontType === ANIMAL_TYPES.MAMMAL &&
      backType === ANIMAL_TYPES.DOG
    )
    ||
    (
      frontType === ANIMAL_TYPES.DOG &&
      backType === ANIMAL_TYPES.MAMMAL
    )
  ){


    return ANIMAL_TYPES.CAT;

  }



  return null;

}





// ============================================================
// 判断组合后的纯度
//
// 只看当前这一代。
// 不读取父节点自己的 purity。
//
//
// 普通同类 + 同类
// → pure
//
// 普通异类生成第三类
// → mixed
//
// 最终是鸟系
// → null
//
// 鸟 + 普通
// → mixed
// ============================================================

export function combineAnimalPurity(
  front,
  back
) {


  if(
    !front ||
    !back
  ){

    return null;

  }



  const frontType =
    front.animalType;


  const backType =
    back.animalType;



  if(
    !frontType ||
    !backType
  ){

    return null;

  }



  const resultType =

    combineAnimalType(

      front,

      back

    );



  if(
    !resultType
  ){

    return null;

  }



  // ==========================================================
  // 鸟系当前不参与纯度
  // ==========================================================

  if(
    resultType === ANIMAL_TYPES.BIRD
  ){


    return null;

  }



  // ==========================================================
  // 普通同类生成同类
  //
  // → pure
  // ==========================================================

  if(
    isNormalAnimalType(
      frontType
    )
    &&
    isNormalAnimalType(
      backType
    )
    &&
    frontType === backType
    &&
    resultType === frontType
  ){


    return ANIMAL_PURITY.PURE;

  }



  // ==========================================================
  // 其他生成普通三系的情况
  //
  // → mixed
  // ==========================================================

  if(
    isNormalAnimalType(
      resultType
    )
  ){


    return ANIMAL_PURITY.MIXED;

  }



  return null;

}





// ============================================================
// 判断两个棋子是否拥有相同“动物身份”
//
// 当前身份由：
//
// value + animalType
//
// 两部分共同决定。
//
//
// 例如：
//
// 狗2 ≠ 猫2
//
// 狗2 = 狗2
//
//
// 当前暂时不比较 purity。
//
// 所以：
//
// 纯狗2
// 半纯狗2
//
// 在组合限制中仍视为同一种：
//
// 狗2
// ============================================================

export function isSameAnimalIdentity(
  a,
  b
) {


  if(
    !a ||
    !b
  ){

    return false;

  }



  return (

    a.value === b.value

    &&

    a.animalType === b.animalType

  );

}





// ============================================================
// 判断某个棋子的直接父母中
// 是否存在指定棋子
//
// 必须：
//
// value 相同
// +
// animalType 相同
//
// 才视为真正的父母。
// ============================================================

export function hasParentAnimal(
  child,
  candidate
) {


  if(
    !child ||
    !candidate
  ){

    return false;

  }



  // ==========================================================
  // 新版数据：
//
// parentAnimals 保存完整动物身份。
// ==========================================================

  if(
    Array.isArray(
      child.parentAnimals
    )
  ){


    return child.parentAnimals.some(

      parent =>

        isSameAnimalIdentity(

          parent,

          candidate

        )

    );

  }



  // ==========================================================
  // 更早的纯数字历史数据兼容
  // ==========================================================

  if(
    Array.isArray(
      child.parents
    )
  ){


    return child.parents.includes(
      candidate.value
    );

  }



  return false;

}





// ============================================================
// 判断是否已经存在同父母孩子
//
// 新规则比较完整动物身份：
//
// 狗2 + 猫3
//
// value + animalType
//
// 顺序无关。
// ============================================================

export function hasSameParents(
  numbers,
  a,
  b
) {


  if(
    !Array.isArray(
      numbers
    ) ||
    !a ||
    !b
  ){

    return false;

  }



  return numbers.some(

    item => {


      // ======================================================
      // 新版读取 parentAnimals
      // ======================================================

      if(
        Array.isArray(
          item.parentAnimals
        ) &&
        item.parentAnimals.length >= 2
      ){


        const p1 =
          item.parentAnimals[0];


        const p2 =
          item.parentAnimals[1];



        if(
          !p1 ||
          !p2
        ){

          return false;

        }



        const sameForward =

          isSameAnimalIdentity(
            p1,
            a
          )

          &&

          isSameAnimalIdentity(
            p2,
            b
          );



        const sameBackward =

          isSameAnimalIdentity(
            p1,
            b
          )

          &&

          isSameAnimalIdentity(
            p2,
            a
          );



        return (

          sameForward ||
          sameBackward

        );

      }



      // ======================================================
      // 更早的纯数字历史数据兼容
      // ======================================================

      if(
        !Array.isArray(
          item.parents
        ) ||
        item.parents.length < 2
      ){

        return false;

      }



      const p1 =
        item.parents[0];


      const p2 =
        item.parents[1];



      return (

        (
          p1 === a.value &&
          p2 === b.value
        )

        ||

        (
          p1 === b.value &&
          p2 === a.value
        )

      );

    }

  );

}





// ============================================================
// 判断两个棋子之间是否存在“组合关系”
//
// 只判断关系本身。
// 不考虑棋盘有没有空位。
// ============================================================

export function canCombineRelation(
  a,
  b,
  numbers
) {


  if(
    !a ||
    !b
  ){

    return false;

  }



  // ==========================================================
  // 不能和自己的真正父母再次组合
  //
// value + animalType
// 必须全部一样才算父母。
// ==========================================================

  if(
    hasParentAnimal(
      a,
      b
    )
  ){


    return false;

  }



  if(
    hasParentAnimal(
      b,
      a
    )
  ){


    return false;

  }



  // ==========================================================
  // 已存在同父母孩子
  // ==========================================================

  if(
    hasSameParents(
      numbers,
      a,
      b
    )
  ){


    return false;

  }



  return true;

}





// ============================================================
// 判断当前是否真的可以执行组合
//
// 当前主棋盘为九宫格。
// ============================================================

export function canCombine(
  a,
  b,
  numbers
) {


  // ==========================================================
  // 满9格禁止实际组合
  // ==========================================================

  if(
    numbers.length >= 9
  ){

    return false;

  }



  return canCombineRelation(
    a,
    b,
    numbers
  );

}