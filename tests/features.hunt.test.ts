import { enterHunt, stepHunt } from '../src/js/features/hunt';
import config from '../config.json';

test('hunt is deterministic and tracks combo', () => {
  const seed = 999;
  const s1 = enterHunt(config, 5, seed); // 5 scatters => 10 throws per config
  const s2 = enterHunt(config, 5, seed);

  let a = s1, b = s2;
  for (let i = 0; i < 5; i++) {
    a = stepHunt(a, config);
    b = stepHunt(b, config);
    expect(a.last?.result).toBe(b.last?.result);
    expect(a.totalWinX).toBe(b.totalWinX);
    expect(a.comboCount).toBe(b.comboCount);
    if (a.ended) break;
  }
});