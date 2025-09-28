import type { Meta, StoryObj } from "@storybook/html";

type WinsPoint = { row: number; col: number };
type GridArgs = {
  // Layout & look
  size: number;
  gap: number;
  rows: number;
  cols: number;
  winColor: string;
  theme: "light" | "dark";
  outlineWins: boolean;
  showLabels: boolean;
  showMultipliers: boolean;
  useWallpaper: boolean;
  // Preview toggles
  evoChance: number; // 0..1 probability for evo sprinkle
  spinPreview: boolean; // keep grid spinning persistently
  // Content & data
  useSprites: boolean;
  arenaBacks: boolean;
  symbolSource: "auto" | "fallback" | "manifest";
  seed: string;
  // Multipliers generation
  multMode: "all1" | "edge2x" | "random";
  multMin: number;
  multMax: number;
  // Wins
  wins?: WinsPoint[];
  winsMode: "manual" | "none" | "ring" | "plus" | "random";
  winsCount: number;
  // Animation presets
  animSpin: "wobble" | "flash" | "shake" | "pop" | "none";
  animWin: "glow" | "bounce" | "pop" | "twist" | "none";
  animEvo: "pulse" | "ascend" | "shine" | "rotate" | "none";
  animSpeed: number;
  animSkip: boolean;
};

const meta: Meta<GridArgs> = {
  title: "POCKET MUNSTERS/Grid",
  tags: ["autodocs"],
  argTypes: {
    size: { control: { type: "range", min: 48, max: 128, step: 4 } },
    gap: { control: { type: "range", min: 0, max: 16, step: 1 } },
    rows: { control: { type: "range", min: 3, max: 9, step: 1 } },
    cols: { control: { type: "range", min: 3, max: 9, step: 1 } },
    winColor: { control: "color" },
    theme: { control: { type: "select" }, options: ["light", "dark"] },
    outlineWins: { control: "boolean" },
    showLabels: { control: "boolean" },
    showMultipliers: { control: "boolean" },
    useWallpaper: { control: "boolean" },
    evoChance: { control: { type: "range", min: 0, max: 0.25, step: 0.01 } },
    spinPreview: { control: "boolean" },
    useSprites: { control: "boolean" },
    arenaBacks: { control: "boolean" },
    symbolSource: { control: { type: "select" }, options: ["auto", "fallback", "manifest"] },
    seed: { control: "text" },
    multMode: { control: { type: "select" }, options: ["all1", "edge2x", "random"] },
    multMin: { control: { type: "range", min: 1, max: 10, step: 1 } },
    multMax: { control: { type: "range", min: 1, max: 20, step: 1 } },
    wins: { control: "object" },
    winsMode: {
      control: { type: "select" },
      options: ["manual", "none", "ring", "plus", "random"],
    },
    winsCount: { control: { type: "range", min: 1, max: 20, step: 1 } },
    animSpin: { control: { type: "select" }, options: ["wobble", "flash", "shake", "pop", "none"] },
    animWin: { control: { type: "select" }, options: ["glow", "bounce", "pop", "twist", "none"] },
    animEvo: {
      control: { type: "select" },
      options: ["pulse", "ascend", "shine", "rotate", "none"],
    },
    // Additional preview controls
    animSpeed: { control: { type: "range", min: 0.25, max: 2, step: 0.05 } },
    animSkip: { control: "boolean" },
  },
  args: {
    size: 72,
    gap: 6,
    rows: 6,
    cols: 5,
    winColor: "#ffd54a",
    theme: "dark",
    outlineWins: false,
    showLabels: true,
    showMultipliers: true,
    useWallpaper: false,
    evoChance: 0.02,
    spinPreview: true,
    useSprites: false,
    arenaBacks: false,
    symbolSource: "auto",
    seed: "demo",
    multMode: "all1",
    multMin: 1,
    multMax: 5,
    wins: [
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 3, col: 3 },
      { row: 1, col: 3 },
    ],
    winsMode: "manual",
    winsCount: 6,
    animSpin: "wobble",
    animWin: "glow",
    animEvo: "pulse",
    animSpeed: 1,
    animSkip: false,
  },
};
export default meta;

