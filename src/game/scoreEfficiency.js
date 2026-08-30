export function getScoreEfficiency(score, steps){
  if(!Number.isFinite(score) || !Number.isFinite(steps) || steps <= 0){
    return 0;
  }

  return score / steps;
}
