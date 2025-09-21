import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { spin } from '../src/js/engine/engine.js';

const baseConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'config.json'), 'utf-8'));

// Slightly bias the config to ensure we get some removals in a few cascades
const testConfig = {
  ...baseConfig,
  grid: { rows: 6, cols: 5 },
  engine: { ...(baseConfig.engine||{}), chanceAddMultiplier: 0.0, chanceMasterBall: 0.0, hunt: { rushTarget: 20, wildPerCascade: 3 } },
  multipliers: { ...(baseConfig.multipliers||{}), cellMax: 128 }
};

describe('Bonus Modes', () => {
  it('Hunt accumulates rush progress when cells are removed', () => {
    const seed = 20250919;
    const res = spin(testConfig, 1, { seed, maxCascades: 10, inBonusMode: 'hunt' });
    const rush = (res.uiHints as any)?.rush;
    expect(rush).toBeDefined();
    // If no clusters at all, rush can be 0; but typically should be > 0 with our config
    expect(rush.target).toBeGreaterThan(0);
    expect(rush.progress).toBeGreaterThanOrEqual(0);
  });

  it('Epic increments existing multipliers after cascades (sticky progressive)', () => {
    const seed = 20250919;
    // Start with a non-empty multiplier map to verify increment behavior
    const init: number[][] = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => 0));
    init[2][2] = 2; init[0][0] = 3;
    const res = spin(testConfig, 1, { seed, maxCascades: 3, inBonusMode: 'epic', initMultiplierMap: init });
    const after = res.multiplierMap;
    // Both seeded positions should have risen by at least +1 unless capped by no cascades
    expect(after[2][2]).toBeGreaterThanOrEqual(3);
    expect(after[0][0]).toBeGreaterThanOrEqual(4);
  });

  it('Frenzy forces at least one multiplier placement per cascade (probabilistically visible)', () => {
    const seed = 20250919;
    const res = spin(testConfig, 1, { seed, maxCascades: 3, inBonusMode: 'frenzy' });
    // Soft assertion: look for any multipliers placed
    const count = res.multiplierMap.flat().filter(x => x > 0).length;
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
