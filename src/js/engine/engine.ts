import type { Grid, MultiplierMap, SpinEvent, SpinResult } from "./types.ts";
import { checkEvolution } from "./evolution.js";

export interface EngineOptions {
  seed?: number;
  maxCascades?: number;
  initMultiplierMap?: MultiplierMap;
  inBonusMode?: "base" | "frenzy" | "hunt" | "epic";
}

// New 6x5 PockitMon engine with Super Cascades, additive position multipliers, Master Ball, and bonus modes
export function spin(configJson: any, bet: number, opts: EngineOptions = {}): SpinResult {
  // Stake spec default grid 7x7 (cluster pays), overridable via config
  const rows = Math.max(1, Math.min(20, configJson?.grid?.rows ?? 7));
  const cols = Math.max(1, Math.min(20, configJson?.grid?.cols ?? 7));
  let seed = (opts.seed ?? Date.now()) >>> 0;
  const maxCascades = Math.max(1, Math.min(50, opts.maxCascades ?? 20));
  const inBonus = opts.inBonusMode ?? "base";

  // Seeded RNG (LCG)
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  // Symbols and simple base pays (adjustable via config)
  type SymbolId =
    | "pikachu"
    | "charmander"
    | "squirtle"
    | "bulbasaur"
    | "jigglypuff"
    | "eevee"
    | "wild"
    | "freeSpins"
    | "pokeball"
    | "masterBall"
    | "egg";
  type CellId = SymbolId | "__empty__";

  const basePays: Record<SymbolId, number> = {
    pikachu: configJson?.basePays?.pikachu ?? 10,
    charmander: configJson?.basePays?.charmander ?? 12,
    squirtle: configJson?.basePays?.squirtle ?? 14,
    bulbasaur: configJson?.basePays?.bulbasaur ?? 16,
    jigglypuff: configJson?.basePays?.jigglypuff ?? 20,
    eevee: configJson?.basePays?.eevee ?? 25,
    wild: configJson?.basePays?.wild ?? 0,
    freeSpins: configJson?.basePays?.freeSpins ?? 0,
    pokeball: configJson?.basePays?.pokeball ?? 0,
    masterBall: configJson?.basePays?.masterBall ?? 0,
    egg: configJson?.basePays?.egg ?? 0,
  };

  const weights: Record<SymbolId, number> = {
    pikachu: configJson?.symbolWeights?.pikachu ?? 12,
    charmander: configJson?.symbolWeights?.charmander ?? 11,
    squirtle: configJson?.symbolWeights?.squirtle ?? 11,
    bulbasaur: configJson?.symbolWeights?.bulbasaur ?? 11,
    jigglypuff: configJson?.symbolWeights?.jigglypuff ?? 10,
    eevee: configJson?.symbolWeights?.eevee ?? 9,
    wild: configJson?.symbolWeights?.wild ?? 1,
    freeSpins: configJson?.symbolWeights?.freeSpins ?? 1,
    pokeball: configJson?.symbolWeights?.pokeball ?? 1,
    masterBall: 0, // masterBall does not spawn via picker; it's an effect
    egg: configJson?.symbolWeights?.egg ?? 1,
  };

  // Cell multipliers follow x1 → x2 → x4...; we store 0 for none (x1 baseline),
  // and when a cell wins we set 0→2 or double existing, capped by cellCap.
  // Random placement will use x2 to seed positions.
  const MULTIPLIER_SEED_VALUE = 2;
  const MASTER_BALL_MULTIPLIERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const chanceAddMultiplier = configJson?.engine?.chanceAddMultiplier ?? 0.3;
  const chanceMasterBall = configJson?.engine?.chanceMasterBall ?? 0.15;
  const cellCap = configJson?.multipliers?.cellMax ?? 8192;

  // Hunt mode knobs
  let rushProgress = 0;
  const rushTarget = Math.max(1, Math.floor(configJson?.engine?.hunt?.rushTarget ?? 50));
  const wildsPerCascade = Math.max(0, Math.floor(configJson?.engine?.hunt?.wildPerCascade ?? 2));

  type Cell = { id: CellId };
  const pick = (): Cell => {
    const picker: Array<{ id: SymbolId; w: number }> = [
      { id: "pikachu", w: weights.pikachu },
      { id: "charmander", w: weights.charmander },
      { id: "squirtle", w: weights.squirtle },
      { id: "bulbasaur", w: weights.bulbasaur },
      { id: "jigglypuff", w: weights.jigglypuff },
      { id: "eevee", w: weights.eevee },
      { id: "wild", w: weights.wild },
      { id: "freeSpins", w: weights.freeSpins },
      { id: "pokeball", w: weights.pokeball },
      { id: "egg", w: weights.egg },
    ];
    const total = picker.reduce((a, p) => a + p.w, 0);
    let x = rand() * total;
    for (const p of picker) {
      x -= p.w;
      if (x <= 0) return { id: p.id };
    }
    return { id: "pikachu" };
  };

  // Build initial grid and multipliers (0 = none, else X value e.g., 2,5,10)
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => pick())
  );
  const multipliers: number[][] = opts.initMultiplierMap
    ? opts.initMultiplierMap.map((row) => row.slice())
    : Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

  const events: SpinEvent[] = [];
  events.push({ type: "spinStart", payload: { seed: opts.seed } });

  // Helpers
  const tierMapCfg: Record<string, Record<number, string>> | undefined =
    configJson?.evolution?.tiers ?? undefined;
  const reverseTierToBase: Map<string, string> = new Map();
  if (tierMapCfg) {
    for (const base of Object.keys(tierMapCfg)) {
      const tiers = tierMapCfg[base] || ({} as Record<number, string>);
      for (const k of Object.keys(tiers)) {
        const symId = String((tiers as any)[k] ?? "").toLowerCase();
        if (symId) reverseTierToBase.set(symId, base as string);
      }
    }
  }
  const normalizeId = (id: string): CellId => {
    if (!id) return id as CellId;
    const low = String(id).toLowerCase();
    if (
      low === "__empty__" ||
      low === "wild" ||
      low === "freespins" ||
      low === "freeSpins".toLowerCase() ||
      low === "pokeball" ||
      low === "masterball" ||
      low === "masterBall".toLowerCase() ||
      low === "egg"
    )
      return id as CellId;
    const mapped = reverseTierToBase.get(low);
    return (mapped as CellId) || (id as CellId);
  };
  const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
  const neighbors4 = (r: number, c: number) =>
    [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].filter(([rr, cc]) => inBounds(rr, cc)) as Array<[number, number]>;

  // We'll use explicit empty marking to avoid symbol id collision
  const markEmpty = (r: number, c: number) => ((grid[r][c] as any).id = "__empty__" as any);

  // DFS cluster with wilds joining the target id
  const MIN_CLUSTER = 5; // Stake spec: clusters are 5+ adjacent (4-direction)
  const findClusters = () => {
    const seen: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    );
    const clusters: Array<{ id: SymbolId; cells: Array<[number, number]> }> = [];
    const dfs = (r: number, c: number, targetBase: SymbolId, acc: Array<[number, number]>) => {
      if (!inBounds(r, c) || seen[r][c]) return;
      const curRaw = grid[r][c].id as string;
      const cur = curRaw as CellId;
      if (cur === "__empty__") return;
      const curBase = normalizeId(String(cur)) as SymbolId;
      if (!(curBase === targetBase || cur === "wild")) return;
      seen[r][c] = true;
      acc.push([r, c]);
      for (const [nr, nc] of neighbors4(r, c)) dfs(nr, nc, targetBase, acc);
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (seen[r][c]) continue;
        const curId = grid[r][c].id as string;
        if (
          curId === "__empty__" ||
          curId === "wild" ||
          curId === "freeSpins" ||
          curId === "pokeball" ||
          curId === "masterBall" ||
          curId === "egg"
        ) {
          seen[r][c] = true;
          continue;
        }
        const targetBase = normalizeId(curId) as SymbolId;
        const acc: Array<[number, number]> = [];
        dfs(r, c, targetBase as SymbolId, acc);
        if (acc.length >= MIN_CLUSTER) clusters.push({ id: targetBase as SymbolId, cells: acc });
      }
    }
    // largest first removes more
    clusters.sort((a, b) => b.cells.length - a.cells.length);
    return clusters;
  };

  const tumble = () => {
    for (let c = 0; c < cols; c++) {
      const col: Cell[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        const cell = grid[r][c] as any;
        if (cell && (cell as Cell).id !== "__empty__") col.push(cell);
      }
      for (let r = rows - 1; r >= 0; r--) {
        if (col.length) grid[r][c] = col.shift()!;
        else grid[r][c] = pick();
      }
    }
  };

  let totalWin = 0;
  let cascade = 0;
  let masterBallActiveThisCascade = false;

  // Count scatters at initial reveal for potential feature triggers
  const scatterCounts: Record<"freeSpins" | "pokeball", number> = { freeSpins: 0, pokeball: 0 };
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].id === "freeSpins") scatterCounts.freeSpins++;
      if (grid[r][c].id === "pokeball") scatterCounts.pokeball++;
    }

  while (cascade < maxCascades) {
    events.push({ type: "cascadeStart", payload: { index: cascade, chainMultiplier: 1 } });

    // Bonus: Epic — progressive sticky multipliers (+1 each cascade for existing),
    // applied at cascade start to guarantee visibility even if no wins occur.
    if (inBonus === "epic") {
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (multipliers[r][c] > 0) multipliers[r][c] = Math.min(cellCap, multipliers[r][c] + 1);
        }
    }

    // Bonus: Frenzy — ensure at least one multiplier placement per cascade
    if (inBonus === "frenzy") {
      const positions: Array<[number, number]> = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) positions.push([r, c]);
      const [rr, cc] = positions[Math.floor(rand() * positions.length)];
      if ((multipliers[rr][cc] ?? 0) === 0) multipliers[rr][cc] = MULTIPLIER_SEED_VALUE;
    }

    // Optional Master Ball effect this cascade
    if (!masterBallActiveThisCascade && rand() < chanceMasterBall) {
      const mb = MASTER_BALL_MULTIPLIERS[Math.floor(rand() * MASTER_BALL_MULTIPLIERS.length)];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          if (multipliers[r][c] > 0) multipliers[r][c] = Math.min(cellCap, multipliers[r][c] * mb);
        }
      events.push({ type: "masterBall", payload: { index: cascade, multiplier: mb } });
      masterBallActiveThisCascade = true;
    }

    // Bonus: Hunt — inject wilds before cluster evaluation to influence wins
    if (inBonus === "hunt" && wildsPerCascade > 0) {
      const candidates: Array<[number, number]> = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const id = grid[r][c].id;
          if (
            id !== "__empty__" &&
            id !== "freeSpins" &&
            id !== "pokeball" &&
            id !== "masterBall" &&
            id !== "wild"
          ) {
            candidates.push([r, c]);
          }
        }
      const chosen: Array<[number, number]> = [];
      for (let k = 0; k < wildsPerCascade && candidates.length > 0; k++) {
        const idx = Math.floor(rand() * candidates.length);
        const [rr, cc] = candidates.splice(idx, 1)[0];
        grid[rr][cc].id = "wild";
        chosen.push([rr, cc]);
      }
      if (chosen.length) {
        events.push({
          type: "wildInject",
          payload: { index: cascade, positions: chosen.map(([r, c]) => ({ row: r, col: c })) },
        } as any);
      }
    }

    const clusters = findClusters();
    if (clusters.length === 0) {
      events.push({ type: "cascadeEnd", payload: { index: cascade, removed: 0 } });
      break;
    }

    // Chance to add a new position multiplier (base game random) when not in Frenzy
    if (inBonus !== "frenzy" && rand() < chanceAddMultiplier) {
      const positions: Array<[number, number]> = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) positions.push([r, c]);
      const [rr, cc] = positions[Math.floor(rand() * positions.length)];
      if ((multipliers[rr][cc] ?? 0) === 0) multipliers[rr][cc] = MULTIPLIER_SEED_VALUE;
    }

    // Compute wins per cluster
    const removedPositions: Array<[number, number]> = [];

    for (const cl of clusters) {
      const size = cl.cells.length;
      const baseFactor = configJson?.engine?.demo?.baseFactor ?? 1.0;
      const base = (basePays as any)[cl.id] * size * baseFactor; // apply baseFactor from config
      // Aggregate multiplier factor: treat 0 as x1 baseline, otherwise multiply xN
      const factor = cl.cells.reduce(
        (acc, [r, c]) => acc * (multipliers[r][c] > 0 ? multipliers[r][c] : 1),
        1
      );
      const win = Math.floor(base * (bet || 1) * factor);
      totalWin += win;

      // Double multipliers that were part of a win (0 → 2; else *2), capped
      for (const [r, c] of cl.cells) {
        const cur = multipliers[r][c] ?? 0;
        const next = cur === 0 ? MULTIPLIER_SEED_VALUE : Math.min(cellCap, cur * 2);
        multipliers[r][c] = next;
      }

      events.push({
        type: "win",
        payload: {
          clusterId: `${cl.id}-${size}-${cascade}`,
          cells: cl.cells.map(([r, c]) => ({ row: r, col: c })),
          symbol: { id: cl.id, tier: 1 },
          size,
          multiplier: factor,
          winAmount: win,
        },
      });

      // Evolution: if any eggs adjacent to the win, try to evolve a 2x2 of same-tier symbols
      const evo = checkEvolution(
        grid as any,
        cl.cells,
        neighbors4,
        (configJson?.evolution?.tiers ?? undefined) as any
      );
      if (evo.events.length) {
        for (const ev of evo.events) events.push(ev);
      }

      // Remove only the cells in the winning cluster (no all-of-type removal)
      for (const [r, c] of cl.cells) {
        if ((grid[r][c].id as any) !== "__empty__") {
          markEmpty(r, c);
          removedPositions.push([r, c]);
        }
      }
    }

    events.push({
      type: "cascadeEnd",
      payload: { index: cascade, removed: removedPositions.length },
    });

    // Bonus: Hunt — accumulate rush progress by removed count
    if (inBonus === "hunt") {
      rushProgress += removedPositions.length;
    }

    if (removedPositions.length === 0) break;

    // Gravity and refill
    tumble();
    cascade += 1;
    masterBallActiveThisCascade = false; // allow again next cascade
  }

  events.push({ type: "spinEnd", payload: { totalWinX: totalWin } });

  // Emit result grid as simple objects
  const outGrid: Grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({ id: grid[r][c].id }))
  );

  return {
    grid: outGrid,
    multiplierMap: multipliers,
    totalWinX: totalWin,
    events,
    uiHints: {
      scatters: scatterCounts,
      bonusHint:
        scatterCounts.freeSpins >= 3 ? "frenzy" : scatterCounts.pokeball >= 4 ? "hunt" : undefined,
      rush: inBonus === "hunt" ? { progress: rushProgress, target: rushTarget } : undefined,
    },
  } as SpinResult;
}
