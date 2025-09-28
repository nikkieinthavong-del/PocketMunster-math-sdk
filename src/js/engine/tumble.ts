import type { Cell, Grid, MultiplierMap } from './types.js';
import { generateCell } from './grid.js';
import type { RNG } from './rng.js';

export interface TumbleResult {
  grid: Grid;
  cascadeLevel: number;
  newSymbolsPositions: Array<[number, number]>;
  multiplierBoosts: Array<{
    position: [number, number];
    oldValue: number;
    newValue: number;
    reason: 'cascade' | 'chain' | 'evolution_bonus';
  }>;
}

export interface CascadeConfig {
  maxCascades: number;
  multiplierIncrease: number; // e.g., 1 means +1x per cascade
  chainBonusThreshold: number; // consecutive cascades needed for bonus
  chainBonusMultiplier: number;
  evolutionBonusMultiplier: number;
  persistentMultipliers: boolean;
}

const DEFAULT_CASCADE_CONFIG: CascadeConfig = {
  maxCascades: 8,
  multiplierIncrease: 1,
  chainBonusThreshold: 3,
  chainBonusMultiplier: 2,
  evolutionBonusMultiplier: 3,
  persistentMultipliers: true,
};

export function applyTumble(
  grid: Grid,
  removeMask: boolean[][],
  genCell: (rng: RNG) => Cell,
  rng: RNG,
  multiplierMap?: MultiplierMap,
  cascadeLevel = 0,
  config: CascadeConfig = DEFAULT_CASCADE_CONFIG
): TumbleResult {
  const rows = grid.length, cols = grid[0].length;
  const out: Grid = Array.from({ length: rows }, () => Array<Cell>(cols));
  const newSymbolsPositions: Array<[number, number]> = [];
  const multiplierBoosts: Array<{
    position: [number, number];
    oldValue: number;
    newValue: number;
    reason: 'cascade' | 'chain' | 'evolution_bonus';
  }> = [];

  // For each column, collapse cells not removed to the bottom
  for (let c = 0; c < cols; c++) {
    const stack: Cell[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (!removeMask[r][c]) stack.push(grid[r][c]);
    }

    // Fill from bottom
    for (let r = rows - 1; r >= 0; r--) {
      if (stack.length) {
        out[r][c] = stack.shift()!;
      } else {
        out[r][c] = genCell(rng);
        newSymbolsPositions.push([r, c]);

        // Apply cascade multiplier bonuses to new symbols
        if (multiplierMap && cascadeLevel > 0) {
          const oldMult = multiplierMap[r][c];
          let newMult = oldMult;

          // Base cascade bonus
          if (cascadeLevel >= 1) {
            newMult += config.multiplierIncrease * cascadeLevel;
          }

          // Chain bonus for consecutive cascades
          if (cascadeLevel >= config.chainBonusThreshold) {
            newMult += config.chainBonusMultiplier;
          }

          // Special evolution bonus for high-tier Pokemon
          if (out[r][c].kind === 'standard' && out[r][c].tier >= 3) {
            newMult += config.evolutionBonusMultiplier;
          }

          if (newMult !== oldMult) {
            multiplierMap[r][c] = Math.min(newMult, 8192); // Cap at 8192x
            multiplierBoosts.push({
              position: [r, c],
              oldValue: oldMult,
              newValue: multiplierMap[r][c],
              reason: cascadeLevel >= config.chainBonusThreshold ? 'chain' : 'cascade',
            });
          }
        }
      }
    }
  }

  return {
    grid: out,
    cascadeLevel,
    newSymbolsPositions,
    multiplierBoosts,
  };
}

export function makeRemoveMask(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

/**
 * Advanced cascade system with enhanced multiplier mechanics
 */
export function performCascadeSequence(
  initialGrid: Grid,
  genCell: (rng: RNG) => Cell,
  rng: RNG,
  findWinningClusters: (grid: Grid) => Array<{ positions: Array<[number, number]> }>,
  multiplierMap: MultiplierMap,
  config: CascadeConfig = DEFAULT_CASCADE_CONFIG
): {
  finalGrid: Grid;
  totalCascades: number;
  cascadeHistory: Array<{
    level: number;
    winningPositions: Array<[number, number]>;
    multiplierBoosts: Array<{ position: [number, number]; oldValue: number; newValue: number; reason: string }>;
  }>;
  finalMultiplierMap: MultiplierMap;
} {
  let currentGrid = initialGrid;
  let cascadeLevel = 0;
  const cascadeHistory: Array<{
    level: number;
    winningPositions: Array<[number, number]>;
    multiplierBoosts: Array<{ position: [number, number]; oldValue: number; newValue: number; reason: string }>;
  }> = [];

  while (cascadeLevel < config.maxCascades) {
    // Find winning clusters
    const winningClusters = findWinningClusters(currentGrid);
    if (winningClusters.length === 0) break;

    // Create remove mask for winning positions
    const removeMask = makeRemoveMask(currentGrid.length, currentGrid[0].length);
    const winningPositions: Array<[number, number]> = [];

    for (const cluster of winningClusters) {
      for (const [r, c] of cluster.positions) {
        removeMask[r][c] = true;
        winningPositions.push([r, c]);
      }
    }

    // Apply tumble with multiplier updates
    const tumbleResult = applyTumble(
      currentGrid,
      removeMask,
      genCell,
      rng,
      multiplierMap,
      cascadeLevel,
      config
    );

    cascadeHistory.push({
      level: cascadeLevel,
      winningPositions,
      multiplierBoosts: tumbleResult.multiplierBoosts,
    });

    currentGrid = tumbleResult.grid;
    cascadeLevel++;
  }

  return {
    finalGrid: currentGrid,
    totalCascades: cascadeLevel,
    cascadeHistory,
    finalMultiplierMap: multiplierMap,
  };
}

/**
 * Special mechanics for increasing multipliers during cascades
 */
export function applyWinningPositionMultipliers(
  multiplierMap: MultiplierMap,
  winningPositions: Array<[number, number]>,
  cascadeLevel: number,
  config: CascadeConfig = DEFAULT_CASCADE_CONFIG
): Array<{ position: [number, number]; oldValue: number; newValue: number }> {
  const updates: Array<{ position: [number, number]; oldValue: number; newValue: number }> = [];

  for (const [r, c] of winningPositions) {
    const oldValue = multiplierMap[r][c];
    let newValue = oldValue;

    // Multiplicative increase for winning positions
    if (cascadeLevel === 0) {
      newValue += 1; // First cascade: +1x
    } else if (cascadeLevel < 3) {
      newValue += 2; // Early cascades: +2x
    } else if (cascadeLevel < 5) {
      newValue += 3; // Mid cascades: +3x
    } else {
      newValue += 5; // Late cascades: +5x
    }

    // Cap multiplier
    newValue = Math.min(newValue, 8192);

    if (newValue !== oldValue) {
      multiplierMap[r][c] = newValue;
      updates.push({ position: [r, c], oldValue, newValue });
    }
  }

  return updates;
}