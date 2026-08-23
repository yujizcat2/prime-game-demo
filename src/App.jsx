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



  const [
    cardDisplayMode,
    setCardDisplayMode
  ] = useState("food");



  const [
    removingId,
    setRemovingId
  ] = useState(null);





  // =========================
  // 获取调料动画
  // =========================

  function handleRemoveOne(id) {


    if(
      removingId !== null
    ){

      return;

    }


    setRemovingId(
      id
    );


    window.setTimeout(
      () => {


        game.removeOne(
          id
        );


        setRemovingId(
          null
        );


      },
      300
    );

  }





  // =========================
  // 卡片显示模式
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
  // 开始
  // =========================

  if(
    !game.started
  ){

    return (

      <StartScreen

        onStart={
          game.startGame
        }

      />

    );

  }





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
            标题
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
            金钱 + 时间
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
              game-board-toolbar
            "
          >


            {/* 左侧 */}

            <div
              className="
                game-board-toolbar-left
              "
            >

              <div
                className="
                  game-section-title
                "
              >

                主菜台

              </div>

            </div>



            {/* 中间：
                现在只剩处理
            */}

            <div
              className="
                game-board-toolbar-actions
              "
            >

              <ActionButtons

                selected={
                  game.selected
                }

                preview={
                  game.preview
                }

                onReduce={
                  game.reduceNumbers
                }

                gameOver={
                  game.gameOver
                }

                removingId={
                  removingId
                }

              />

            </div>



            {/* 右侧 */}

            <div
              className="
                game-board-toolbar-right
              "
            >


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


          </div>





          {/* =========================
              主菜盘
              ========================= */}

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

              onCombine={
                game.combineNumbers
              }

              onRemoveOne={
                handleRemoveOne
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