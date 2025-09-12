import type { MultiplierMap } from '../engine/types';
import { splitRng } from '../engine/rng';
import { spin } from '../engine/engine';

export interface FreeSpinsConfig {
  spinsByScatters: Record<string, number>; // { "4":10, "5":12, "6":15, "7":20 }
  retriggerScatterCount: number;           // default 3
  retriggerSpins: number;                  // default 5
}

export interface FreeSpinsState {
  seed: number;
  spinsTotal: number;
  spinsLeft: number;
  stepIndex: number;
  totalWinX: number;
  multiplierMap: MultiplierMap;
  ended: boolean;
  lastSpin?: { winX: number; events: any[]; grid: any };
}

function spinsForScatters(cfg: FreeSpinsConfig, scatters: number) {
  const keys = Object.keys(cfg.spinsByScatters).map(Number).sort((a, b) => a - b);
  let out = 0;
  for (const k of keys) if (scatters >= k) out = cfg.spinsByScatters[String(k)];
  return out;
}

function makeOnesMap(rows: number, cols: number): MultiplierMap {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));
}

function bumpAllByOne(map: MultiplierMap) {
  for (let r = 0; r < map.length; r++) for (let c = 0; c < map[0].length; c++) map[r][c] += 1;
}

function countPikachuScatters(grid: any[][]) {
  let k = 0;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) {
    if (String(grid[r][c].kind) === 'scatter_pikachu') k++;
  }
  return k;
}

export function enterFreeSpins(configJson: any, pikachuScatterCount: number, seed: number, rows = 7, cols = 7): FreeSpinsState {
  const cfg: FreeSpinsConfig = configJson.features?.freespins ?? {
    spinsByScatters: { '4': 10, '5': 12, '6': 15, '7': 20 },
    retriggerScatterCount: 3,
    retriggerSpins: 5,
  };
  const total = spinsForScatters(cfg, pikachuScatterCount);
  return {
    seed,
    spinsTotal: total,
    spinsLeft: total,
    stepIndex: 0,
    totalWinX: 0,
    multiplierMap: makeOnesMap(rows, cols),
    ended: total <= 0,
  };
}

export function stepFreeSpins(state: FreeSpinsState, configJson: any): FreeSpinsState {
  if (state.ended || state.spinsLeft <= 0) return state;

  const cfg: FreeSpinsConfig = configJson.features?.freespins ?? {
    spinsByScatters: { '4': 10, '5': 12, '6': 15, '7': 20 },
    retriggerScatterCount: 3,
    retriggerSpins: 5,
  };

  const rng = splitRng(state.seed, `freespins/${state.stepIndex}`);
  const childSeed = Math.floor(rng() * 0x7fffffff);

  const res = spin(configJson, 1, { seed: childSeed, initMultiplierMap: state.multiplierMap });

  let spinsLeft = state.spinsLeft - 1;
  let totalWinX = state.totalWinX + res.totalWinX;
  const newMap = res.multiplierMap;

  // retrigger on 3+ Pikachu scatters
  const pikachu = countPikachuScatters(res.grid as any[][]);
  if (pikachu >= (cfg.retriggerScatterCount ?? 3)) {
    spinsLeft += cfg.retriggerSpins ?? 5;
    bumpAllByOne(newMap);
  }

  return {
    ...state,
    stepIndex: state.stepIndex + 1,
    spinsLeft,
    totalWinX,
    multiplierMap: newMap,
    ended: spinsLeft <= 0,
    lastSpin: { winX: res.totalWinX, events: res.events, grid: res.grid },
  };
}