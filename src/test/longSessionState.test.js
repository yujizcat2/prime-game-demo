import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { createCombineOrigin, createReduceOrigin } from "../game/numberOrigin";

function baseCard(value = 2){
  return {value, scoreValue: value, bornAt: 0, foodType: "meat", purity: "pure", origin: null};
}

function buildLineage(generations){
  let card = baseCard();
  for(let generation = 1; generation <= generations; generation += 1){
    const other = baseCard(generation + 2);
    const value = card.value + other.value;
    card = {...baseCard(value), origin: createCombineOrigin(value, card, other)};
  }
  return card;
}

function originDepth(origin){
  if(!origin) return 0;
  if(origin.type === "combine"){
    return 1 + Math.max(
      originDepth(origin.mainParent?.origin),
      ...(origin.parents ?? []).map(parent => originDepth(parent?.origin))
    );
  }
  return 1 + originDepth((origin.parent ?? origin.from)?.origin);
}

function assertDirectParentsAreCompact(origin){
  if(!origin) return;
  if(origin.type === "combine"){
    assert.ok((origin.parents ?? []).every(parent => parent.origin == null));
    assertDirectParentsAreCompact(origin.mainParent?.origin);
    return;
  }
  assertDirectParentsAreCompact((origin.parent ?? origin.from)?.origin);
}

const checkpoints = [50, 100, 200, 400, 800];
const measurements = checkpoints.map(generations => {
  const startedAt = performance.now();
  const card = buildLineage(generations);
  const combineMs = performance.now() - startedAt;
  const cardBytes = Buffer.byteLength(JSON.stringify(card));
  const reducedAt = performance.now();
  const reduced = {...card, value: Math.max(1, Math.floor(card.value / 2)), origin: createReduceOrigin(card.value, card)};
  const reduceMs = performance.now() - reducedAt;
  return {generations, cardBytes, depth: originDepth(card.origin), combineMs, reduceMs, reducedBytes: Buffer.byteLength(JSON.stringify(reduced))};
});

for(const measurement of measurements){
  assert.equal(measurement.depth, measurement.generations);
  assert.ok(measurement.cardBytes < measurement.generations * 1000, `lineage at ${measurement.generations} generations must remain linear and compact`);
}

assertDirectParentsAreCompact(buildLineage(800).origin);
assert.ok(measurements.at(-1).cardBytes < measurements[0].cardBytes * 20, "16x more generations must not cause super-linear card growth");
console.log(JSON.stringify(measurements));
