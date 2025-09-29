import { describe, it, expect } from 'vitest';
import { applyTumble, makeRemoveMask } from '../src/js/engine/tumble.js';
import type { Grid } from '../src/js/engine/types.js';

function std(id: string, tier = 1): any {
  return { kind: 'standard', tier, id };
}
function rngConst(v = 0.5) {
  return () => v;
}

describe('tumble basics', () => {
  it('collapses removed cells and generates new ones with cascade multiplier updates', () => {
    const grid: Grid = [
      [std('tier1_a'), std('tier1_b')],
      [std('tier1_c'), std('tier3_d')], // tier3 to exercise evolution bonus path
    ];
    const mask = makeRemoveMask(2, 2);
    // Remove top row to force both positions to refill
    mask[0][0] = true;
    mask[0][1] = true;

    const multiplierMap = [
      [1, 1],
      [1, 1],
    ];

    const res = applyTumble(
      grid,
      mask,
      () => std('tier3_new', 3), // always generate tier3 to trigger evolution bonus
      rngConst(),
      multiplierMap,
      3, // cascadeLevel high enough to trigger chain bonus path
      {
        maxCascades: 8,
        multiplierIncrease: 1,
        chainBonusThreshold: 3,
        chainBonusMultiplier: 2,
        evolutionBonusMultiplier: 3,
        persistentMultipliers: true,
      },
    );

    // Two new symbols at positions [0,0] and [0,1]
    expect(res.newSymbolsPositions).toEqual([
      [0, 0],
      [0, 1],
    ]);
    // Multiplier boosts applied due to cascade level and evolution bonus
    expect(res.multiplierBoosts.length).toBeGreaterThanOrEqual(1);
    for (const b of res.multiplierBoosts) {
      expect(b.newValue).toBeGreaterThan(b.oldValue);
    }
  });
});

describe('tumble multiplier tiers', () => {
  it('increments winning position multipliers by tier per cascade level', async () => {
    const { applyWinningPositionMultipliers } = await import('../src/js/engine/tumble.js');

    const multiplierMap = [[1, 1, 1]];
    const winningPositions: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [0, 2],
    ];

    // Level 0: +1 each
    let updates = applyWinningPositionMultipliers(multiplierMap as any, winningPositions, 0);
    expect(updates.map(({ newValue, oldValue }: any) => newValue - oldValue)).toEqual([1, 1, 1]);

    // Level 1: +2 each (early cascades)
    updates = applyWinningPositionMultipliers(multiplierMap as any, winningPositions, 1);
    expect(updates.map(({ newValue, oldValue }: any) => newValue - oldValue)).toEqual([2, 2, 2]);

    // Level 3: +3 each (mid cascades)
    updates = applyWinningPositionMultipliers(multiplierMap as any, winningPositions, 3);
    expect(updates.map(({ newValue, oldValue }: any) => newValue - oldValue)).toEqual([3, 3, 3]);

    // Level 5: +5 each (late cascades)
    updates = applyWinningPositionMultipliers(multiplierMap as any, winningPositions, 5);
    expect(updates.map(({ newValue, oldValue }: any) => newValue - oldValue)).toEqual([5, 5, 5]);
  });
});
