import type { Grid } from '../engine/types';
import type { HuntState } from './hunt';
import type { FreeSpinsState } from './freespins';
import type { ArenaState, Boss } from './arena';
import { enterHunt } from './hunt';
import { enterFreeSpins } from './freespins';
import { enterArena } from './arena';

export interface FeatureTriggers {
  scatters: { pokeball: number; pikachu: number; trainer: number };
  hunt?: HuntState;
  freespins?: FreeSpinsState;
  arena?: { options: Boss[]; seed: number; preview: { boss: Boss; turns: number; state: ArenaState } };
}

export function countScatters(grid: Grid) {
  let pokeball = 0, pikachu = 0, trainer = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const k = grid[r][c].kind;
      if (k === 'scatter_pokeball') pokeball++;
      else if (k === 'scatter_pikachu') pikachu++;
      else if (k === 'scatter_trainer') trainer++;
    }
  }
  return { pokeball, pikachu, trainer };
}

export function detectFeatureTriggers(configJson: any, grid: Grid, seed: number): FeatureTriggers | undefined {
  const scatters = countScatters(grid);
  const out: FeatureTriggers = { scatters };

  if (scatters.pokeball >= 4) {
    out.hunt = enterHunt(configJson, scatters.pokeball, seed);
  }
  if (scatters.pikachu >= 4) {
    out.freespins = enterFreeSpins(configJson, scatters.pikachu, seed);
  }
  if (scatters.trainer >= 5) {
    // UI chooses boss; provide preview for Brock with 10 turns
    const boss: Boss = 'brock';
    const turns = 10;
    const preview = enterArena(configJson, boss, seed, turns);
    out.arena = { options: ['brock', 'misty', 'surge'], seed, preview: { boss, turns, state: preview } as any };
  }

  if (out.hunt || out.freespins || out.arena) return out;
  return undefined;
}