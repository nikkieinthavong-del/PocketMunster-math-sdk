/**
 * Enhanced Pocket Monsters Engine with Advanced Graphics Integration
 * Stake.com Casino Platform Optimized Version
 */

import type { Grid, MultiplierMap, SpinEvent, SpinResult } from "./types.ts";
import { checkEvolution } from "./evolution.js";
import { AdvancedGraphicsEngine, GraphicsConfig } from "../graphics/AdvancedGraphicsEngine.js";
import { PokemonAnimationSystem, Easing } from "../animations/PokemonAnimationSystem.js";

export interface EnhancedEngineOptions {
  seed?: number;
  maxCascades?: number;
  initMultiplierMap?: MultiplierMap;
  inBonusMode?: "base" | "frenzy" | "hunt" | "epic";
  graphicsEngine?: AdvancedGraphicsEngine;
  animationSystem?: PokemonAnimationSystem;
  enableAdvancedEffects?: boolean;
  qualitySettings?: "low" | "medium" | "high" | "ultra";
}

// Enhanced PockitMon engine with professional graphics and animations
export function enhancedSpin(
  configJson: any,
  bet: number,
  opts: EnhancedEngineOptions = {}
): Promise<SpinResult> {
  return new Promise(async (resolve) => {
    // Initialize enhanced systems
    const graphicsEngine = opts.graphicsEngine;
    const animationSystem = opts.animationSystem;
    const enableEffects = opts.enableAdvancedEffects ?? true;

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

    // Enhanced Pokemon symbols with visual data
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

    // Enhanced multiplier system with visual effects
    const MULTIPLIER_SEED_VALUE = 2;
    const MASTER_BALL_MULTIPLIERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    const chanceAddMultiplier = configJson?.engine?.chanceAddMultiplier ?? 0.3;
    const chanceMasterBall = configJson?.engine?.chanceMasterBall ?? 0.15;
    const cellCap = configJson?.multipliers?.cellMax ?? 8192;

    // Bonus mode configurations
    let rushProgress = 0;
    const rushTarget = Math.max(1, Math.floor(configJson?.engine?.hunt?.rushTarget ?? 50));
    const wildsPerCascade = Math.max(0, Math.floor(configJson?.engine?.hunt?.wildPerCascade ?? 2));

    type Cell = { id: CellId; visualData?: any };
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
        if (x <= 0)
          return {
            id: p.id,
            visualData: getPokemonVisualData(p.id),
          };
      }
      return { id: "pikachu", visualData: getPokemonVisualData("pikachu") };
    };

    // Build initial grid with enhanced visual data
    const grid: Cell[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => pick())
    );

    const multipliers: number[][] = opts.initMultiplierMap
      ? opts.initMultiplierMap.map((row) => row.slice())
      : Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));

    const events: SpinEvent[] = [];
    events.push({ type: "spinStart", payload: { seed: opts.seed } });

    // Enhanced visual initialization
    if (enableEffects && graphicsEngine && animationSystem) {
      await initializeVisualEffects(grid, graphicsEngine, animationSystem, inBonus);
    }

    // Helper functions with visual enhancements
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
      ) {
        return id as CellId;
      }
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

    const markEmpty = (r: number, c: number) => {
      (grid[r][c] as any).id = "__empty__" as any;
      if (enableEffects && animationSystem) {
        animationSystem.animatePokemonDisappear(`sprite_${r}_${c}`, true);
      }
    };

    // Enhanced cluster finding with visual feedback
    const MIN_CLUSTER = 5;
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
          if (acc.length >= MIN_CLUSTER) {
            clusters.push({ id: targetBase as SymbolId, cells: acc });

            // Visual cluster highlighting
            if (enableEffects && animationSystem) {
              acc.forEach(([row, col]) => {
                animationSystem.animateSprite(
                  `sprite_${row}_${col}`,
                  { scale: { x: 1.1, y: 1.1 } },
                  { duration: 300, easing: Easing.easeOutQuad }
                );
              });
            }
          }
        }
      }

      clusters.sort((a, b) => b.cells.length - a.cells.length);
      return clusters;
    };

    const tumble = async () => {
      if (enableEffects && animationSystem) {
        // Animate cascade with physics
        await new Promise<void>((resolve) => {
          animationSystem.animateCascade([], []);
          setTimeout(resolve, 1000); // Wait for cascade animation
        });
      }

      // Perform tumble logic
      for (let c = 0; c < cols; c++) {
        const col: Cell[] = [];
        for (let r = rows - 1; r >= 0; r--) {
          const cell = grid[r][c] as any;
          if (cell && (cell as Cell).id !== "__empty__") col.push(cell);
        }
        for (let r = rows - 1; r >= 0; r--) {
          if (col.length) {
            grid[r][c] = col.shift()!;
          } else {
            const newCell = pick();
            grid[r][c] = newCell;

            // Animate new symbol appearance
            if (enableEffects && animationSystem) {
              animationSystem.animatePokemonAppear(`sprite_${r}_${c}`, newCell.id);
            }
          }
        }
      }
    };

    let totalWin = 0;
    let cascade = 0;
    let masterBallActiveThisCascade = false;
    let totalRemovedPositions = 0;

    // Count scatters with enhanced visuals
    const scatterCounts: Record<"freeSpins" | "pokeball", number> = { freeSpins: 0, pokeball: 0 };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].id === "freeSpins") {
          scatterCounts.freeSpins++;
          if (enableEffects && animationSystem) {
            animationSystem.createPokemonSparkles(`sprite_${r}_${c}`, "freeSpins");
          }
        }
        if (grid[r][c].id === "pokeball") {
          scatterCounts.pokeball++;
          if (enableEffects && animationSystem) {
            animationSystem.createPokemonSparkles(`sprite_${r}_${c}`, "pokeball");
          }
        }
      }
    }

    // Main game loop with enhanced effects
    while (cascade < maxCascades) {
      events.push({ type: "cascadeStart", payload: { index: cascade, chainMultiplier: 1 } });

      // Enhanced bonus mode effects
      if (inBonus === "epic") {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (multipliers[r][c] > 0) {
              const oldValue = multipliers[r][c];
              multipliers[r][c] = Math.min(cellCap, multipliers[r][c] + 1);

              // Animate multiplier increase
              if (enableEffects && animationSystem) {
                animationSystem.animateMultiplierIncrease(
                  { x: c * 80, y: r * 80 },
                  oldValue,
                  multipliers[r][c]
                );
              }
            }
          }
        }
      }

      if (inBonus === "frenzy") {
        const positions: Array<[number, number]> = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) positions.push([r, c]);
        }
        const [rr, cc] = positions[Math.floor(rand() * positions.length)];
        if ((multipliers[rr][cc] ?? 0) === 0) {
          multipliers[rr][cc] = MULTIPLIER_SEED_VALUE;

          // Frenzy mode visual effect
          if (enableEffects && animationSystem) {
            animationSystem.createExplosionEffect(cc * 80, rr * 80, 1.5);
          }
        }
      }

      // Enhanced Master Ball effect
      if (!masterBallActiveThisCascade && rand() < chanceMasterBall) {
        const mb = MASTER_BALL_MULTIPLIERS[Math.floor(rand() * MASTER_BALL_MULTIPLIERS.length)];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (multipliers[r][c] > 0) {
              multipliers[r][c] = Math.min(cellCap, multipliers[r][c] * mb);
            }
          }
        }

        events.push({ type: "masterBall", payload: { index: cascade, multiplier: mb } });
        masterBallActiveThisCascade = true;

        // Spectacular Master Ball animation
        if (enableEffects && animationSystem && graphicsEngine) {
          animationSystem.animateMasterBallEffect(mb);
          graphicsEngine.triggerMasterBallEffect(mb);
        }
      }

      // Enhanced Hunt mode
      if (inBonus === "hunt" && wildsPerCascade > 0) {
        const candidates: Array<[number, number]> = [];
        for (let r = 0; r < rows; r++) {
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
        }

        const chosen: Array<[number, number]> = [];
        for (let k = 0; k < wildsPerCascade && candidates.length > 0; k++) {
          const idx = Math.floor(rand() * candidates.length);
          const [rr, cc] = candidates.splice(idx, 1)[0];
          grid[rr][cc].id = "wild";
          chosen.push([rr, cc]);

          // Wild transformation effect
          if (enableEffects && animationSystem) {
            animationSystem.animatePokemonDisappear(`sprite_${rr}_${cc}`);
            setTimeout(() => {
              animationSystem.animatePokemonAppear(`sprite_${rr}_${cc}`, "wild");
            }, 200);
          }
        }

        if (chosen.length) {
          events.push({
            type: "wildInject",
            payload: {
              index: cascade,
              positions: chosen.map(([r, c]) => ({ row: r, col: c })),
            },
          } as any);
        }
      }

      const clusters = findClusters();
      if (clusters.length === 0) {
        events.push({ type: "cascadeEnd", payload: { index: cascade, removed: 0 } });
        break;
      }

      // Enhanced multiplier placement
      if (inBonus !== "frenzy" && rand() < chanceAddMultiplier) {
        const positions: Array<[number, number]> = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) positions.push([r, c]);
        }
        const [rr, cc] = positions[Math.floor(rand() * positions.length)];
        if ((multipliers[rr][cc] ?? 0) === 0) {
          multipliers[rr][cc] = MULTIPLIER_SEED_VALUE;

          // New multiplier creation effect
          if (enableEffects && animationSystem) {
            animationSystem.animateMultiplierIncrease(
              { x: cc * 80, y: rr * 80 },
              0,
              MULTIPLIER_SEED_VALUE
            );
          }
        }
      }

      // Process wins with enhanced effects
      const removedPositions: Array<[number, number]> = [];

      for (const cl of clusters) {
        const size = cl.cells.length;
        const base = (basePays as any)[cl.id] * size;
        const factor = cl.cells.reduce(
          (acc, [r, c]) => acc * (multipliers[r][c] > 0 ? multipliers[r][c] : 1),
          1
        );
        const win = Math.floor(base * (bet || 1) * factor);
        totalWin += win;

        // Enhanced win celebration
        if (enableEffects && animationSystem) {
          cl.cells.forEach(([r, c]) => {
            animationSystem.createPokemonSparkles(`sprite_${r}_${c}`, cl.id);
          });
        }

        // Double multipliers with visual feedback
        for (const [r, c] of cl.cells) {
          const cur = multipliers[r][c] ?? 0;
          const next = cur === 0 ? MULTIPLIER_SEED_VALUE : Math.min(cellCap, cur * 2);

          if (cur !== next && enableEffects && animationSystem) {
            animationSystem.animateMultiplierIncrease({ x: c * 80, y: r * 80 }, cur, next);
          }

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

        // Enhanced evolution system
        const evo = checkEvolution(
          grid as any,
          cl.cells,
          neighbors4,
          (configJson?.evolution?.tiers ?? undefined) as any
        );
        if (evo.events.length) {
          for (const ev of evo.events) events.push(ev);
        }

        // Remove cells with enhanced animation
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
      totalRemovedPositions += removedPositions.length;

      if (inBonus === "hunt") {
        rushProgress += removedPositions.length;
      }

      if (removedPositions.length === 0) break;

      // Enhanced tumble with animation
      await tumble();
      cascade += 1;
      masterBallActiveThisCascade = false;
    }

    events.push({ type: "spinEnd", payload: { totalWinX: totalWin } });

    // Create enhanced result with visual data
    const outGrid: Grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        id: grid[r][c].id,
        visualData: grid[r][c].visualData,
      }))
    );

    const result: SpinResult = {
      grid: outGrid,
      multiplierMap: multipliers,
      totalWinX: totalWin,
      events,
      uiHints: {
        scatters: scatterCounts,
        bonusHint:
          scatterCounts.freeSpins >= 3
            ? "frenzy"
            : scatterCounts.pokeball >= 4
              ? "hunt"
              : undefined,
        rush: inBonus === "hunt" ? { progress: rushProgress, target: rushTarget } : undefined,
      },
      visualEffects: enableEffects
        ? {
            cascadeAnimations: cascade,
            masterBallTriggers: events.filter((e) => e.type === "masterBall").length,
            totalParticleEffects: totalRemovedPositions * 2,
          }
        : undefined,
    } as SpinResult;

    resolve(result);
  });
}