// Insert minimal CSS once to mimic the grid look without external files
function ensureStyles() {
  const id = "pm-grid-styles";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
  :root {
    --cell-size: 72px;
    --cell-gap: 6px;
    --cell-bg: #0c1222;
    --cell-border: #223;
    --win-color: #ffd54a;
    --anim-scale: 1;
  }
  .pm-grid-wrap { display: inline-block; padding: 16px; background: #0b0f1a; color: #fff; font-family: ui-sans-serif, system-ui, Arial; }
  .pm-grid { display: grid; grid-template-columns: repeat(7, var(--cell-size)); grid-auto-rows: var(--cell-size); gap: var(--cell-gap); }
  .pm-cell { position: relative; border: 1px solid var(--cell-border); background: var(--cell-bg); border-radius: 6px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03); }
  .pm-cell .img { position: absolute; inset: 0; background-size: contain; background-position: center; background-repeat: no-repeat; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.6)); }
  .pm-cell .label { position: absolute; left: 6px; bottom: 4px; font-size: 11px; opacity: 0.9; text-shadow: 0 1px 1px rgba(0,0,0,0.6); }
  .pm-cell .mult { position: absolute; right: 6px; top: 4px; font-size: 11px; opacity: 0.9; background: rgba(0,0,0,0.35); padding: 1px 6px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); }
  .pm-cell.win { outline: 2px solid var(--win-color); box-shadow: 0 0 0 2px rgba(0,0,0,0.3), 0 0 12px 2px rgba(255,213,74,0.45); }
  /* Optional outline-only style */
  .pm-outline .pm-cell.win { box-shadow: none !important; outline-style: dashed; outline-width: 2px; }
  .pm-legend { margin-top: 10px; font-size: 12px; opacity: 0.85; }

  /* Global skip override */
  body.anim-skip * { animation-duration: .01s !important; transition-duration: .01s !important; animation-iteration-count: 1 !important; }

  /* Animations preview (mirrors app classes) */
  @keyframes spinWobble{0%{transform:scale(1) rotate(0)}25%{transform:scale(1.03) rotate(-2deg)}50%{transform:scale(0.98) rotate(1.5deg)}75%{transform:scale(1.02) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
  @keyframes spinFlash{0%,100%{filter:brightness(1)}50%{filter:brightness(1.4)}}
  @keyframes spinShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}50%{transform:translateX(2px)}75%{transform:translateX(-1px)}}
  @keyframes spinPop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}
  body.asel-spin-wobble .pm-grid.spinning .pm-cell .img{animation:spinWobble calc(.8s/var(--anim-scale)) ease-in-out infinite}
  body.asel-spin-flash .pm-grid.spinning .pm-cell .img{animation:spinFlash calc(.6s/var(--anim-scale)) ease-in-out infinite}
  body.asel-spin-shake .pm-grid.spinning .pm-cell .img{animation:spinShake calc(.5s/var(--anim-scale)) ease-in-out infinite}
  body.asel-spin-pop .pm-grid.spinning .pm-cell .img{animation:spinPop calc(.5s/var(--anim-scale)) ease-in-out infinite}

  @keyframes winGlow{0%,100%{box-shadow:0 0 0 rgba(251,191,36,0)}50%{box-shadow:0 0 16px rgba(251,191,36,.9)}}
  @keyframes winBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @keyframes winPop{0%{transform:scale(1)}50%{transform:scale(1.08)}100%{transform:scale(1)}}
  @keyframes winTwist{0%{transform:rotate(0)}50%{transform:rotate(3deg)}100%{transform:rotate(0)}}
  body.asel-win-glow .pm-cell.win{animation:winGlow calc(1.2s/var(--anim-scale)) ease-in-out 3}
  body.asel-win-bounce .pm-cell.win{animation:winBounce calc(.9s/var(--anim-scale)) ease-in-out 3}
  body.asel-win-pop .pm-cell.win{animation:winPop calc(.8s/var(--anim-scale)) ease-out 2}
  body.asel-win-twist .pm-cell.win{animation:winTwist calc(1s/var(--anim-scale)) ease-in-out 2}

  @keyframes evoPulse{0%,100%{filter:drop-shadow(0 0 0 rgba(168,85,247,0))}50%{filter:drop-shadow(0 0 10px rgba(168,85,247,.9))}}
  @keyframes evoAscend{0%{transform:translateY(0)}100%{transform:translateY(-6px)}}
  @keyframes evoShine{0%,100%{filter:saturate(1)}50%{filter:saturate(1.4) hue-rotate(10deg)}}
  @keyframes evoRotate{0%{transform:rotate(0)}100%{transform:rotate(-3deg)}}
  body.asel-evo-pulse .pm-cell.evo .img{animation:evoPulse calc(1s/var(--anim-scale)) ease-in-out 2}
  body.asel-evo-ascend .pm-cell.evo{animation:evoAscend calc(.8s/var(--anim-scale)) ease-out 1 forwards}
  body.asel-evo-shine .pm-cell.evo .img{animation:evoShine calc(1.2s/var(--anim-scale)) ease-in-out 2}
  body.asel-evo-rotate .pm-cell.evo{animation:evoRotate calc(.6s/var(--anim-scale)) ease-in-out 2}
  /* Theme overrides (from addon-themes classes) */
  body.theme-light .pm-grid-wrap { background: #f9fafb; color: #0b1220; }
  body.theme-light { --cell-bg: #ffffff; --cell-border: #d1d5db; --win-color: #2563eb; }
  body.theme-dark .pm-grid-wrap { background: #0b0f1a; color: #e5e7eb; }
  body.theme-dark { --cell-bg: #0f172a; --cell-border: #223; --win-color: #a78bfa; }
  /* Removed pokedex theme */
  `;
  document.head.appendChild(style);
}

function colorFor(name: string): string {
  // Deterministic color from name
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 65% 60% / .95), hsl(${(hue + 40) % 360} 70% 45% / .95))`;
}

type MockCell = { name: string; tier: number; mult?: number } | { empty: true };

// Simple seeded PRNG (Mulberry32)
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

// Assets manifest cache loaded from Storybook static dir mapping dist-web -> /assets
type AssetsMeta = {
  baseDir: string;
  backDir?: string;
  names?: string[];
  backNames?: string[];
};
let cachedAssets: AssetsMeta | null = null;
async function loadAssets(): Promise<AssetsMeta | null> {
  if (cachedAssets) return cachedAssets;
  try {
    // Best-effort: try a few common manifest locations; otherwise fall back to null.
    const candidates = ["/assets/manifest.json", "/assets/assets.json"];
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data: any = await res.json();
        const meta: AssetsMeta = {
          baseDir: data.baseDir ?? data.sprites?.dir ?? data.dir ?? "",
          backDir: data.backDir ?? data.back?.dir,
          names: Array.isArray(data.names)
            ? data.names
            : Array.isArray(data.sprites?.names)
              ? data.sprites.names
              : undefined,
          backNames: Array.isArray(data.backNames)
            ? data.backNames
            : Array.isArray(data.back?.names)
              ? data.back.names
              : undefined,
        };
        if (meta.baseDir) {
          cachedAssets = meta;
          return cachedAssets;
        }
      } catch {
        // ignore and try next candidate
      }
    }
    return null;
  } catch {
    return null;
  }
}

function sanitizeName(s: string) {
  return String(s || "").replace(/[^A-Za-z0-9_\-]/g, "");
}
function displayName(n: string) {
  // Try to strip numeric prefix like 0001-Name
  const parts = n.split("-");
  if (parts.length > 1 && /^\d{4}$/.test(parts[0])) return parts.slice(1).join("-");
  return n;
}
function spriteUrl(meta: AssetsMeta, name: string, useBack: boolean): string {
  const n = sanitizeName(name);
  if (useBack && meta.backDir && Array.isArray(meta.backNames) && meta.backNames.includes(n)) {
    return `/assets/${meta.backDir}/${n}.png`;
  }
  return `/assets/${meta.baseDir}/${n}.png`;
}

function createGrid(
  root?: HTMLElement,
  opts?: {
    cells?: MockCell[][];
    wins?: WinsPoint[];
    // look & layout
    size?: number;
    gap?: number;
    rows?: number;
    cols?: number;
    winColor?: string;
    showLabels?: boolean;
    showMultipliers?: boolean;
    useWallpaper?: boolean;
    // content
    useSprites?: boolean;
    arenaBacks?: boolean;
    seed?: string;
    symbolSource?: "auto" | "fallback" | "manifest";
    // mults
    multMode?: "all1" | "edge2x" | "random";
    multMin?: number;
    multMax?: number;
    // wins mode
    winsMode?: "manual" | "none" | "ring" | "plus" | "random";
    winsCount?: number;
    // animations
    animSpin?: "wobble" | "flash" | "shake" | "pop" | "none";
    animWin?: "glow" | "bounce" | "pop" | "twist" | "none";
    animEvo?: "pulse" | "ascend" | "shine" | "rotate" | "none";
    animSpeed?: number;
    animSkip?: boolean;
    // extra look
    theme?: "light" | "dark";
    outlineWins?: boolean;
    // toggles
    evoChance?: number;
    spinPreview?: boolean;
  }
) {
  ensureStyles();
  const host = root ?? document.createElement("div");
  host.className = "pm-grid-wrap";
  const grid = document.createElement("div");
  grid.className = "pm-grid";
  // Theme classes on body
  const body = document.body;
  body.classList.remove("theme-light", "theme-dark");
  if (opts?.theme) body.classList.add(`theme-${opts.theme}`);
  // Outline wins wrapper toggle
  host.classList.toggle("pm-outline", !!opts?.outlineWins);
  // Apply animation classes on body like the app
  const b = document.body;
  [
    "asel-spin-wobble",
    "asel-spin-flash",
    "asel-spin-shake",
    "asel-spin-pop",
    "asel-win-glow",
    "asel-win-bounce",
    "asel-win-pop",
    "asel-win-twist",
    "asel-evo-pulse",
    "asel-evo-ascend",
    "asel-evo-shine",
    "asel-evo-rotate",
  ].forEach((c) => b.classList.remove(c));
  if (opts?.animSpin && opts.animSpin !== "none") b.classList.add("asel-spin-" + opts.animSpin);
  if (opts?.animWin && opts.animWin !== "none") b.classList.add("asel-win-" + opts.animWin);
  if (opts?.animEvo && opts.animEvo !== "none") b.classList.add("asel-evo-" + opts.animEvo);
  // speed and skip
  const scale = Math.max(0.25, Math.min(2, opts?.animSpeed ?? 1));
  document.documentElement.style.setProperty("--anim-scale", String(scale));
  b.classList.toggle("anim-skip", !!opts?.animSkip);
  if (opts?.size) {
    grid.style.setProperty("--cell-size", `${opts.size}px`);
  }
  if (opts?.gap != null) {
    grid.style.setProperty("--cell-gap", `${opts.gap}px`);
  }
  if (opts?.winColor) host.style.setProperty("--win-color", opts.winColor);

  const rows = Math.max(1, Math.floor(opts?.rows ?? 7));
  const cols = Math.max(1, Math.floor(opts?.cols ?? 7));
  // Reflect dynamic column count in CSS grid
  grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;

  const cells =
    opts?.cells ??
    defaultCells({
      rows,
      cols,
      seed: opts?.seed ?? "demo",
      symbolSource: opts?.symbolSource ?? "auto",
      preferSprites: opts?.useSprites ?? false,
      multMode: opts?.multMode ?? "all1",
      multMin: opts?.multMin ?? 1,
      multMax: opts?.multMax ?? 5,
    });

  // wins
  let winPoints: WinsPoint[] = [];
  const rng = makeRng(opts?.seed ?? "demo");
  if (opts?.winsMode && opts.winsMode !== "manual") {
    winPoints = generateWins(rows, cols, opts.winsMode, opts.winsCount ?? 6, rng);
  } else {
    winPoints = opts?.wins ?? [];
  }
  const wins = new Set(winPoints.map((p) => `${p.row}:${p.col}`));

  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      const cell = document.createElement("div");
      cell.className = "pm-cell";
      const data = cells[r][c] as any;
      if (data && !("empty" in data)) {
        const img = document.createElement("div");
        img.className = "img";
        // Use gradient or real sprite depending on opts
        if (opts?.useSprites && (window as any).__pmAssetsMeta) {
          const meta = (window as any).__pmAssetsMeta as AssetsMeta;
          img.style.backgroundImage = `url('${spriteUrl(meta, data.name, !!opts?.arenaBacks)}')`;
          img.style.backgroundSize = "contain";
          img.style.backgroundPosition = "center";
          img.style.backgroundRepeat = "no-repeat";
        } else {
          img.style.background = colorFor(data.name);
        }
        cell.appendChild(img);

        if (opts?.showLabels !== false) {
          const label = document.createElement("span");
          label.className = "label";
          label.textContent = `${displayName(data.name)} T${data.tier}`;
          cell.appendChild(label);
        }

        if (opts?.showMultipliers !== false) {
          const mult = document.createElement("span");
          mult.className = "mult";
          mult.textContent = `x${data.mult ?? 1}`;
          cell.appendChild(mult);
        }
      }
      if (wins.has(`${r}:${c}`)) cell.classList.add("win");
      // deterministic sprinkle using seeded RNG with configurable chance
      const p =
        typeof opts?.evoChance === "number" ? Math.max(0, Math.min(1, opts.evoChance)) : 0.02;
      if (rng() < p) cell.classList.add("evo");
      grid.appendChild(cell);
    }
  }
  host.appendChild(grid);

  const legend = document.createElement("div");
  legend.className = "pm-legend";
  legend.textContent =
    (opts?.useSprites ? "Sprites mode (served from /assets) — " : "Pure mock (colors only) — ") +
    '"win" cells are highlighted.';
  host.appendChild(legend);

  // Optional wallpaper
  if (opts?.useWallpaper && (window as any).__pmAssetsMeta?.wallpaper) {
    // Use a generic wallpaper path from new assets if desired
    host.style.backgroundImage = `url('/${(window as any).__pmAssetsMeta.wallpaper}')`;
    host.style.backgroundSize = "cover";
    host.style.backgroundPosition = "center";
  } else {
    host.style.backgroundImage = "";
  }

  // Spin preview behavior
  if (opts?.spinPreview === true) {
    grid.classList.add("spinning");
  } else if (opts?.spinPreview === false) {
    grid.classList.remove("spinning");
  } else {
    // default brief preview when undefined
    grid.classList.add("spinning");
    setTimeout(() => grid.classList.remove("spinning"), 1200);
  }

  return host;
}

