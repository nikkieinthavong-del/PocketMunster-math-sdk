import { describe, it, expect } from 'vitest';
import { generateCell, generateGrid } from '../src/js/engine/grid.js';
import { mulberry32 } from '../src/js/engine/rng.js';

const cfg = {
  rows: 3,
  cols: 4,
  // Heavily bias to a single bucket to make assertions easy, but keep a second present
  weights: { tier1: 10, tier2: 1 },
  cellMultiplierCap: 64,
};

describe('grid generation', () => {
  it('generateCell is deterministic for a given RNG', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const a = Array.from({ length: 10 }, () => generateCell(cfg as any, rng1));
    const b = Array.from({ length: 10 }, () => generateCell(cfg as any, rng2));
    expect(a).toEqual(b);
  });

  it('generateGrid fills rows x cols with valid cells', () => {
    const rng = mulberry32(7);
    const g = generateGrid(cfg as any, rng);
    expect(g.length).toBe(cfg.rows);
    expect(g[0].length).toBe(cfg.cols);
    // All cells should have a kind/id/tier consistent with types
    for (const row of g) {
      for (const cell of row) {
        expect(cell).toHaveProperty('kind');
        expect(cell).toHaveProperty('id');
        expect(typeof cell.tier).toBe('number');
      }
    }
  });
});
