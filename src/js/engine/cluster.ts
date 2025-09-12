import type { Cell, Grid } from './types.js';

export interface Cluster {
  id: string; // match key
  positions: Array<[number, number]>;
  tier: number;
}

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function inBounds(grid: Grid, r: number, c: number) {
  return r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;
}

export function findClusters(grid: Grid, minSize = 5): Cluster[] {
  const rows = grid.length, cols = grid[0].length;
  const seen: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const clusters: Cluster[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (seen[r][c]) continue;
      const start = grid[r][c];
      if (start.kind !== 'standard') {
        seen[r][c] = true;
        continue;
      }
      const targetId = start.id;
      const targetTier = start.tier;
      const q: Array<[number, number]> = [[r, c]];
      const pos: Array<[number, number]> = [];
      seen[r][c] = true;

      while (q.length) {
        const [cr, cc] = q.pop()!;
        pos.push([cr, cc]);
        for (const [dr, dc] of dirs) {
          const nr = cr + dr, nc = cc + dc;
          if (!inBounds(grid, nr, nc) || seen[nr][nc]) continue;
          const cell = grid[nr][nc];
          if (cell.kind === 'standard' && cell.id === targetId) {
            seen[nr][nc] = true;
            q.push([nr, nc]);
          }
        }
      }

      if (pos.length >= minSize) {
        clusters.push({ id: targetId, positions: pos, tier: targetTier });
      }
    }
  }

  return clusters;
}