import { GAME_CONFIG } from "./config";

export function calcScore(gainedCount) {
  return gainedCount * GAME_CONFIG.REMOVE_SCORE;
}