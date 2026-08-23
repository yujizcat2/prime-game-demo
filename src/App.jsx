import {
  useState
} from "react";

import "./App.css";

import StartScreen from "./components/StartScreen";
import NumberList from "./components/NumberList";
import SeasoningTray from "./components/SeasoningTray";
import ActionButtons from "./components/ActionButtons";
import ActionHintPanel from "./components/ActionHintPanel";
import CollectionPanel from "./components/CollectionPanel";
import StepPanel from "./components/StepPanel";
import Discovery from "./components/Discovery";
import BoardStatus from "./components/BoardStatus";
import GameOver from "./components/GameOver";

import useGame from "./hooks/useGame";

import {
  getActivityStatus
} from "./game/activityStatus";


function App() {


  const game =
    useGame();



  // =========================
  // 卡片显示模式
  //
  // food
  // 菜名大 / 数字小
  //
  // number
  // 数字大 / 菜名小
  // =========================

  const [
    cardDisplayMode,
    setCardDisplayMode
  ] = useState("food");



  // =========================
  // 正在消除的数字
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


    window.setTimeout(
      () => {

        game.removeOne(id);

        setRemovingId(null);

      },
      300
    );

  }





  // =========================
  // 切换卡片显示模式
  // =========================

  function toggleCardDisplayMode() {


    setCardDisplayMode(

      current =>

        current === "food"

          ? "number"

          : "food"

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

      />

    );

  }





  // =========================
  // 活性状态
  // =========================

  const activityStatus =
    getActivityStatus(
      game.numbers,
      game.primeDensity
    );





  return (

    <div
      className="
        game-page
      "
    >


      <div
        className="
          game-shell
        "
      >



        {/* =========================
            顶部标题
            ========================= */}

        <header
          className="
            game-header
          "
        >


          <div>


            <div
              className="
                game-header-kicker
              "
            >

              PRIME KITCHEN

            </div>


            <h1
              className="
                game-header-title
              "
            >

              料理迷宫

            </h1>


          </div>



          <div
            className="
              game-header-status
            "
          >

            <span>

              LABYRINTH

            </span>


            <span
              className="
                game-header-dot
              "
            />

          </div>


        </header>





        {/* =========================
            顶部状态
            ========================= */}

        <section
          className="
            game-top-status
          "
        >


          <StepPanel

            steps={
              game.steps
            }

            score={
              game.score
            }

          />



          <Discovery

            collection={
              game.collection
            }

          />


        </section>





        {/* =========================
            Tips + 活性
            ========================= */}

        <section
          className="
            game-info-row
          "
        >


          <div
            className="
              game-info-item
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



          <div
            className="
              game-info-item
            "
          >

            <BoardStatus

              primeEnergy={
                game.primeEnergy
              }

              primeDensity={
                game.primeDensity
              }

              primeState={
                game.primeState
              }

              activity={
                activityStatus.activity
              }

              activityScore={
                activityStatus.activityScore
              }

              activityMax={
                activityStatus.activityMax
              }

              activityLegal={
                activityStatus.legal
              }

              activityTotal={
                activityStatus.total
              }

              activityCombineLegal={
                activityStatus.combineLegal
              }

              activityCombineTotal={
                activityStatus.combineTotal
              }

              activityCombinePrimeLegal={
                activityStatus.combinePrimeLegal
              }

              activityCombineNormalLegal={
                activityStatus.combineNormalLegal
              }

              activityReduceLegal={
                activityStatus.reduceLegal
              }

              activityReduceTotal={
                activityStatus.reduceTotal
              }

            />

          </div>


        </section>





        {/* =========================
            主菜台
            ========================= */}

        <section
          className="
            game-board-section
          "
        >


          <div
            className="
              game-section-header
              game-board-section-header
            "
          >


            <div
              className="
                game-section-title
              "
            >

              主菜台

            </div>



            <div
              className="
                game-section-line
              "
            />



            {/* =====================
                卡片模式切换
                ===================== */}

            <button

              type="button"

              className="
                game-card-mode-toggle
              "

              onClick={
                toggleCardDisplayMode
              }

              aria-label="切换主菜卡显示模式"

            >


              <span
                className="
                  game-card-mode-toggle-label
                "
              >

                {
                  cardDisplayMode === "food"

                    ? "料理"

                    : "数字"
                }

              </span>


              <span
                className="
                  game-card-mode-toggle-icon
                "
              >

                ⇄

              </span>


            </button>



            <div
              className="
                game-section-count
              "
            >

              {game.numbers.length}
              {" / "}
              10

            </div>


          </div>





          {/* =========================
              主菜盘 + 操作
              ========================= */}

          <div
            className="
              game-board-control-row
            "
          >


            <div
              className="
                game-board
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

                displayMode={
                  cardDisplayMode
                }

              />

            </div>



            <div
              className="
                game-board-actions
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


          </div>


        </section>





        {/* =========================
            调料区
            ========================= */}

        <section
          className="
            game-seasoning-section
          "
        >


          <div
            className="
              game-section-header
              game-seasoning-section-header
            "
          >


            <div
              className="
                game-section-title
              "
            >

              调料

            </div>


            <div
              className="
                game-section-line
              "
            />


          </div>



          <div
            className="
              game-seasoning-area
            "
          >

            <SeasoningTray

              seasoningTray={
                game.seasoningTray
              }

              numbers={
                game.numbers
              }

            />

          </div>


        </section>





        <div
          className="
            game-collection-divider
          "
        />



        <CollectionPanel

          collection={
            game.collection
          }

          collectionPaths={
            game.collectionPaths
          }

          latestCollection={
            game.latestCollection
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