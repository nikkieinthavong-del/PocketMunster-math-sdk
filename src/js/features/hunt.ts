import type { RNG } from '../engine/rng';
import { splitRng } from '../engine/rng';

export type HuntBall = 'poke' | 'great' | 'ultra' | 'master';

export interface HuntConfig {
  throwsByScatters: Record<string, number>;
  weights: Record<HuntBall, number>;
}

export interface HuntState {
  seed: number;
  stepIndex: number;
  throwsTotal: number;
  throwsLeft: number;
  totalWinX: number;
  comboType: HuntBall | null;
  comboCount: number; // 1..5
  ended: boolean;
  last?: { result: HuntBall; baseX: number; comboX: number; appliedX: number };
}

const PAY_X: Record<HuntBall, number> = {
  poke: 10,
  great: 25,
  ultra: 50,
  master: 100,
};

function cumulative<T extends string>(w: Record<T, number>) {
  const entries = Object.entries(w) as Array<[T, number]>;
  const sum = entries.reduce((a, [, v]) => a + v, 0);
  let acc = 0;
  return entries.map(([k, v]) => {
    acc += v / sum;
    return [k, acc] as const;
  });
}
function pick<T extends string>(cum: ReadonlyArray<readonly [T, number]>, rng: RNG): T {
  const r = rng();
  for (const [k, c] of cum) if (r <= c) return k;
  return cum[cum.length - 1][0];
}

function throwsForScatters(cfg: HuntConfig, scatters: number) {
  const map = cfg.throwsByScatters;
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  let out = 0;
  for (const k of keys) if (scatters >= k) out = map[String(k)];
  return out;
}

export function enterHunt(configJson: any, pokeballScatterCount: number, seed: number): HuntState {
  const cfg: HuntConfig = configJson.features?.hunt ?? { throwsByScatters: { '4': 8 }, weights: { poke: 50, great: 30, ultra: 15, master: 5 } as any };
  const total = throwsForScatters(cfg, pokeballScatterCount);
  return {
    seed,
    stepIndex: 0,
    throwsTotal: total,
    throwsLeft: total,
    totalWinX: 0,
    comboType: null,
    comboCount: 0,
    ended: total <= 0,
  };
}

export function stepHunt(state: HuntState, configJson: any): HuntState {
  if (state.ended || state.throwsLeft <= 0) return state;
  const cfg: HuntConfig = configJson.features?.hunt ?? { throwsByScatters: { '4': 8 }, weights: { poke: 50, great: 30, ultra: 15, master: 5 } as any };
  const rng = splitRng(state.seed, `hunt/${state.stepIndex}`);
  const cum = cumulative(cfg.weights);

  const result = pick(cum, rng);
  let comboType = state.comboType;
  let comboCount = state.comboCount;

  if (result === state.comboType && result !== 'master') {
    comboCount = Math.min(5, comboCount + 1);
  } else {
    comboType = result === 'master' ? null : result;
    comboCount = result === 'master' ? 0 : 1;
  }

  const baseX = PAY_X[result];
  const comboX = comboCount > 0 ? comboCount : 1;
  const appliedX = baseX * comboX;

  const throwsLeft = state.throwsLeft - 1;
  const ended = result === 'master' || throwsLeft <= 0;

  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    throwsLeft,
    ended,
    comboType,
    comboCount,
    totalWinX: state.totalWinX + appliedX,
    last: { result, baseX, comboX, appliedX },
  };
}