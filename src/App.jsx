import {
  useState
} from "react";

import "./App.css";

import StartScreen from "./components/StartScreen";
import Board from "./components/Board";
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



function App(){


  const game =
    useGame();



  // ==========================================================
  // 九宫格消除动画
  // ==========================================================

  const [
    removingIndex,
    setRemovingIndex
  ] = useState(null);





  // ==========================================================
  // 消除1
  // ==========================================================

  function handleRemoveOne(
    index
  ){


    if(
      removingIndex !== null
    ){

      return;

    }



    setRemovingIndex(
      index
    );



    window.setTimeout(
      () => {


        game.removeOne(
          index
        );


        setRemovingIndex(
          null
        );


      },
      300
    );

  }





  // ==========================================================
  // 开始界面
  // ==========================================================

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





  // ==========================================================
  // 活性
  // ==========================================================

  const activityStatus =

    getActivityStatus(

      game.numbers,

      game.primeDensity

    );





  // ==========================================================
  // 旧外围UI兼容
  // ==========================================================

  const selectedIdsForLegacyUI =

    game.selectedNumbers.map(

      item =>
        item.id

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



        {/* =====================================================
            Header
        ===================================================== */}

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





        {/* =====================================================
            金钱 + 时间
        ===================================================== */}

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





        {/* =====================================================
            Tips + 活性
        ===================================================== */}

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
                selectedIdsForLegacyUI
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





        {/* =====================================================
            主菜台
        ===================================================== */}

        <section
          className="
            game-board-section
          "
        >


          {/* ===================================================
              标题栏
          =================================================== */}

          <div
            className="
              game-board-toolbar
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
                game-section-count
              "
            >

              {
                game.numbers.length
              }

              {" / "}

              9

            </div>


          </div>





          {/* ===================================================
              主游戏核心
              
              桌面：
              
              左操作区 + 右九宫格
              
              手机：
              
              上九宫格 + 下操作区
          =================================================== */}

          <div
            className="
              game-board-layout
            "
          >



            {/* =================================================
                左侧操作区
            ================================================= */}

            <aside
              className="
                game-board-control-panel
              "
            >


              <div
                className="
                  game-board-control-inner
                "
              >


                <div
                  className="
                    game-board-control-kicker
                  "
                >

                  ACTION

                </div>



                <ActionButtons

                  selected={
                    selectedIdsForLegacyUI
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

                  gameOver={
                    game.gameOver
                  }

                  removingId={
                    removingIndex
                  }

                />


              </div>


            </aside>





            {/* =================================================
                右侧棋盘
            ================================================= */}

            <div
              className="
                game-board-main
              "
            >


              <Board

                board={
                  game.board
                }

                selectedIndexes={
                  game.selectedIndexes
                }

                onSelectCell={
                  game.selectCell
                }

                onRemoveOne={
                  handleRemoveOne
                }

                onCombine={
                  game.combineNumbers
                }

                collection={
                  game.collection
                }

                removingIndex={
                  removingIndex
                }

                preview={
                  game.preview
                }

              />


            </div>


          </div>


        </section>





        {/* =====================================================
            调料
        ===================================================== */}

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



        {/* =====================================================
            收藏
        ===================================================== */}

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





      {/* =====================================================
          Game Over
      ===================================================== */}

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