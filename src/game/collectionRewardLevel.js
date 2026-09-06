export function getCollectionRewardMultiplier(rewardLevel){
  const collectionRewardLevel = Number.isInteger(rewardLevel) && rewardLevel >= 2
    ? rewardLevel
    : 2;

  return {
    collectionRewardLevel,
    collectionMultiplierRate: Math.min(1.5, 1 + (collectionRewardLevel - 2) * 0.05)
  };
}
