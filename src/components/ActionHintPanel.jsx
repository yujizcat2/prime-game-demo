import {
  getActionStatus
} from "../game/actionStatus";


export default function ActionHintPanel({

  numbers,

  selected

}) {


  const status =

    getActionStatus(

      numbers,

      selected

    );



  let message =
    "选择两个数字";



  // ==========================================================
  // 选中1
  // ==========================================================

  if(
    status.type === "one"
  ){

    message =
      "消除它，获得奖励";

  }



  // ==========================================================
  // 只选一个普通数字
  // ==========================================================

  else if(
    status.type === "single"
  ){

    message =
      "再选一个数字";

  }



  // ==========================================================
  // 选择两个数字
  // ==========================================================

  else if(
    status.type === "pair"
  ){


    const {

      combine,

      reduce

    } = status;



    // ========================================================
    // 两个都可以
    // ========================================================

    if(
      combine.allowed &&
      reduce.allowed
    ){

      message =
        `可以合成 ${combine.result}，也可以一起变小`;

    }



    // ========================================================
    // 可以合成，但不能约分
    // ========================================================

    else if(
      combine.allowed &&
      !reduce.allowed
    ){

      message =
        `可以合成 ${combine.result}，但不能一起变小`;

    }



    // ========================================================
    // 合成失败
    //
    // 无论能不能约分，
    // 都优先显示“为什么不能合成”
    // ========================================================

    else if(
      !combine.allowed
    ){

      message =
        combine.reason;

    }



    // ========================================================
    // 兜底
    // ========================================================

    else{

      message =
        "这两个数字现在不能这样操作";

    }

  }



  return (

    <div

      className="
        relative

        w-full
        h-12

        flex
        items-center
        justify-center

        rounded-2xl

        bg-white

        border
        border-gray-100

        shadow-[0_4px_14px_rgba(15,23,42,0.035)]

        px-4

        overflow-hidden
      "

    >



      {/* =========================
          TIP
          ========================= */}

      <div

        className="
          absolute
          left-3

          h-7

          px-2.5

          flex
          items-center

          gap-1.5

          rounded-xl

          bg-gray-50

          border
          border-gray-100

          text-gray-400

          pointer-events-none
        "

      >


        <span

          className="
            text-[12px]
            leading-none
          "

        >

          ✦

        </span>


        <span

          className="
            text-[9px]

            font-bold

            tracking-[0.14em]
          "

        >

          TIP

        </span>


      </div>



      {/* =========================
          提示文字
          ========================= */}

      <div

        className="
          max-w-[68%]

          truncate

          text-center

          text-[13px]
          font-medium

          text-gray-500

          transition-all
          duration-200
        "

      >

        {message}

      </div>


    </div>

  );

}