import { gcd } from "../utils/math";

export function getBaseScore(value){
  const interferingCount = Array.from({length: 100}, (_, index) => index + 2)
    .filter(candidate => candidate !== value && gcd(value, candidate) > 1)
    .length;
  const combinationCount = Math.max(1, Math.floor(101 / value));
  const rarityInterference = Math.log(101 / (interferingCount + 1)) / Math.log(101);
  const rarityCombination = Math.log(51 / combinationCount) / Math.log(51);
  const normalizedValue = (value - 2) / 99;

  return Math.round(
    8
    + 65 * rarityInterference
    + 50 * rarityCombination
    + 17 * normalizedValue
  );
}

export function getOriginMultiplier(parentA, parentB){
  const combinedParentCount = [parentA, parentB]
    .filter(parent => parent?.origin?.type === "combine")
    .length;

  return [1.1, 1.2, 1.3][combinedParentCount];
}

export function getCreatedScoreValue(value, parentA, parentB){
  return Math.round(getBaseScore(value) * getOriginMultiplier(parentA, parentB));
}
