import {
  gcd
} from "../utils/math";



// ============================================================
// 食物类型
//
// meat       = 荤系
// vegetable  = 素系
// seasoning  = 调料系
// dessert    = 甜食系
//
// 荤 / 素 / 调料
// 三种全部存在于主棋盘。
//
// dessert 为特殊类型。
// ============================================================

export const FOOD_TYPES = {

  MEAT:
    "meat",

  VEGETABLE:
    "vegetable",

  SEASONING:
    "seasoning",

  DESSERT:
    "dessert"

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
// purity只描述当前这一代的生成方式。
// 不追踪更早祖先。
// ============================================================

export const FOOD_PURITY = {

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
// 判断合成后的数字
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
// 荤
// 素
// 调料
//
// 甜食不属于普通三系。
// ============================================================

export function isNormalFoodType(
  foodType
) {


  return [

    FOOD_TYPES.MEAT,

    FOOD_TYPES.VEGETABLE,

    FOOD_TYPES.SEASONING

  ].includes(
    foodType
  );

}





// ============================================================
// 判断合成后的料理类型
//
// ============================================================
// 第一层：甜食规则
// ============================================================
//
// 甜食 + 荤
// → 荤
//
// 甜食 + 素
// → 素
//
// 甜食 + 调料
// → 调料
//
// 甜食 + 甜食
// → 甜食
//
//
// ============================================================
// 第二层：普通跨101
// ============================================================
//
// 双方都属于：
//
// 荤 / 素 / 调料
//
// 且原始相加值 > 101：
//
// → 甜食
//
//
// ============================================================
// 第三层：普通三循环
// ============================================================
//
// 同类：
//
// 荤 + 荤
// → 荤
//
// 素 + 素
// → 素
//
// 调料 + 调料
// → 调料
//
//
// 异类：
//
// 荤 + 素
// → 调料
//
// 素 + 调料
// → 荤
//
// 调料 + 荤
// → 素
// ============================================================

export function combineFoodType(
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
    front.foodType;


  const backType =
    back.foodType;



  if(
    !frontType ||
    !backType
  ){

    return null;

  }



  // ==========================================================
  // 1. 甜食 + 甜食
  // ==========================================================

  if(
    frontType === FOOD_TYPES.DESSERT &&
    backType === FOOD_TYPES.DESSERT
  ){


    return FOOD_TYPES.DESSERT;

  }



  // ==========================================================
  // 2. 甜食 + 普通
  //
  // 结果继承普通类型。
  // ==========================================================

  if(
    frontType === FOOD_TYPES.DESSERT &&
    isNormalFoodType(
      backType
    )
  ){


    return backType;

  }



  if(
    backType === FOOD_TYPES.DESSERT &&
    isNormalFoodType(
      frontType
    )
  ){


    return frontType;

  }



  // ==========================================================
  // 3. 双方必须属于普通三系
  // ==========================================================

  const bothNormal =

    isNormalFoodType(
      frontType
    )

    &&

    isNormalFoodType(
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
  // → 甜食
  // ==========================================================

  const crossed101 =

    isCrossing101(

      front.value,

      back.value

    );



  if(
    crossed101
  ){


    return FOOD_TYPES.DESSERT;

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
  // 6. 荤 + 素
  //
  // → 调料
  // ==========================================================

  if(
    (
      frontType === FOOD_TYPES.MEAT &&
      backType === FOOD_TYPES.VEGETABLE
    )
    ||
    (
      frontType === FOOD_TYPES.VEGETABLE &&
      backType === FOOD_TYPES.MEAT
    )
  ){


    return FOOD_TYPES.SEASONING;

  }



  // ==========================================================
  // 7. 素 + 调料
  //
  // → 荤
  // ==========================================================

  if(
    (
      frontType === FOOD_TYPES.VEGETABLE &&
      backType === FOOD_TYPES.SEASONING
    )
    ||
    (
      frontType === FOOD_TYPES.SEASONING &&
      backType === FOOD_TYPES.VEGETABLE
    )
  ){


    return FOOD_TYPES.MEAT;

  }



  // ==========================================================
  // 8. 调料 + 荤
  //
  // → 素
  // ==========================================================

  if(
    (
      frontType === FOOD_TYPES.SEASONING &&
      backType === FOOD_TYPES.MEAT
    )
    ||
    (
      frontType === FOOD_TYPES.MEAT &&
      backType === FOOD_TYPES.SEASONING
    )
  ){


    return FOOD_TYPES.VEGETABLE;

  }



  return null;

}





// ============================================================
// 判断合成后的纯度
//
// 只看当前这一代。
// 不读取父节点自己的purity。
//
//
// 普通同类 + 同类
// → pure
//
// 普通异类生成第三类
// → mixed
//
// 最终是甜食
// → null
//
// 甜食 + 普通
// → mixed
// ============================================================

export function combineFoodPurity(
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
    front.foodType;


  const backType =
    back.foodType;



  if(
    !frontType ||
    !backType
  ){

    return null;

  }



  const resultType =

    combineFoodType(

      front,

      back

    );



  if(
    !resultType
  ){

    return null;

  }



  // ==========================================================
  // 甜食当前不参与纯度
  // ==========================================================

  if(
    resultType === FOOD_TYPES.DESSERT
  ){


    return null;

  }



  // ==========================================================
  // 普通同类生成同类
  //
  // → pure
  // ==========================================================

  if(
    isNormalFoodType(
      frontType
    )
    &&
    isNormalFoodType(
      backType
    )
    &&
    frontType === backType
    &&
    resultType === frontType
  ){


    return FOOD_PURITY.PURE;

  }



  // ==========================================================
  // 其他生成普通三系的情况
  //
  // → mixed
  // ==========================================================

  if(
    isNormalFoodType(
      resultType
    )
  ){


    return FOOD_PURITY.MIXED;

  }



  return null;

}





// ============================================================
// 判断两个棋子是否拥有相同“料理身份”
//
// 当前身份由：
//
// value + foodType
//
// 两部分共同决定。
//
//
// 例如：
//
// 肉2 ≠ 素2
//
// 肉2 = 肉2
//
//
// 当前暂时不比较purity。
//
// 所以：
//
// 纯肉2
// 半纯肉2
//
// 在组合限制中仍视为同一种：
//
// 肉2
// ============================================================

export function isSameFoodIdentity(
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

    a.foodType === b.foodType

  );

}





// ============================================================
// 判断某个棋子的直接父母中
// 是否存在指定棋子
//
// 新规则：
//
// 必须：
//
// value相同
// +
// foodType相同
//
// 才视为真正的父母。
//
//
// 例如：
//
// 子节点父母之一是：
//
// 肉2
//
// 当前棋子：
//
// 素2
//
// 虽然数字都是2，
// 但不是同一个料理身份，
//
// → 可以合成。
// ============================================================

export function hasParentFood(
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
  // 优先使用parentFoods。
  // ==========================================================

  if(
    Array.isArray(
      child.parentFoods
    )
  ){


    return child.parentFoods.some(

      parent =>

        isSameFoodIdentity(

          parent,

          candidate

        )

    );

  }



  // ==========================================================
  // 旧数据兼容
  //
  // 如果历史节点没有parentFoods，
  // 才退回旧的纯数字判断。
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
//
// 旧规则：
//
// 只比较数字：
//
// 2 + 3
//
//
// 新规则：
//
// 比较完整料理身份：
//
// 肉2 + 素3
//
//
// 因此：
//
// 肉2 + 素3
// 已经生成
//
// 再次：
//
// 肉2 + 素3
// → 禁止
//
//
// 但是：
//
// 素2 + 肉3
// → 允许
//
//
// 调料2 + 素3
// → 允许
//
//
// 顺序仍然无关。
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
      // 新版优先读取parentFoods
      // ======================================================

      if(
        Array.isArray(
          item.parentFoods
        ) &&
        item.parentFoods.length >= 2
      ){


        const p1 =
          item.parentFoods[0];


        const p2 =
          item.parentFoods[1];



        if(
          !p1 ||
          !p2
        ){

          return false;

        }



        // ====================================================
        // 正向
        //
        // p1 = a
        // p2 = b
        // ====================================================

        const sameForward =

          isSameFoodIdentity(
            p1,
            a
          )

          &&

          isSameFoodIdentity(
            p2,
            b
          );



        // ====================================================
        // 反向
        //
        // p1 = b
        // p2 = a
        //
        // 合成顺序无关。
        // ====================================================

        const sameBackward =

          isSameFoodIdentity(
            p1,
            b
          )

          &&

          isSameFoodIdentity(
            p2,
            a
          );



        return (

          sameForward ||
          sameBackward

        );

      }



      // ======================================================
      // 旧节点兼容
      //
      // 如果没有parentFoods，
      // 才使用旧parents数字数据。
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
// 判断两个棋子之间是否存在“合成关系”
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
  // 不能和自己的真正父母再次合成
  //
  // 新版判断：
  //
  // value + foodType
  //
  // 必须全部一样才算父母。
  //
  // 例如：
  //
  // 父母是：
  // 肉2
  //
  // 当前遇到：
  // 素2
  //
  // → 不算父母
  // → 可以合成
  // ==========================================================

  if(
    hasParentFood(
      a,
      b
    )
  ){


    return false;

  }



  if(
    hasParentFood(
      b,
      a
    )
  ){


    return false;

  }



  // ==========================================================
  // 已存在同父母孩子
  //
  // 新版：
  //
  // 必须两个父母的：
  //
  // value
  // foodType
  //
  // 都完全对应，
  // 才算重复组合。
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
// 判断当前是否真的可以执行合成
//
// 当前主棋盘为九宫格。
// ============================================================

export function canCombine(
  a,
  b,
  numbers
) {


  // ==========================================================
  // 满9格禁止实际合成
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