function defaultCells(opts: {
  rows: number;
  cols: number;
  seed: string;
  symbolSource: "auto" | "fallback" | "manifest";
  preferSprites: boolean;
  multMode: "all1" | "edge2x" | "random";
  multMin: number;
  multMax: number;
}): MockCell[][] {
  const rng = makeRng(opts.seed);
  // Generic, non-branded fallback symbol names
  const fallback = ["Amber", "Topaz", "Jade", "Onyx", "Quartz", "Garnet", "Sapphire", "Citrine"];
  const meta = (window as any).__pmAssetsMeta as (AssetsMeta & { wallpaper?: string }) | undefined;
  let pool = fallback;
  const wantsManifest =
    opts.symbolSource === "manifest" || (opts.symbolSource === "auto" && opts.preferSprites);
  if (wantsManifest && meta && Array.isArray(meta.names) && meta.names.length > 0) {
    const names = meta.names.filter((n) => /^\d{4}-/.test(n));
    if (names.length >= 8) pool = names.slice(0, 48);
  }
  const R = Math.max(1, Math.floor(opts.rows));
  const C = Math.max(1, Math.floor(opts.cols));
  const out: MockCell[][] = Array.from({ length: R }, (_, r) =>
    Array.from({ length: C }, (_, c) => {
      const name = pool[Math.floor(rng() * pool.length)];
      const tier = (Math.floor(rng() * 1000) % 3) + 1;
      let mult = 1;
      if (opts.multMode === "edge2x") {
        const onEdge = r === 0 || c === 0 || r === R - 1 || c === C - 1;
        mult = onEdge ? 2 : 1;
      } else if (opts.multMode === "random") {
        const lo = Math.max(1, Math.floor(opts.multMin));
        const hi = Math.max(lo, Math.floor(opts.multMax));
        mult = lo + Math.floor(rng() * (hi - lo + 1));
      }
      return { name, tier, mult };
    })
  );
  return out;
}

