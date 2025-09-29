import { describe, it, expect } from 'vitest';
import { makeSpinConfig } from '../src/js/engine/engine.js';

describe('makeSpinConfig', () => {
  it('fills defaults when fields are missing', () => {
    const cfg = makeSpinConfig({});
    expect(cfg.rows).toBe(7);
    expect(cfg.cols).toBe(7);
    expect(cfg.weights).toEqual({ tier1: 1 });
    expect(cfg.cellMultiplierCap).toBe(8192);
  });

  it('uses provided values when present', () => {
    const cfg = makeSpinConfig({
      grid: { rows: 5, cols: 6 },
      symbolWeights: { tier1: 2, tier2: 1 },
      multipliers: { cellMax: 64 },
    });
    expect(cfg.rows).toBe(5);
    expect(cfg.cols).toBe(6);
    expect(cfg.weights).toEqual({ tier1: 2, tier2: 1 });
    expect(cfg.cellMultiplierCap).toBe(64);
  });
});
