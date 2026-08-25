import {
  gcd
} from "../utils/math";

import {
  ANIMAL_TYPES,
  ANIMAL_PURITY,
  combineValue,
  combineAnimalType,
  combineAnimalPurity,
  canReduce,
  canCombine
} from "../game/rules";

import {
  createMazeStateKey
} from "../game/mazeHistory";

import {
  applyCollection
} from "../game/collectionRules";





// ============================================================
// Simulation
//
// 高速版本：
//
// 不保存完整 mazeHistory.entries。
// 使用持久化 prototype 链记录访问状态。
// ============================================================

export const SIM_BOARD_SIZE =
  9;





// ============================================================
// 快速字符串 Hash
// ============================================================

function hashString(
  text
){


  let hash =
    2166136261;



  for(
    let i = 0;
    i < text.length;
    i++
  ){


    hash ^=

      text.charCodeAt(
        i
      );


    hash =

      Math.imul(
        hash,
        16777619
      );

  }



  return hash >>> 0;

}





function toVisitedKey(
  stateKey
){


  return `@${stateKey}`;

}





function getVisitedEntry(
  state,
  stateKey
){


  const key =

    toVisitedKey(
      stateKey
    );



  if(
    key in state.mazeVisited
  ){


    return state.mazeVisited[key];

  }



  return null;

}





function recordVisitedState(
  state,
  stateKey,
  reason = "normal"
){


  const existing =

    getVisitedEntry(
      state,
      stateKey
    );



  if(
    existing
  ){


    return existing;

  }



  const hash =

    hashString(
      stateKey
    );



  const entry = {

    sequence:
      state.mazeVisitedCount,

    steps:
      state.steps,

    reason

  };



  state.mazeVisited[
    toVisitedKey(
      stateKey
    )
  ] =
    entry;



  state.mazeVisitedCount++;



  state.mazeHashXor =

    (
      state.mazeHashXor
      ^
      hash
    )

    >>>

    0;



  state.mazeHashSum =

    (
      state.mazeHashSum
      +
      hash
    )

    >>>

    0;



  return entry;

}





// ============================================================
// 创建模拟状态
// ============================================================

export function createSimulationState(
  values
){


  const board =

    Array.from(
      {
        length:
          SIM_BOARD_SIZE
      },
      () =>
        null
    );



  const initialValues =

    Array.isArray(
      values
    )

      ? values.slice(
          0,
          3
        )

      : [];



  const types = [

    ANIMAL_TYPES.DOG,

    ANIMAL_TYPES.CAT,

    ANIMAL_TYPES.MAMMAL

  ];



  initialValues.forEach(

    (
      value,
      index
    ) => {


      board[index] = {

        value,

        animalType:
          types[index],

        purity:
          ANIMAL_PURITY.PURE,

        parents:
          null,

        parentAnimals:
          null,

        previousValue:
          null

      };

    }

  );





  const state = {

    board,


    collection:
      new Set(),


    collectionAnimalTypeHistory:
      [],


    steps:
      0,


    mazeVisited:
      Object.create(
        null
      ),

    mazeVisitedCount:
      0,

    mazeHashXor:
      0,

    mazeHashSum:
      0,

    mazeTurnCount:
      0,

    lastMazeTurn:
      null

  };





  recordVisitedState(

    state,

    createMazeStateKey(
      state
    ),

    "initial"

  );



  return state;

}





function getPieces(
  board
){


  return board.filter(
    Boolean
  );

}





function isBoardFull(
  board
){


  for(
    let i = 0,
        count = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i]
    ){


      count++;



      if(
        count >=
        SIM_BOARD_SIZE
      ){


        return true;

      }

    }

  }



  return false;

}





function getNextEmptyIndex(
  board
){


  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i] ===
      null
    ){


      return i;

    }

  }



  return -1;

}





function canCombineIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA === indexB ||
    isBoardFull(
      state.board
    )
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b ||
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }



  return canCombine(

    a,

    b,

    getPieces(
      state.board
    )

  );

}





function canReduceIndexes(
  state,
  indexA,
  indexB
){


  if(
    indexA === indexB
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b ||
    a.value === 1 ||
    b.value === 1
  ){


    return false;

  }



  return canReduce(
    a,
    b
  );

}





export function getSimulationLegalActions(
  state
){


  const actions =
    [];


  const board =
    state.board;


  const full =

    isBoardFull(
      board
    );





  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    if(
      board[i]?.value ===
      1
    ){


      actions.push({

        type:
          "remove",

        index:
          i

      });

    }

  }





  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const a =
      board[i];



    if(
      !a ||
      a.value === 1
    ){


      continue;

    }



    for(
      let j = i + 1;
      j < SIM_BOARD_SIZE;
      j++
    ){


      const b =
        board[j];



      if(
        !b ||
        b.value === 1
      ){


        continue;

      }



      if(
        !full &&
        canCombineIndexes(
          state,
          i,
          j
        )
      ){


        actions.push({

          type:
            "combine",

          indexes: [
            i,
            j
          ]

        });

      }



      if(
        canReduceIndexes(
          state,
          i,
          j
        )
      ){


        actions.push({

          type:
            "reduce",

          indexes: [
            i,
            j
          ]

        });

      }

    }

  }



  return actions;

}





// ============================================================
// 组合
// ============================================================

