import type { Grid, MultiplierMap, SpinConfig, SpinEvent, SpinResult } from './types';
import { mulberry32, splitRng } from './rng';
import { generateGrid, cloneGrid, generateCell } from './grid';
import { findClusters } from './cluster';
import { makeRemoveMask, applyTumble } from './tumble';
import { bumpMultipliers, makeMultiplierMap, productUnderCluster } from './multipliers';
import { eggAdjacentToWin, performEvolution } from './evolution';
import { detectFeatureTriggers } from '../features/index';

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
) {
  const seed = opts.seed ?? Date.now();
  const maxCascades = opts.maxCascades ?? 20;
  const cfg = makeSpinConfig(configJson);
  const rngBase = mulberry32(seed);

  let grid: Grid = generateGrid(cfg, splitRng(seed, 'base/gen0'));
  // initialize multiplier map
  let mult = makeMultiplierMap(cfg.rows, cfg.cols);
  const events: SpinEvent[] = [{ type: 'spinStart', payload: { seed } }];
  let totalWinX = 0;

  const genCell = (r: number, c: number) => (rng: ReturnType<typeof mulberry32>) => generateCell(cfg, rng);

  let cascades = 0;

  while (cascades < maxCascades) {
    const clusters = findClusters(grid, 5);
    if (clusters.length === 0) {
      // Potential Team Rocket random event trigger (non-winning spin only)
      if (totalWinX === 0) {
        const rocketChance = 0.01; // 1% chance
        if (rngBase() < rocketChance) {
          events.push({ type: 'teamRocket', payload: {} });
          const t1 = Math.random() < 0.5;
          const t2 = Math.random() < 0.5;
          const r1 = t1 ? 1 : 0;
          const r2 = t2 ? 1 : 0;
          const newRows = Math.min(6, cfg.rows + r1);
          const newCols = Math.min(6, cfg.cols + r2);
          const evolveSeed = seed + 1;
          grid = performEvolution(grid, evolveSeed, newRows, newCols, splitRng(evolveSeed, 'evo'));
          mult = makeMultiplierMap(newRows, newCols);
          break;
        }
      }
      break;
    }

    cascades++;
    const cluster = clusters[0];
    const { size, tier, cells } = cluster;
    const winX = computeClusterBaseWinX(tier, size) * bet;
    totalWinX += winX;

    events.push({
      type: 'win',
      payload: {
        clusterId: `${cascades}-${tier}-${size}`,
        cells: cells as { row: number; col: number }[],
        symbol: {
          id: cluster.id,
          tier: cluster.tier,
          kind: cluster.kind
        },
        size,
        multiplier: productUnderCluster(mult, cells),
        winAmount: winX
      }
    });

        // Mark cells for removal
        for (const { row, col } of cells) {
          // TODO: Implement cell removal logic here, e.g. mark cells in a mask
          // Example: removeMask[row][col] = true;
        }
        // TODO: Continue tumble, bump multipliers, and update grid/multiplier map as needed
        // This is a placeholder for further tumble/evolution logic
    
        // End of cascade loop
      }
    
      // Finalize spin result
      const result: SpinResult = {
          grid,
          events,
          multiplierMap: mult,
          uiHints: {},
          totalWinX: 0
      };
      return result;
    }

    // Remove unused comma expression and invalid object

interface SpinEvent {
  type:
    | 'spinStart'
    | 'win'
    | 'tumbleStart'
    | 'tumbleEnd'
    | 'cellMultiplierUp'
    | 'evolutionStep'
    | 'raidStart'
    | 'raidResolve'
    | 'featureEnter'  // added
    | 'spinEnd'
    | 'teamRocket';
  payload?: any;
}