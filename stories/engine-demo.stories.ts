import type { Meta, StoryObj } from "@storybook/html";
import { spin } from "../src/js/engine/engine.js";

type Args = {
  seed: number;
  bet: number;
  cascades: number;
  showMultipliers: boolean;
  mode: "base" | "frenzy" | "hunt" | "epic";
  rushTarget: number;
  wildPerCascade: number;
};

const meta: Meta<Args> = {
  title: "POCKET MUNSTERS/Engine Demo (6x5)",
  tags: ["autodocs"],
  argTypes: {
    seed: { control: { type: "number", min: 1, step: 1 } },
    bet: { control: { type: "number", min: 1, step: 1 } },
    cascades: { control: { type: "range", min: 1, max: 20, step: 1 } },
    showMultipliers: { control: "boolean" },
    mode: { control: { type: "radio" }, options: ["base", "frenzy", "hunt", "epic"] },
    rushTarget: { control: { type: "number", min: 1, step: 1 } },
    wildPerCascade: { control: { type: "number", min: 0, step: 1 } },
  },
  args: {
    seed: 4242,
    bet: 1,
    cascades: 8,
    showMultipliers: true,
    mode: "base",
    rushTarget: 50,
    wildPerCascade: 2,
  },
};
export default meta;

function ensureStyles() {
  const id = "pm-engine-demo-styles";
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = `
  .demo-wrap{display:grid;gap:10px;font-family: ui-sans-serif, system-ui, Arial;}
  .grid{display:grid;grid-template-columns:repeat(5,64px);grid-auto-rows:64px;gap:6px}
  .cell{position:relative;border:1px solid #223;background:#0c1222;border-radius:6px;overflow:hidden}
  .cell.win{outline:2px dashed #ffd54a}
  .lab{position:absolute;left:6px;bottom:4px;font-size:11px;color:#fff;opacity:.9}
  .mult{position:absolute;right:6px;top:4px;font-size:11px;color:#fff;opacity:.9;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:1px 6px}
  .evt{font-size:12px;opacity:.9}
  .rush{height:10px;background:#14223a;border:1px solid #27406f;border-radius:4px;overflow:hidden}
  .rush > div{height:100%;background:linear-gradient(90deg,#3ec6ff,#9eff5c);}
  .inj{position:absolute;right:6px;bottom:6px;width:10px;height:10px;border-radius:50%;background:#ffd54a;box-shadow:0 0 0 2px rgba(0,0,0,.5)}
  `;
  document.head.appendChild(s);
}

function renderSpin(
  seed: number,
  bet: number,
  cascades: number,
  showMults: boolean,
  mode: Args["mode"],
  rushTarget: number,
  wildPerCascade: number
) {
  ensureStyles();
  const root = document.createElement("div");
  root.className = "demo-wrap";
  const config = {
    grid: { rows: 6, cols: 5 },
    multipliers: { cellMax: 8192 },
    engine: {
      chanceAddMultiplier: 0.3,
      chanceMasterBall: 0.15,
      hunt: { rushTarget, wildPerCascade },
    },
  };
  const res = spin(config as any, bet, { seed, maxCascades: cascades, inBonusMode: mode });
  const injected = res.events
    .filter((e) => e.type === "wildInject")
    .flatMap((e: any) => e.payload.positions as Array<{ row: number; col: number }>);
  const grid = document.createElement("div");
  grid.className = "grid";
  const rows = res.grid.length,
    cols = res.grid[0].length;
  grid.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const el = document.createElement("div");
      el.className = "cell";
      const id = (res.grid as any)[r][c]?.id;
      const lab = document.createElement("div");
      lab.className = "lab";
      lab.textContent = String(id);
      el.appendChild(lab);
      if (showMults) {
        const m = res.multiplierMap[r][c] || 0;
        if (m > 0) {
          const t = document.createElement("div");
          t.className = "mult";
          t.textContent = "x" + m;
          el.appendChild(t);
        }
      }
      if (mode === "hunt" && injected.some((p) => p.row === r && p.col === c)) {
        const inj = document.createElement("div");
        inj.className = "inj";
        inj.title = "wild injected";
        el.appendChild(inj);
      }
      grid.appendChild(el);
    }

  // Mode header + rush bar if present
  const head = document.createElement("div");
  head.textContent = `Mode: ${mode}`;
  root.appendChild(head);
  if ((res.uiHints as any)?.rush) {
    const { progress, target } = (res.uiHints as any).rush as { progress: number; target: number };
    const wrap = document.createElement("div");
    wrap.className = "rush";
    const bar = document.createElement("div");
    bar.style.width = Math.min(100, Math.floor((progress / Math.max(1, target)) * 100)) + "%";
    wrap.title = `Rush ${progress}/${target}`;
    wrap.appendChild(bar);
    root.appendChild(wrap);
  }
  const events = document.createElement("div");
  res.events.forEach((e) => {
    const line = document.createElement("div");
    line.className = "evt";
    if (e.type === "win")
      line.textContent = `win: ${e.payload.symbol.id} size=${e.payload.size} x=${e.payload.multiplier} amount=${e.payload.winAmount}`;
    else if (e.type === "masterBall") line.textContent = `masterBall: x${e.payload.multiplier}`;
    else if (e.type === "wildInject")
      line.textContent = `wildInject: cascade=${(e.payload as any).index} positions=${(e.payload as any).positions.length}`;
    else if (e.type === "cascadeStart") line.textContent = `cascade ${e.payload.index}`;
    else if (e.type === "cascadeEnd") line.textContent = `cascade end removed=${e.payload.removed}`;
    else if (e.type === "spinEnd") line.textContent = `totalWinX=${e.payload.totalWinX}`;
    else line.textContent = e.type;
    events.appendChild(line);
  });
  root.appendChild(grid);
  root.appendChild(events);
  return root;
}

export const Demo: StoryObj<Args> = {
  args: {
    cascades: 20,
    mode: "base",
    seed: 4253,
    bet: 2,
    rushTarget: 4,
    wildPerCascade: 4,
  },

  render: (args) =>
    renderSpin(
      args.seed,
      args.bet,
      args.cascades,
      args.showMultipliers,
      args.mode,
      args.rushTarget,
      args.wildPerCascade
    ),
};
