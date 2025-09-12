import { findClusters } from '../src/js/engine/cluster';
import type { Grid } from '../src/js/engine/types';

function mkStandard(tier: number, id: string) {
  return { kind: 'standard' as const, tier: tier as any, id };
}

test('finds a 5+ cluster (4-way only)', () => {
  const rows = 7, cols = 7;
  const grid: Grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => mkStandard(2, `u_${r}_${c}`))
  );

  // Make a vertical cluster of 5: id 'tier1_0', tier 1
  for (let r = 1; r <= 5; r++) grid[r][3] = mkStandard(1, 'tier1_0');

  const clusters = findClusters(grid, 5);
  expect(clusters.length).toBe(1);
  expect(clusters[0].positions.length).toBe(5);
  expect(clusters[0].tier).toBe(1);
});