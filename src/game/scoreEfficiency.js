export function getScoreEfficiency(score, totalActionMinutes){
  if(!Number.isFinite(score) || !Number.isFinite(totalActionMinutes) || totalActionMinutes <= 0){
    return 0;
  }

  return score / totalActionMinutes * 60;
}
