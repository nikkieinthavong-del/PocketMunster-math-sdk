import type { Grid, MultiplierMap, SpinConfig, SpinEvent, SpinResult } from './types';
import { mulberry32, splitRng } from './rng';
import { generateGrid } from './grid';
import { findClusters } from './cluster';
import { bumpMultipliers, makeMultiplierMap, productUnderCluster } from './multipliers';
import { performEvolution } from './evolution';
export interface EngineOptions {
  seed?: number;
  maxCascades?: number;
}

export function makeSpinConfig(configJson: any): SpinConfig {
  const rows = configJson.grid?.rows ?? 7;
  const cols = configJson.grid?.cols ?? 7;
  return {
    rows,
    cols,
    weights: configJson.symbolWeights ?? { tier1: 1 },
    cellMultiplierCap: configJson.multipliers?.cellMax ?? 8192,
  };
}

function computeClusterBaseWinX(tier: number, size: number): number {
  // Simple anchor curve (placeholder). Replace with real paytable integration.
  const base = {
    1: { 5: 0.2, 8: 0.8, 12: 2.5, 15: 10 },
    2: { 5: 0.8, 8: 2.5, 12: 8, 15: 25 },
    3: { 5: 2, 8: 10, 12: 30, 15: 100 },
    4: { 5: 5, 8: 20, 12: 60, 15: 200 },
    5: { 5: 20, 8: 100, 12: 500, 15: 2000 },
  } as const;
  const brackets = [15, 12, 8, 5];
  for (const b of brackets) {
    if (size >= b) return (base as any)[tier][b];
  }
  return 0;
}

export function spin(
  configJson: any,
  bet: number,
  opts: { seed?: number; maxCascades?: number; initMultiplierMap?: MultiplierMap } = {},
): SpinResult {
  const seed = opts.seed ?? Date.now();
  const maxCascades = opts.maxCascades ?? 20;
  const cfg = makeSpinConfig(configJson);
  const rngBase = mulberry32(seed);

  let grid: Grid = generateGrid(cfg, splitRng(seed, 'base/gen0'));
  // initialize multiplier map
  let mult = makeMultiplierMap(cfg.rows, cfg.cols);
  const events: SpinEvent[] = [{ type: 'spinStart', payload: { seed } }];
  let totalWinX = 0;

  let cascades = 0;

  while (cascades < maxCascades) {
    const clusters = findClusters(grid, 5);
    if (clusters.length === 0) {
      // Potential Team Rocket random event trigger (non-winning spin only)
      if (totalWinX === 0) {
        const rocketChance = 0.01; // 1% chance
        if (rngBase() < rocketChance) {
          events.push({ type: 'featureEnter', payload: { feature: 'teamRocket' } });
          const evolutionResult = performEvolution(grid);
          const maybeEvolvedGrid: Grid | undefined =
            (evolutionResult as any).newGrid ?? (evolutionResult as any).grid;
          grid = maybeEvolvedGrid ?? grid;
          // If grid dimensions changed, update multiplier map accordingly
          if (
            grid.length !== mult.length ||
            (grid[0] && mult[0] && grid[0].length !== mult[0].length)
          ) {
            mult = makeMultiplierMap(grid.length, grid[0].length);
          }
        }
      }
      break;
    }

    cascades++;
    const cluster = clusters[0];
    const clusterSize = cluster.positions.length;
    const clusterTier = cluster.tier;
    const clusterCells = cluster.positions;
    const mappedCells = clusterCells.map(([row, col]) => ({ row, col }));
    const clusterMultiplier = productUnderCluster(mult, clusterCells);
    const winX = computeClusterBaseWinX(clusterTier, clusterSize) * bet * clusterMultiplier;
    totalWinX += winX;

    events.push({
      type: 'win',
      payload: {
        clusterId: `${cascades}-${clusterTier}-${clusterSize}`,
        cells: mappedCells,
        symbol: {
          id: cluster.id,
          tier: cluster.tier
        },
        size: clusterSize,
        multiplier: clusterMultiplier,
        winAmount: winX
      }
    });

    // TODO: Implement tumble/multiplier updates; stop after first win for now
    break;
  }

  // Finalize spin result
  const result: SpinResult = {
    grid,
    events,
    multiplierMap: mult,
    uiHints: {},
    totalWinX: totalWinX
  };
  return result;
}
