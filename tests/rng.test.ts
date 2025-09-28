import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed, splitRng } from '../src/js/engine/rng.js';

describe('rng utilities', () => {
  it('mulberry32 is deterministic for a given seed', () => {
    const r1 = mulberry32(123);
    const r2 = mulberry32(123);
    const seq1 = [r1(), r1(), r1(), r1(), r1()];
    const seq2 = [r2(), r2(), r2(), r2(), r2()];
    expect(seq1).toEqual(seq2);
  });

  it('splitRng produces distinct streams for different names', () => {
    const a = splitRng(42, 'grid');
    const b = splitRng(42, 'bonus');
    // Low chance to collide on first few draws
    expect([a(), a(), a()].join(',')).not.toEqual([b(), b(), b()].join(','));
  });

  it('hashSeed combines parts into a stable 32-bit value', () => {
    const h1 = hashSeed(42, 'grid', 7);
    const h2 = hashSeed(42, 'grid', 7);
    const h3 = hashSeed(42, 'grid', 8);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    // within uint32 range
    expect(h1 >>> 0).toBe(h1);
  });
});