function applyCombine(
  state,
  indexA,
  indexB
){


  const targetIndex =

    getNextEmptyIndex(
      state.board
    );



  if(
    targetIndex === -1
  ){


    return false;

  }



  const a =
    state.board[indexA];


  const b =
    state.board[indexB];



  if(
    !a ||
    !b
  ){


    return false;

  }



  const front =

    indexA < indexB
      ? a
      : b;



  const back =

    indexA < indexB
      ? b
      : a;



  const value =

    combineValue(

      front.value,

      back.value

    );



  const animalType =

    combineAnimalType(

      front,

      back

    );



  if(
    !animalType
  ){


    return false;

  }



  state.board[
    targetIndex
  ] = {

    value,

    animalType,

    purity:

      combineAnimalPurity(
        front,
        back
      ),

    parents: [

      a.value,

      b.value

    ],

    parentAnimals: [

      {

        value:
          front.value,

        animalType:
          front.animalType,

        purity:
          front.purity
          ?? null

      },

      {

        value:
          back.value,

        animalType:
          back.animalType,

        purity:
          back.purity
          ?? null

      }

    ],

    previousValue:
      null

  };



  state.steps++;



  return true;

}





// ============================================================
// 约分
// ============================================================

function applyReduce(
  state,
  indexA,
  indexB
){


  const first =
    state.board[indexA];


  const second =
    state.board[indexB];



  if(
    !first ||
    !second
  ){


    return false;

  }



  const divisor =

    gcd(

      first.value,

      second.value

    );



  if(
    divisor <=
    1
  ){


    return false;

  }



  const oldA =
    first.value;


  const oldB =
    second.value;



  first.value =
    oldA / divisor;


  second.value =
    oldB / divisor;



  // animalType / purity 保留

  first.parents =
    null;

  first.parentAnimals =
    null;

  second.parents =
    null;

  second.parentAnimals =
    null;



  first.previousValue =
    oldA;

  second.previousValue =
    oldB;



  state.steps++;



  return true;

}





// ============================================================
// 处理1
// ============================================================

function applyRemove(
  state,
  index
){


  const target =
    state.board[index];



  if(
    !target ||
    target.value !== 1
  ){


    return false;

  }



  applyCollection(
    state,
    target
  );



  state.board[index] =
    null;



  return true;

}





function mazeTurnValue(
  value
){


  return (

    value === 101

      ? 2

      : value + 1

  );

}





function applyMazeTurn(
  state
){


  for(
    let i = 0;
    i < SIM_BOARD_SIZE;
    i++
  ){


    const piece =
      state.board[i];



    if(
      piece
    ){


      piece.value =

        mazeTurnValue(
          piece.value
        );

    }

  }

}





function resolveMaze(
  state
){


  const key =

    createMazeStateKey(
      state
    );



  const previous =

    getVisitedEntry(
      state,
      key
    );



  if(
    !previous
  ){


    recordVisitedState(

      state,

      key,

      "normal"

    );


    state.lastMazeTurn =
      null;


    return;

  }





  const beforeValues =

    state.board.map(

      piece =>
        piece?.value
        ?? null

    );



  applyMazeTurn(
    state
  );



  state.mazeTurnCount++;



  const afterValues =

    state.board.map(

      piece =>
        piece?.value
        ?? null

    );



  state.lastMazeTurn = {

    triggered:
      true,

    count:
      state.mazeTurnCount,

    previousSequence:
      previous.sequence,

    previousSteps:
      previous.steps,

    triggerSteps:
      state.steps,

    beforeValues,

    afterValues

  };





  const turnedKey =

    createMazeStateKey(
      state
    );



  if(
    !getVisitedEntry(
      state,
      turnedKey
    )
  ){


    recordVisitedState(

      state,

      turnedKey,

      "maze-turn"

    );

  }

}





export function applySimulationAction(
  state,
  action
){


  if(
    !state ||
    !action
  ){


    return false;

  }



  let applied =
    false;



  switch(
    action.type
  ){


    case "combine":


      applied =

        applyCombine(

          state,

          action.indexes[0],

          action.indexes[1]

        );


      break;



    case "reduce":


      applied =

        applyReduce(

          state,

          action.indexes[0],

          action.indexes[1]

        );


      break;



    case "remove":


      applied =

        applyRemove(

          state,

          action.index

        );


      break;



    default:


      return false;

  }



  if(
    !applied
  ){


    return false;

  }



  resolveMaze(
    state
  );



  return true;

}





function clonePiece(
  piece
){


  if(
    !piece
  ){


    return null;

  }



  return {

    value:
      piece.value,

    animalType:
      piece.animalType,

    purity:
      piece.purity,

    parents:

      piece.parents

        ? [
            ...piece.parents
          ]

        : null,

    parentAnimals:

      piece.parentAnimals

        ? piece.parentAnimals.map(

            animal => ({

              value:
                animal.value,

              animalType:
                animal.animalType,

              purity:
                animal.purity

            })

          )

        : null,

    previousValue:
      piece.previousValue
      ?? null

  };

}





export function cloneSimulationState(
  state
){


  return {

    board:

      state.board.map(
        clonePiece
      ),


    collection:

      new Set(
        state.collection
      ),


    collectionAnimalTypeHistory:

      [
        ...(
          state.collectionAnimalTypeHistory
          ?? []
        )
      ],


    steps:
      state.steps,


    mazeVisited:

      Object.create(
        state.mazeVisited
      ),

    mazeVisitedCount:
      state.mazeVisitedCount,

    mazeHashXor:
      state.mazeHashXor,

    mazeHashSum:
      state.mazeHashSum,

    mazeTurnCount:
      state.mazeTurnCount,

    lastMazeTurn:
      null

  };

}





export function getSimulationHistorySignature(
  state
){


  return (

    `${state.mazeVisitedCount}`

    +

    ":"

    +

    `${state.mazeHashXor}`

    +

    ":"

    +

    `${state.mazeHashSum}`

  );

}