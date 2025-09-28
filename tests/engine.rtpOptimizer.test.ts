import { describe, it, expect } from 'vitest';
import { RTOOptimizer, type PaytableSet } from '../src/js/engine/rtpOptimizer.js';

describe('RTOOptimizer helpers', () => {
  it('adjustPaytables scales sections correctly and leaves free spins unchanged', () => {
    const base: PaytableSet = {
      basePays: { tier1: { 3: 1, 4: 2 } },
      clusterBonuses: { 5: 2 },
      evolutionMultipliers: { basic_to_stage1: 2 },
      freeSpinMultipliers: { 3: 8 },
      megaWinMultipliers: { full_screen: 100 },
    };

    const opt = new RTOOptimizer(0.94, 'medium');
    // Bypass private access via any to test pure logic deterministically
    const adjusted = (opt as any).adjustPaytables(base, 1.1) as PaytableSet;

    expect(adjusted.basePays.tier1[3]).toBeCloseTo(1.1, 10);
    expect(adjusted.basePays.tier1[4]).toBeCloseTo(2.2, 10);
    expect(adjusted.clusterBonuses[5]).toBeCloseTo(2.2, 10);
    expect(adjusted.evolutionMultipliers.basic_to_stage1).toBeCloseTo(2.2, 10);
    // Free spin multipliers are copied (unchanged)
    expect(adjusted.freeSpinMultipliers[3]).toBe(8);
    // Mega win multipliers scale with sqrt of factor
    expect(adjusted.megaWinMultipliers.full_screen).toBeCloseTo(100 * Math.pow(1.1, 0.5), 10);
  });

  it('classifyVolatility maps variance thresholds (low/medium/high/extreme)', () => {
    const opt = new RTOOptimizer(0.945, 'high');
    const simTemplate = {
      totalSpins: 100,
      totalWins: 100, // avgWin = 1
      rtpByDenomination: {},
      hitFrequencyByFeature: {},
      averageFeatureWin: {},
    } as const;

    // biggestWin to avg ratios: 150 -> low, 700 -> medium, 1200 -> high, 3000 -> extreme
    const mk = (biggestWin: number) => ({ biggestWin, ...simTemplate });
    expect((opt as any).classifyVolatility(mk(150))).toBe('low');
    expect((opt as any).classifyVolatility(mk(700))).toBe('medium');
    expect((opt as any).classifyVolatility(mk(1200))).toBe('high');
    expect((opt as any).classifyVolatility(mk(3000))).toBe('extreme');
  });

  it('calculateHitFrequency sums base + free spins and caps at 1.0', () => {
    const opt = new RTOOptimizer(0.945, 'high');
    const simBase = {
      totalSpins: 1000,
      totalWins: 300,
      biggestWin: 100,
      rtpByDenomination: {},
      hitFrequencyByFeature: { basePays: 0.3, freeSpins: 0.05 },
      averageFeatureWin: {},
    };
    const simCap = {
      totalSpins: 1000,
      totalWins: 300,
      biggestWin: 100,
      rtpByDenomination: {},
      hitFrequencyByFeature: { basePays: 0.8, freeSpins: 0.4 },
      averageFeatureWin: {},
    };

    expect((opt as any).calculateHitFrequency(simBase)).toBeCloseTo(0.35, 10);
    expect((opt as any).calculateHitFrequency(simCap)).toBeCloseTo(1.0, 10);
  });
});
