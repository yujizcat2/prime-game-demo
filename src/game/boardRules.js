// ============================================================
// 九宫格
// ============================================================

export const BOARD_CONFIG = {

  ROWS:
    3,

  COLS:
    3,

  SIZE:
    9

};





// ============================================================
// 创建空棋盘
// ============================================================

export function createEmptyBoard(){


  return Array.from(
    {
      length:
        BOARD_CONFIG.SIZE
    },
    () =>
      null
  );

}





// ============================================================
// 获取所有正式棋子
// ============================================================

export function getBoardPieces(
  board
){


  if(
    !Array.isArray(
      board
    )
  ){


    return [];

  }



  return board.filter(
    Boolean
  );

}





// ============================================================
// 当前棋子数量
// ============================================================

export function getBoardCount(
  board
){


  return getBoardPieces(
    board
  ).length;

}





// ============================================================
// 是否满盘
// ============================================================

export function isBoardFull(
  board
){


  return (

    getBoardCount(
      board
    )

    >=

    BOARD_CONFIG.SIZE

  );

}





// ============================================================
// 获取下一个空格
//
// 九宫格顺序：
//
// 0 1 2
// 3 4 5
// 6 7 8
//
// 新棋子自动进入
// 第一个空位置。
// ============================================================

export function getNextEmptyIndex(
  board
){


  if(
    !Array.isArray(
      board
    )
  ){


    return -1;

  }



  return board.findIndex(

    item =>
      item === null

  );

}





// ============================================================
// 根据index获取节点
// ============================================================

export function getPieceAt(
  state,
  index
){


  if(
    !state?.board
  ){


    return null;

  }



  if(
    index < 0 ||
    index >= BOARD_CONFIG.SIZE
  ){


    return null;

  }



  return (

    state.board[index]

    ??

    null

  );

}





// ============================================================
// 根据ID获取节点
//
// 保留给旧UI兼容。
// ============================================================

export function getNumberById(
  state,
  id
){


  return (

    getBoardPieces(
      state?.board
    )
      .find(

        item =>
          item.id === id

      )

    ??

    null

  );

}





// ============================================================
// 是否存在1
// ============================================================

export function hasOne(
  board
){


  return getBoardPieces(
    board
  )
    .some(

      item =>
        item.value === 1

    );

}





// ============================================================
// 确定两个棋子的前后
//
// indexA is the first selected piece. Order affects inherited type.
// ============================================================

export function getOrderedPair(
  state,
  indexA,
  indexB
){


  const a =

    getPieceAt(
      state,
      indexA
    );


  const b =

    getPieceAt(
      state,
      indexB
    );



  if(
    !a ||
    !b ||
    indexA === indexB
  ){


    return null;

  }



  return {front:a,back:b,frontIndex:indexA,backIndex:indexB};

}
