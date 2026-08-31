export const NEW_COLLECTION_MONEY = 10;

export function getCollectionMoneyGain(isNewCollection){
  return isNewCollection ? NEW_COLLECTION_MONEY : 0;
}
