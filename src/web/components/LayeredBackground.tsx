import React, { useMemo } from 'react';

// Helper to load all backgrounds under assets/backgrounds and index by filename (case/space-insensitive)
const bgGlob = import.meta.glob('../../../assets/backgrounds/**/*.{png,jpg,jpeg,webp,gif}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

function keyOf(path: string) {
  const file = path.split(/[/\\]/).pop() || '';
  return file.toLowerCase().replace(/\s+/g, '');
}

function findByNames(names: string[]): (string | null)[] {
  const entries = Object.entries(bgGlob).map(([p, url]) => ({ key: keyOf(p), url }));
  return names.map((name) => {
    const target = name.toLowerCase().replace(/\s+/g, '');
    const hit = entries.find(e => e.key === target || e.key.includes(target));
    return hit ? hit.url : null;
  });
}

type Props = {
  className?: string;
  style?: React.CSSProperties;
  // Optional override names in order; defaults provided per request
  orderNames?: string[];
  // Optional opacity per layer (0..1)
  opacities?: number[];
};

/**
 * Renders layered backgrounds in order using assets in assets/backgrounds.
 * Default order: Sky.png, grass 2.png, grass.png, PokedexOverlayBackground.png
 */
const LayeredBackground: React.FC<Props> = ({ className, style, orderNames, opacities }) => {
  const names = orderNames ?? ['Sky.png', 'grass 2.png', 'grass.png', 'PokedexOverlayBackground.png'];
  const layers = useMemo(() => findByNames(names), [names]);
  const ops = opacities ?? [1, 1, 1, 1];

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, ...style }} aria-hidden>
      {layers.map((src, i) => (
        src ? (
          <img
            key={i}
            src={src}
            alt={names[i]}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: ops[i] ?? 1, pointerEvents: 'none' }}
          />
        ) : null
      ))}
    </div>
  );
};

export default LayeredBackground;