// Helper functions for visual enhancements
function getPokemonVisualData(symbolId: string) {
  const visualDatabase: Record<string, any> = {
    pikachu: {
      rarity: "common",
      glowColor: [1.0, 1.0, 0.0],
      sparkleIntensity: 1.0,
      animationSpeed: 1.0,
    },
    charmander: {
      rarity: "common",
      glowColor: [1.0, 0.5, 0.0],
      sparkleIntensity: 1.1,
      animationSpeed: 1.1,
    },
    squirtle: {
      rarity: "common",
      glowColor: [0.0, 0.5, 1.0],
      sparkleIntensity: 1.1,
      animationSpeed: 1.0,
    },
    bulbasaur: {
      rarity: "common",
      glowColor: [0.0, 1.0, 0.0],
      sparkleIntensity: 1.1,
      animationSpeed: 0.9,
    },
    jigglypuff: {
      rarity: "rare",
      glowColor: [1.0, 0.5, 1.0],
      sparkleIntensity: 1.3,
      animationSpeed: 1.2,
    },
    eevee: {
      rarity: "epic",
      glowColor: [0.8, 0.6, 0.4],
      sparkleIntensity: 1.5,
      animationSpeed: 1.3,
    },
    wild: {
      rarity: "legendary",
      glowColor: [1.0, 1.0, 1.0],
      sparkleIntensity: 2.0,
      animationSpeed: 1.5,
    },
  };

  return visualDatabase[symbolId] || visualDatabase["pikachu"];
}

async function initializeVisualEffects(
  grid: any[][],
  graphicsEngine: AdvancedGraphicsEngine,
  animationSystem: PokemonAnimationSystem,
  bonusMode: string
) {
  // Initialize grid sprites
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.id !== "__empty__") {
        animationSystem.animatePokemonAppear(`sprite_${r}_${c}`, cell.id);
      }
    }
  }

  // Bonus mode entrance effects
  if (bonusMode !== "base") {
    animationSystem.animateBonusModeEntrance(bonusMode as any);
  }
}
