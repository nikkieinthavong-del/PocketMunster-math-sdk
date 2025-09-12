import type { MultiplierMap } from './types';

export function makeMultiplierMap(rows: number, cols: number): MultiplierMap {
  return Array.from({ length: rows }, () => Array(cols).fill(1));
}

export function bumpMultipliers(map: MultiplierMap, positions: Array<[number, number]>, cap: number): Array<[number, number, number]> {
  const raised: Array<[number, number, number]> = [];
  for (const [r, c] of positions) {
    const next = Math.min(map[r][c] * 2, cap);
    map[r][c] = next;
    raised.push([r, c, next]);
  }
  return raised;
}

export function productUnderCluster(map: MultiplierMap, positions: Array<[number, number]>): number {
  return positions.reduce((acc, [r, c]) => acc * map[r][c], 1);
}