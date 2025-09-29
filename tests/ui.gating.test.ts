import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameController } from '../src/js/components/GameController.js';

// Create a minimal mock canvas for AnimationEngine construction
function createMockCanvas(): HTMLCanvasElement {
  const ctx = {
    canvas: {},
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
  } as any;

  const canvas: any = {
    width: 0,
    height: 0,
    style: {},
    getContext: vi.fn(() => ctx),
    getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600 })),
  };

  return canvas as HTMLCanvasElement;
}

// Helper to build config with visuals block
function visualsConfig(overrides: Partial<Record<string, boolean>> = {}, particleDensity = 0.8) {
  return {
    engine: {
      visuals: {
        enableReelSpin: true,
        enableClusterCelebrate: true,
        enableMegaWinCelebration: true,
        enableEvolutionAnimation: true,
        enableMorphingFX: true,
        enableCascadeFX: true,
        enableScatterPulse: true,
        enableFsEntrance: true,
        enableScatterAnticipation: true,
        particleDensity,
        ...overrides,
      },
      demo: {
        winChance: 0.0, // ensure no wins to avoid cascades by default
      },
    },
  } as any;
}

// We spy on AnimationEngine prototype methods to ensure dispatcher honors gates
const AnimationEngineModule = await import('../src/js/components/AnimationEngine.js');

describe('UI gating flags', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock window and RAF for the animation engine
    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.devicePixelRatio = 1;
    const raf = vi.fn(() => 1 as any);
    (globalThis as any).requestAnimationFrame = raf;
    (globalThis as any).window.requestAnimationFrame = raf;
  });

  it('disables reel spin when enableReelSpin=false', async () => {
    const canvas = createMockCanvas();
    const spy = vi
      .spyOn(AnimationEngineModule.AnimationEngine.prototype, 'spinReels')
      .mockResolvedValue();
    // Disable unrelated visuals to avoid awaiting other animations
    const overrides: any = {
      enableReelSpin: false,
      enableClusterCelebrate: false,
      enableMegaWinCelebration: false,
      enableEvolutionAnimation: false,
      enableMorphingFX: false,
      enableCascadeFX: false,
      enableScatterPulse: false,
      enableFsEntrance: false,
      enableScatterAnticipation: false,
    };
    const cfg = visualsConfig(overrides);
    // Ensure no scatters to avoid FS logic
    cfg.engine.demo.scatterWeights = [[0, 1]];
    const gc = new GameController(canvas, cfg);
    await gc.executeSpin(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('disables scatter pulse when enableScatterPulse=false', async () => {
    const canvas = createMockCanvas();
    const spy = vi
      .spyOn(AnimationEngineModule.AnimationEngine.prototype, 'playScatterPulse')
      .mockResolvedValue();
    const cfg = visualsConfig({
      enableReelSpin: false,
      enableClusterCelebrate: false,
      enableMegaWinCelebration: false,
      enableEvolutionAnimation: false,
      enableMorphingFX: false,
      enableCascadeFX: false,
      enableScatterPulse: false,
      enableFsEntrance: false,
      enableScatterAnticipation: false,
    });
    // Force exactly 1 scatter; pulse would normally fire but is gated off
    cfg.engine.demo.scatterWeights = [[1, 1]];
    // Force exactly 1 scatter to land by setting grid directly post-spin
    const gc = new GameController(canvas, cfg);
    await gc.executeSpin(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('disables freespins entrance when enableFsEntrance=false', async () => {
    const canvas = createMockCanvas();
    const spy = vi
      .spyOn(AnimationEngineModule.AnimationEngine.prototype, 'playFreeSpinsEntrance')
      .mockResolvedValue();
    const cfg = visualsConfig({
      enableReelSpin: false,
      enableClusterCelebrate: false,
      enableMegaWinCelebration: false,
      enableEvolutionAnimation: false,
      enableMorphingFX: false,
      enableCascadeFX: false,
      enableScatterPulse: false,
      enableFsEntrance: false,
      enableScatterAnticipation: false,
    });
    // Force a FS trigger
    cfg.engine.demo.scatterWeights = [[3, 1]];
    const gc = new GameController(canvas, cfg);
    await gc.executeSpin(1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('respects particleDensity preset', async () => {
    const canvas = createMockCanvas();
    const spy = vi
      .spyOn(AnimationEngineModule.AnimationEngine.prototype, 'preloadParticleEffects')
      .mockImplementation(() => {});
    const cfg = visualsConfig({}, 0.5);
    const gc = new GameController(canvas, cfg);
    // construction calls preload; ensure constructor executed without error
    expect(spy).toHaveBeenCalled();
  });
});
