// Unified animation controller with graceful fallbacks.
// Tries to use optional external modules if present; otherwise dispatches DOM events.

export type AnimationType = 'evolution' | 'capture' | 'battle-effect' | 'attack-animation' | 'pokedex-entry';

type CapturePayload = { success: boolean };
type EvolutionPayload = { step?: number; cells?: Array<{ row: number; col: number }> };
type Payload = CapturePayload | EvolutionPayload | Record<string, unknown> | undefined;

class AnimationSystem {
  // Registry of optional modules (paths are hints; may not exist in this project)
  private registry: Record<string, string> = {
    // Remove legacy pokedex module paths; keep optional arena hooks only if present
    'battle-effect': '../../assets/gameplay/pokemon-arena/js/effects.js',
    'attack-animation': '../../assets/gameplay/pokemon-arena/js/attack.js',
    'capture': '../../assets/gameplay/pokemon-arena/js/capture.js',
  };

  async tryModule(kind: AnimationType): Promise<any | null> {
    const path = this.registry[kind];
    if (!path) return null;
    try {
      // Dynamic import with vite ignore so we can use a string path; may fail if file is absent/non-ESM.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = await import(/* @vite-ignore */ path);
      return mod ?? null;
    } catch {
      return null;
    }
  }

  async play(kind: AnimationType, target?: HTMLElement | null, payload?: Payload): Promise<void> {
    // Attempt external module first
    const mod = await this.tryModule(kind);
    try {
      if (mod) {
        if (kind === 'evolution' && typeof mod.evolve === 'function') {
          await mod.evolve(target, payload);
          return;
        }
        if (kind === 'capture' && typeof mod.captureSequence === 'function') {
          await mod.captureSequence(target, payload);
          return;
        }
        if (typeof mod.default === 'function') {
          await mod.default(target, payload);
          return;
        }
      }
    } catch {
      // Ignore and fallback
    }

    // Fallback: dispatch DOM event others can hook into
    document.dispatchEvent(new CustomEvent('animation:play', { detail: { kind, target, payload } }));

    // Simple built-in effects for capture/evolution if no external handler present
    if (kind === 'capture' && target) this.flashOverlay(target as HTMLElement, (payload as CapturePayload)?.success);
    if (kind === 'evolution' && target) this.shake(target as HTMLElement);
  }

  private flashOverlay(container: HTMLElement, success?: boolean) {
    const overlay = document.createElement('div');
    overlay.className = `capture-overlay ${success ? 'success' : 'fail'}`;
    container.appendChild(overlay);
    setTimeout(() => overlay.classList.add('visible'));
    setTimeout(() => {
      overlay.classList.remove('visible');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }, 450);
  }

  private shake(el: HTMLElement) {
    el.classList.add('scene-shake');
    setTimeout(() => el.classList.remove('scene-shake'), 500);
  }
}

export const animationSystem = new AnimationSystem();
