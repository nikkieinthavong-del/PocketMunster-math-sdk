import { describe, it, expect } from 'vitest';
import { eggAdjacentToWin, performEvolution } from '../src/js/engine/evolution.js';
import type { Grid } from '../src/js/engine/types.js';

function std(id: string, tier = 1): any {
  return { kind: 'standard', tier, id };
}
function egg(): any {
  return { kind: 'egg', tier: 0, id: 'egg' };
}

describe('evolution basics', () => {
  it('eggAdjacentToWin detects eggs next to winning cells', () => {
    const g: Grid = [
      [std('tier1_pikachu'), egg()],
      [std('tier1_pikachu'), std('tier1_x')],
    ];
    const winMask = [
      [true, false],
      [false, false],
    ];
    expect(eggAdjacentToWin(g, winMask)).toBe(true);
  });

  it('performEvolution promotes species per chain when RNG favors evolution', () => {
    // Build a grid with 4 pikachu at tier1 to satisfy minClusterSize and requiredTier
    const g: Grid = [
      [std('tier1_pikachu'), std('tier1_pikachu')],
      [std('tier1_pikachu'), std('tier1_pikachu')],
    ];

    // RNG that always returns 0 – always below evolutionChance thresholds
    const always = () => 0;
    const outcome = performEvolution(g, always);

    expect(outcome.evolved).toBe(true);
    expect(outcome.steps.length).toBe(1);
    const step = outcome.steps[0];
    expect(step.species).toBe('pikachu');
    expect(step.fromTier).toBe(1);
    // Not mega, so tier should bump to 2
    expect(step.toTier).toBe(2);
    expect(step.positions.length).toBeGreaterThanOrEqual(3); // 80% of 4 -> 3 (floor)

    // Grid cells at step.positions should now have next form id and tier 2
    for (const [r, c] of step.positions) {
      const cell = g[r][c];
      expect(cell.tier).toBe(2);
      expect(cell.id).toBe('tier2_raichu');
    }
  });
});
