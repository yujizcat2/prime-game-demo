import { createEmptyBoard, getBoardCount } from "./boardRules";
import { getBaseScore, getNonDrinkBoardSum } from "./scoreValue";

export const ACTIONS_PER_DAY = 20;
export const OPENING_HOUR = 10;
export const MINUTES_PER_ACTION = 30;
export const MIN_COLLECTIONS_PER_DAY = 4;
export const NEXT_DAY_BOARD_INDEXES = Object.freeze([0, 1, 2, 3, 4]);

const DAY_SCORE_TARGETS = [500, 1200, 2200, 3600, 5200, 7000, 9000];

export function getDayScoreTarget(day = 1){
  const normalizedDay = Math.max(1, Math.floor(day));
  return DAY_SCORE_TARGETS[normalizedDay - 1]
    ?? DAY_SCORE_TARGETS.at(-1) + (normalizedDay - DAY_SCORE_TARGETS.length) * 2200;
}

export function getDayStep(state){
  return Math.min(ACTIONS_PER_DAY, Math.max(0, (state?.steps ?? 0) - (state?.dayStartStep ?? 0)));
}

export function getDayTime(state){
  const totalMinutes = OPENING_HOUR * 60 + getDayStep(state) * MINUTES_PER_ACTION;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getDayPeriod(state){
  const dayStep = getDayStep(state);
  if(dayStep >= ACTIONS_PER_DAY) return "打烊";
  const hour = OPENING_HOUR + Math.floor(dayStep * MINUTES_PER_ACTION / 60);
  if(hour < 12) return "上午";
  if(hour < 14) return "午间";
  if(hour < 17) return "下午";
  return "傍晚";
}

export function createNextDayCards(collections = []){
  if(collections.length < MIN_COLLECTIONS_PER_DAY) return [];
  const rounds = Array.from({length: 4}, () => []);
  collections.forEach((card, index) => rounds[index % 4].push(card));
  const crystals = rounds.map((round, index) => ({
    value: Math.round(round.reduce((sum, card) => sum + card.value, 0) / round.length),
    foodType: round.at(-1).foodType,
    source: "round_crystal",
    round: ["A", "B", "C", "D"][index]
  }));
  const maximum = collections.reduce((best, card) => !best || card.value >= best.value ? card : best, null);
  return [...crystals, {
    value: maximum.value,
    foodType: maximum.foodType,
    source: "daily_maximum"
  }];
}

export function createDaySettlement(state){
  const todayCollections = (state?.collectionCards ?? state?.collection ?? [])
    .slice(state?.dayStartCollectionCount ?? 0)
    .map(card => ({value: card.value, foodType: card.foodType}));
  const targetScore = getDayScoreTarget(state.day);
  const finalScore = state.score ?? 0;
  const scoreTargetMet = finalScore >= targetScore;
  const collectionTargetMet = todayCollections.length >= MIN_COLLECTIONS_PER_DAY;
  const passed = scoreTargetMet && collectionTargetMet;
  return {
    day: state.day,
    targetScore,
    finalScore,
    scoreGainToday: finalScore - (state.dayStartScore ?? 0),
    collectionGainToday: todayCollections.length,
    minimumCollectionCount: MIN_COLLECTIONS_PER_DAY,
    scoreTargetMet,
    collectionTargetMet,
    boardCount: getBoardCount(state.board),
    boardSum: getNonDrinkBoardSum(state.board),
    passed,
    nextDayCards: passed ? createNextDayCards(todayCollections) : []
  };
}

export function settleDayIfNeeded(state){
  if(!state?.dayCycleEnabled || state.daySettlement || getDayStep(state) < ACTIONS_PER_DAY) return state;
  const daySettlement = createDaySettlement(state);
  return {
    ...state,
    daySettlement,
    dayHistory: [...(state.dayHistory ?? []), daySettlement],
    gameOver: !daySettlement.passed,
    gameOverReason: daySettlement.passed
      ? null
      : daySettlement.scoreTargetMet ? "day_collection_failed" : "day_target_failed"
  };
}

export function advanceToNextDay(state){
  if(!state?.dayCycleEnabled || !state.daySettlement?.passed) return state;
  const board = createEmptyBoard();
  state.daySettlement.nextDayCards.forEach((card, index) => {
    board[NEXT_DAY_BOARD_INDEXES[index]] = {
      id: state.nextId + index,
      value: card.value,
      scoreValue: getBaseScore(card.value),
      foodType: card.foodType,
      purity: "pure",
      parents: null,
      parentFoods: null,
      drinkOriginValue: null,
      sourceKey: null,
      origin: null
    };
  });
  return {
    ...state,
    board,
    nextId: state.nextId + state.daySettlement.nextDayCards.length,
    day: state.day + 1,
    dayStartStep: state.steps,
    dayStartScore: state.score ?? 0,
    dayStartCollectionCount: state.collectionCards?.length ?? state.collection?.length ?? 0,
    heaterCount: 1,
    restoreCount: 1,
    superHeaterCount: 1,
    daySettlement: null,
    gameOver: false,
    gameOverReason: null
  };
}
