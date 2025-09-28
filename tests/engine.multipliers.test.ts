import { describe, it, expect } from 'vitest';
import {
  makeMultiplierMap,
  bumpMultipliers,
  productUnderCluster,
} from '../src/js/engine/multipliers.js';

describe('multipliers utilities', () => {
  it('makeMultiplierMap creates an all-ones matrix', () => {
    const m = makeMultiplierMap(2, 3);
    expect(m).toEqual([
      [1, 1, 1],
      [1, 1, 1],
    ]);
  });

  it('bumpMultipliers doubles values and respects cap', () => {
    const m = makeMultiplierMap(2, 2);
    // Pre-set one cell near cap
    m[0][1] = 33;
    const raised = bumpMultipliers(
      m,
      [
        [0, 0], // 1 -> 2
        [0, 1], // 33 -> min(66, 64) = 64
        [1, 1], // 1 -> 2
      ],
      64,
    );

    expect(m).toEqual([
      [2, 64],
      [1, 2],
    ]);
    expect(raised).toEqual([
      [0, 0, 2],
      [0, 1, 64],
      [1, 1, 2],
    ]);
  });

  it('productUnderCluster multiplies values at positions', () => {
    const m = [
      [2, 1, 4],
      [1, 3, 1],
    ];
    const p = productUnderCluster(m as any, [
      [0, 0],
      [0, 2],
      [1, 1],
    ]);
    expect(p).toBe(2 * 4 * 3);
  });
});
