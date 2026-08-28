import { createEightPalaceInitialValues } from "../game/initialValues";
import { applyAction, createGameState, getBoardCount, getLegalActions, resolveGameOver } from "../game/gameEngine";
import { getEightPalaceKeyCount, getMissingEightPalaceKeyTypes } from "../game/eightPalaceKeys";
import { gcd } from "../utils/math";

export const EIGHT_PALACE_SOLVER_DEFAULTS = Object.freeze({games:100,depth:6,beamWidth:100,maxActions:500});

function snapshotBoard(board){return board.map((piece,index)=>piece?{index,value:piece.value,foodType:piece.foodType,purity:piece.purity??null,parents:piece.parents?[...piece.parents]:null,parentFoods:piece.parentFoods?piece.parentFoods.map(parent=>({...parent})):null,sourceKey:piece.sourceKey??null}:null);}

export function createEightPalaceBoardKey(state){
  const board=state.board.map(piece=>piece?[piece.value,piece.foodType,piece.purity??null,piece.sourceKey??null,piece.parents??null,piece.parentFoods?.map(parent=>[parent.value,parent.foodType,parent.purity??null])??null]:null);
  const keys=Object.keys(state.eightPalaceKeys??{}).filter(type=>state.eightPalaceKeys[type]).sort();
  return JSON.stringify({board,keys});
}

function countMissingKeyOpportunities(state){
  const missing=new Set(getMissingEightPalaceKeyTypes(state.eightPalaceKeys));
  const pieces=state.board.filter(Boolean);
  let count=0;
  for(let i=0;i<pieces.length;i++)for(let j=i+1;j<pieces.length;j++){
    const first=pieces[i],second=pieces[j];
    if(first.foodType!==second.foodType||!missing.has(first.foodType))continue;
    const divisor=gcd(first.value,second.value);
    if(divisor>1&&(first.value/divisor===1||second.value/divisor===1))count++;
  }
  return count;
}

function isSuccess(state){return getEightPalaceKeyCount(state.eightPalaceKeys)===8&&getBoardCount(state.board)<=2;}

function evaluateState(state,lastAction){
  const keyCount=getEightPalaceKeyCount(state.eightPalaceKeys);
  const boardCount=getBoardCount(state.board);
  const legalActions=getLegalActions(state);
  const terminalFailure=state.gameOver&&!isSuccess(state);
  return {score:keyCount*1_000_000_000_000-boardCount*1_000_000_000+countMissingKeyOpportunities(state)*10_000_000+legalActions.length*1_000+(lastAction?.type==="reduce"?100:0)-(terminalFailure?5_000_000_000_000:0),keyCount,boardCount};
}

function searchNextAction(rootState,{depth,beamWidth},visited){
  let frontier=[{state:rootState,firstAction:null,...evaluateState(rootState,null)}];
  let best=null,repeatedPrunes=0,generated=0;
  const searchSeen=new Set([createEightPalaceBoardKey(rootState)]);
  for(let level=0;level<depth;level++){
    const nextNodes=[];
    for(const node of frontier)for(const action of getLegalActions(node.state)){
      const nextState=applyAction(node.state,action);
      if(nextState===node.state)continue;
      generated++;
      const key=createEightPalaceBoardKey(nextState);
      if(visited.has(key)||searchSeen.has(key)){repeatedPrunes++;continue;}
      searchSeen.add(key);
      const candidate={state:nextState,firstAction:node.firstAction??action,...evaluateState(nextState,action)};
      if(isSuccess(nextState))return {action:candidate.firstAction,repeatedPrunes,generated};
      nextNodes.push(candidate);
    }
    frontier=nextNodes.sort((a,b)=>b.score-a.score).slice(0,beamWidth);
    if(frontier.length===0)break;
    if(!best||frontier[0].score>best.score)best=frontier[0];
  }
  return {action:best?.firstAction??null,repeatedPrunes,generated};
}

function describeAction(state,action,nextState){
  const indexes=action.type==="remove"?[action.index]:[...action.indexes];
  const inputs=indexes.map(index=>({index,value:state.board[index]?.value??null,foodType:state.board[index]?.foodType??null}));
  const beforeKeys=new Set(Object.keys(state.eightPalaceKeys??{}).filter(type=>state.eightPalaceKeys[type]));
  const gainedType=Object.keys(nextState.eightPalaceKeys??{}).find(type=>nextState.eightPalaceKeys[type]&&!beforeKeys.has(type))??null;
  return {number:null,type:action.type,indexes,inputs,stepBefore:state.steps,stepAfter:nextState.steps,boardCountAfter:getBoardCount(nextState.board),keyCountAfter:getEightPalaceKeyCount(nextState.eightPalaceKeys),gainedKey:gainedType?{...nextState.eightPalaceKeys[gainedType]}:null,boardAfter:snapshotBoard(nextState.board)};
}

