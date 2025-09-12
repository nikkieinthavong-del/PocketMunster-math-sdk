import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spin } from '../src/js/engine/engine.js';
import { enterFreeSpins, stepFreeSpins } from '../src/js/features/freespins.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, '..', '..', 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const args = new Map<string, string>();
process.argv.slice(2).forEach((a) => {
  const [k, v] = a.startsWith('--') ? a.slice(2).split('=') : [a, 'true'];
  args.set(k, v ?? 'true');
});
const spins = Number(args.get('spins') ?? 10000);

// local helper (matches freespins logic)
function countPikachuScatters(grid: any[][]) {
  let k = 0;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) {
    if (String(grid[r][c]?.kind) === 'scatter_pikachu') k++;
  }
  return k;
}

let baseWin = 0;
let bonusWin = 0;
let triggers = 0;
let totalAwardedSpins = 0;

for (let i = 0; i < spins; i++) {
  const seed = (123456789 + i) >>> 0;
  const base = spin(config, 1, { seed });

  baseWin += base.totalWinX;

  const scatters = countPikachuScatters(base.grid as any[][]);
  const state0 = enterFreeSpins(config, scatters, seed);
  if (!state0.ended && state0.spinsLeft > 0) {
    triggers++;
    totalAwardedSpins += state0.spinsLeft;

    let st = state0;
    while (!st.ended && st.spinsLeft > 0) {
      st = stepFreeSpins(st, config);
      bonusWin += st.lastSpin?.winX ?? 0;
    }
  }
}

const rtpBase = baseWin / spins;
const rtpBonus = bonusWin / spins;
const rtpTotal = (baseWin + bonusWin) / spins;
const triggerRate = triggers / spins;
const avgAwardedOnTrigger = triggers ? totalAwardedSpins / triggers : 0;

console.log(JSON.stringify({
  spins,
  triggerRate,
  avgAwardedOnTrigger,
  rtpBase,
  rtpBonus,
  rtpTotal
}, null, 2));