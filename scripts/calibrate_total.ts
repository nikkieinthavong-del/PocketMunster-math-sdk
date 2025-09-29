import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spin } from '../src/js/engine/engine.js';
import { enterFreeSpins, stepFreeSpins } from '../src/js/features/freespins.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cfgPath = resolve(__dirname, '..', '..', 'config.json');

type Args = Record<string, string | boolean>;
const args: Args = {};
for (const a of process.argv.slice(2)) {
  const [k, v] = a.startsWith('--') ? a.slice(2).split('=') : [a, 'true'];
  args[k] = v ?? true;
}
const spins = Number(args.spins ?? 200000);
const targetRTP = Number(args.targetRTP ?? 0.95);
const doWrite = args.write === 'true' || args.write === true;

function countPikachuScatters(grid: any[][]) {
  let k = 0;
  for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) {
    if (String(grid[r][c]?.kind) === 'scatter_pikachu') k++;
  }
  return k;
}

function simulateTotal(cfg: any, spins: number) {
  let baseWin = 0;
  let bonusWin = 0;
  let triggers = 0;
  let totalAwardedSpins = 0;

  for (let i = 0; i < spins; i++) {
    const seed = (0x9e3779b9 + i) >>> 0;
    const base = spin(cfg, 1, { seed });
    baseWin += base.totalWinX;

    const scatters = countPikachuScatters(base.grid as any[][]);
    const st0 = enterFreeSpins(cfg, scatters, seed);
    if (!st0.ended && st0.spinsLeft > 0) {
      triggers++;
      totalAwardedSpins += st0.spinsLeft;
      let st = st0;
      while (!st.ended && st.spinsLeft > 0) {
        st = stepFreeSpins(st, cfg);
        bonusWin += st.lastSpin?.winX ?? 0;
      }
    }
  }
  const rtpBase = baseWin / spins;
  const rtpBonus = bonusWin / spins;
  const rtpTotal = (baseWin + bonusWin) / spins;
  return {
    spins, rtpBase, rtpBonus, rtpTotal,
    triggerRate: triggers / spins,
    avgAwardedOnTrigger: triggers ? totalAwardedSpins / triggers : 0,
  };
}

let cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));
let factor = cfg?.engine?.demo?.baseFactor ?? 0.25;

// Iteratively scale factor towards target total RTP
for (let iter = 0; iter < 6; iter++) {
  const tmpCfg = JSON.parse(JSON.stringify(cfg));
  tmpCfg.engine = tmpCfg.engine ?? {};
  tmpCfg.engine.demo = tmpCfg.engine.demo ?? {};
  tmpCfg.engine.demo.baseFactor = factor;

  const res = simulateTotal(tmpCfg, Math.max(20000, Math.floor(spins / (iter < 2 ? 4 : 1))));
  console.log(JSON.stringify({
    iteration: iter,
    spins: res.spins,
    targetRTP,
    rtpBase: res.rtpBase,
    rtpBonus: res.rtpBonus,
    rtpTotal: res.rtpTotal,
    triggerRate: res.triggerRate,
    avgAwardedOnTrigger: res.avgAwardedOnTrigger,
    currentFactor: factor,
  }, null, 2));

  const scale = targetRTP / Math.max(1e-6, res.rtpTotal);
  const next = factor * scale;
  // smooth and clamp
  factor = Math.min(4, Math.max(0.01, 0.5 * factor + 0.5 * next));
}

console.log(JSON.stringify({
  spins,
  targetRTP,
  recommendedFactor: factor,
}, null, 2));

if (doWrite) {
  cfg.engine = cfg.engine ?? {};
  cfg.engine.demo = cfg.engine.demo ?? {};
  cfg.engine.demo.baseFactor = factor;
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
  console.log(`Wrote baseFactor=${factor.toFixed(6)} to config.json`);
}