import { describe, it, expect } from 'vitest';
import { performMorphing } from '../src/js/engine/evolution.js';
import type { Grid } from '../src/js/engine/types.js';

function std(id: string, tier = 1): any {
  return { kind: 'standard', tier, id };
}

// Deterministic RNG helper that returns values from a fixed array
function seq(values: number[]) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('morphing mechanics', () => {
  it('morphs due to adjacent different species when RNG favors it', () => {
    // Grid with two different species adjacent, ensuring adjacency morph path
    const g: Grid = [[std('tier1_pikachu'), std('tier1_charmander')]];

    // performMorphing checks: if cell.kind is standard and rng() <= morphChance (0.15),
    // then for adjacent different species, if rng() < adjacentMorphBonus (0.3),
    // it morphs to neighbor species. We'll provide sequence: 0.0 for morphChance pass,
    // and 0.0 for adjacentMorphBonus pass.
    const rng = seq([0.0, 0.0, 0.5, 0.5]);
    const res = performMorphing(g, rng);

    expect(res.morphed).toBe(true);
    expect(res.morphSteps.length).toBeGreaterThanOrEqual(1);
    const step = res.morphSteps[0];
    expect(step.fromSpecies).toBe('pikachu');
    expect(step.toSpecies === 'charmander' || step.toSpecies === 'pikachu').toBe(true);

    // Grid updated at the morphed position
    const [r, c] = step.position;
    expect(g[r][c].id.startsWith(`tier${g[r][c].tier}_`)).toBe(true);
  });
});
