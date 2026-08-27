import {
  useEffect,
  useRef,
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


  const [
    boardAnimation,
    setBoardAnimation
  ] = useState(null);


  const [
    clearedCells,
    setClearedCells
  ] = useState([]);


  const animationTimersRef = useRef([]);
  const animationTokenRef = useRef(0);


  function clearAnimationTimers(){

    animationTimersRef.current.forEach(
      timer => window.clearTimeout(timer)
    );

    animationTimersRef.current = [];

  }


  function scheduleAnimation(callback, delay){

    const timer = window.setTimeout(callback, delay);
    animationTimersRef.current.push(timer);

  }


  useEffect(
    () => () => clearAnimationTimers(),
    []
  );


  function handleCombine(){

    if(
      boardAnimation ||
      removingIndex !== null ||
      game.selectedIndexes.length !== 2 ||
      !game.preview?.combine
    ){
      return;
    }

    const indexes = [...game.selectedIndexes];
    const targetIndex = game.board.findIndex(piece => !piece);
    const token = ++animationTokenRef.current;

    clearAnimationTimers();
    setClearedCells([]);
    setBoardAnimation({ type: "combine", phase: "exit", indexes, targetIndex, token });

    scheduleAnimation(
      () => {
        game.combineNumbers();
        setBoardAnimation({ type: "combine", phase: "enter", indexes, targetIndex, token });
      },
      140
    );

    scheduleAnimation(
      () => setBoardAnimation(null),
      440
    );

  }


  function handleReduce(){

    if(
      boardAnimation ||
      removingIndex !== null ||
      game.selectedIndexes.length !== 2 ||
      !game.preview?.reduce
    ){
      return;
    }

    const indexes = [...game.selectedIndexes];
    const removedIndexes = indexes.filter(
      (_, position) => game.preview.reduce.results?.[position]?.autoCollect
    );
    const removedCells = removedIndexes.map(
      index => ({ index, foodType: game.board[index]?.foodType ?? null })
    );
    const token = ++animationTokenRef.current;
    const commitDelay = removedIndexes.length > 0 ? 420 : 150;

    clearAnimationTimers();
    setClearedCells([]);
    setBoardAnimation({ type: "reduce", phase: "compress", indexes, removedIndexes, token });

    scheduleAnimation(
      () => {
        game.reduceNumbers();
        setBoardAnimation({ type: "reduce", phase: "settle", indexes, removedIndexes, token });

        if(removedCells.length > 0){
          setClearedCells(removedCells);
          scheduleAnimation(() => setClearedCells([]), 360);
        }
      },
      commitDelay
    );

    scheduleAnimation(
      () => setBoardAnimation(null),
      commitDelay + (removedIndexes.length > 0 ? 80 : 300)
    );

  }



  function handleRemoveOne(
    index
  ){


    if(
      removingIndex !== null ||
      boardAnimation
    ){

      return;

    }



    setRemovingIndex(
      index
    );

    const removedCell = {
      index,
      foodType: game.board[index]?.foodType ?? null
    };



    clearAnimationTimers();
    setClearedCells([]);

    scheduleAnimation(
      () => {


        game.removeOne(
          index
        );

        setClearedCells([removedCell]);

        scheduleAnimation(
          () => setClearedCells([]),
          360
        );


        setRemovingIndex(
          null
        );


      },
      420
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
              game.money
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
                    handleCombine
                  }

                  onReduce={
                    handleReduce
                  }

                  gameOver={
                    game.gameOver
                  }

                  removingId={
                    removingIndex ?? boardAnimation?.token ?? null
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
                  boardAnimation
                    ? undefined
                    : game.selectCell
                }

                onRemoveOne={
                  handleRemoveOne
                }

                onCombine={
                  handleCombine
                }

                collection={
                  game.collection
                }

                prices={
                  game.boardPrices
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

                animationState={
                  boardAnimation
                }

                actionCandidates={
                  game.actionCandidates
                }

                clearedCells={
                  clearedCells
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

          collectionOrigins={
            game.collectionOrigins
          }

          collectionParents={
            game.collectionParents
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