export async function runEightPalaceGame({depth=EIGHT_PALACE_SOLVER_DEFAULTS.depth,beamWidth=EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,maxActions=EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,initialOpening=null}={}){
  const opening=initialOpening??createEightPalaceInitialValues();
  let state=resolveGameOver(createGameState(opening));
  const initialBoard=snapshotBoard(state.board);
  const visited=new Set([createEightPalaceBoardKey(state)]),actionPath=[];
  let repeatedPrunes=0,failureReason=null;
  while(actionPath.length<maxActions&&!isSuccess(state)){
    const legalActions=getLegalActions(state);
    if(legalActions.length===0){failureReason="deadlock";break;}
    const choice=searchNextAction(state,{depth,beamWidth},visited);
    repeatedPrunes+=choice.repeatedPrunes;
    if(!choice.action){failureReason=choice.generated>0&&choice.repeatedPrunes>0?"repeated-state / loop":"search exhausted";break;}
    const nextState=applyAction(state,choice.action);
    if(nextState===state){failureReason="search exhausted";break;}
    const entry=describeAction(state,choice.action,nextState);entry.number=actionPath.length+1;actionPath.push(entry);
    state=nextState;visited.add(createEightPalaceBoardKey(state));
  }
  const finalBoardCount=getBoardCount(state.board),finalKeyCount=getEightPalaceKeyCount(state.eightPalaceKeys),success=isSuccess(state);
  if(!success&&!failureReason)failureReason=actionPath.length>=maxActions?"maxActions":"search exhausted";
  return {success,initialOpening:opening.map(item=>({...item})),initialBoard,finalBoardCount,finalKeyCount,acquiredKeyTypes:Object.keys(state.eightPalaceKeys).filter(type=>state.eightPalaceKeys[type]),missingKeyTypes:getMissingEightPalaceKeyTypes(state.eightPalaceKeys),steps:state.steps,actions:actionPath.length,finalBoard:snapshotBoard(state.board),actionPath,failureReason,gameOverReason:state.gameOverReason,repeatedPrunes};
}

function createKeyDistribution(results){const distribution=Object.fromEntries(Array.from({length:9},(_,count)=>[count,0]));for(const result of results)distribution[result.finalKeyCount]++;return distribution;}

export async function runEightPalaceSolver({games=EIGHT_PALACE_SOLVER_DEFAULTS.games,depth=EIGHT_PALACE_SOLVER_DEFAULTS.depth,beamWidth=EIGHT_PALACE_SOLVER_DEFAULTS.beamWidth,maxActions=EIGHT_PALACE_SOLVER_DEFAULTS.maxActions,onProgress=null}={}){
  const results=[];
  for(let gameIndex=1;gameIndex<=games;gameIndex++){
    const result=await runEightPalaceGame({depth,beamWidth,maxActions});result.gameIndex=gameIndex;results.push(result);
    onProgress?.({completed:gameIndex,total:games,currentGame:result,currentActions:result.actions,currentSteps:result.steps,currentBoardCount:result.finalBoardCount,currentKeyCount:result.finalKeyCount,currentSuccess:result.success});
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  const successes=results.filter(result=>result.success),successfulSteps=successes.map(result=>result.steps);
  const failureCounts={deadlock:0,"repeated-state / loop":0,maxActions:0,"search exhausted":0};
  for(const result of results)if(!result.success)failureCounts[result.failureReason]++;
  const shortestSuccess=successes.length?successes.reduce((best,result)=>result.steps<best.steps?result:best):null;
  const hardestSuccess=successes.length?successes.reduce((best,result)=>result.steps>best.steps?result:best):null;
  return {games,depth,beamWidth,maxActions,successCount:successes.length,successRate:games?successes.length/games:0,averageSuccessSteps:successes.length?successfulSteps.reduce((sum,value)=>sum+value,0)/successes.length:0,shortestSuccessSteps:successes.length?Math.min(...successfulSteps):null,longestSuccessSteps:successes.length?Math.max(...successfulSteps):null,averageFinalKeyCount:games?results.reduce((sum,result)=>sum+result.finalKeyCount,0)/games:0,keysCompleteNotClearedCount:results.filter(result=>result.finalKeyCount===8&&result.finalBoardCount>2).length,clearedWithoutKeysCount:results.filter(result=>result.finalBoardCount<=2&&result.finalKeyCount<8).length,finalKeyCountDistribution:createKeyDistribution(results),failureCounts,shortestSuccess,hardestSuccess,singleGame:games===1?results[0]:null,results};
}
