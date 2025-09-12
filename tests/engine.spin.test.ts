import { spin } from '../src/js/engine/engine';
import config from '../config.json';

test('spin is deterministic for a given seed', () => {
  const seed = 123456;
  const a = spin(config, 1, { seed, maxCascades: 10 });
  const b = spin(config, 1, { seed, maxCascades: 10 });

  expect(a.totalWinX).toBe(b.totalWinX);
  expect(a.events.length).toBe(b.events.length);

  for (let i = 0; i < a.events.length; i++) {
    expect(a.events[i].type).toBe(b.events[i].type);
    expect(JSON.stringify(a.events[i].payload)).toBe(JSON.stringify(b.events[i].payload));
  }
});