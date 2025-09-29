import { describe, it, expect } from 'vitest';
import { findClusters } from '../src/js/engine/cluster.js';
import type { Grid } from '../src/js/engine/types.js';

function cell(id: string): any {
  return { kind: 'standard', tier: 1, id };
}

describe('cluster detection', () => {
  it('finds a single cluster of identical adjacent ids', () => {
    // 3x3 grid with a horizontal line of 5 cells by repeating ids over rows
    const g: Grid = [
      [cell('tier1_0'), cell('tier1_0'), cell('x')],
      [cell('tier1_0'), cell('tier1_0'), cell('x')],
      [cell('tier1_0'), cell('tier1_0'), cell('x')],
    ];
    // This setup creates a 2x3 block of 'tier1_0' (size 6), which exceeds minSize 5
    const clusters = findClusters(g, 5);
    expect(clusters.length).toBe(1);
    expect(clusters[0].id).toBe('tier1_0');
    expect(clusters[0].positions.length).toBeGreaterThanOrEqual(5);
  });
});
