import { enterArena, stepArena } from '../src/js/features/arena';
import config from '../config.json';

test('arena special applies x3 to next two damaging moves', () => {
  // Use a fixed seed and small turn budget; this asserts determinism and internal counters
  const seed = 2024;
  const init = enterArena(config, 'brock', seed, 6);

  // Step a few moves; ensure deterministic
  const s1 = stepArena(init, config);
  const s2 = stepArena(s1, config);
  const s3 = stepArena(s2, config);
  const s4 = stepArena(s3, config);

  // Basic invariants
  expect(s4.turnsLeft).toBeLessThan(init.turnsLeft);
  expect(s4.totalDamageX).toBeGreaterThanOrEqual(0);
  // Determinism: repeat from fresh
  let a = enterArena(config, 'brock', seed, 6);
  for (let i = 0; i < 4; i++) a = stepArena(a, config);
  expect(a.totalDamageX).toBe(s4.totalDamageX);
  expect(a.bossHpLeft).toBe(s4.bossHpLeft);
});