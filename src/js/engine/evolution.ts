import type { EvolutionOutcome, Grid } from './types';

function neighbors(r: number, c: number) {
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ] as const;
}

function inBounds(grid: Grid, r: number, c: number) {
  return r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;
}

export function eggAdjacentToWin(grid: Grid, winMask: boolean[][]): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (!winMask[r][c]) continue;
      for (const [nr, nc] of neighbors(r, c)) {
        if (inBounds(grid, nr, nc) && grid[nr][nc].kind === 'egg') return true;
      }
    }
  }
  return false;
}

/**
 * Evolves any set of >= 4 identical Tier1 into Tier2; then if >=4 Tier2 exist post-tumble, can be called again by the engine.
 * This is a simplified placeholder without named species mapping; tier increments and keeps the same local id suffix.
 */
export function performEvolution(grid: Grid): EvolutionOutcome {
  const rows = grid.length, cols = grid[0].length;
  // Count positions by (tier,id)
  const byKey = new Map<string, Array<[number, number]>>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.kind !== 'standard') continue;
      const key = `${cell.tier}:${cell.id}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push([r, c]);
    }
  }

  // Prefer lower tiers
  const candidates = [...byKey.entries()]
    .map(([k, positions]) => {
      const [tierStr] = k.split(':');
      return { tier: Number(tierStr), positions, key: k };
    })
    .filter(e => e.tier === 1 && e.positions.length >= 4)
    .sort((a, b) => b.positions.length - a.positions.length);

  if (candidates.length === 0) {
    return { evolved: false, steps: [] };
  }

  const chosen = candidates[0];
  const toTier = Math.min(chosen.tier + 1, 3);
  const steps = [{ fromTier: chosen.tier, toTier, positions: chosen.positions }];

  for (const [r, c] of chosen.positions) {
    const old = grid[r][c];
    grid[r][c] = {
      kind: 'standard',
      tier: toTier as any,
      // keep same id suffix but swap tier prefix
      id: old.id.replace(/^tier\d+_/, `tier${toTier}_`),
    };
  }

  return { evolved: true, steps };
}