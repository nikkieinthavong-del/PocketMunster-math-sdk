export function makeSpinConfig(configJson) {
  const rows = configJson.grid?.rows ?? 7;
  const cols = configJson.grid?.cols ?? 7;
  return {
    rows,
    cols,
    weights: configJson.symbolWeights ?? { tier1: 1 },
    cellMultiplierCap: configJson.multipliers?.cellMax ?? 8192,
  };
}
function computeClusterBaseWinX(tier, size) {
  // Simple anchor curve (placeholder). Replace with real paytable integration.
  const base = {
    1: { 5: 0.2, 8: 0.8, 12: 2.5, 15: 10 },
    2: { 5: 0.8, 8: 2.5, 12: 8, 15: 25 },
    3: { 5: 2, 8: 10, 12: 30, 15: 100 },
    4: { 5: 5, 8: 20, 12: 60, 15: 200 },
    5: { 5: 20, 8: 100, 12: 500, 15: 2000 },
  };
  const brackets = [15, 12, 8, 5];
  for (const b of brackets) {
    if (size >= b) return base[tier][b];
  }
  return 0;
}
export function spin(configJson, bet, opts = {}) {
  const rows = configJson.grid?.rows ?? 7;
  const cols = configJson.grid?.cols ?? 7;
  // ESM-safe RNG setup assumed above; rand() available here
  let seed = (opts.seed ?? Date.now()) >>> 0;
  // simple seeded RNG
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  // multiplier map (all x1 unless provided)
  const multiplierMap =
    opts.initMultiplierMap ??
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));
  const events = [];
  events.push({ type: 'spinStart', payload: { seed: opts.seed } });
  // Tuning knobs for demo math (already in your file)
  const WIN_CHANCE = configJson?.engine?.demo?.winChance ?? 0.28;
  const BASE_FACTOR = configJson?.engine?.demo?.baseFactor ?? 0.25;
  // Helper for weighted picks
  const pickWeighted = (pairs) => {
    const total = pairs.reduce((a, [, w]) => a + w, 0);
    let x = rand() * total;
    for (const [val, w] of pairs) {
      x -= w;
      if (x <= 0) return val;
    }
    return pairs[pairs.length - 1][0];
  };
  // Build a display grid and prefill with blanks
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ kind: 'blank' })),
  );
  // Demo win generation (unchanged except using WIN_CHANCE/BASE_FACTOR)
  let totalWinX = 0;
  if (rand() < WIN_CHANCE) {
    const size = pickWeighted([
      [3, 70],
      [4, 25],
      [5, 5],
    ]);
    const tier = pickWeighted([
      [1, 70],
      [2, 25],
      [3, 5],
    ]);
    const row = Math.floor(rand() * rows);
    const col = Math.max(0, Math.min(cols - size, Math.floor(rand() * cols)));
    const cells = Array.from({ length: size }, (_, i) => ({ row, col: col + i }));
    // mark cells for visibility (optional)
    for (const p of cells) grid[p.row][p.col] = { kind: 'win' };
    const baseWinX = tier * size * BASE_FACTOR;
    const multiplier = cells.reduce((acc, p) => acc * (multiplierMap[p.row][p.col] ?? 1), 1);
    const winAmount = baseWinX * Math.max(1, multiplier) * bet;
    totalWinX += winAmount;
    events.push({ type: 'win', payload: { row, col, size, tier, winX: winAmount } });
  }
  // Place scatters (controls Free Spins triggers)
  // Configure via config.engine.demo.scatterWeights: [ [count, weight], ... ]
  const defaultScatterWeights = [
    [0, 960],
    [1, 30],
    [2, 8],
    [3, 2],
    [4, 0.8],
    [5, 0.15],
    [6, 0.04],
    [7, 0.01],
  ];
  const scatterPairs = configJson?.engine?.demo?.scatterWeights ?? defaultScatterWeights;
  let scatterCount = Math.min(pickWeighted(scatterPairs), rows * cols);
  // Random unique positions for scatters
  if (scatterCount > 0) {
    const positions = [];
    while (positions.length < scatterCount) {
      const r = Math.floor(rand() * rows);
      const c = Math.floor(rand() * cols);
      // avoid duplicates
      if (!positions.some(([rr, cc]) => rr === r && cc === c)) positions.push([r, c]);
    }
    for (const [r, c] of positions) grid[r][c] = { kind: 'scatter_pikachu' };
    events.push({ type: 'scatters', payload: { count: scatterCount } });
  }
  events.push({ type: 'spinEnd', payload: { totalWinX } });
  return {
    totalWinX,
    grid,
    events,
    multiplierMap,
  };
}
