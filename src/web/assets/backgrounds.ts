// Optional background loader for base/hunt/arena scenes
// Looks under assets/backgrounds/ for files and maps them by loose name matching.
// Expected names (case-insensitive, spaces ignored):
// - PokedexOverlayBackground.png -> base
// - Background Bonus Hunt.png -> hunt
// - battle arena background template .png -> arena

type BgKind = 'base' | 'hunt' | 'arena';

function slug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_.-]/g, '');
}

// Import any images dropped under assets/backgrounds
const bgMaps = import.meta.glob('../../../assets/backgrounds/**/*.{png,jpg,jpeg,webp,gif}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

let resolved: Partial<Record<BgKind, string>> | null = null;

function buildMap() {
  const mapping: Partial<Record<BgKind, string>> = {};
  for (const [path, url] of Object.entries(bgMaps)) {
    const file = path.split(/[\\/]/).pop() || '';
    const s = slug(file);
    if (
      !mapping.base && (
        s.includes('pokedexoverlaybackground') ||
        s.startsWith('overlay') ||
        (s.includes('pokedex') && s.includes('background')) ||
        s.includes('wallpaper') ||
        s.includes('gameplay') ||
        s.includes('basebg') ||
        s.includes('basebackground') ||
        s.includes('pokedexbg')
      )
    ) {
      mapping.base = url;
      continue;
    }
    if (!mapping.hunt && (s.includes('backgroundbonushunt') || s.includes('bonushunt') || s.includes('huntbg') || s.includes('huntbackground'))) {
      mapping.hunt = url;
      continue;
    }
    if (
      !mapping.arena && (
        s.includes('battlearenabackground') ||
        s.includes('arenabackground') ||
        (s.includes('battle') && s.includes('arena')) ||
        s.includes('arenabg')
      )
    ) {
      mapping.arena = url;
      continue;
    }
  }
  // Fallbacks: if no base detected, pick the first discovered image
  if (!mapping.base) {
    const first = Object.values(bgMaps)[0];
    if (first) mapping.base = first;
  }
  return mapping;
}

export function getBackground(kind: BgKind): string | null {
  if (!resolved) resolved = buildMap();
  return resolved[kind] ?? null;
}
