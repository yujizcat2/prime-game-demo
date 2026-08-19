import {
  useState
} from "react";

import StartScreen from "./components/StartScreen";
import NumberList from "./components/NumberList";
import ActionButtons from "./components/ActionButtons";
import ActionHintPanel from "./components/ActionHintPanel";
import CollectionPanel from "./components/CollectionPanel";
import StepPanel from "./components/StepPanel";
import GameOver from "./components/GameOver";

import TestLab from "./components/TestLab";

import useGame from "./hooks/useGame";


function App() {


  const game =
    useGame();



  // =========================
  // 页面
  // =========================

  const [
    page,
    setPage
  ] = useState("game");



  // =========================
  // 正在消除的数字
  // 仅用于动画
  // =========================

  const [
    removingId,
    setRemovingId
  ] = useState(null);



  // =========================
  // 消除动画
  // =========================

  function handleRemoveOne(id) {


    if (
      removingId !== null
    ) {

      return;

    }


    setRemovingId(id);


    // 先播放离场动画
    // 再真正执行游戏逻辑

    window.setTimeout(
      () => {

        game.removeOne(id);

        setRemovingId(null);

      },
      300
    );

  }





  // =========================
  // 测试实验室
  // =========================

  if (
    page === "test"
  ) {

    return (

      <TestLab

        onBack={() =>
          setPage("game")
        }

      />

    );

  }





  // =========================
  // 开始界面
  // =========================

  if (
    !game.started
  ) {

    return (

      <StartScreen

        onStart={
          game.startGame
        }

        onOpenTest={() =>
          setPage("test")
        }

      />

    );

  }





  return (

    <div

      className="
        min-h-screen

        bg-[#f3f5f8]

        px-4
        pt-6
        pb-14
      "

    >


      <div

        className="
          w-full
          max-w-xl
          mx-auto
        "

      >



        {/* =========================
            标题
            ========================= */}

        <div

          className="
            flex
            items-center
            justify-between

            px-2
            mb-5
          "

        >


          <div>

            <h1

              className="
                text-2xl
                font-black

                tracking-tight

                text-gray-800
              "

            >

              PRIME GAME

            </h1>


            <div

              className="
                text-[11px]

                tracking-[0.24em]

                text-gray-400

                mt-0.5
              "

            >

              NUMBER LABYRINTH

            </div>

          </div>



          <div

            className="
              w-11
              h-11

              rounded-2xl

              bg-white

              shadow-sm

              flex
              items-center
              justify-center

              text-gray-400
            "

          >

            ✦

          </div>


        </div>





        {/* =========================
            HUD
            ========================= */}

        <StepPanel

          steps={
            game.steps
          }

          stepLimit={
            game.stepLimit
          }

          score={
            game.score
          }

          gameOver={
            game.gameOver
          }

          checkpointPending={
            game.checkpointPending
          }

          checkpointRequiredScore={
            game.checkpointRequiredScore
          }

          checkpointNumber={
            game.checkpointNumber
          }

        />





        {/* =========================
            动作提示
            ========================= */}

        <div

          className="
            mt-3
          "

        >

          <ActionHintPanel

            numbers={
              game.numbers
            }

            selected={
              game.selected
            }

          />

        </div>





        {/* =========================
            主棋盘外层间距
            ========================= */}

        <div

          className="
            pt-16
          "

        >


          {/* =========================
              主棋盘
              ========================= */}

          <div

            className="
              game-board

              rounded-[38px]

              bg-white

              border
              border-white

              shadow-[0_16px_50px_rgba(15,23,42,0.08)]

              px-4
              py-7
            "

          >

            <NumberList

              numbers={
                game.numbers
              }

              selected={
                game.selected
              }

              preview={
                game.preview
              }

              onSelect={
                game.selectNumber
              }

              collection={
                game.collection
              }

              removingId={
                removingId
              }

            />

          </div>


        </div>





        {/* =========================
            操作按钮
            ========================= */}

        <div

          className="
            mt-6
          "

        >

          <ActionButtons

            numbers={
              game.numbers
            }

            selected={
              game.selected
            }

            preview={
              game.preview
            }

            onCombine={
              game.combineNumbers
            }

            onReduce={
              game.reduceNumbers
            }

            onRemoveOne={
              handleRemoveOne
            }

            gameOver={
              game.gameOver
            }

            removingId={
              removingId
            }

          />

        </div>





        {/* =========================
            收藏 / 发现记录
            ========================= */}

        <CollectionPanel

          collection={
            game.collection
          }

        />


      </div>





      {/* =========================
          Game Over
          ========================= */}

      {

        game.gameOver &&

        <GameOver

          steps={
            game.steps
          }

          stepLimit={
            game.stepLimit
          }

          score={
            game.score
          }

          collection={
            game.collection
          }

          onRestart={() =>
            window.location.reload()
          }

        />

      }


    </div>

  );

}


export default App;