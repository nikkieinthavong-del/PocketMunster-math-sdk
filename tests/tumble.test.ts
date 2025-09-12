import { applyTumble, makeRemoveMask } from '../src/js/engine/tumble';
import type { Grid, Cell } from '../src/js/engine/types';
import { mulberry32 } from '../src/js/engine/rng';

function mk(id: string): Cell {
  return { kind: 'standard', tier: 1, id };
}

test('tumble collapses columns and fills new cells', () => {
  const rows = 4, cols = 4;
  const grid: Grid = [
    [mk('a'), mk('b'), mk('c'), mk('d')],
    [mk('e'), mk('f'), mk('g'), mk('h')],
    [mk('i'), mk('j'), mk('k'), mk('l')],
    [mk('m'), mk('n'), mk('o'), mk('p')],
  ];

  const mask = makeRemoveMask(rows, cols);
  mask[3][1] = true; // remove 'n'
  mask[1][1] = true; // remove 'f'

  const genCell = () => mk('new');
  const rng = mulberry32(42);

  const out = applyTumble(grid, mask, genCell as any, rng);
  // Column 1 (index 1) should collapse: keep b, j from top, then fill 2 new at top
  const col1 = [out[0][1].id, out[1][1].id, out[2][1].id, out[3][1].id];
  // After tumble, bottom-up should be: j, b, new, new (since 'n' and 'f' removed)
  expect(col1[3]).toBe('j');
  expect(col1[2]).toBe('b');
  expect([col1[0], col1[1]].filter(x => x === 'new').length).toBe(2);
});