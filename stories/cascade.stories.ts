import type { Meta, StoryObj } from "@storybook/html";

type Args = {
  rows: number;
  cols: number;
  seed: string;
  cascades: number;
  stepDelayMs: number;
  showLabels: boolean;
  outlineWins: boolean;
  winStrategy: "cross" | "largestCluster";
  autoLoop: boolean;
  loopDelayMs: number;
};

const meta: Meta<Args> = {
  title: "POCKET MUNSTERS/Cascade Replay",
  tags: ["autodocs"],
  argTypes: {
    rows: { control: { type: "range", min: 3, max: 9, step: 1 } },
    cols: { control: { type: "range", min: 3, max: 9, step: 1 } },
    seed: { control: "text" },
    cascades: { control: { type: "range", min: 1, max: 10, step: 1 } },
    stepDelayMs: { control: { type: "range", min: 200, max: 2000, step: 50 } },
    showLabels: { control: "boolean" },
    outlineWins: { control: "boolean" },
    winStrategy: { control: { type: "inline-radio" }, options: ["cross", "largestCluster"] },
    autoLoop: { control: "boolean" },
    loopDelayMs: { control: { type: "range", min: 300, max: 3000, step: 50 } },
  },
  args: {
    rows: 7,
    cols: 7,
    seed: "demo",
    cascades: 3,
    stepDelayMs: 700,
    showLabels: false,
    outlineWins: true,
    winStrategy: "cross",
    autoLoop: false,
    loopDelayMs: 900,
  },
};
export default meta;

// Minimal styling (aligned with grid story, but scoped locally)
function ensureStyles() {
  const id = "pm-cascade-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
  :root { --cell-size: 72px; --cell-gap: 6px; --win-color: #ffd54a; }
  .pm-c-wrap { display: grid; grid-template-rows: auto 1fr; height: 70vh; gap: 8px; font-family: ui-sans-serif, system-ui, Arial; }
  .pm-toolbar { display: flex; gap: 8px; align-items: center; }
  .pm-grid { display: grid; grid-auto-rows: var(--cell-size); gap: var(--cell-gap); }
  .pm-cell { position: relative; width: var(--cell-size); height: var(--cell-size); border-radius: 6px; background: #0c1222; border: 1px solid #223; overflow: hidden; }
  .pm-cell .img { position: absolute; inset: 0; background-size: contain; background-position: center; background-repeat: no-repeat; }
  .pm-cell.win { outline: 2px solid var(--win-color); box-shadow: 0 0 12px 2px rgba(255,213,74,0.35); }
  .pm-label { position: absolute; left: 6px; bottom: 4px; font-size: 11px; opacity: .9; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.6); }
  .pm-grid.spinning .img { animation: spinPop .5s ease-in-out infinite; }
  @keyframes spinPop{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}
  `;
  document.head.appendChild(style);
}

type Cell = { name: string; tier: number } | { empty: true };

function makeRng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    const t = (h ^= h >>> 16) >>> 0;
    return (t & 0xfffffff) / 0x10000000;
  };
}
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 65% 60%/.95), hsl(${(hue + 40) % 360} 70% 45%/.95))`;
}

function buildGrid(rows: number, cols: number, rng: () => number): Cell[][] {
  const names = ["Amber", "Topaz", "Jade", "Onyx", "Quartz", "Garnet", "Sapphire", "Citrine"];
  const g: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ empty: true }) as Cell)
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const name = names[Math.floor(rng() * names.length)];
      const tier = (Math.floor(rng() * 1000) % 3) + 1;
      g[r][c] = { name, tier };
    }
  return g;
}

function renderGrid(container: HTMLElement, grid: Cell[][], showLabels: boolean) {
  const rows = grid.length,
    cols = grid[0]?.length ?? 0;
  container.innerHTML = "";
  container.classList.add("pm-grid");
  container.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement("div");
      cell.className = "pm-cell";
      const data = grid[r][c];
      if (!("empty" in data)) {
        const img = document.createElement("div");
        img.className = "img";
        img.style.background = colorFor(data.name);
        cell.appendChild(img);
        if (showLabels) {
          const label = document.createElement("div");
          label.className = "pm-label";
          label.textContent = `${data.name} T${data.tier}`;
          cell.appendChild(label);
        }
      }
      container.appendChild(cell);
    }
}

function findClusterWins(
  grid: Cell[][],
  strategy: "cross" | "largestCluster"
): Array<[number, number]> {
  const rows = grid.length,
    cols = grid[0]?.length ?? 0;
  if (strategy === "cross") {
    const cr = Math.floor(rows / 2),
      cc = Math.floor(cols / 2);
    return [
      [cr, cc] as [number, number],
      [cr - 1, cc] as [number, number],
      [cr + 1, cc] as [number, number],
      [cr, cc - 1] as [number, number],
      [cr, cc + 1] as [number, number],
    ].filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols);
  }
  // largest connected component of same-name cells (4-directional)
  const seen: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false)
  );
  let best: Array<[number, number]> = [];
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if ("empty" in cell || seen[r][c]) continue;
      const target = cell.name;
      const stack: Array<[number, number]> = [[r, c]];
      const cluster: Array<[number, number]> = [];
      seen[r][c] = true;
      while (stack.length) {
        const [rr, cc] = stack.pop()!;
        cluster.push([rr, cc]);
        for (const [dr, dc] of dirs) {
          const nr = rr + dr,
            nc = cc + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc]) continue;
          const ncell = grid[nr][nc];
          if (!("empty" in ncell) && ncell.name === target) {
            seen[nr][nc] = true;
            stack.push([nr, nc]);
          }
        }
      }
      if (cluster.length > best.length) best = cluster;
    }
  // only return as a win if sizeable; else fall back to center cross
  if (best.length >= 4) return best;
  const cr = Math.floor(rows / 2),
    cc = Math.floor(cols / 2);
  return [
    [cr, cc] as [number, number],
    [cr - 1, cc] as [number, number],
    [cr + 1, cc] as [number, number],
    [cr, cc - 1] as [number, number],
    [cr, cc + 1] as [number, number],
  ].filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c < cols);
}

