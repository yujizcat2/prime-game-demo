const FRIDGE_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8]
];

export function getLegalFridgeStoreActions(state){
  if(!state || state.fridgeBatchActive || (state.fridgeCards?.length ?? 0) > 0) return [];
  return FRIDGE_LINES.flatMap(indexes => {
    const cards = indexes.map(index => state.board?.[index]);
    return cards.every(Boolean) && cards.every(card => card.value !== 1) && cards[0].foodType != null && cards.every(card => card.foodType === cards[0].foodType)
      ? [{type: "fridge_store", indexes: [...indexes]}]
      : [];
  });
}

export function getLegalFridgeRetrieveActions(state){
  if(!state || !(state.fridgeCards?.length > 0)) return [];
  const emptyIndexes = state.board.flatMap((card, index) => card ? [] : [index]);
  return state.fridgeCards.flatMap((card, fridgeIndex) => card && card.value !== 1
    ? emptyIndexes.map(boardIndex => ({type: "fridge_retrieve", fridgeIndex, boardIndex}))
    : []
  );
}

export function applyFridgeAction(state, action){
  if(action?.type === "fridge_store"){
    const legal = getLegalFridgeStoreActions(state)
      .find(candidate => candidate.indexes.join("-") === action.indexes?.join("-"));
    if(!legal) return state;
    const storedAt = state.totalActionMinutes ?? 0;
    const board = [...state.board];
    const fridgeCards = legal.indexes.map(index => {
      const card = board[index];
      board[index] = null;
      return {...card, fridgeStoredAt: storedAt};
    });
    return {...state, board, fridgeCards, fridgeBatchActive: true};
  }

  if(action?.type === "fridge_retrieve"){
    const {fridgeIndex, boardIndex} = action;
    if(!getLegalFridgeRetrieveActions(state).some(candidate =>
      candidate.fridgeIndex === fridgeIndex && candidate.boardIndex === boardIndex
    )) return state;
    const now = state.totalActionMinutes ?? 0;
    const fridgeCards = [...state.fridgeCards];
    const storedCard = fridgeCards[fridgeIndex];
    const {fridgeStoredAt, ...card} = storedCard;
    card.bornAt = (card.bornAt ?? now) + Math.max(0, now - (fridgeStoredAt ?? now));
    fridgeCards[fridgeIndex] = null;
    const board = [...state.board];
    board[boardIndex] = card;
    const empty = fridgeCards.every(item => !item);
    return {...state, board, fridgeCards: empty ? [] : fridgeCards, fridgeBatchActive: !empty};
  }

  return state;
}
