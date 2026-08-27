export function getBoardMetrics(board){
  const values = (board ?? [])
    .filter(Boolean)
    .map(piece => piece.value);

  if(values.length === 0){
    return {boardMean: 0, boardSize: 0, boardMax: 0, boardMin: 0};
  }

  return {
    boardMean: values.reduce((sum, value) => sum + value, 0) / values.length,
    boardSize: values.length,
    boardMax: Math.max(...values),
    boardMin: Math.min(...values)
  };
}


export function getBoardMeanBand(boardMean){
  if(boardMean < 15) return "low";
  if(boardMean < 35) return "middle";
  return "high";
}


export function getRecentBoardMean(boardMeans, windowSize = 20){
  const recent = (boardMeans ?? []).slice(-windowSize);
  if(recent.length === 0) return 0;
  return recent.reduce((sum, value) => sum + value, 0) / recent.length;
}


function average(values){
  if(values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}


export function summarizeBoardMetrics(entries, firstCollectionBoardMeans = []){
  const history = entries ?? [];
  const finalEntry = history[history.length - 1] ?? null;
  const highestMeanEntry = history.reduce(
    (best, entry) => !best || entry.boardMean > best.boardMean ? entry : best,
    null
  );
  const highestMaxEntry = history.reduce(
    (best, entry) => !best || entry.boardMax > best.boardMax ? entry : best,
    null
  );

  let lowStepCount = 0;
  let currentLowStart = null;
  let currentLowLength = 0;
  let longestLowStartStep = null;
  let longestLowEndStep = null;
  let longestLowStepCount = 0;

  for(const entry of history){
    if(getBoardMeanBand(entry.boardMean) === "low"){
      lowStepCount++;
      if(currentLowLength === 0) currentLowStart = entry.step;
      currentLowLength++;
      if(currentLowLength > longestLowStepCount){
        longestLowStepCount = currentLowLength;
        longestLowStartStep = currentLowStart;
        longestLowEndStep = entry.step;
      }
    }
    else{
      currentLowLength = 0;
      currentLowStart = null;
    }
  }

  const rangeAverage = (start, end) => average(
    history
      .filter(entry => entry.step >= start && entry.step <= end)
      .map(entry => entry.boardMean)
  );
  const firstMiddle = history.find(entry => entry.boardMean >= 15);
  const firstHigh = history.find(entry => entry.boardMean >= 35);

  return {
    finalBoardMean: finalEntry?.boardMean ?? 0,
    highestBoardMean: highestMeanEntry?.boardMean ?? 0,
    highestBoardMeanStep: highestMeanEntry?.step ?? null,
    averageBoardMean: average(history.map(entry => entry.boardMean)) ?? 0,
    boardMeanRanges: [
      rangeAverage(1, 100),
      rangeAverage(101, 200),
      rangeAverage(201, 300),
      rangeAverage(301, 400),
      rangeAverage(401, 500)
    ],
    lowStepCount,
    lowStepRate: history.length > 0 ? lowStepCount / history.length : 0,
    longestLowStepCount,
    longestLowStartStep,
    longestLowEndStep,
    firstMiddleStep: firstMiddle?.step ?? null,
    firstHighStep: firstHigh?.step ?? null,
    highStepCount: history.filter(entry => entry.boardMean >= 35).length,
    highestBoardMax: highestMaxEntry?.boardMax ?? 0,
    highestBoardMaxStep: highestMaxEntry?.step ?? null,
    firstCollectionAverageBoardMean: average(firstCollectionBoardMeans) ?? 0,
    first10CollectionAverageBoardMean: average(firstCollectionBoardMeans.slice(0, 10)) ?? 0,
    last10CollectionAverageBoardMean: average(firstCollectionBoardMeans.slice(-10)) ?? 0
  };
}
