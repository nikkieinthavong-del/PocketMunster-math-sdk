/**
 * Cinema-Quality Animation Engine for PocketMon Genesis
 * Supports Spine2D, particle effects, and cinematic transitions
 *
 * @version 2.0.0 - Refactored for better performance and maintainability
 * @author Animation Team
 *
 * ============================================================================
 * FEATURES
 * ============================================================================
 * - Object pooling for optimal performance
 * - Comprehensive error handling and validation
 * - Configurable animation settings
 * - Real-time performance metrics
 * - Automatic resource management and cleanup
 * - Type-safe interfaces
 * - Modular architecture for easy testing and maintenance
 *
 * ============================================================================
 * USAGE EXAMPLES
 * ============================================================================
 *
 * ```typescript
 * // Basic setup
 * const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
 * const engine = new AnimationEngine(canvas, {
 *   enableParticles: true,
 *   quality: 'high',
 *   frameRate: 60
 * });
 *
 * // Play evolution animation
 * await engine.playEvolutionAnimation(
 *   [[0, 0], [0, 1]], // positions
 *   'pikachu',        // from species
 *   'raichu'          // to species
 * );
 *
 * // Spin reels with anticipation
 * await engine.spinReels([
 *   {
 *     reelIndex: 0,
 *     symbols: ['pikachu', 'charizard', 'blastoise'],
 *     finalPosition: 100,
 *     anticipation: true
 *   }
 * ]);
 *
 * // Play win celebration
 * await engine.playClusterWinAnimation(
 *   [[1, 1], [1, 2], [2, 1]], // winning positions
 *   3                         // tier level
 * );
 *
 * // Mega win with screen effects
 * await engine.playMegaWinAnimation(10000);
 *
 * // Get performance metrics
 * const metrics = engine.getMetrics();
 * console.log(`FPS: ${metrics.fps}, Active: ${metrics.activeAnimations}`);
 *
 * // Cleanup on game end
 * engine.dispose();
 * ```
 *
 * ============================================================================
 * CONFIGURATION OPTIONS
 * ============================================================================
 *
 * AnimationConfig:
 * - enableParticles: Enable/disable particle effects
 * - enableSpine: Enable/disable Spine2D integration
 * - quality: 'low' | 'medium' | 'high' | 'ultra'
 * - frameRate: Target frame rate (30-120)
 * - particleDensity: Particle density multiplier (0.1-2.0)
 * - maxConcurrentAnimations: Maximum simultaneous animations
 *
 * ReelMotionConfig:
 * - spinDuration: Duration of reel spin in milliseconds
 * - anticipationDelay: Delay before reel stops for anticipation
 * - easeType: 'bounce' | 'elastic' | 'smooth' | 'sharp'
 * - blurEffect: Enable motion blur during spin
 * - reelSeparation: Enable reel separation effect
 *
 * ============================================================================
 * PERFORMANCE OPTIMIZATIONS
 * ============================================================================
 * - Object pooling for particles and effects
 * - Efficient Map-based collections
 * - Automatic cleanup of completed animations
 * - Frame rate independent animations
 * - Configurable animation limits
 * - Lazy loading and resource management
 */

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface AnimationConfig {
  enableParticles: boolean;
  enableSpine: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  frameRate: number;
  particleDensity: number;
  maxConcurrentAnimations: number;
}

export interface ReelMotionConfig {
  spinDuration: number;
  anticipationDelay: number;
  easeType: 'bounce' | 'elastic' | 'smooth' | 'sharp';
  blurEffect: boolean;
  reelSeparation: boolean;
}

export interface ParticleEffect {
  id: string;
  type: 'evolution_burst' | 'win_sparkle' | 'scatter_magic' | 'cascade_explosion' | 'mega_aura';
  position: { x: number; y: number };
  duration: number;
  intensity: number;
  color: string;
  particleCount: number;
  startTime: number;
}

export interface SpineAnimation {
  id: string;
  skeletonData: string;
  animationName: string;
  position: { x: number; y: number };
  scale: number;
  loop: boolean;
  duration?: number;
  onComplete?: () => void;
  startTime: number;
}

export interface CinematicEffect {
  id: string;
  type: 'screen_shake' | 'flash' | 'zoom' | 'slow_motion' | 'lightning';
  intensity: number;
  duration: number;
  delay?: number;
  startTime: number;
}

export interface AnimationMetrics {
  fps: number;
  activeAnimations: number;
  memoryUsage: number;
  lastFrameTime: number;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class AnimationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any,
  ) {
    super(message);
    this.name = 'AnimationError';
  }
}

export class ConfigurationError extends AnimationError {
  constructor(message: string, context?: any) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigurationError';
  }
}

// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================

export class AnimationConfigManager {
  private static instance: AnimationConfigManager;
  private config: Required<AnimationConfig>;
  private reelConfig: Required<ReelMotionConfig>;

  private constructor() {
    this.config = this.getDefaultAnimationConfig();
    this.reelConfig = this.getDefaultReelConfig();
  }

  static getInstance(): AnimationConfigManager {
    if (!AnimationConfigManager.instance) {
      AnimationConfigManager.instance = new AnimationConfigManager();
    }
    return AnimationConfigManager.instance;
  }

  updateAnimationConfig(config: Partial<AnimationConfig>): void {
    this.validateAnimationConfig(config);
    this.config = { ...this.config, ...config };
  }

