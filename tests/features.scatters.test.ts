import { describe, it, expect } from 'vitest';
import config from '../config.json';
import { spin } from '../src/js/engine/engine.js';

function countPikachuScatters(grid: any[][]) {
  let k = 0;
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < grid[0].length; c++)
      if (grid[r][c]?.kind === 'scatter_pikachu') k++;
  return k;
}

describe('scatters placement', () => {
  it('places scatters occasionally', () => {
    const spins = 2000;
    let triggers = 0;
    for (let i = 0; i < spins; i++) {
      const res = spin(config as any, 1, { seed: (123456 + i) >>> 0 });
      if (countPikachuScatters(res.grid as any[][]) >= 4) triggers++;
    }
    expect(triggers).toBeGreaterThan(0);
    expect(triggers).toBeLessThan(spins * 0.2);
  });
});