import type { RNG } from '../engine/rng';
import { splitRng } from '../engine/rng';

export type ArenaMove = 'attack' | 'power' | 'special' | 'potion';
export type Boss = 'brock' | 'misty' | 'surge';

export interface ArenaConfig {
  bossHp: Record<Boss, number>; // in x bet units
  weights: Record<ArenaMove, number>;
  jackpots?: Record<Boss, number>; // optional explicit jackpot mapping, fallback to bossHp
}

export interface ArenaState {
  seed: number;
  stepIndex: number;
  boss: Boss;
  bossHpMax: number;
  bossHpLeft: number;
  turnsLeft: number; // caller-defined; potion adds +2
  totalDamageX: number;
  buffMovesLeft: number; // for x3 special buff
  ended: boolean;
  victory: boolean;
  last?: { move: ArenaMove; baseDmgX: number; appliedDmgX: number; turnsLeft: number; bossHpLeft: number };
}

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

export function enterArena(configJson: any, boss: Boss, seed: number, turnsInitial: number): ArenaState {
  const cfg: ArenaConfig = configJson.features?.arena ?? { bossHp: { brock: 500, misty: 750, surge: 1000 } as any, weights: { attack: 60, power: 25, special: 10, potion: 5 } as any };
  const bossHp = cfg.bossHp[boss];
  return {
    seed,
    stepIndex: 0,
    boss,
    bossHpMax: bossHp,
    bossHpLeft: bossHp,
    turnsLeft: turnsInitial,
    totalDamageX: 0,
    buffMovesLeft: 0,
    ended: turnsInitial <= 0,
    victory: false,
  };
}

export function stepArena(state: ArenaState, configJson: any): ArenaState {
  if (state.ended || state.turnsLeft <= 0) return { ...state, ended: true };
  const cfg: ArenaConfig = configJson.features?.arena ?? { bossHp: { brock: 500, misty: 750, surge: 1000 } as any, weights: { attack: 60, power: 25, special: 10, potion: 5 } as any };
  const rng = splitRng(state.seed, `arena/${state.stepIndex}`);
  const cum = cumulative(cfg.weights);

  const move = pick(cum, rng);

  let turnsLeft = state.turnsLeft - 1;
  let buffMovesLeft = state.buffMovesLeft;
  let baseDmgX = 0;

  if (move === 'attack') baseDmgX = 5;
  else if (move === 'power') baseDmgX = 20;
  else if (move === 'special') buffMovesLeft = 2;
  else if (move === 'potion') turnsLeft += 2;

  const appliedDmgX = baseDmgX * (buffMovesLeft > 0 && baseDmgX > 0 ? 3 : 1);
  if (baseDmgX > 0 && buffMovesLeft > 0) buffMovesLeft--;

  const bossHpLeft = Math.max(0, state.bossHpLeft - appliedDmgX);
  const totalDamageX = state.totalDamageX + appliedDmgX;
  const victory = bossHpLeft === 0;
  const ended = victory || turnsLeft <= 0;

  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    turnsLeft,
    buffMovesLeft,
    bossHpLeft,
    totalDamageX,
    ended,
    victory,
    last: { move, baseDmgX, appliedDmgX, turnsLeft, bossHpLeft },
  };
}