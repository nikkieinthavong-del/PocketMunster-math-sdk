// Sprite mapping utilities for the web UI
// Enhanced to support auto-indexing of Pokémon 3D model sprites (Gen 1–8) via Vite import.meta.glob.
// Drop legally obtained images under assets/pokemon/3d/gen{1..8}/ and they'll be picked up automatically.

// Legacy local placeholders (kept for fallbacks). Use URL pattern to avoid module typing issues.
const bgPng = new URL('../../../assets/sprites/bg.png', import.meta.url).href;
const faviconPng = new URL('../../../assets/sprites/favicon.png', import.meta.url).href;
const miscPng = new URL('../../../assets/sprites/c1515bcbe69a3b4508287255d66d2a90.png', import.meta.url).href;
const animGif = new URL('../../../assets/sprites/animation.gif', import.meta.url).href;

export type UISymbol = { name: string; image: string };

// ---------------- Dynamic Pokémon sprite indexing (Gen 1–8) ----------------
// We accept common web image formats; filenames may be like:
//   025.png, 025-shiny.png, pikachu.png, pikachu-shiny.png
// We'll try to parse a Pokédex number first; if none, index by a slugged name.

type SpriteMap = Record<string, string>;

const gen1 = import.meta.glob(
  '../../../assets/pokemon/3d/gen1/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen2 = import.meta.glob(
  '../../../assets/pokemon/3d/gen2/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen3 = import.meta.glob(
  '../../../assets/pokemon/3d/gen3/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen4 = import.meta.glob(
  '../../../assets/pokemon/3d/gen4/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen5 = import.meta.glob(
  '../../../assets/pokemon/3d/gen5/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen6 = import.meta.glob(
  '../../../assets/pokemon/3d/gen6/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen7 = import.meta.glob(
  '../../../assets/pokemon/3d/gen7/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;
const gen8 = import.meta.glob(
  '../../../assets/pokemon/3d/gen8/**/*.{png,gif,jpg,jpeg,webp}',
  { eager: true, query: '?url', import: 'default' }
) as SpriteMap;

const allGens: Array<{ gen: number; map: SpriteMap; range: [number, number] }> = [
  { gen: 1, map: gen1, range: [1, 151] },
  { gen: 2, map: gen2, range: [152, 251] },
  { gen: 3, map: gen3, range: [252, 386] },
  { gen: 4, map: gen4, range: [387, 493] },
  { gen: 5, map: gen5, range: [494, 649] },
  { gen: 6, map: gen6, range: [650, 721] },
  { gen: 7, map: gen7, range: [722, 809] },
  { gen: 8, map: gen8, range: [810, 898] },
];

// Indices for quick lookup
type VariantIndex = { pov: string[]; norm: string[] };
const dexIndex = new Map<number, VariantIndex>();
const nameIndex = new Map<string, VariantIndex>();
const genPools: Record<number, string[]> = {};
const genPovPools: Record<number, string[]> = {};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function indexSprite(path: string, url: string) {
  // Extract filename without extension
  const file = path.split(/[/\\]/).pop() || '';
  const base = file.replace(/\.[^.]+$/, '');
  // POV detection: '-f' token (with or without surrounding spaces or hyphens)
  const tokens = base.split(/[^a-z0-9]+/i).filter(Boolean);
  const lowerPath = path.toLowerCase();
  const isPov = tokens.some((t) => t.toLowerCase() === 'f' || t.toLowerCase() === 'back') || lowerPath.includes('/back/') || lowerPath.includes('\\back\\');
  // Try to parse dex number anywhere in the name (1-4 digits, but we clamp later)
  const numMatch = base.match(/(\d{1,4})/);
  let indexed = false;
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1 && n <= 1025) {
      const entry = dexIndex.get(n) || { pov: [], norm: [] };
      (isPov ? entry.pov : entry.norm).push(url);
      dexIndex.set(n, entry);
      indexed = true;
    }
  }
  if (!indexed) {
    const key = slugify(base.replace(/-shiny$/i, ''));
    const entry = nameIndex.get(key) || { pov: [], norm: [] };
    (isPov ? entry.pov : entry.norm).push(url);
    nameIndex.set(key, entry);
  }
}

// Build indices and per-gen pools once
for (const g of allGens) {
  const urls = Object.entries(g.map);
  genPools[g.gen] = [];
  genPovPools[g.gen] = [];
  for (const [path, url] of urls) {
    // Fill gen pools and POV pools
    const file = path.split(/[\/\\]/).pop() || '';
    const base = file.replace(/\.[^.]+$/, '');
  const tokens = base.split(/[^a-z0-9]+/i).filter(Boolean);
  const lowerPath = path.toLowerCase();
  const isPov = tokens.some((t) => t.toLowerCase() === 'f' || t.toLowerCase() === 'back') || lowerPath.includes('/back/') || lowerPath.includes('\\back\\');
    if (isPov) genPovPools[g.gen].push(url);
    else genPools[g.gen].push(url);
    indexSprite(path, url);
  }
}

