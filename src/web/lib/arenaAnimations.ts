// Adapter to optional external Pocket Arena animations with graceful fallback

export type AnimationKey =
  | 'ball-throw'
  | 'capture-success'
  | 'capture-fail'
  | 'attack'
  | 'powermove'
  | 'special';

export function calculateCaptureRate(base: number, combo: number): number {
  const bonus = Math.min(Math.max(combo - 1, 0) * 0.05, 0.25); // +5%/combo up to +25%
  const p = base + bonus;
  return Math.max(0, Math.min(0.95, p));
}

export async function playAnimation(key: AnimationKey): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    document.dispatchEvent(new CustomEvent('arena-animation', { detail: { key } }));
  } catch {
    /* no-op */
  }
}
