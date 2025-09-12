import type { Cell, Grid } from './types';
import { generateCell } from './grid';
import type { RNG } from './rng';

export function applyTumble(grid: Grid, removeMask: boolean[][], genCell: (rng: RNG) => Cell, rng: RNG): Grid {
  const rows = grid.length, cols = grid[0].length;
  const out: Grid = Array.from({ length: rows }, () => Array<Cell>(cols));
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
      }
    }
  }
  return out;
}

export function makeRemoveMask(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}