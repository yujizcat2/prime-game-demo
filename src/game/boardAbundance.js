export function getBoardAbundance(board){
  if(!Array.isArray(board)) return 0;

  return board.reduce(
    (total, piece) => total + (Number.isFinite(piece?.value) ? piece.value : 0),
    0
  );
}

export function getAbundanceBonusRate(abundance){
  if(abundance >= 550) return 0.5;
  if(abundance >= 450) return 0.4;
  if(abundance >= 350) return 0.3;
  if(abundance >= 250) return 0.2;
  if(abundance >= 150) return 0.1;
  return 0;
}

export function getAbundanceBonusScore(baseScore, abundance){
  if(baseScore <= 0) return 0;
  return Math.round(baseScore * getAbundanceBonusRate(abundance));
}