function generateWins(
  rows: number,
  cols: number,
  mode: "none" | "ring" | "plus" | "random",
  count: number,
  rng: () => number
): WinsPoint[] {
  const pts: WinsPoint[] = [];
  const R = Math.max(1, Math.floor(rows));
  const C = Math.max(1, Math.floor(cols));
  if (mode === "none") return pts;
  if (mode === "ring") {
    for (let c = 0; c < C; c++) {
      pts.push({ row: 0, col: c });
      pts.push({ row: R - 1, col: c });
    }
    for (let r = 1; r < R - 1; r++) {
      pts.push({ row: r, col: 0 });
      pts.push({ row: r, col: C - 1 });
    }
    return dedupeWins(pts);
  }
  if (mode === "plus") {
    const cr = Math.floor(R / 2),
      cc = Math.floor(C / 2);
    for (let c = 0; c < C; c++) pts.push({ row: cr, col: c });
    for (let r = 0; r < R; r++) pts.push({ row: r, col: cc });
    return dedupeWins(pts);
  }
  // random
  const N = Math.max(1, Math.floor(count));
  for (let i = 0; i < N; i++) {
    pts.push({ row: Math.floor(rng() * R), col: Math.floor(rng() * C) });
  }
  return dedupeWins(pts);
}

function dedupeWins(pts: WinsPoint[]): WinsPoint[] {
  const seen = new Set<string>();
  const out: WinsPoint[] = [];
  for (const p of pts) {
    const k = `${p.row}:${p.col}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

export const Default: StoryObj<GridArgs> = {
  args: {
    size: 128,
    multMin: 1,
    showLabels: false,
    showMultipliers: false,
    symbolSource: "auto",
    multMode: "all1",
    multMax: 20,
    winsMode: "none",
    winsCount: 9,
    animSpin: "flash",
    animWin: "pop",
    animSpeed: 2,
    useWallpaper: true,
    gap: 6,
    arenaBacks: true,
    wins: [],
    animEvo: "none",
    evoChance: 0.06,
    spinPreview: true,
    rows: 5,
    cols: 6,
    theme: "light",
    useSprites: true,
  },

  render: (args) =>
    createGrid(undefined, {
      size: args.size,
      gap: args.gap,
      rows: args.rows,
      cols: args.cols,
      theme: args.theme,
      winColor: args.winColor,
      showLabels: args.showLabels,
      showMultipliers: args.showMultipliers,
      outlineWins: args.outlineWins,
      useWallpaper: args.useWallpaper,
      useSprites: args.useSprites,
      arenaBacks: args.arenaBacks,
      symbolSource: args.symbolSource,
      seed: args.seed,
      multMode: args.multMode,
      multMin: args.multMin,
      multMax: args.multMax,
      wins: args.wins,
      winsMode: args.winsMode,
      winsCount: args.winsCount,
      animSpin: args.animSpin,
      animWin: args.animWin,
      animEvo: args.animEvo,
      animSpeed: args.animSpeed,
      animSkip: args.animSkip,
      evoChance: args.evoChance,
      spinPreview: args.spinPreview,
    }),
};

export const WithWins: StoryObj<GridArgs> = {
  args: {
    winsMode: "random",
    size: 128,
    gap: 7,
    showLabels: false,
    useWallpaper: true,
    useSprites: true,
    symbolSource: "manifest",
    multMode: "random",
    winsCount: 8,
    animSpin: "shake",
    animEvo: "shine",
    animSpeed: 1.05,
    arenaBacks: true,
    animWin: "pop",
    evoChance: 0.12,
    spinPreview: true,
    rows: 5,
    cols: 6,
    outlineWins: true,
    showMultipliers: true,
  },
  render: (args) =>
    createGrid(undefined, {
      size: args.size,
      gap: args.gap,
      rows: args.rows,
      cols: args.cols,
      theme: args.theme,
      winColor: args.winColor,
      showLabels: args.showLabels,
      showMultipliers: args.showMultipliers,
      outlineWins: args.outlineWins,
      useWallpaper: args.useWallpaper,
      useSprites: args.useSprites,
      arenaBacks: args.arenaBacks,
      symbolSource: args.symbolSource,
      seed: args.seed,
      multMode: args.multMode,
      multMin: args.multMin,
      multMax: args.multMax,
      wins: args.wins,
      winsMode: args.winsMode,
      winsCount: args.winsCount,
      animSpin: args.animSpin,
      animWin: args.animWin,
      animEvo: args.animEvo,
      animSpeed: args.animSpeed,
      animSkip: args.animSkip,
      evoChance: args.evoChance,
      spinPreview: args.spinPreview,
    }),
};

export const BigCells: StoryObj<GridArgs> = {
  args: {
    size: 128,
    gap: 5,
    showLabels: false,
    useWallpaper: true,
    useSprites: false,
    arenaBacks: false,
    symbolSource: "manifest",
    winsMode: "random",
    winsCount: 5,
    animSpin: "pop",
    animWin: "glow",
    animEvo: "ascend",
    winColor: "#ff4af0",
    animSpeed: 1.25,
    outlineWins: true,
    multMode: "edge2x",
    multMax: 20,
    evoChance: 0.1,
    spinPreview: false,
    rows: 5,
    cols: 6,
    multMin: 3,
  },
  render: (args) =>
    createGrid(undefined, {
      size: args.size,
      gap: args.gap,
      rows: args.rows,
      cols: args.cols,
      theme: args.theme,
      winColor: args.winColor,
      showLabels: args.showLabels,
      showMultipliers: args.showMultipliers,
      outlineWins: args.outlineWins,
      useWallpaper: args.useWallpaper,
      useSprites: args.useSprites,
      arenaBacks: args.arenaBacks,
      symbolSource: args.symbolSource,
      seed: args.seed,
      multMode: args.multMode,
      multMin: args.multMin,
      multMax: args.multMax,
      wins: args.wins,
      winsMode: args.winsMode,
      winsCount: args.winsCount,
      animSpin: args.animSpin,
      animWin: args.animWin,
      animEvo: args.animEvo,
      animSpeed: args.animSpeed,
      animSkip: args.animSkip,
      evoChance: args.evoChance,
      spinPreview: args.spinPreview,
    }),
};

// Load assets manifest in the Storybook context when the story is loaded (best-effort)
// This allows toggling useSprites without reloading SB; assets are cached on window.
(async () => {
  try {
    const meta = await loadAssets();
    if (meta) (window as any).__pmAssetsMeta = meta;
  } catch {}
})();
