const COLLECTION_MULTIPLIER_RATES = Object.freeze({
  2: 1,
  3: 1.1,
  4: 1.15,
  5: 1.25,
  6: 1.3,
  7: 1.4
});

export function getCollectionMultiplier(collectionRecord){
  const collectedValue = collectionRecord?.value;
  const originalValue = collectionRecord?.origin?.type === "reduce"
    ? collectionRecord.origin.parent?.value
    : null;
  const multiplier = originalValue / collectedValue;
  const isValid = Number.isInteger(originalValue)
    && Number.isInteger(collectedValue)
    && collectedValue > 0
    && Number.isInteger(multiplier)
    && multiplier >= 2;
  const collectionMultiplier = isValid ? multiplier : 1;

  return {
    collectionMultiplier,
    collectionMultiplierRate: collectionMultiplier >= 8
      ? 1.5
      : (COLLECTION_MULTIPLIER_RATES[collectionMultiplier] ?? 1)
  };
}
