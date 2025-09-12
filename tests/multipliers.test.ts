import { makeMultiplierMap, bumpMultipliers } from '../src/js/engine/multipliers';

test('cell multipliers double and cap', () => {
  const map = makeMultiplierMap(2, 2);
  const cap = 8;
  bumpMultipliers(map, [[0, 0], [0, 1]], cap);
  expect(map[0][0]).toBe(2);
  expect(map[0][1]).toBe(2);

  bumpMultipliers(map, [[0, 0]], cap);
  expect(map[0][0]).toBe(4);

  bumpMultipliers(map, [[0, 0]], cap);
  expect(map[0][0]).toBe(8);

  // capped
  bumpMultipliers(map, [[0, 0]], cap);
  expect(map[0][0]).toBe(8);
});