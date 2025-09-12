import { enterFreeSpins, stepFreeSpins } from '../src/js/features/freespins';
import config from '../config.json';

test('free spins deterministic with persistent multipliers', () => {
  const seed = 4242;
  let a = enterFreeSpins(config, 4, seed);
  let b = enterFreeSpins(config, 4, seed);

  for (let i = 0; i < 3; i++) {
    a = stepFreeSpins(a, config);
    b = stepFreeSpins(b, config);
    expect(a.totalWinX).toBeCloseTo(b.totalWinX, 6);
    // compare a few multiplier cells
    expect(a.multiplierMap[0][0]).toBe(b.multiplierMap[0][0]);
    expect(a.multiplierMap[3][3]).toBe(b.multiplierMap[3][3]);
  }
});