  updateReelConfig(config: Partial<ReelMotionConfig>): void {
    this.validateReelConfig(config);
    this.reelConfig = { ...this.reelConfig, ...config };
  }

  getAnimationConfig(): Readonly<Required<AnimationConfig>> {
    return { ...this.config };
  }

  getReelConfig(): Readonly<Required<ReelMotionConfig>> {
    return { ...this.reelConfig };
  }

  private getDefaultAnimationConfig(): Required<AnimationConfig> {
    return {
      enableParticles: true,
      enableSpine: false,
      quality: 'high',
      frameRate: 60,
      particleDensity: 1.0,
      maxConcurrentAnimations: 50,
    };
  }

  private getDefaultReelConfig(): Required<ReelMotionConfig> {
    return {
      spinDuration: 2000,
      anticipationDelay: 300,
      easeType: 'elastic',
      blurEffect: true,
      reelSeparation: true,
    };
  }

  private validateAnimationConfig(config: Partial<AnimationConfig>): void {
    if (config.frameRate !== undefined && (config.frameRate < 30 || config.frameRate > 120)) {
      throw new ConfigurationError('Frame rate must be between 30 and 120 FPS', {
        frameRate: config.frameRate,
      });
    }
    if (
      config.particleDensity !== undefined &&
      (config.particleDensity < 0.1 || config.particleDensity > 2.0)
    ) {
      throw new ConfigurationError('Particle density must be between 0.1 and 2.0', {
        particleDensity: config.particleDensity,
      });
    }
  }

  private validateReelConfig(config: Partial<ReelMotionConfig>): void {
    if (config.spinDuration !== undefined && config.spinDuration < 500) {
      throw new ConfigurationError('Spin duration must be at least 500ms', {
        spinDuration: config.spinDuration,
      });
    }
  }
}

// ============================================================================
// PARTICLE SYSTEM WITH OBJECT POOLING
// ============================================================================

export class ParticlePool {
  private static instance: ParticlePool;
  private pool: Map<string, ParticleEffect[]> = new Map();
  private activeParticles: Set<string> = new Set();

  static getInstance(): ParticlePool {
    if (!ParticlePool.instance) {
      ParticlePool.instance = new ParticlePool();
    }
    return ParticlePool.instance;
  }

  getParticle(effectType: string): ParticleEffect | null {
    const pool = this.pool.get(effectType) || [];
    const particle = pool.pop();
    if (particle) {
      this.activeParticles.add(particle.id);
    }
    return particle || null;
  }

  releaseParticle(particle: ParticleEffect): void {
    if (this.activeParticles.has(particle.id)) {
      this.activeParticles.delete(particle.id);
      const pool = this.pool.get(particle.type) || [];
      pool.push(particle);
      this.pool.set(particle.type, pool);
    }
  }

  createParticle(
    effectType: ParticleEffect['type'],
    config: Omit<ParticleEffect, 'id' | 'type' | 'startTime'>,
  ): ParticleEffect {
    const particle: ParticleEffect = {
      id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: effectType as ParticleEffect['type'],
      startTime: performance.now(),
      ...config,
    };

    this.activeParticles.add(particle.id);
    return particle;
  }

  cleanup(): void {
    this.activeParticles.clear();
    this.pool.clear();
  }
}

// ============================================================================
// EASING UTILITIES
// ============================================================================

export class EasingUtils {
  static bounce(t: number): number {
    if (t < 0.5) return 2 * t * t;
    return -1 + (4 - 2 * t) * t;
  }

  static elastic(t: number): number {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  }

  static smooth(t: number): number {
    return t * t * (3 - 2 * t);
  }

  static sharp(t: number): number {
    return t * t;
  }

  static applyEasing(t: number, type: string): number {
    switch (type) {
      case 'bounce':
        return this.bounce(t);
      case 'elastic':
        return this.elastic(t);
      case 'smooth':
        return this.smooth(t);
      case 'sharp':
        return this.sharp(t);
      default:
        return t;
    }
  }
}

// ============================================================================
// MAIN ANIMATION ENGINE
// ============================================================================

export class AnimationEngine {
  private canvas: any; // HTMLCanvasElement
  private ctx: any; // CanvasRenderingContext2D
  private configManager: AnimationConfigManager;
  private particlePool: ParticlePool;
  private animationMetrics: AnimationMetrics;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private metricsUpdateInterval: number = 1000; // Update metrics every second
  // Auto-throttle state for adaptive performance
  private throttleScale: number = 1.0; // 0.5 .. 1.0, multiplies particleDensity
  private slowFrameStreak: number = 0;
  private fastFrameStreak: number = 0;

  // Animation collections with proper typing
  private activeParticles: Map<string, ParticleEffect> = new Map();
  private activeSpineAnimations: Map<string, SpineAnimation> = new Map();
  private activeCinematicEffects: Map<string, CinematicEffect> = new Map();

  constructor(canvas: HTMLCanvasElement, config?: Partial<AnimationConfig>) {
    this.validateCanvas(canvas);
    this.canvas = canvas;
    this.ctx = this.getCanvasContext(canvas);
    this.configManager = AnimationConfigManager.getInstance();
    this.particlePool = ParticlePool.getInstance();
    this.animationMetrics = {
      fps: 0,
      activeAnimations: 0,
      memoryUsage: 0,
      lastFrameTime: 0,
    };

    if (config) {
      this.configManager.updateAnimationConfig(config);
    }

    this.setupCanvas();
    this.startRenderLoop();
  }

