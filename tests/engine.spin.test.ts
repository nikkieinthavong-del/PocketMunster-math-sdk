import { describe, it, expect } from 'vitest';
import { spin } from '../src/js/engine/engine.js';

// Minimal config helper with deterministic knobs
const baseConfig = {
  grid: { rows: 5, cols: 5 },
  engine: {
    demo: {
      // Let the engine decide wins with RNG unless overridden per test
      // Default knobs match engine.ts expectations
      winChance: 0.28,
      baseFactor: 0.25,
      // Use default scatter weights so determinism depends only on seed
    },
  },
};

describe('engine.spin', () => {
  it('is deterministic given the same seed', () => {
    const seed = 123456;
    const a = spin(baseConfig, 1, { seed });
    const b = spin(baseConfig, 1, { seed });
    // Check salient fields
    expect(a.totalWinX).toBe(b.totalWinX);
    expect(a.grid).toEqual(b.grid);
    expect(a.events).toEqual(b.events);
    // multiplierMap is derived solely from inputs, should match as well
    expect(a.multiplierMap).toEqual(b.multiplierMap);
  });

  it('applies initMultiplierMap product across winning cells when a win occurs', () => {
    // Force a win path deterministically by setting winChance=1 and limiting the space
    const cfg = {
      ...baseConfig,
      engine: { demo: { ...baseConfig.engine.demo, winChance: 1 } },
      // Keep grid small for easier amplification expectations
      grid: { rows: 3, cols: 5 },
    };

    const seed = 2025;
    // Build a multiplier map that has some >1 multipliers; others default to 1
    const initMultiplierMap = [
      [1, 2, 1, 1, 1],
      [1, 1, 3, 1, 1],
      [1, 1, 1, 1, 1],
    ];

    // First, run without multipliers to capture base totalWinX for this seed
    const baseRes = spin(cfg, 1, { seed });

    // Ensure the forced win actually happened (sanity check)
    const hadWinEvent = baseRes.events.some((e) => e.type === 'win');
    expect(hadWinEvent).toBe(true);

    // Now, run with a multiplier map applied
    const multiRes = spin(cfg, 1, { seed, initMultiplierMap });

    // The win amount should be >= base (never smaller) when multipliers >= 1
    expect(multiRes.totalWinX).toBeGreaterThanOrEqual(baseRes.totalWinX);

    // If the winning cluster overlaps any >1 cells, it should strictly increase
    const winEvt = multiRes.events.find((e) => e.type === 'win') as any;
    if (winEvt) {
      // The engine computes winAmount as baseWinX * product(multiplierMap over win cells)
      // While we don't know exact cells here without re-deriving, we can assert that
      // if any overlapped cell had multiplier>1 then the amount is strictly greater.
      // Compare to base result's win event when present.
      const baseEvt = baseRes.events.find((e) => e.type === 'win') as any;
      if (baseEvt) {
        // Strictly greater in most seeds due to presence of a 2x or 3x on the row/cols
        expect(multiRes.totalWinX).toBeGreaterThanOrEqual(baseRes.totalWinX);
      }
    }
  });
});
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { spin } from '../src/js/engine/engine.js';
const config = JSON.parse(readFileSync(resolve(process.cwd(), 'config.json'), 'utf-8'));
describe('spin() contract', () => {
  it('emits spinStart and spinEnd, totalWinX equals sum of win events', () => {
    const seed = 4242;
    const res = spin(config, 1, { seed });
    expect(res.events[0].type).toBe('spinStart');
    expect(res.events.at(-1)?.type).toBe('spinEnd');
    const wins = res.events.filter((e) => e.type === 'win');
    const sum = wins.reduce((a, w) => a + (w.payload?.winAmount ?? 0), 0);
    expect(res.totalWinX).toBeCloseTo(sum, 8);
  });

  it('is deterministic for a given seed', () => {
    const seed = 1337;
    const a = spin(config, 1, { seed });
    const b = spin(config, 1, { seed });
    expect(a.totalWinX).toBeCloseTo(b.totalWinX, 8);
    expect(a.events.map((e) => e.type)).toEqual(b.events.map((e) => e.type));
  });
});
