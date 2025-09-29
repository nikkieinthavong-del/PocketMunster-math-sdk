import { describe, it, expect } from 'vitest';
import { calculateWaysWins } from '../src/js/engine/ways.js';
import type { Grid } from '../src/js/engine/types.js';

function std(id: string, tier = 1): any {
  return { kind: 'standard', tier, id };
}

describe('ways calculation', () => {
  it('computes left-to-right adjacent ways with simple paytable', () => {
    // 2 rows x 3 cols: symbols aligned per column to create ways across 3 consecutive columns
    const g: Grid = [
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1)],
      [std('tier1_pika', 1), std('x'), std('tier1_pika', 1)],
    ];

    const paytable = {
      tier1_tier1_pika: { 3: 1 }, // exact symbol-tier key used in getPayoutForSymbol
      tier1: { 3: 0.5 }, // fallback tier-based payout (not used if exact key present)
    } as any;

    // No multipliers
    const result = calculateWaysWins(g, paytable, undefined, {
      minSymbolsForWin: 3,
      payLeftToRight: true,
      payRightToLeft: false,
      adjacentOnly: true,
      maxWays: 1000,
    });

    // First column has 2 matches, second has 1, third has 2 => ways = 2 * 1 * 2 = 4
    expect(result.totalWays).toBeGreaterThanOrEqual(1);
    expect(result.wins.length).toBeGreaterThanOrEqual(1);
    const w = result.wins[0];
    expect(w.symbol).toBe('tier1_pika');
    expect(w.symbolCount).toBeGreaterThanOrEqual(3);
    expect(w.ways).toBeGreaterThanOrEqual(2);
    // Payout should scale with ways
    expect(w.winAmount).toBeGreaterThanOrEqual(1);
  });

  it('caps total ways by maxWays when multiplicative explosion occurs', () => {
    // 3 rows x 4 cols. First 3 columns have 3 matches each -> 3*3*3 = 27 ways
    // Set maxWays to 10 to force capping
    const g: Grid = [
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1), std('x')],
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1), std('x')],
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1), std('x')],
    ];

    const paytable = { tier1_tier1_pika: { 3: 1 } } as any;

    const result = calculateWaysWins(g, paytable, undefined, {
      minSymbolsForWin: 3,
      payLeftToRight: true,
      payRightToLeft: false,
      adjacentOnly: true,
      maxWays: 10,
    });

    expect(result.wins.length).toBeGreaterThan(0);
    // Ensure the ways value has been capped
    expect(result.wins[0].ways).toBe(10);
    expect(result.totalWays).toBeGreaterThanOrEqual(10);
  });

  it('computes right-to-left adjacent ways when enabled', () => {
    // 2 rows x 4 cols. Rightmost 3 columns have matching symbols; leftmost is a blocker.
    // For right-to-left, consecutive columns must start from the rightmost and move left.
    const g: Grid = [
      [std('x'), std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1)],
      [std('x'), std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1)],
    ];

    const paytable = { tier1_tier1_pika: { 3: 1 } } as any;

    const result = calculateWaysWins(g, paytable, undefined, {
      minSymbolsForWin: 3,
      payLeftToRight: false,
      payRightToLeft: true,
      adjacentOnly: true,
      maxWays: 1000,
    });

    // 3 consecutive columns each have 2 matches -> ways = 2 * 2 * 2 = 8
    expect(result.wins.length).toBeGreaterThan(0);
    const w = result.wins[0];
    expect(w.symbol).toBe('tier1_pika');
    expect(w.symbolCount).toBe(3);
    expect(w.ways).toBe(8);
    expect(w.winAmount).toBeGreaterThanOrEqual(1 * 8);
  });

  it('applies position multipliers when multiplierMap is provided', () => {
    // 2 rows x 3 cols all matching to ensure a win; set multipliers on specific positions.
    const g: Grid = [
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1)],
      [std('tier1_pika', 1), std('tier1_pika', 1), std('tier1_pika', 1)],
    ];

    // Multiplier map: boost two positions, leave others as 1 (or undefined, which is ignored)
    const multiplierMap = [
      [2, 1, 1],
      [1, 3, 1],
    ];

    const paytable = { tier1_tier1_pika: { 3: 1 } } as any;

    const result = calculateWaysWins(g, paytable, multiplierMap, {
      minSymbolsForWin: 3,
      payLeftToRight: true,
      payRightToLeft: false,
      adjacentOnly: true,
      maxWays: 1000,
    });

    expect(result.wins.length).toBeGreaterThan(0);
    const w = result.wins[0];
    // Base payout per way is 1, ways = 2 (col1:2) * 2 (col2:2) * 2 (col3:2) = 8
    // Position multiplier product includes 2 and 3 at [0,0] and [1,1] => 6
    // So winAmount should be >= 8 * 6 = 48
    expect(w.ways).toBe(8);
    expect(w.multiplier).toBeGreaterThanOrEqual(6);
    expect(w.winAmount).toBeGreaterThanOrEqual(48);
  });
});
