import { getBoardCount } from "./boardRules";
import { scaleScore } from "./scoreScale";

function boardChanged(previousBoard = [], nextBoard = []){
  return previousBoard.some((piece, index) =>
    piece?.value !== nextBoard[index]?.value || piece?.foodType !== nextBoard[index]?.foodType
  );
}

export function applyActionBaseScore(previousState, action, actionState, comboState){
  let actionBaseScore = 0;
  if((action.type === "combine" || action.type === "combine_ordered")
    && (actionState.nextId ?? 0) > (previousState.nextId ?? 0)){
    actionBaseScore = scaleScore(1);
  }else if(action.type === "reduce"
    && (actionState.steps ?? 0) > (previousState.steps ?? 0)
    && getBoardCount(actionState.board) === getBoardCount(previousState.board)
    && (actionState.collectionTimeline?.length ?? 0) === (previousState.collectionTimeline?.length ?? 0)
    && boardChanged(previousState.board, actionState.board)){
    actionBaseScore = scaleScore(2);
  }

  return {
    ...comboState,
    score: (comboState.score ?? 0) + actionBaseScore,
    latestActionBaseScore: actionBaseScore > 0 ? {type: action.type, score: actionBaseScore} : null
  };
}