  private validateCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) {
      throw new AnimationError('Canvas element is required', 'CANVAS_REQUIRED');
    }
  }

  private getCanvasContext(canvas: any): any {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new AnimationError('Failed to get 2D rendering context', 'CONTEXT_ERROR');
    }
    return ctx;
  }

  private setupCanvas(): void {
    try {
      const dpr = (window && window.devicePixelRatio) || 1;
      const rect = this.canvas.getBoundingClientRect();

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);

      this.canvas.style.width = rect.width + 'px';
      this.canvas.style.height = rect.height + 'px';
    } catch (error) {
      throw new AnimationError('Failed to setup canvas', 'CANVAS_SETUP_ERROR', { error });
    }
  }

  private startRenderLoop(): void {
    const render = (timestamp: number) => {
      try {
        this.updateMetrics(timestamp);
        this.clearCanvas();
        this.updateAnimations(timestamp);
        this.renderFrame(timestamp);
        this.cleanupCompletedAnimations();
      } catch (error) {
        console.error('Animation render error:', error);
      }
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  private updateMetrics(timestamp: number): void {
    this.frameCount++;
    const deltaTime = timestamp - this.lastFrameTime;

    if (deltaTime >= this.metricsUpdateInterval) {
      this.animationMetrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.animationMetrics.activeAnimations =
        this.activeParticles.size +
        this.activeSpineAnimations.size +
        this.activeCinematicEffects.size;
      this.animationMetrics.lastFrameTime = deltaTime;
      this.frameCount = 0;

      // Auto-throttle particle density based on sustained FPS
      try {
        const cfg = this.configManager.getAnimationConfig();
        const targetFps = Math.max(30, Math.min(cfg.frameRate, 120));
        const fps = this.animationMetrics.fps || targetFps;
        const belowThreshold = fps < targetFps * 0.9; // drop if <90% target
        const aboveThreshold = fps > targetFps * 0.98; // recover if >98% target

        if (belowThreshold) {
          this.slowFrameStreak++;
          this.fastFrameStreak = 0;
        } else if (aboveThreshold) {
          this.fastFrameStreak++;
          this.slowFrameStreak = 0;
        } else {
          // reset streaks if in the neutral band
          this.slowFrameStreak = 0;
          this.fastFrameStreak = 0;
        }

        // Apply throttling after sustained condition for ~0.5-1.0s
        if (this.slowFrameStreak >= 6) {
          this.throttleScale = Math.max(0.5, +(this.throttleScale - 0.1).toFixed(2));
          this.slowFrameStreak = 0;
        } else if (this.fastFrameStreak >= 10 && this.throttleScale < 1.0) {
          this.throttleScale = Math.min(1.0, +(this.throttleScale + 0.05).toFixed(2));
          this.fastFrameStreak = 0;
        }
      } catch {
        // non-fatal; keep rendering
      }
    }

    this.lastFrameTime = timestamp;
  }

  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private updateAnimations(timestamp: number): void {
    this.updateParticles(timestamp);
    this.updateSpineAnimations(timestamp);
    this.updateCinematicEffects(timestamp);
  }

  private cleanupCompletedAnimations(): void {
    const currentTime = performance.now();
    const config = this.configManager.getAnimationConfig();

    // Cleanup particles
    for (const [id, particle] of this.activeParticles.entries()) {
      if (currentTime - particle.startTime > particle.duration) {
        this.particlePool.releaseParticle(particle);
        this.activeParticles.delete(id);
      }
    }

    // Cleanup cinematic effects
    for (const [id, effect] of this.activeCinematicEffects.entries()) {
      if (currentTime - effect.startTime > effect.duration) {
        this.activeCinematicEffects.delete(id);
      }
    }

    // Check animation limits
    if (this.getTotalActiveAnimations() > config.maxConcurrentAnimations) {
      this.cleanupExcessAnimations();
    }
  }

  private getTotalActiveAnimations(): number {
    return (
      this.activeParticles.size + this.activeSpineAnimations.size + this.activeCinematicEffects.size
    );
  }

  private cleanupExcessAnimations(): void {
    // Remove oldest particles first
    const particles = Array.from(this.activeParticles.values()).sort(
      (a, b) => a.startTime - b.startTime,
    );

    const excessCount =
      this.getTotalActiveAnimations() -
      this.configManager.getAnimationConfig().maxConcurrentAnimations;
    for (let i = 0; i < excessCount && i < particles.length; i++) {
      const particle = particles[i];
      this.particlePool.releaseParticle(particle);
      this.activeParticles.delete(particle.id);
    }
  }

  // ============================================================================
  // REEL ANIMATION MANAGER
  // ============================================================================

  public async spinReels(
    reelConfigs: Array<{
      reelIndex: number;
      symbols: string[];
      finalPosition: number;
      anticipation?: boolean;
    }>,
  ): Promise<void> {
    try {
      this.validateReelConfigs(reelConfigs);
      const promises = reelConfigs.map((config) => this.spinSingleReel(config));
      await Promise.all(promises);
    } catch (error) {
      throw new AnimationError('Failed to spin reels', 'REEL_SPIN_ERROR', { error, reelConfigs });
    }
  }

  private async spinSingleReel(config: {
    reelIndex: number;
    symbols: string[];
    finalPosition: number;
    anticipation?: boolean;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.validateReelConfig(config);
        const startTime = performance.now();
        const reelConfig = this.configManager.getReelConfig();
        const totalDuration =
          reelConfig.spinDuration + (config.anticipation ? reelConfig.anticipationDelay : 0);

        const animateReel = (currentTime: number) => {
          try {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);

            // Apply easing function
            const easedProgress = EasingUtils.applyEasing(progress, reelConfig.easeType);

            // Calculate reel position with physics
            const position = this.calculateReelPosition(easedProgress, config.finalPosition);

            // Apply visual effects
            if (reelConfig.blurEffect) {
              this.applyMotionBlur(config.reelIndex, easedProgress);
            }

            this.renderReel(config.reelIndex, position, config.symbols);

            if (progress < 1) {
              requestAnimationFrame(animateReel);
            } else {
              resolve();
            }
          } catch (error) {
            reject(
              new AnimationError('Reel animation failed', 'REEL_ANIMATION_ERROR', {
                error,
                config,
              }),
            );
          }
        };

        requestAnimationFrame(animateReel);
      } catch (error) {
        reject(error);
      }
    });
  }

  private validateReelConfigs(
    reelConfigs: Array<{
      reelIndex: number;
      symbols: string[];
      finalPosition: number;
      anticipation?: boolean;
    }>,
  ): void {
    if (!Array.isArray(reelConfigs) || reelConfigs.length === 0) {
      throw new AnimationError('Reel configs must be a non-empty array', 'INVALID_REEL_CONFIGS');
    }

    reelConfigs.forEach((config, index) => {
      this.validateReelConfig(config, index);
    });
  }

  private validateReelConfig(
    config: {
      reelIndex: number;
      symbols: string[];
      finalPosition: number;
      anticipation?: boolean;
    },
    index?: number,
  ): void {
    if (typeof config.reelIndex !== 'number' || config.reelIndex < 0) {
      throw new AnimationError('Invalid reel index', 'INVALID_REEL_INDEX', { config, index });
    }
    if (!Array.isArray(config.symbols) || config.symbols.length === 0) {
      throw new AnimationError('Symbols must be a non-empty array', 'INVALID_SYMBOLS', {
        config,
        index,
      });
    }
    if (typeof config.finalPosition !== 'number') {
      throw new AnimationError('Final position must be a number', 'INVALID_FINAL_POSITION', {
        config,
        index,
      });
    }
  }

  private calculateReelPosition(progress: number, finalPosition: number): number {
    // Add extra rotations for dramatic effect
    const extraRotations = 3 + Math.random() * 2;
    const totalRotation = extraRotations * 360 + finalPosition;
    return totalRotation * progress;
  }

  private applyMotionBlur(reelIndex: number, progress: number): void {
    const blurAmount = Math.max(0, 1 - progress) * 10;
    this.ctx.filter = `blur(${blurAmount}px)`;
  }

  private renderReel(reelIndex: number, position: number, symbols: string[]): void {
    const reelWidth = this.canvas.width / 7; // 7x7 grid
    const x = reelIndex * reelWidth;

    // Render reel background
    this.ctx.fillStyle = '#2a2a3e';
    this.ctx.fillRect(x, 0, reelWidth, this.canvas.height);

    // Render symbols with position offset
    symbols.forEach((symbol, index) => {
      const y = (index * 100 + position) % (this.canvas.height + 100);
      this.renderSymbol(symbol, x + reelWidth / 2, y);
    });

    this.ctx.filter = 'none';
  }

  private renderSymbol(symbol: string, x: number, y: number): void {
    this.ctx.fillStyle = this.getSymbolColor(symbol);
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(symbol, x, y);
  }

  private getSymbolColor(symbol: string): string {
    const colors: Record<string, string> = {
      pikachu: '#FFD700',
      charizard: '#FF6B35',
      blastoise: '#4FC3F7',
      venusaur: '#66BB6A',
      mewtwo: '#AB47BC',
      scatter: '#F06292',
    };
    return colors[symbol] || '#FFFFFF';
  }

  // ============================================================================
  // ANIMATION METHODS
  // ============================================================================

  /**
   * Evolution animation with spectacular effects
   */
  public async playEvolutionAnimation(
    positions: Array<[number, number]>,
    fromSpecies: string,
    toSpecies: string,
  ): Promise<void> {
    try {
      this.validateEvolutionAnimationInput(positions, fromSpecies, toSpecies);

      // Add particle burst at evolution positions
      positions.forEach(([row, col]) => {
        const particle = this.particlePool.createParticle('evolution_burst', {
          position: this.gridToScreen(row, col),
          duration: this.scaleDuration(2000),
          intensity: 0.8,
          color: '#FFD700',
          particleCount: this.scaleCount(50),
        });
        this.activeParticles.set(particle.id, particle);
      });

      // Add cinematic effects
      const flashEffect: CinematicEffect = {
        id: `flash_${Date.now()}`,
        type: 'flash',
        intensity: 0.6,
        duration: 500,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(flashEffect.id, flashEffect);

      const shakeEffect: CinematicEffect = {
        id: `shake_${Date.now()}`,
        type: 'screen_shake',
        intensity: 0.4,
        duration: 800,
        delay: 200,
        startTime: performance.now() + 200,
      };
      this.activeCinematicEffects.set(shakeEffect.id, shakeEffect);

      // Wait for animation to complete
      await this.delay(2500);
    } catch (error) {
      throw new AnimationError('Evolution animation failed', 'EVOLUTION_ANIMATION_ERROR', {
        error,
        positions,
      });
    }
  }

  private validateEvolutionAnimationInput(
    positions: Array<[number, number]>,
    fromSpecies: string,
    toSpecies: string,
  ): void {
    if (!Array.isArray(positions) || positions.length === 0) {
      throw new AnimationError('Positions must be a non-empty array', 'INVALID_POSITIONS');
    }
    if (typeof fromSpecies !== 'string' || fromSpecies.trim() === '') {
      throw new AnimationError('From species must be a non-empty string', 'INVALID_FROM_SPECIES');
    }
    if (typeof toSpecies !== 'string' || toSpecies.trim() === '') {
      throw new AnimationError('To species must be a non-empty string', 'INVALID_TO_SPECIES');
    }
  }

  /**
   * Cluster win celebration with cascading particles
   */
  public async playClusterWinAnimation(
    positions: Array<[number, number]>,
    tier: number,
  ): Promise<void> {
    try {
      this.validateClusterWinInput(positions, tier);
      const intensity = Math.min(tier / 3, 1);

      positions.forEach(([row, col], index) => {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('win_sparkle', {
            position: this.gridToScreen(row, col),
            duration: this.scaleDuration(1500),
            intensity,
            color: tier >= 3 ? '#FF6B35' : '#4FC3F7',
            particleCount: this.scaleCount(25 * tier),
          });
          this.activeParticles.set(particle.id, particle);
        }, index * 100);
      });

      if (tier >= 3) {
        const zoomEffect: CinematicEffect = {
          id: `zoom_${Date.now()}`,
          type: 'zoom',
          intensity: 0.3,
          duration: 1000,
          startTime: performance.now(),
        };
        this.activeCinematicEffects.set(zoomEffect.id, zoomEffect);
      }

      await this.delay(2000);
    } catch (error) {
      throw new AnimationError('Cluster win animation failed', 'CLUSTER_WIN_ERROR', {
        error,
        positions,
        tier,
      });
    }
  }

  private validateClusterWinInput(positions: Array<[number, number]>, tier: number): void {
    if (!Array.isArray(positions) || positions.length === 0) {
      throw new AnimationError('Positions must be a non-empty array', 'INVALID_POSITIONS');
    }
    if (typeof tier !== 'number' || tier < 1) {
      throw new AnimationError('Tier must be a positive number', 'INVALID_TIER');
    }
  }

  /**
   * Cascade/tumble animation with falling symbols
   */
  public async playCascadeAnimation(
    removedPositions: Array<[number, number]>,
    newPositions: Array<[number, number]>,
  ): Promise<void> {
    try {
      this.validateCascadeInput(removedPositions, newPositions);

      // Explosion effect at removed positions
      removedPositions.forEach(([row, col]) => {
        const particle = this.particlePool.createParticle('cascade_explosion', {
          position: this.gridToScreen(row, col),
          duration: this.scaleDuration(800),
          intensity: 0.6,
          color: '#FF9800',
          particleCount: this.scaleCount(20),
        });
        this.activeParticles.set(particle.id, particle);
      });

      // Falling symbol animation for new positions
      this.animateNewSymbolsFalling(newPositions);

      await this.delay(1200);
    } catch (error) {
      throw new AnimationError('Cascade animation failed', 'CASCADE_ERROR', {
        error,
        removedPositions,
        newPositions,
      });
    }
  }

  private validateCascadeInput(
    removedPositions: Array<[number, number]>,
    newPositions: Array<[number, number]>,
  ): void {
    if (!Array.isArray(removedPositions)) {
      throw new AnimationError('Removed positions must be an array', 'INVALID_REMOVED_POSITIONS');
    }
    if (!Array.isArray(newPositions)) {
      throw new AnimationError('New positions must be an array', 'INVALID_NEW_POSITIONS');
    }
  }

  private animateNewSymbolsFalling(positions: Array<[number, number]>): void {
    positions.forEach(([row, col], index) => {
      setTimeout(() => {
        const screenPos = this.gridToScreen(row, col);
        this.animateSymbolFall(screenPos.x, screenPos.y);
      }, index * 50);
    });
  }

  private animateSymbolFall(x: number, y: number): void {
    const startY = -100;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce easing for landing effect
      const easedProgress =
        progress < 0.8
          ? progress
          : 0.8 + (progress - 0.8) * Math.sin((progress - 0.8) * Math.PI * 5) * 0.2;

      const currentY = startY + (y - startY) * easedProgress;

      // Render falling symbol (simplified)
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(x - 25, currentY - 25, 50, 50);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Mega win celebration with screen-wide effects
   */
  public async playMegaWinAnimation(winAmount: number): Promise<void> {
    try {
      this.validateWinAmount(winAmount);

      // Lightning effect
      const lightningEffect: CinematicEffect = {
        id: `lightning_${Date.now()}`,
        type: 'lightning',
        intensity: 1.0,
        duration: 2000,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(lightningEffect.id, lightningEffect);

      // Screen shake
      const shakeEffect: CinematicEffect = {
        id: `shake_${Date.now()}`,
        type: 'screen_shake',
        intensity: 0.8,
        duration: 3000,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(shakeEffect.id, shakeEffect);

      // Slow motion effect
      const slowMotionEffect: CinematicEffect = {
        id: `slowmo_${Date.now()}`,
        type: 'slow_motion',
        intensity: 0.5,
        duration: 2000,
        delay: 500,
        startTime: performance.now() + 500,
      };
      this.activeCinematicEffects.set(slowMotionEffect.id, slowMotionEffect);

      // Multiple particle bursts across screen
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('mega_aura', {
            position: {
              x: Math.random() * this.canvas.width,
              y: Math.random() * this.canvas.height,
            },
            duration: this.scaleDuration(3000),
            intensity: 1.0,
            color: '#FFD700',
            particleCount: this.scaleCount(100),
          });
          this.activeParticles.set(particle.id, particle);
        }, i * 200);
      }

      await this.delay(4000);
    } catch (error) {
      throw new AnimationError('Mega win animation failed', 'MEGA_WIN_ERROR', { error, winAmount });
    }
  }

  private validateWinAmount(winAmount: number): void {
    if (typeof winAmount !== 'number' || winAmount <= 0) {
      throw new AnimationError('Win amount must be a positive number', 'INVALID_WIN_AMOUNT');
    }
  }

  /**
   * Subtle scatter pulse at given positions (used when scatters land)
   */
  public async playScatterPulse(
    positions: Array<[number, number]>,
    intensity: number = 0.5,
  ): Promise<void> {
    try {
      if (!Array.isArray(positions) || positions.length === 0) {
        return; // nothing to show
      }

      const clampedIntensity = Math.min(Math.max(intensity, 0.2), 1.0);
      const color = '#F06292';

      positions.forEach(([row, col], idx) => {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('scatter_magic', {
            position: this.gridToScreen(row, col),
            duration: this.scaleDuration(900),
            intensity: clampedIntensity,
            color,
            particleCount: this.scaleCount(Math.floor(12 * clampedIntensity) + 8),
          });
          this.activeParticles.set(particle.id, particle);
        }, idx * 60);
      });

      const flash: CinematicEffect = {
        id: `flash_scatter_${Date.now()}`,
        type: 'flash',
        intensity: 0.25 * clampedIntensity,
        duration: 350,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(flash.id, flash);

      await this.delay(650 + positions.length * 60);
    } catch (error) {
      throw new AnimationError('Scatter pulse animation failed', 'SCATTER_PULSE_ERROR', {
        error,
        positions,
      });
    }
  }

  /**
   * Free Spins entrance glow/zoom
   */
  public async playFreeSpinsEntrance(scatterCount: number): Promise<void> {
    try {
      const base = Math.min(Math.max(scatterCount, 3), 7);

      const flash: CinematicEffect = {
        id: `flash_fs_${Date.now()}`,
        type: 'flash',
        intensity: 0.35 + (base - 3) * 0.08,
        duration: 600,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(flash.id, flash);

      const zoom: CinematicEffect = {
        id: `zoom_fs_${Date.now()}`,
        type: 'zoom',
        intensity: 0.25 + (base - 3) * 0.05,
        duration: 900,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(zoom.id, zoom);

      // Ambient magic particles to sell the transition
      for (let i = 0; i < base; i++) {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('scatter_magic', {
            position: {
              x: Math.random() * this.canvas.width,
              y: Math.random() * this.canvas.height,
            },
            duration: this.scaleDuration(1000),
            intensity: 0.4 + i * 0.05,
            color: '#F06292',
            particleCount: this.scaleCount(18 + i * 2),
          });
          this.activeParticles.set(particle.id, particle);
        }, i * 90);
      }

      await this.delay(1000 + base * 90);
    } catch (error) {
      throw new AnimationError('Free Spins entrance animation failed', 'FS_ENTRANCE_ERROR', {
        error,
        scatterCount,
      });
    }
  }

  /**
   * Subtle morphing FX: small pulses at positions
   */
  public async playMorphingAnimation(
    positions: Array<[number, number]>,
    intensity: number = 0.4,
  ): Promise<void> {
    try {
      if (!Array.isArray(positions) || positions.length === 0) return;
      const clamped = Math.min(Math.max(intensity, 0.2), 1.0);
      const color = '#7FC8FF';

      positions.forEach(([row, col], idx) => {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('win_sparkle', {
            position: this.gridToScreen(row, col),
            duration: this.scaleDuration(700),
            intensity: clamped,
            color,
            particleCount: this.scaleCount(Math.floor(10 * clamped) + 6),
          });
          this.activeParticles.set(particle.id, particle);
        }, idx * 40);
      });

      const flash: CinematicEffect = {
        id: `flash_morph_${Date.now()}`,
        type: 'flash',
        intensity: 0.18 * clamped,
        duration: 250,
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(flash.id, flash);

      await this.delay(450 + positions.length * 40);
    } catch (error) {
      throw new AnimationError('Morphing animation failed', 'MORPH_ANIMATION_ERROR', {
        error,
        positions,
      });
    }
  }

  // ============================================================================
  // PRIVATE ANIMATION UPDATE METHODS
  // ============================================================================

  private updateParticles(timestamp: number): void {
    // Particles are now managed with Maps for better performance
    // Cleanup is handled in cleanupCompletedAnimations()
  }

  private updateSpineAnimations(timestamp: number): void {
    // Update Spine2D animations if available
    for (const [id, animation] of this.activeSpineAnimations.entries()) {
      // Spine animation update logic would go here
      // This would integrate with the Spine WebGL runtime
    }
  }

  private updateCinematicEffects(timestamp: number): void {
    for (const [id, effect] of this.activeCinematicEffects.entries()) {
      const age = timestamp - effect.startTime;
      if (age < 0) continue; // Not started yet
      if (age > effect.duration) {
        this.activeCinematicEffects.delete(id);
        continue;
      }

      this.applyCinematicEffect(effect, age / effect.duration);
    }
  }

  // Global scaling helpers for particle-heavy effects
  private getParticleScale(): number {
    const cfg = this.configManager.getAnimationConfig();
    // Use particleDensity multiplied by adaptive throttle; clamp to sane bounds
    const raw = cfg.particleDensity * this.throttleScale;
    return Math.max(0.25, Math.min(raw, 2.0));
  }

  private scaleCount(base: number): number {
    const s = this.getParticleScale();
    return Math.max(1, Math.round(base * s));
  }

  private scaleDuration(baseMs: number): number {
    const s = this.getParticleScale();
    // Avoid extreme durations; keep within 0.5x..1.5x window
    const clamped = Math.max(0.5, Math.min(s, 1.5));
    return Math.round(baseMs * clamped);
  }

  private applyCinematicEffect(effect: CinematicEffect, progress: number): void {
    switch (effect.type) {
      case 'screen_shake':
        this.applyScreenShake(effect.intensity * (1 - progress));
        break;
      case 'flash':
        this.applyFlash(effect.intensity * (1 - progress));
        break;
      case 'zoom':
        this.applyZoom(1 + effect.intensity * Math.sin(progress * Math.PI));
        break;
      case 'slow_motion':
        // This would affect animation speeds globally
        break;
      case 'lightning':
        this.applyLightning(effect.intensity, progress);
        break;
    }
  }

  private applyScreenShake(intensity: number): void {
    const shakeX = (Math.random() - 0.5) * intensity * 10;
    const shakeY = (Math.random() - 0.5) * intensity * 10;
    this.ctx.translate(shakeX, shakeY);
  }

  private applyFlash(intensity: number): void {
    this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private applyZoom(scale: number): void {
    this.ctx.scale(scale, scale);
  }

  private applyLightning(intensity: number, progress: number): void {
    const branches = Math.floor(5 + intensity * 10);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
    this.ctx.lineWidth = 2 + intensity * 3;

    for (let i = 0; i < branches; i++) {
      const startX = Math.random() * this.canvas.width;
      const startY = 0;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = this.canvas.height;

      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);

      // Create jagged lightning path
      const segments = 8;
      for (let j = 1; j <= segments; j++) {
        const x = startX + (endX - startX) * (j / segments) + (Math.random() - 0.5) * 50;
        const y = startY + (endY - startY) * (j / segments);
        this.ctx.lineTo(x, y);
      }

      this.ctx.stroke();
    }
  }

  private renderFrame(timestamp: number): void {
    // Render all active particle systems
    for (const [id, effect] of this.activeParticles.entries()) {
      this.renderParticleSystem(effect, timestamp);
    }
  }

  private renderParticleSystem(effect: ParticleEffect, timestamp: number): void {
    const age = timestamp - effect.startTime;
    const progress = Math.min(age / effect.duration, 1);

    for (let i = 0; i < effect.particleCount; i++) {
      const particleProgress = Math.max(0, progress - (i / effect.particleCount) * 0.3);
      if (particleProgress <= 0) continue;

      const angle = (i / effect.particleCount) * Math.PI * 2;
      const distance = particleProgress * 100 * effect.intensity;

      const x = effect.position.x + Math.cos(angle) * distance;
      const y = effect.position.y + Math.sin(angle) * distance;

      const alpha = 1 - particleProgress;
      this.ctx.fillStyle = `${effect.color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, '0')}`;
      this.ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  private gridToScreen(row: number, col: number): { x: number; y: number } {
    const cellWidth = this.canvas.width / 7;
    const cellHeight = this.canvas.height / 7;

    return {
      x: col * cellWidth + cellWidth / 2,
      y: row * cellHeight + cellHeight / 2,
    };
  }

  // ============================================================================
  // PUBLIC API AND UTILITY METHODS
  // ============================================================================

  /**
   * Get current animation metrics
   */
  public getMetrics(): Readonly<AnimationMetrics> {
    return { ...this.animationMetrics };
  }

  /**
   * Update animation configuration
   */
  public updateConfig(config: Partial<AnimationConfig>): void {
    this.configManager.updateAnimationConfig(config);
  }

  /**
   * Update reel configuration
   */
  public updateReelConfig(config: Partial<ReelMotionConfig>): void {
    this.configManager.updateReelConfig(config);
  }

  /**
   * Preload particle effects for better performance
   */
  public preloadParticleEffects(): void {
    const effectTypes: Array<ParticleEffect['type']> = [
      'evolution_burst',
      'win_sparkle',
      'scatter_magic',
      'cascade_explosion',
      'mega_aura',
    ];

    effectTypes.forEach((type) => {
      for (let i = 0; i < 10; i++) {
        this.particlePool.createParticle(type, {
          position: { x: 0, y: 0 },
          duration: this.scaleDuration(1000),
          intensity: 1.0,
          color: '#FFFFFF',
          particleCount: this.scaleCount(50),
        });
      }
    });
  }

  /**
   * Clean up all animations and resources
   */
  public dispose(): void {
    this.activeParticles.clear();
    this.activeSpineAnimations.clear();
    this.activeCinematicEffects.clear();
    this.particlePool.cleanup();
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Near-miss scatter anticipation cue: gentle sparkle and flash
   */
  public async playScatterAnticipation(positions: Array<[number, number]>): Promise<void> {
    try {
      if (!Array.isArray(positions) || positions.length === 0) return;
      const color = '#FEEAA1';

      positions.forEach(([row, col], idx) => {
        setTimeout(() => {
          const particle = this.particlePool.createParticle('win_sparkle', {
            position: this.gridToScreen(row, col),
            duration: this.scaleDuration(600),
            intensity: 0.35,
            color,
            particleCount: this.scaleCount(12),
          });
          this.activeParticles.set(particle.id, particle);
        }, idx * 45);
      });

      const flash: CinematicEffect = {
        id: `flash_anticipation_${Date.now()}`,
        type: 'flash',
        intensity: 0.18,
        duration: this.scaleDuration(250),
        startTime: performance.now(),
      };
      this.activeCinematicEffects.set(flash.id, flash);

      await this.delay(500 + positions.length * 45);
    } catch (error) {
      throw new AnimationError('Scatter anticipation failed', 'SCATTER_ANTICIPATION_ERROR', {
        error,
        positions,
      });
    }
  }
}

/**
 * Spine2D Integration for Professional Pokemon Animations
 */
export class SpineAnimationManager {
  private spineRuntime: any; // Spine WebGL runtime
  private skeletons: Map<string, any> = new Map();
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initializeSpineRuntime(canvas);
  }

  private initializeSpineRuntime(canvas: HTMLCanvasElement): void {
    try {
      // This would initialize the Spine WebGL runtime
      // Implementation depends on the actual Spine runtime integration
      console.log('Spine runtime initialized for canvas:', canvas);
    } catch (error) {
      throw new AnimationError('Failed to initialize Spine runtime', 'SPINE_INIT_ERROR', { error });
    }
  }

  public async loadPokemonSkeleton(
    pokemonName: string,
    skeletonPath: string,
    atlasPath: string,
  ): Promise<void> {
    try {
      this.validateSkeletonInput(pokemonName, skeletonPath, atlasPath);

      // Load skeleton and atlas data
      // Create skeleton instance
      // Store in skeletons map
      console.log(`Loading skeleton for ${pokemonName} from ${skeletonPath}`);

      // Placeholder implementation
      this.skeletons.set(pokemonName, {
        name: pokemonName,
        loaded: true,
        skeletonPath,
        atlasPath,
      });
    } catch (error) {
      throw new AnimationError('Failed to load Pokemon skeleton', 'SKELETON_LOAD_ERROR', {
        error,
        pokemonName,
        skeletonPath,
        atlasPath,
      });
    }
  }

  public async playPokemonAnimation(
    pokemonName: string,
    animationName: string,
    position: { x: number; y: number },
  ): Promise<void> {
    try {
      this.validateAnimationInput(pokemonName, animationName, position);

      const skeleton = this.skeletons.get(pokemonName);
      if (!skeleton) {
        console.warn(`Skeleton for ${pokemonName} not loaded`);
        return;
      }

      console.log(`Playing animation ${animationName} for ${pokemonName} at position:`, position);

      // Set skeleton position
      // Play animation
      // Set up completion callback
    } catch (error) {
      throw new AnimationError('Failed to play Pokemon animation', 'ANIMATION_PLAY_ERROR', {
        error,
        pokemonName,
        animationName,
        position,
      });
    }
  }

  private validateSkeletonInput(
    pokemonName: string,
    skeletonPath: string,
    atlasPath: string,
  ): void {
    if (typeof pokemonName !== 'string' || pokemonName.trim() === '') {
      throw new AnimationError('Pokemon name must be a non-empty string', 'INVALID_POKEMON_NAME');
    }
    if (typeof skeletonPath !== 'string' || skeletonPath.trim() === '') {
      throw new AnimationError('Skeleton path must be a non-empty string', 'INVALID_SKELETON_PATH');
    }
    if (typeof atlasPath !== 'string' || atlasPath.trim() === '') {
      throw new AnimationError('Atlas path must be a non-empty string', 'INVALID_ATLAS_PATH');
    }
  }

  private validateAnimationInput(
    pokemonName: string,
    animationName: string,
    position: { x: number; y: number },
  ): void {
    if (typeof pokemonName !== 'string' || pokemonName.trim() === '') {
      throw new AnimationError('Pokemon name must be a non-empty string', 'INVALID_POKEMON_NAME');
    }
    if (typeof animationName !== 'string' || animationName.trim() === '') {
      throw new AnimationError(
        'Animation name must be a non-empty string',
        'INVALID_ANIMATION_NAME',
      );
    }
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new AnimationError('Position must have valid x and y coordinates', 'INVALID_POSITION');
    }
  }

  /**
   * Clean up Spine resources
   */
  public dispose(): void {
    this.skeletons.clear();
    // Clean up Spine runtime resources
  }
}

// ============================================================================
// TYPE DECLARATIONS FOR DOM APIs
// ============================================================================

/**
 * Type declarations for DOM APIs to resolve TypeScript errors
 * These would typically be in a .d.ts file or provided by a library
 */
declare const performance: {
  now(): number;
};

declare function requestAnimationFrame(callback: (time: number) => void): number;

declare const window: any;
