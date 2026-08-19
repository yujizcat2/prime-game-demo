import {
  getLegalActions,
  applyAction
} from "../game/gameEngine";

import {
  evaluateState
} from "./evaluation";



// ============================================================
// 默认配置
// ============================================================

export const SCORE_BEAM_CONFIG = {

  // 搜索未来多少层
  DEPTH: 4,

  // 每层只保留多少个最佳状态
  BEAM_WIDTH: 50

};



// ============================================================
// 为Action生成简单Key
// ============================================================

function getActionKey(action) {

  if(
    action.type === "combine" ||
    action.type === "reduce"
  ){

    return (
      action.type +
      ":" +
      action.ids.join("-")
    );

  }


  if(
    action.type === "remove"
  ){

    return (
      "remove:" +
      action.id
    );

  }


  return JSON.stringify(
    action
  );
}



// ============================================================
// 生成简单棋盘状态Key
//
// 用于Beam内部去重
// ============================================================

function getStateKey(state) {

  const numbers =

    state.numbers

      .map(

        item => {

          const parents =

            item.parents

              ? [...item.parents]
                  .sort(
                    (a, b) => a - b
                  )
                  .join(".")

              : "-";


          return (
            item.value +
            ":" +
            parents +
            ":" +
            (
              item.reduceFrom ??
              "-"
            )
          );

        }

      )

      .sort()

      .join("|");


  const collection =

    [...state.collection]

      .sort(
        (a, b) => a - b
      )

      .join(",");


  return [

    numbers,

    collection,

    state.score,

    state.steps,

    state.stepLimit,

    state.checkpointPending
      ? 1
      : 0

  ].join("#");
}



// ============================================================
// 单个Beam节点
// ============================================================

function createNode({
  state,
  firstAction,
  depth
}){

  return {

    state,

    firstAction,

    depth,

    evaluation:
      evaluateState(
        state
      )

  };
}



// ============================================================
// 排序
//
// 最好的状态排最前
// ============================================================

function sortNodes(nodes) {

  return nodes.sort(

    (a, b) =>

      b.evaluation -
      a.evaluation

  );
}



// ============================================================
// 去重
//
// 如果多个路径到达完全一样的状态，
// 只保留评价最高的一条
// ============================================================

function deduplicateNodes(
  nodes
){

  const map =
    new Map();


  for(
    const node of nodes
  ){

    const key =

      getStateKey(
        node.state
      );


    const old =
      map.get(key);


    if(
      !old ||
      node.evaluation >
      old.evaluation
    ){

      map.set(
        key,
        node
      );

    }

  }


  return [
    ...map.values()
  ];
}



// ============================================================
// Beam Search选择下一步
// ============================================================

export function chooseScoreBeamAction(
  state,
  options = {}
){

  const depth =

    options.depth ??
    SCORE_BEAM_CONFIG.DEPTH;


  const beamWidth =

    options.beamWidth ??
    SCORE_BEAM_CONFIG.BEAM_WIDTH;



  // ==========================================================
  // 当前所有合法操作
  // ==========================================================

  const initialActions =

    getLegalActions(
      state
    );



  if(
    initialActions.length === 0
  ){

    return null;

  }



  // ==========================================================
  // 第一层
  // ==========================================================

  let beam = [];


  for(
    const action of initialActions
  ){

    const nextState =

      applyAction(
        state,
        action
      );


    if(
      nextState === state
    ){

      continue;

    }


    beam.push(

      createNode({

        state:
          nextState,

        firstAction:
          action,

        depth:
          1

      })

    );

  }



  beam =

    sortNodes(
      deduplicateNodes(
        beam
      )
    )

    .slice(
      0,
      beamWidth
    );



  if(
    beam.length === 0
  ){

    return null;

  }



  // ==========================================================
  // 向未来搜索
  // ==========================================================

  for(
    let currentDepth = 2;
    currentDepth <= depth;
    currentDepth++
  ){

    const nextBeam = [];



    for(
      const node of beam
    ){


      // ======================================================
      // 已经死亡
      // 不再扩展
      // ======================================================

      if(
        node.state.gameOver
      ){

        nextBeam.push(
          node
        );

        continue;

      }



      const actions =

        getLegalActions(
          node.state
        );



      // ======================================================
      // 没操作
      // 作为终点保留
      // ======================================================

      if(
        actions.length === 0
      ){

        nextBeam.push(
          node
        );

        continue;

      }



      // ======================================================
      // 展开
      // ======================================================

      for(
        const action of actions
      ){

        const nextState =

          applyAction(
            node.state,
            action
          );


        if(
          nextState ===
          node.state
        ){

          continue;

        }



        nextBeam.push(

          createNode({

            state:
              nextState,

            firstAction:
              node.firstAction,

            depth:
              currentDepth

          })

        );

      }

    }



    // ========================================================
    // 如果没有可继续搜索的状态
    // ========================================================

    if(
      nextBeam.length === 0
    ){

      break;

    }



    beam =

      sortNodes(

        deduplicateNodes(
          nextBeam
        )

      )

      .slice(
        0,
        beamWidth
      );

  }



  // ==========================================================
  // 最终最佳路线
  // ==========================================================

  const bestNode =
    beam[0];


  return (
    bestNode?.firstAction ??
    null
  );
}



// ============================================================
// Debug版本
//
// 不只返回Action，
// 还返回搜索结果
// ============================================================

export function analyzeScoreBeamAction(
  state,
  options = {}
){

  const depth =

    options.depth ??
    SCORE_BEAM_CONFIG.DEPTH;


  const beamWidth =

    options.beamWidth ??
    SCORE_BEAM_CONFIG.BEAM_WIDTH;


  const legalActions =

    getLegalActions(
      state
    );


  if(
    legalActions.length === 0
  ){

    return {

      action: null,

      evaluation: null,

      candidates: []

    };

  }



  const candidates = [];


  for(
    const action of legalActions
  ){

    const nextState =

      applyAction(
        state,
        action
      );


    if(
      nextState === state
    ){

      continue;

    }


    candidates.push({

      action,

      actionKey:
        getActionKey(
          action
        ),

      evaluation:
        evaluateState(
          nextState
        ),

      score:
        nextState.score,

      collectionSize:
        nextState.collection.length,

      steps:
        nextState.steps

    });

  }



  candidates.sort(

    (a, b) =>
      b.evaluation -
      a.evaluation

  );


  const action =

    chooseScoreBeamAction(
      state,
      {
        depth,
        beamWidth
      }
    );


  return {

    action,

    depth,

    beamWidth,

    candidates

  };
}