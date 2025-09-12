import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spin } from '../src/js/engine/engine';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'config.json'), 'utf-8'));

function countPikachuScatters(grid: any[][]) {
  let k = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c]?.kind === 'scatter_pikachu') k++;
    }
  }
  return k;
}

describe('scatters placement', () => {
  it('occasionally places >= 4 scatters', () => {
    const spins = 1000;
    let triggers = 0;
    for (let i = 0; i < spins; i++) {
      const res = spin(config, 1, { seed: (123456 + i) >>> 0 });
      if (countPikachuScatters(res.grid as any[][]) >= 4) triggers++;
    }
    expect(triggers).toBeGreaterThan(0);
  });
});