import type { Cell, Grid, SpinConfig } from './types.js';
import type { RNG } from './rng.js';

const STANDARD_BUCKETS = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'] as const;

function cumulative(weights: Record<string, number>) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const sum = entries.reduce((a, [, w]) => a + w, 0);
  let acc = 0;
  return entries.map(([k, w]) => {
    acc += w / sum;
    return [k, acc] as const;
  });
}

function pickBucket(wcum: ReadonlyArray<readonly [string, number]>, rng: RNG): string {
  const r = rng();
  for (const [k, c] of wcum) {
    if (r <= c) return k;
  }
  return wcum[wcum.length - 1][0];
}

let cachedCum: ReturnType<typeof cumulative> | null = null;
let cachedKey = '';

function getCum(weights: Record<string, number>) {
  const key = JSON.stringify(weights);
  if (key !== cachedKey) {
    cachedCum = cumulative(weights);
    cachedKey = key;
  }
  return cachedCum!;
}

function makeStandardId(tier: number, rng: RNG): string {
  // Create 8 distinct ids per tier for diversity
  const idx = Math.floor(rng() * 8);
  return `tier${tier}_${idx}`;
}

export function generateCell(cfg: SpinConfig, rng: RNG): Cell {
  const wcum = getCum(cfg.weights);
  const bucket = pickBucket(wcum, rng);
  if ((STANDARD_BUCKETS as readonly string[]).includes(bucket)) {
    const tier = Number(bucket.slice(4)) as 1 | 2 | 3 | 4 | 5;
    return { kind: 'standard', tier, id: makeStandardId(tier, rng) };
  }
  if (bucket === 'wild') return { kind: 'wild', tier: 0, id: 'wild' };
  if (bucket === 'egg') return { kind: 'egg', tier: 0, id: 'egg' };
  if (bucket === 'pokeballScatter') return { kind: 'scatter_pokeball', tier: 0, id: 'scatter_pokeball' };
  if (bucket === 'pikachuScatter') return { kind: 'scatter_pikachu', tier: 0, id: 'scatter_pikachu' };
  if (bucket === 'trainerScatter') return { kind: 'scatter_trainer', tier: 0, id: 'scatter_trainer' };
  // Fallback to tier1
  return { kind: 'standard', tier: 1, id: makeStandardId(1, rng) };
}

export function generateGrid(cfg: SpinConfig, rng: RNG): Grid {
  const g: Grid = [];
  for (let r = 0; r < cfg.rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cfg.cols; c++) {
      row.push(generateCell(cfg, rng));
    }
    g.push(row);
  }
  return g;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row => row.map(cell => ({ ...cell })));
}