function pickRandom(list: string[]): string | undefined {
  if (!list || list.length === 0) return undefined;
  const i = Math.floor(Math.random() * list.length);
  return list[i];
}

export function getPokemonSpriteByDex(dex: number, opts?: { pov?: boolean }): UISymbol | null {
  const entry = dexIndex.get(dex);
  if (!entry) return null;
  const list = opts?.pov ? entry.pov : entry.norm;
  const image = list && list.length > 0 ? list[0] : (opts?.pov ? (entry.norm[0] || undefined) : undefined);
  if (!image) return null;
  return { name: `Dex ${dex}` + (opts?.pov ? ' POV' : ''), image };
}

export function getPokemonSpriteByName(name: string, opts?: { pov?: boolean }): UISymbol | null {
  const key = slugify(name);
  const entry = nameIndex.get(key);
  if (!entry) return null;
  const list = opts?.pov ? entry.pov : entry.norm;
  const image = list && list.length > 0 ? list[0] : (opts?.pov ? (entry.norm[0] || undefined) : undefined);
  if (!image) return null;
  const display = key.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  return { name: display + (opts?.pov ? ' POV' : ''), image };
}

// Tier mapping strategy:
// - For now we restrict to GEN 1 only (per request).
// - Otherwise, fall back to local placeholders.
const tierFallback: Record<number, UISymbol> = {
  0: { name: 'Tier 0', image: animGif },
  1: { name: 'Tier 1', image: faviconPng },
  2: { name: 'Tier 2', image: miscPng },
  3: { name: 'Tier 3', image: bgPng },
  4: { name: 'Tier 4', image: miscPng },
  5: { name: 'Tier 5', image: faviconPng },
};

function getTierGenPool(_tier: number): string[] | null {
  // GEN 1 only for now
  return genPools[1] && genPools[1].length > 0 ? genPools[1] : null;
}

export function getRandomGen1Sprite(opts?: { pov?: boolean }): UISymbol | null {
  const pool = opts?.pov ? genPovPools[1] : genPools[1];
  const candidate = pool && pickRandom(pool);
  if (!candidate) return null;
  return { name: opts?.pov ? 'Gen1 POV' : 'Gen1', image: candidate };
}

const fallback: UISymbol = { name: 'Blank', image: animGif };

// Map tiers to specific Gen1 dex pools when available
import { GEN1_TIER_DEX, isValidGen1Tier } from './gen1_tiers';

export function getSpriteForTier(tier?: number): UISymbol {
  if (!tier) return fallback;
  // Prefer exact dex-mapped images per tier for Gen1
  if (isValidGen1Tier(tier)) {
    const candidates = GEN1_TIER_DEX[tier];
    // Try to resolve a dex entry that we have an image for
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    for (const dex of shuffled) {
      const ui = getPokemonSpriteByDex(dex);
      if (ui) return { name: ui.name, image: ui.image };
    }
  }
  // Fallback to any Gen1 pool image if no specific mapping available
  const pool = getTierGenPool(tier);
  const candidate = pool && pickRandom(pool);
  if (candidate) return { name: `Tier ${tier}`, image: candidate };
  return tierFallback[tier] ?? fallback;
}

// If later we add real symbol-based mapping, expose a generic accessor too.
export function getSpriteForSymbol(symbol?: string): UISymbol {
  if (!symbol) return fallback;
  // Support explicit pokemon prefix forms: pokemon:dex:25 or pokemon:name:pikachu
  if (symbol.startsWith('pokemon:')) {
    const parts = symbol.split(':');
    if (parts[1] === 'dex' && parts[2]) {
      const dex = parseInt(parts[2], 10);
      const ui = Number.isFinite(dex) ? getPokemonSpriteByDex(dex) : null;
      if (ui) return ui;
    } else if (parts[1] === 'name' && parts[2]) {
      const ui = getPokemonSpriteByName(parts.slice(2).join(':'));
      if (ui) return ui;
    }
  }

  const symbolSprites: Record<string, UISymbol> = {
    // Ball types
  pokeball: { name: 'Pocket Ball', image: faviconPng },
    greatball: { name: 'Great Ball', image: miscPng },
    ultraball: { name: 'Ultra Ball', image: bgPng },
    masterball: { name: 'Master Ball', image: animGif },

    // Feature/scatter-like symbols used in local randomizer
    trainer: { name: 'Trainer', image: bgPng },
    egg: { name: 'Egg', image: animGif },
    wild: { name: 'Wild', image: miscPng },
    pikachu_scatter: { name: 'Pikachu', image: faviconPng },

    // Fallbacks
    blank: fallback,
  };
  return symbolSprites[symbol] ?? fallback;
}

// Dev helper: expose Gen1 pool sizes to surface helpful warnings
export function getGen1PoolStats(): { pov: number; normal: number } {
  const pov = genPovPools[1] ? genPovPools[1].length : 0;
  const normal = genPools[1] ? genPools[1].length : 0;
  return { pov, normal };
}
