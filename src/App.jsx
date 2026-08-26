import {
  useState
} from "react";

import "./App.css";

import StartScreen from "./components/StartScreen";
import TestLab from "./components/TestLab";

import Board from "./components/Board";
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



  const [
    showTestLab,
    setShowTestLab
  ] = useState(false);



  const [
    removingIndex,
    setRemovingIndex
  ] = useState(null);



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





  if(
    showTestLab
  ){


    return (

      <TestLab

        onBack={() =>
          setShowTestLab(false)
        }

      />

    );

  }





  if(
    !game.started
  ){


    return (

      <StartScreen

        onStart={
          game.startGame
        }

        onOpenTest={() =>
          setShowTestLab(true)
        }

      />

    );

  }





  const activityStatus =

    getActivityStatus(

      game.numbers,

      game.primeDensity

    );





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

            collectionPaths={
              game.collectionPaths
            }

          />


        </section>



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


            <div
              className="
                game-section-title
              "
            >

              料理台

            </div>



            <div
              className="
                game-section-count
              "
            >

              {game.numbers.length}

              {" / "}

              9

            </div>


          </div>



          <div
            className="
              game-board-layout
            "
          >


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

                mazeTurn={
                  game.mazeTurn
                }

              />


            </div>


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