function markWins(container: HTMLElement, wins: Array<[number, number]>, outline: boolean) {
  const cols = (container.style.gridTemplateColumns.match(/repeat\((\d+)/)?.[1] ?? "0") as string;
  const C = parseInt(cols, 10) || 0;
  wins.forEach(([r, c]) => {
    const idx = r * C + c;
    const el = container.children.item(idx) as HTMLElement | null;
    if (el && outline) el.classList.add("win");
  });
}

function explode(grid: Cell[][], wins: Array<[number, number]>) {
  for (const [r, c] of wins) grid[r][c] = { empty: true } as Cell;
}

function tumbleAndRefill(grid: Cell[][], rng: () => number) {
  const rows = grid.length,
    cols = grid[0]?.length ?? 0;
  // gravity per column
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (!("empty" in grid[r][c])) {
        if (write !== r) {
          grid[write][c] = grid[r][c];
          grid[r][c] = { empty: true } as Cell;
        }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      const tier = (Math.floor(rng() * 1000) % 3) + 1;
      const names = ["Amber", "Topaz", "Jade", "Onyx", "Quartz", "Garnet", "Sapphire", "Citrine"];
      const name = names[Math.floor(rng() * names.length)];
      grid[r][c] = { name, tier };
    }
  }
}

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function renderWithArgs(args: Args) {
  ensureStyles();
  const rng = makeRng(args.seed || "demo");
  const wrap = document.createElement("div");
  wrap.className = "pm-c-wrap";
  const toolbar = document.createElement("div");
  toolbar.className = "pm-toolbar";
  const playBtn = document.createElement("button");
  playBtn.textContent = "Play";
  const stepBtn = document.createElement("button");
  stepBtn.textContent = "Step";
  const autoLabel = document.createElement("label");
  autoLabel.style.display = "inline-flex";
  autoLabel.style.alignItems = "center";
  autoLabel.style.gap = "6px";
  const autoChk = document.createElement("input");
  autoChk.type = "checkbox";
  autoChk.checked = !!args.autoLoop;
  autoLabel.appendChild(autoChk);
  autoLabel.appendChild(document.createTextNode("Auto"));
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Reset";
  const gridEl = document.createElement("div");
  let running = false;
  let current = 0;
  let grid = buildGrid(args.rows, args.cols, rng);
  renderGrid(gridEl, grid, args.showLabels);
  gridEl.style.setProperty("--cell-size", "72px");
  gridEl.style.setProperty("--cell-gap", "6px");
  toolbar.appendChild(playBtn);
  toolbar.appendChild(stepBtn);
  toolbar.appendChild(autoLabel);
  toolbar.appendChild(resetBtn);
  wrap.appendChild(toolbar);
  wrap.appendChild(gridEl);

  async function oneCascade() {
    // mark wins
    const wins = findClusterWins(grid, args.winStrategy);
    gridEl.classList.remove("spinning");
    renderGrid(gridEl, grid, args.showLabels);
    markWins(gridEl, wins, args.outlineWins);
    await wait(args.stepDelayMs);
    // explode
    explode(grid, wins);
    renderGrid(gridEl, grid, args.showLabels);
    await wait(200);
    // tumble + refill
    gridEl.classList.add("spinning");
    tumbleAndRefill(grid, rng);
    renderGrid(gridEl, grid, args.showLabels);
    await wait(args.stepDelayMs);
  }

  async function run() {
    if (running) return;
    running = true;
    current = 0;
    for (let i = 0; i < args.cascades; i++) {
      await oneCascade();
      current++;
    }
    gridEl.classList.remove("spinning");
    running = false;
  }

  function reset() {
    running = false;
    current = 0;
    grid = buildGrid(args.rows, args.cols, makeRng(args.seed || "demo"));
    gridEl.classList.remove("spinning");
    renderGrid(gridEl, grid, args.showLabels);
  }

  playBtn.addEventListener("click", () => {
    if (!running) run();
  });
  stepBtn.addEventListener("click", () => {
    if (!running) oneCascade();
  });
  autoChk.addEventListener("change", async () => {
    if (autoChk.checked) {
      while (autoChk.checked) {
        await oneCascade();
        await wait(args.loopDelayMs);
      }
    }
  });
  resetBtn.addEventListener("click", () => reset());
  return wrap;
}

export const Replay: StoryObj<Args> = {
  args: {
    cascades: 6,
    stepDelayMs: 300,
    winStrategy: "largestCluster",
    outlineWins: false,
    autoLoop: true,
    loopDelayMs: 1950,
    rows: 5,
    cols: 6,
  },

  render: (args) => renderWithArgs(args),
};
