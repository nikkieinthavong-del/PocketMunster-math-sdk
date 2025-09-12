import { eggAdjacentToWin, performEvolution } from '../src/js/engine/evolution';
import type { Grid } from '../src/js/engine/types';

function mkStandard(tier: number, id: string) {
  return { kind: 'standard' as const, tier: tier as any, id };
}
function mkEgg() {
  return { kind: 'egg' as const, tier: 0 as any, id: 'egg' };
}

test('egg adjacent to win mask triggers eligibility', () => {
  const grid: Grid = [
    [mkStandard(1, 'tier1_0'), mkEgg()],
    [mkStandard(2, 'u'), mkStandard(2, 'v')],
  ];
  const mask = [
    [true, false],
    [false, false],
  ];
  expect(eggAdjacentToWin(grid, mask)).toBe(true);
});

test('performEvolution promotes 4 identical tier1 to tier2', () => {
  const grid: Grid = [
    [mkStandard(1, 'tier1_0'), mkStandard(1, 'tier1_0'), mkStandard(2, 'x')],
    [mkStandard(1, 'tier1_0'), mkStandard(1, 'tier1_0'), mkStandard(2, 'y')],
    [mkStandard(2, 'x'), mkStandard(2, 'y'), mkStandard(2, 'z')],
  ];

  const outcome = performEvolution(grid);
  expect(outcome.evolved).toBe(true);
  expect(outcome.steps[0].fromTier).toBe(1);
  expect(outcome.steps[0].toTier).toBe(2);
  // All 4 positions updated to tier2_* id
  let updated = 0;
  for (const [r, c] of outcome.steps[0].positions) {
    const cell = grid[r][c];
    expect(cell.tier).toBe(2);
    expect(cell.id.startsWith('tier2_')).toBe(true);
    updated++;
  }
  expect(updated).toBe(4);
});