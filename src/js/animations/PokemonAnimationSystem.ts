/**
 * ULTIMATE POKEMON ANIMATION SYSTEM - Surpassing Stake.com Games
 * Advanced tweening, physics-based animations, and cinematic effects
 *
 * INSPIRED BY STAKE.COM'S BEST:
 * - Gates of Olympus: Lightning effects and smooth cascading
 * - Sweet Bonanza: Tumbling symbols with explosive effects
 * - Reactoonz: Energy charges and cluster reactions
 * - Moon Princess: Magical transformations and grid clearing
 * - The Dog House: Sticky wilds and bonus animations
 */

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  delay?: number;
  repeat?: number;
  yoyo?: boolean;
  onUpdate?: (progress: number, value: any) => void;
  onComplete?: () => void;
}

export interface StakeQualityReelConfig {
  anticipationEffects: boolean;
  smoothAcceleration: boolean;
  dramaticStopping: boolean;
  bounceOnLanding: boolean;
  cascadePhysics: boolean;
  winCelebrations: boolean;
}

export type EasingFunction = (t: number) => number;

// Professional easing functions for casino-quality animations
export const Easing = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t),

  easeInElastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const a = 1;
    const s = p / 4;
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin(((t - s) * (2 * Math.PI)) / p));
  },

  easeOutElastic: (t: number) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    const a = 1;
    const s = p / 4;
    return a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
  },

  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

export interface Sprite {
  id: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  alpha: number;
  tint: { r: number; g: number; b: number };
  anchor: { x: number; y: number };
  texture: WebGLTexture;
  visible: boolean;
  zIndex: number;
}

export interface ParticleEmitter {
  position: { x: number; y: number };
  velocity: { x: number; y: number; variance: number };
  acceleration: { x: number; y: number };
  lifetime: { min: number; max: number };
  size: { start: number; end: number };
  color: { start: [number, number, number, number]; end: [number, number, number, number] };
  emissionRate: number;
  maxParticles: number;
  blendMode: "normal" | "add" | "multiply";
}

export class PokemonAnimationSystem {
  private animations: Map<string, PokemonAnimation> = new Map();
  private sprites: Map<string, Sprite> = new Map();
  private particleEmitters: Map<string, ParticleEmitter> = new Map();
  private timeline: AnimationTimeline = new AnimationTimeline();

  // Performance optimization
  private animationPool: PokemonAnimation[] = [];
  private lastFrameTime = 0;
  private deltaTime = 0;

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults() {
    // Initialize object pools and default configurations
  }

  // Core animation methods
  public animateSprite(
    spriteId: string,
    properties: Partial<Sprite>,
    config: AnimationConfig
  ): string {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) {
      console.warn(`Sprite ${spriteId} not found`);
      return "";
    }

    const animationId = this.generateAnimationId();
    const animation = this.createAnimation(sprite, properties, config, animationId);

    this.animations.set(animationId, animation);
    return animationId;
  }

  // Pokemon-specific animations for casino gaming
  public animatePokemonAppear(spriteId: string, pokemonType: string): string {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return "";

    // Set initial state (invisible, scaled down)
    sprite.alpha = 0;
    sprite.scale = { x: 0.1, y: 0.1 };
    sprite.rotation = Math.PI * 0.25; // 45 degrees

    // Create dramatic entrance animation
    return this.timeline
      .add(() =>
        this.animateSprite(
          spriteId,
          { alpha: 1, scale: { x: 1.2, y: 1.2 } },
          { duration: 300, easing: Easing.easeOutElastic }
        )
      )
      .add(() =>
        this.animateSprite(
          spriteId,
          { scale: { x: 1, y: 1 }, rotation: 0 },
          { duration: 200, easing: Easing.easeOutBounce }
        )
      )
      .add(() => this.createPokemonSparkles(spriteId, pokemonType))
      .execute();
  }

  public animatePokemonDisappear(spriteId: string, isWinning: boolean = false): string {
    const effectsId = isWinning ? this.createWinningEffects(spriteId) : "";

    return this.timeline
      .add(() => effectsId) // Add winning effects if applicable
      .add(() =>
        this.animateSprite(
          spriteId,
          {
            scale: { x: 1.3, y: 1.3 },
            alpha: 0.8,
            rotation: Math.PI * 0.1,
          },
          { duration: 150, easing: Easing.easeInQuad }
        )
      )
      .add(() =>
        this.animateSprite(
          spriteId,
          {
            scale: { x: 0, y: 0 },
            alpha: 0,
            rotation: Math.PI * 0.5,
          },
          { duration: 250, easing: Easing.easeInCubic }
        )
      )
      .execute();
  }

  /**
   * ULTIMATE STAKE.COM-QUALITY REEL SPINNING SYSTEM
   * Inspired by Gates of Olympus smooth mechanics
   */
  public async performUltimateReelSpin(config: StakeQualityReelConfig): Promise<string> {
    const timelineId = this.generateAnimationId();

    if (config.anticipationEffects) {
      await this.playAnticipationEffects();
    }

    if (config.smoothAcceleration) {
      await this.performSmoothAcceleration();
    }

    await this.executeMainSpinPhase();

    if (config.dramaticStopping) {
      await this.performDramaticStopping();
    }

    if (config.bounceOnLanding) {
      await this.playLandingBounceEffects();
    }

    return timelineId;
  }

  private async playAnticipationEffects(): Promise<void> {
    // Screen darkening like Gates of Olympus
    this.createScreenEffect("darken", 0.3, 800);

    // All symbols glow anticipation
    this.sprites.forEach((sprite) => {
      this.addGlowEffect(sprite.id, 800);
      this.animateSprite(
        sprite.id,
        { scale: { x: 1.05, y: 1.05 } },
        { duration: 400, easing: Easing.easeInOutQuad, yoyo: true }
      );
    });

    // Sound build-up effect
    this.playSound("anticipation_buildup");

    await this.sleep(800);
  }

  private async performSmoothAcceleration(): Promise<void> {
    // Sweet Bonanza-style smooth acceleration
    const accelerationSteps = 12;

    for (let step = 0; step < accelerationSteps; step++) {
      const progress = step / accelerationSteps;
      const speed = this.easeInQuart(progress);

      // Update all reel speeds progressively
      this.updateReelSpeeds(speed);

      // Visual blur effect during acceleration
      this.createMotionBlur(speed * 10);

      await this.sleep(80);
    }
  }

  private async executeMainSpinPhase(): Promise<void> {
    // Mark all symbols as spinning with motion effects
    this.sprites.forEach((sprite) => {
      this.animateSprite(
        sprite.id,
        { rotation: Math.PI * 4, alpha: 0.8 },
        { duration: 2000, easing: Easing.linear, repeat: -1 }
      );
    });

    // Create spinning particle trail effects
    this.createSpinningParticleTrails();

    await this.sleep(2000);
  }

  private async performDramaticStopping(): Promise<void> {
    // Reactoonz-style dramatic stopping sequence
    const columns = 7; // 7x7 grid
    const stopDelays = [0, 150, 300, 450, 600, 750, 900];

    for (let col = 0; col < columns; col++) {
      setTimeout(() => {
        this.stopColumnWithDrama(col);
      }, stopDelays[col]);
    }

    await this.sleep(1200);
  }

  private stopColumnWithDrama(column: number): void {
    // Quick deceleration with visual feedback
    this.createColumnStopEffect(column);

    // Stop column symbols with screen shake
    this.createScreenShake(5, 200);

    // Sound effect for each column stop
    this.playSound(`reel_stop_${column + 1}`);
  }

  private async playLandingBounceEffects(): Promise<void> {
    // Moon Princess-style bounce effects
    this.sprites.forEach((sprite, index) => {
      setTimeout(
        () => {
          this.animateSprite(
            sprite.id,
            { position: { x: sprite.position.x, y: sprite.position.y - 20 } },
            { duration: 150, easing: Easing.easeOutQuad }
          );

          setTimeout(() => {
            this.animateSprite(
              sprite.id,
              { position: { x: sprite.position.x, y: sprite.position.y } },
              { duration: 200, easing: Easing.easeOutBounce }
            );
          }, 150);
        },
        Number(index || 0) * 50
      );
    });

    await this.sleep(600);
  }

  /**
   * ULTIMATE WIN REVEAL SYSTEM - Surpassing Sweet Bonanza and Gates of Olympus
   */
  public async performUltimateWinReveal(clusters: any[], totalWin: number): Promise<string> {
    const timelineId = this.generateAnimationId();

    // Phase 1: Anticipation buildup
    await this.buildWinAnticipation();

    // Phase 2: Cluster highlighting with dramatic timing
    await this.highlightWinningClusters(clusters);

    // Phase 3: Progressive win value revelation with crescendo
    await this.revealWinProgressively(totalWin);

    // Phase 4: Spectacular celebration effects based on win tier
    await this.triggerTieredWinCelebration(totalWin);

    // Phase 5: Aftermath and transition
    await this.winCelebrationAftermath();

    return timelineId;
  }

  private async buildWinAnticipation(): Promise<void> {
    // Screen dimming effect
    this.createScreenFlash("#000000", 300);
    await this.sleep(200);

    // Subtle screen shake building tension
    for (let i = 0; i < 5; i++) {
      this.createScreenShake(0.5 + i * 0.3, 100);
      await this.sleep(120);
    }

    // Spotlight effect on winning areas
    this.createSpotlightEffect();
    await this.sleep(300);
  }

  private async highlightWinningClusters(clusters: any[]): Promise<void> {
    // Enhanced cluster highlighting with chain reactions
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex++) {
      const cluster = clusters[clusterIndex];

      // Cluster appearance order for maximum drama
      const revealOrder = this.calculateOptimalRevealOrder(cluster.positions);

      for (let i = 0; i < revealOrder.length; i++) {
        const pos = revealOrder[i];
        const spriteId = `sprite_${pos.row}_${pos.col}`;

        // Triple-layer highlight effect
        this.addUltimateGlowEffect(spriteId, cluster.symbol);

        // Dynamic scale animation with overshoot
        this.animateSprite(
          spriteId,
          { scale: { x: 1.5, y: 1.5 } },
          { duration: 200, easing: Easing.easeOutElastic }
        );

        // Enhanced type-specific burst
        this.createTypeSpecificParticleBurst(spriteId, cluster.symbol);

        // Connect to adjacent winning symbols with particle trails
        if (i > 0) {
          this.createWinningSymbolConnection(revealOrder[i - 1], pos);
        }

        await this.sleep(80 + Math.random() * 40); // Slight randomization for organic feel
      }

      // Cluster completion effect
      this.createClusterCompletionBurst(cluster);
      await this.sleep(200);
    }
  }

  private async revealWinProgressively(totalWin: number): Promise<void> {
    // Advanced progressive win counter with dynamic pacing
    const winTier = this.getWinTier(totalWin);
    const duration = this.getRevealDuration(winTier);
    const steps = 40 + winTier * 10; // More steps for bigger wins

    // Pre-reveal anticipation
    this.createWinCounterSpotlight();
    await this.sleep(300);

    for (let step = 0; step <= steps; step++) {
      const progress = step / steps;
      const easedProgress = this.easeOutQuint(progress);
      const currentWin = Math.floor(totalWin * easedProgress);

      // Enhanced win display with scaling and color shifts
      this.updateEnhancedWinDisplay(currentWin, progress, winTier);

      // Dynamic effects based on progress
      if (progress > 0.7) {
        this.createProgressFlash(winTier, progress);
      }

      if (progress > 0.9) {
        this.createWinClimaxEffects(currentWin, totalWin);
      }

      // Adaptive timing - slower at the end for suspense
      const stepDelay = (duration / steps) * (1 + progress * 2);
      await this.sleep(stepDelay);
    }

    // Final win confirmation
    this.createWinConfirmationEffect(totalWin, winTier);
  }

  private async triggerTieredWinCelebration(totalWin: number): Promise<void> {
    const winTier = this.getWinTier(totalWin);

    switch (winTier) {
      case 1: // Small win
        await this.triggerBasicCelebration(totalWin);
        break;
      case 2: // Medium win
        await this.triggerMediumCelebration(totalWin);
        break;
      case 3: // Large win
        await this.triggerLargeCelebration(totalWin);
        break;
      case 4: // Mega win
        await this.triggerMegaCelebration(totalWin);
        break;
      case 5: // Legendary win
        await this.triggerLegendaryCelebration(totalWin);
        break;
    }
  }

  private async triggerBasicCelebration(totalWin: number): Promise<void> {
    // Gentle celebration effects
    this.createConfettiEffect(15, "#FFD700");
    this.createScreenFlash("#FFD700", 200);
    this.createScreenShake(1.0, 300);
    await this.sleep(1000);
  }

  private async triggerMediumCelebration(totalWin: number): Promise<void> {
    // Enhanced celebration
    this.createConfettiEffect(30, ["#FFD700", "#FF6B6B", "#4ECDC4"]);
    this.createFireworksEffect(5);
    this.createScreenFlash("#FFD700", 300);
    this.createScreenShake(1.5, 500);

    // Particle fountain
    this.createParticleFountain(totalWin);
    await this.sleep(1500);
  }

  private async triggerLargeCelebration(totalWin: number): Promise<void> {
    // Major celebration sequence
    this.createScreenFlash("#FFFFFF", 100);
    await this.sleep(100);

    this.createMassiveConfettiStorm();
    this.createFireworksEffect(12);
    this.createScreenShake(2.0, 800);

    // Multiple particle fountains
    for (let i = 0; i < 4; i++) {
      setTimeout(() => this.createParticleFountain(totalWin * 0.25), i * 200);
    }

    // Rainbow screen effects
    await this.createRainbowSequence();
    await this.sleep(2000);
  }

  private async triggerMegaCelebration(totalWin: number): Promise<void> {
    // Epic celebration worthy of mega wins
    this.createScreenFlash("#FFFFFF", 150);
    await this.sleep(100);

    // Multiple celebration layers
    this.createMegaConfettiExplosion();
    this.createFireworksFinale(20);
    this.createScreenShake(2.5, 1000);

    // Cascading particle effects
    await this.createCascadingParticleWave();

    // Golden light rays
    this.createGoldenLightRays();

    // Mega win text animation
    await this.animateMegaWinText(totalWin);
    await this.sleep(2500);
  }

  private async triggerLegendaryCelebration(totalWin: number): Promise<void> {
    // Ultimate legendary celebration
    // Full screen takeover with cinematic effects
    await this.createLegendaryIntro();

    // Explosive opening
    this.createScreenFlash("#FFFFFF", 200);
    await this.sleep(150);

    // Multi-phase legendary sequence
    await this.createLegendaryParticleStorm();
    await this.createLegendaryLightShow();
    await this.createLegendaryTextSequence(totalWin);

    // Ultimate screen effects
    this.createScreenShake(3.0, 1500);

    // Legendary aftermath
    await this.createLegendaryAftermath();
    await this.sleep(3000);
  }

  private async winCelebrationAftermath(): Promise<void> {
    // Gentle fade out of celebration effects
    this.fadeAllParticleEffects();

    // Return to normal game state with smooth transition
    this.createScreenFlash("#000000", 500);
    await this.sleep(300);

    // Reset any transformed elements
    this.resetAllSpriteTransforms();
    await this.sleep(200);
  }

  // Helper methods for the enhanced win celebration system
  private getWinTier(totalWin: number): number {
    if (totalWin < 50) return 1;
    if (totalWin < 200) return 2;
    if (totalWin < 500) return 3;
    if (totalWin < 1000) return 4;
    return 5;
  }

  private getRevealDuration(winTier: number): number {
    return 1000 + winTier * 500; // Longer reveals for bigger wins
  }

  private easeOutQuint(t: number): number {
    return 1 + --t * t * t * t * t;
  }

  // Placeholder implementations for missing methods
  private createSpotlightEffect(): void {
    /* Spotlight implementation */
  }
  private calculateOptimalRevealOrder(positions: any[]): any[] {
    return positions;
  }
  private addUltimateGlowEffect(spriteId: string, symbol: string): void {
    this.addGlowEffect(spriteId, 1000);
  }
  private createWinningSymbolConnection(pos1: any, pos2: any): void {
    /* Connection effect */
  }
  private createClusterCompletionBurst(cluster: any): void {
    this.createExplosionEffect(cluster.centerX || 0, cluster.centerY || 0, 1.5);
  }
  private createWinCounterSpotlight(): void {
    /* Win counter spotlight */
  }
  private updateEnhancedWinDisplay(currentWin: number, progress: number, winTier: number): void {
    this.updateWinDisplay(currentWin, progress);
  }
  private createProgressFlash(winTier: number, progress: number): void {
    this.createScreenFlash("#FFD700", 100);
  }
  private createWinClimaxEffects(currentWin: number, totalWin: number): void {
    this.createExplosionEffect(window.innerWidth / 2, window.innerHeight / 2, 2.0);
  }
  private createWinConfirmationEffect(totalWin: number, winTier: number): void {
    this.createScreenFlash("#00FF00", 200);
  }

  // Celebration effect placeholders
  private createConfettiEffect(count: number, colors: string | string[]): void {
    /* Confetti */
  }
  private createFireworksEffect(count: number): void {
    /* Fireworks */
  }
  private createParticleFountain(intensity: number): void {
    /* Particle fountain */
  }
  private createMassiveConfettiStorm(): void {
    this.createConfettiEffect(200, "#FFD700");
  }
  private createFireworksFinale(count: number): void {
    this.createFireworksEffect(count);
  }
  private async createCascadingParticleWave(): Promise<void> {
    await this.sleep(500);
  }
  private createGoldenLightRays(): void {
    this.createScreenFlash("#FFD700", 500);
  }
  private async animateMegaWinText(totalWin: number): Promise<void> {
    await this.sleep(1000);
  }
  private async createRainbowSequence(): Promise<void> {
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"];
    for (const color of colors) {
      this.createScreenFlash(color, 150);
      await this.sleep(100);
    }
  }
  private createMegaConfettiExplosion(): void {
    this.createConfettiEffect(500, ["#FFD700", "#FF0000"]);
  }

  // Legendary celebration placeholders
  private async createLegendaryIntro(): Promise<void> {
    this.createScreenFlash("#000000", 1000);
    await this.sleep(500);
  }
  private async createLegendaryParticleStorm(): Promise<void> {
    await this.sleep(1000);
  }
  private async createLegendaryLightShow(): Promise<void> {
    await this.createRainbowSequence();
  }
  private async createLegendaryTextSequence(totalWin: number): Promise<void> {
    await this.sleep(1500);
  }
  private async createLegendaryAftermath(): Promise<void> {
    await this.sleep(800);
  }

  // Utility placeholders
  private fadeAllParticleEffects(): void {
    /* Fade particles */
  }
  private resetAllSpriteTransforms(): void {
    this.sprites.forEach((sprite) => {
      sprite.scale = { x: 1, y: 1 };
      sprite.rotation = 0;
      sprite.alpha = 1;
    });
  }

  /**
   * ULTIMATE MULTIPLIER ANIMATION SYSTEM - Exceeding Casino Quality
   * Inspired by Gates of Olympus and Sweet Bonanza multiplier effects
   */
  public animateMultiplierReveal(
    position: { x: number; y: number },
    multiplierValue: number,
    tier: string = "normal"
  ): string {
    const timelineId = this.generateAnimationId();

    // Create multiplier sprite with dynamic appearance
    const multiplierSprite = this.createMultiplierSprite(position, multiplierValue, tier);

    // Phase 1: Dramatic entrance
    this.performMultiplierEntrance(multiplierSprite, multiplierValue);

    // Phase 2: Value reveal with crescendo
    setTimeout(() => {
      this.performMultiplierValueReveal(multiplierSprite, multiplierValue, tier);
    }, 300);

    // Phase 3: Tier-specific celebration
    setTimeout(() => {
      this.performMultiplierCelebration(multiplierSprite, multiplierValue, tier);
    }, 800);

    // Phase 4: Integration into game board
    setTimeout(() => {
      this.integrateMultiplierIntoBoard(multiplierSprite, position, multiplierValue);
    }, 1500);

    return timelineId;
  }

  private createMultiplierSprite(
    position: { x: number; y: number },
    value: number,
    tier: string
  ): any {
    const spriteId = `multiplier_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const sprite = {
      id: spriteId,
      position: { x: position.x, y: position.y },
      scale: { x: 0.1, y: 0.1 },
      rotation: 0,
      alpha: 0,
      tint: this.getMultiplierTierColor(value, tier),
      anchor: { x: 0.5, y: 0.5 },
      texture: {} as WebGLTexture,
      visible: true,
      zIndex: 100,
      value: value,
      tier: tier,
    };

    this.sprites.set(spriteId, sprite);
    return sprite;
  }

  private performMultiplierEntrance(sprite: any, value: number): void {
    // Dynamic entrance based on multiplier value
    const entranceIntensity = Math.min(value / 2, 3.0);

    // Initial flash effect
    this.createScreenFlash(this.getMultiplierFlashColor(value), 150);

    // Dramatic scale animation with overshoot
    this.animateSprite(
      sprite.id,
      {
        scale: { x: 2.0 + entranceIntensity, y: 2.0 + entranceIntensity },
        alpha: 1,
        rotation: Math.PI * 0.25,
      },
      { duration: 200, easing: Easing.easeOutElastic }
    );

    // Settle to final size
    setTimeout(() => {
      this.animateSprite(
        sprite.id,
        {
          scale: { x: 1.3, y: 1.3 },
          rotation: 0,
        },
        { duration: 250, easing: Easing.easeOutBounce }
      );
    }, 200);

    // Entrance particle burst
    this.createMultiplierEntranceParticles(sprite.position, value);
  }

  private performMultiplierValueReveal(sprite: any, value: number, tier: string): void {
    // Progressive value counting for high multipliers
    if (value > 5) {
      this.performProgressiveValueCount(sprite, value);
    } else {
      this.performInstantValueReveal(sprite, value);
    }

    // Tier-specific visual effects during reveal
    this.addTierSpecificRevealEffects(sprite, tier, value);
  }

  private performProgressiveValueCount(sprite: any, finalValue: number): void {
    const steps = Math.min(finalValue, 20); // Limit steps for performance
    const duration = 1000; // 1 second total

    for (let step = 1; step <= steps; step++) {
      setTimeout(
        () => {
          const currentValue = Math.ceil((step / steps) * finalValue);

          // Update visual representation
          this.updateMultiplierDisplay(sprite, currentValue);

          // Scale pulse for each step
          this.animateSprite(
            sprite.id,
            { scale: { x: 1.4, y: 1.4 } },
            { duration: 50, easing: Easing.easeOutQuad }
          );

          setTimeout(() => {
            this.animateSprite(
              sprite.id,
              { scale: { x: 1.3, y: 1.3 } },
              { duration: 50, easing: Easing.easeInQuad }
            );
          }, 50);

          // Sound effect for each count
          if (currentValue === finalValue) {
            this.createMultiplierCompleteEffect(sprite.position, finalValue);
          }
        },
        (step - 1) * (duration / steps)
      );
    }
  }

  private performInstantValueReveal(sprite: any, value: number): void {
    // Immediate reveal with dramatic effect
    this.updateMultiplierDisplay(sprite, value);

    // Double pulse effect
    this.animateSprite(
      sprite.id,
      { scale: { x: 1.6, y: 1.6 } },
      { duration: 100, easing: Easing.easeOutElastic }
    );

    setTimeout(() => {
      this.animateSprite(
        sprite.id,
        { scale: { x: 1.2, y: 1.2 } },
        { duration: 150, easing: Easing.easeOutBounce }
      );
    }, 100);

    this.createMultiplierCompleteEffect(sprite.position, value);
  }

  private performMultiplierCelebration(sprite: any, value: number, tier: string): void {
    // Celebration intensity based on multiplier tier
    if (value >= 100) {
      this.performLegendaryMultiplierCelebration(sprite, value);
    } else if (value >= 50) {
      this.performMegaMultiplierCelebration(sprite, value);
    } else if (value >= 10) {
      this.performBigMultiplierCelebration(sprite, value);
    } else if (value >= 5) {
      this.performGoodMultiplierCelebration(sprite, value);
    } else {
      this.performStandardMultiplierCelebration(sprite, value);
    }
  }

  private performLegendaryMultiplierCelebration(sprite: any, value: number): void {
    // Ultimate legendary multiplier celebration
    this.createScreenFlash("#FFD700", 300);
    this.createScreenShake(2.5, 800);

    // Multiple golden light rays
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.createGoldenLightRay(sprite.position, (i * Math.PI) / 4);
      }, i * 50);
    }

    // Legendary particle explosion
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 3.0);

    // Rainbow aura effect
    this.createRainbowAura(sprite.position, 200);

    // Legendary sound crescendo
    // this.playSound('legendary_multiplier_fanfare');
  }

  private performMegaMultiplierCelebration(sprite: any, value: number): void {
    // Mega multiplier celebration
    this.createScreenFlash("#FF6B6B", 250);
    this.createScreenShake(2.0, 600);

    // Radiating energy waves
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.createEnergyWave(sprite.position, (i + 1) * 50);
      }, i * 100);
    }

    // Mega particle burst
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.5);

    // Pulsing glow effect
    this.addPulsingGlow(sprite.id, this.getMultiplierTierColor(value, "mega"), 2.0);
  }

  private performBigMultiplierCelebration(sprite: any, value: number): void {
    // Big multiplier celebration
    this.createScreenFlash("#4ECDC4", 200);
    this.createScreenShake(1.5, 400);

    // Energy ripples
    this.createEnergyRipples(sprite.position, 3);

    // Big particle explosion
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.0);

    // Glowing ring effect
    this.createGlowingRing(sprite.position, 80, 1500);
  }

  private performGoodMultiplierCelebration(sprite: any, value: number): void {
    // Good multiplier celebration
    this.createScreenFlash("#95E1D3", 150);
    this.createScreenShake(1.0, 300);

    // Sparkle burst
    this.createSparkles(sprite.position, 15);

    // Standard particle effect
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 1.5);
  }

  private performStandardMultiplierCelebration(sprite: any, value: number): void {
    // Standard multiplier celebration
    this.createScreenFlash("#FFE66D", 100);

    // Gentle sparkle effect
    this.createSparkles(sprite.position, 8);

    // Small particle burst
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 1.0);
  }

  private integrateMultiplierIntoBoard(
    sprite: any,
    position: { x: number; y: number },
    value: number
  ): void {
    // Smooth integration animation
    this.animateSprite(
      sprite.id,
      {
        scale: { x: 1.0, y: 1.0 },
        position: position,
      },
      { duration: 400, easing: Easing.easeInOutQuad }
    );

    // Add persistent glow based on multiplier value
    this.addPersistentMultiplierGlow(sprite.id, value);

    // Update z-index for proper layering
    const spriteData = this.sprites.get(sprite.id);
    if (spriteData) {
      spriteData.zIndex = 50; // Above symbols but below effects
    }
  }

  /**
   * MASTER BALL MULTIPLIER SYSTEM - Unique Pokemon-themed feature
   */
  public animateMasterBallMultiplier(
    position: { x: number; y: number },
    megaMultiplier: number
  ): string {
    const timelineId = this.generateAnimationId();

    // Phase 1: Master Ball appearance
    this.createMasterBallEntrance(position);

    // Phase 2: Ball opening sequence
    setTimeout(() => {
      this.performMasterBallOpening(position);
    }, 500);

    // Phase 3: Multiplier release
    setTimeout(() => {
      this.releaseMasterBallMultiplier(position, megaMultiplier);
    }, 1200);

    // Phase 4: Board-wide multiplier application
    setTimeout(() => {
      this.applyMasterBallMultiplierToBoard(megaMultiplier);
    }, 2000);

    return timelineId;
  }

  private createMasterBallEntrance(position: { x: number; y: number }): void {
    // Dramatic Master Ball entrance from above
    const ballSprite = this.createMasterBallSprite(position);

    // Animate fall from sky
    ballSprite.position.y -= 200;
    this.animateSprite(
      ballSprite.id,
      { position: position },
      { duration: 800, easing: Easing.easeOutBounce }
    );

    // Screen effects
    this.createScreenFlash("#FFFFFF", 200);
    this.createScreenShake(1.5, 400);
  }

  private performMasterBallOpening(position: { x: number; y: number }): void {
    // Ball opening animation with particle effects
    this.createExplosionEffect(position.x, position.y, 2.0);

    // Light beam effect
    this.createLightBeam(position, { x: position.x, y: position.y - 100 });

    // Opening sound effect
    // this.playSound('master_ball_opening');
  }

  private releaseMasterBallMultiplier(
    position: { x: number; y: number },
    multiplier: number
  ): void {
    // Epic multiplier release sequence
    this.createScreenFlash("#FFD700", 300);

    // Multiple golden orbs spreading across screen
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const targetX = position.x + Math.cos(angle) * 150;
      const targetY = position.y + Math.sin(angle) * 150;

      setTimeout(() => {
        this.createGoldenMultiplierOrb(position, { x: targetX, y: targetY }, multiplier);
      }, i * 50);
    }
  }

  private applyMasterBallMultiplierToBoard(multiplier: number): void {
    // Apply multiplier effect to all visible symbols
    this.sprites.forEach((sprite, id) => {
      if (sprite.visible && !id.includes("multiplier")) {
        // Enhanced glow for all symbols
        this.addPulsingGlow(id, [1.0, 0.8, 0.0], 1.5); // Golden glow

        // Gentle scale animation
        this.animateSprite(
          id,
          { scale: { x: 1.1, y: 1.1 } },
          { duration: 200, easing: Easing.easeOutQuad }
        );

        setTimeout(() => {
          this.animateSprite(
            id,
            { scale: { x: 1.0, y: 1.0 } },
            { duration: 300, easing: Easing.easeInOutQuad }
          );
        }, 200);
      }
    });

    // Board-wide celebration effects
    this.createScreenFlash("#FFD700", 400);
    this.createFireworksEffect(8);
  }

  // Helper methods for multiplier system
  private getMultiplierTier(value: number): string {
    if (value >= 100) return "legendary";
    if (value >= 50) return "mega";
    if (value >= 10) return "big";
    if (value >= 5) return "good";
    return "normal";
  }

  private getMultiplierTierColor(value: number, tier: string): { r: number; g: number; b: number } {
    if (value >= 100) return { r: 1.0, g: 0.8, b: 0.0 }; // Legendary gold
    if (value >= 50) return { r: 1.0, g: 0.2, b: 0.2 }; // Mega red
    if (value >= 10) return { r: 0.2, g: 0.8, b: 1.0 }; // Big blue
    if (value >= 5) return { r: 0.6, g: 1.0, b: 0.6 }; // Good green
    return { r: 1.0, g: 1.0, b: 0.4 }; // Standard yellow
  }

  private getMultiplierFlashColor(value: number): string {
    if (value >= 100) return "#FFD700"; // Gold
    if (value >= 50) return "#FF3333"; // Red
    if (value >= 10) return "#3399FF"; // Blue
    if (value >= 5) return "#33FF33"; // Green
    return "#FFFF66"; // Yellow
  }

  private updateMultiplierDisplay(sprite: any, value: number): void {
    // Update the visual text/number display (implementation depends on rendering system)
    sprite.displayValue = value;
  }

  private createMultiplierCompleteEffect(position: { x: number; y: number }, value: number): void {
    // Completion effect with sparkles
    this.createSparkles(position, Math.min(value * 2, 30));

    // Small screen flash
    this.createScreenFlash("#FFFFFF", 100);
  }

  private addPersistentMultiplierGlow(spriteId: string, value: number): void {
    const glowColor = this.getMultiplierGlowColor(value);
    const intensity = Math.min(value / 10, 1.5);
    this.addPulsingGlow(spriteId, glowColor, intensity);
  }

  // Additional effect methods
  private createGoldenLightRay(center: { x: number; y: number }, angle: number): void {
    // Create golden light ray effect
    const rayLength = 200;
    const endX = center.x + Math.cos(angle) * rayLength;
    const endY = center.y + Math.sin(angle) * rayLength;

    // Light ray implementation (visual effect)
    this.createExplosionEffect(endX, endY, 0.5);
  }

  private createRainbowAura(center: { x: number; y: number }, radius: number): void {
    // Rainbow aura effect around position
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"];

    colors.forEach((color, i) => {
      setTimeout(() => {
        this.createScreenFlash(color, 100);
      }, i * 100);
    });
  }

  private createEnergyWave(center: { x: number; y: number }, radius: number): void {
    // Expanding energy wave effect
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = center.x + Math.cos(angle) * radius;
      const y = center.y + Math.sin(angle) * radius;
      this.createExplosionEffect(x, y, 0.3);
    }
  }

  private createEnergyRipples(center: { x: number; y: number }, count: number): void {
    // Multiple expanding energy ripples
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.createEnergyWave(center, (i + 1) * 40);
      }, i * 150);
    }
  }

  private createGlowingRing(
    center: { x: number; y: number },
    radius: number,
    duration: number
  ): void {
    // Glowing ring effect that fades over time
    this.createEnergyWave(center, radius);

    // Additional rings for thickness
    setTimeout(() => {
      this.createEnergyWave(center, radius - 10);
      this.createEnergyWave(center, radius + 10);
    }, 50);
  }

  private createSparkles(center: { x: number; y: number }, count: number): void {
    // Sparkle particle effect
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 60;
        const x = center.x + Math.cos(angle) * distance;
        const y = center.y + Math.sin(angle) * distance;
        this.createExplosionEffect(x, y, 0.2);
      }, Math.random() * 300);
    }
  }

  private createMasterBallSprite(position: { x: number; y: number }): any {
    const ballId = `master_ball_${Date.now()}`;
    const sprite = {
      id: ballId,
      position: { x: position.x, y: position.y },
      scale: { x: 1.5, y: 1.5 },
      rotation: 0,
      alpha: 1,
      tint: { r: 0.5, g: 0.0, b: 1.0 }, // Purple Master Ball color
      anchor: { x: 0.5, y: 0.5 },
      texture: {} as WebGLTexture,
      visible: true,
      zIndex: 200,
    };

    this.sprites.set(ballId, sprite);
    return sprite;
  }

  private createLightBeam(start: { x: number; y: number }, end: { x: number; y: number }): void {
    // Light beam effect between two points
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      setTimeout(() => {
        this.createExplosionEffect(x, y, 0.4);
      }, i * 30);
    }
  }

  private createGoldenMultiplierOrb(
    start: { x: number; y: number },
    end: { x: number; y: number },
    multiplier: number
  ): void {
    // Golden orb that travels and leaves particle trail
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;

      setTimeout(() => {
        this.createExplosionEffect(x, y, 0.3);
      }, i * 20);
    }

    // Final explosion at destination
    setTimeout(
      () => {
        this.createExplosionEffect(end.x, end.y, 1.0);
      },
      steps * 20 + 100
    );
  }

  private createMultiplierEntranceParticles(
    position: { x: number; y: number },
    value: number
  ): void {
    // Particle burst for multiplier entrance
    const particleCount = Math.min(value * 3, 50);

    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 80;
        const x = position.x + Math.cos(angle) * distance;
        const y = position.y + Math.sin(angle) * distance;
        this.createExplosionEffect(x, y, 0.4);
      }, Math.random() * 200);
    }
  }

  private addTierSpecificRevealEffects(sprite: any, tier: string, value: number): void {
    // Add tier-specific visual effects during reveal
    switch (tier) {
      case "legendary":
        this.createScreenFlash("#FFD700", 200);
        break;
      case "mega":
        this.createScreenFlash("#FF0080", 150);
        break;
      case "big":
        this.createScreenFlash("#00FFFF", 100);
        break;
      default:
        this.createScreenFlash("#FFFF00", 75);
    }

    // Pulsing effect based on value
    const pulseIntensity = Math.min(value / 5, 2.0);
    this.addPulsingGlow(sprite.id, this.getMultiplierGlowColor(value), pulseIntensity);
  }

  /**
   * POKEMON TYPE-SPECIFIC EFFECTS - Unique to our game, surpassing casino standards
   */
  private createTypeSpecificParticleBurst(spriteId: string, pokemonType: string): void {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return;

    const effects = {
      fire: () => this.createUltimateFireExplosion(sprite),
      water: () => this.createUltimateWaterSplash(sprite),
      electric: () => this.createUltimateLightningBolt(sprite),
      grass: () => this.createUltimateLeafStorm(sprite),
      psychic: () => this.createUltimatePsychicWaves(sprite),
      dragon: () => this.createUltimateDragonBreath(sprite),
      ice: () => this.createUltimateIceShatter(sprite),
      fighting: () => this.createUltimatePunchImpact(sprite),
      poison: () => this.createUltimateToxicBubbles(sprite),
      ground: () => this.createUltimateEarthquake(sprite),
      flying: () => this.createUltimateWindGust(sprite),
      bug: () => this.createUltimateSwarmEffect(sprite),
      rock: () => this.createUltimateRockSlide(sprite),
      ghost: () => this.createUltimateSpiritAura(sprite),
      steel: () => this.createUltimateMetalSpark(sprite),
      dark: () => this.createUltimateShadowBurst(sprite),
      fairy: () => this.createUltimateSparkleStorm(sprite),
      normal: () => this.createUltimateStarBurst(sprite),
    };

    const effect = effects[pokemonType as keyof typeof effects] || effects.normal;
    effect();

    this.createScreenShake(3.0, 200); // Adjust parameters
  }

  // Additional Pokemon type effects surpassing casino standards
  private createUltimateIceShatter(sprite: Sprite): void {
    // Crystal shatter effect with icicle fragments
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 1.8);

    // Radiating ice shards
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50;
      const x = sprite.position.x + Math.cos(angle) * distance;
      const y = sprite.position.y + Math.sin(angle) * distance;

      setTimeout(() => {
        this.createExplosionEffect(x, y, 0.7);
      }, i * 25);
    }

    this.createScreenFlash("#87CEEB", 160);
  }

  private createUltimatePunchImpact(sprite: Sprite): void {
    // Dynamic impact with force lines
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.2);

    // Shockwave rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const radius = (i + 1) * 30;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const x = sprite.position.x + Math.cos(angle) * radius;
          const y = sprite.position.y + Math.sin(angle) * radius;
          this.createExplosionEffect(x, y, 0.4);
        }
      }, i * 50);
    }

    this.createScreenFlash("#FF4500", 120);
  }

  private createUltimateToxicBubbles(sprite: Sprite): void {
    // Poisonous bubble cascade
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50;
        const x = sprite.position.x + Math.cos(angle) * distance;
        const y = sprite.position.y + Math.sin(angle) * distance;
        this.createExplosionEffect(x, y, 0.5);
      }, i * 40);
    }

    this.createScreenFlash("#9400D3", 200);
  }

  private createUltimateEarthquake(sprite: Sprite): void {
    // Ground fracture pattern
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const x = sprite.position.x + (Math.random() - 0.5) * 100;
        const y = sprite.position.y + i * 15;
        this.createExplosionEffect(x, y, 1.0);
      }, i * 60);
    }

    this.createScreenFlash("#8B4513", 180);
  }

  private createUltimateWindGust(sprite: Sprite): void {
    // Spiraling wind currents
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const angle = (i * Math.PI) / 6;
        const radius = 20 + i * 3;
        const x = sprite.position.x + Math.cos(angle) * radius;
        const y = sprite.position.y + Math.sin(angle) * radius;
        this.createExplosionEffect(x, y, 0.6);
      }, i * 30);
    }

    this.createScreenFlash("#87CEEB", 150);
  }

  private createUltimateSwarmEffect(sprite: Sprite): void {
    // Bug swarm with chaotic movement
    for (let i = 0; i < 25; i++) {
      setTimeout(() => {
        const x = sprite.position.x + (Math.random() - 0.5) * 80;
        const y = sprite.position.y + (Math.random() - 0.5) * 80;
        this.createExplosionEffect(x, y, 0.3);
      }, Math.random() * 200);
    }

    this.createScreenFlash("#228B22", 170);
  }

  private createUltimateRockSlide(sprite: Sprite): void {
    // Cascading rock fragments
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const x = sprite.position.x + (Math.random() - 0.5) * 60;
        const y = sprite.position.y - i * 8;
        this.createExplosionEffect(x, y, 0.8);
      }, i * 50);
    }

    this.createScreenFlash("#696969", 160);
  }

  private createUltimateSpiritAura(sprite: Sprite): void {
    // Ethereal ghost wisps
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const angle = (Math.PI * 2 * i) / 10;
        const radius = 35 + Math.sin(Date.now() * 0.01 + i) * 10;
        const x = sprite.position.x + Math.cos(angle) * radius;
        const y = sprite.position.y + Math.sin(angle) * radius;
        this.createExplosionEffect(x, y, 0.4);
      }, i * 50);
    }

    this.createScreenFlash("#9370DB", 200);
  }

  private createUltimateMetalSpark(sprite: Sprite): void {
    // Metallic sparks with shine
    for (let i = 0; i < 16; i++) {
      setTimeout(() => {
        const angle = (Math.PI * 2 * i) / 16;
        const distance = 40;
        const x = sprite.position.x + Math.cos(angle) * distance;
        const y = sprite.position.y + Math.sin(angle) * distance;
        this.createExplosionEffect(x, y, 0.5);
      }, i * 20);
    }

    this.createScreenFlash("#C0C0C0", 140);
  }

  private createUltimateShadowBurst(sprite: Sprite): void {
    // Dark energy explosion
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.5);

    // Spreading darkness
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const radius = (i + 1) * 20;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 3) {
          const x = sprite.position.x + Math.cos(angle) * radius;
          const y = sprite.position.y + Math.sin(angle) * radius;
          this.createExplosionEffect(x, y, 0.6);
        }
      }, i * 80);
    }

    this.createScreenFlash("#2F2F2F", 180);
  }

  private createUltimateSparkleStorm(sprite: Sprite): void {
    // Magical fairy sparkles
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 60;
        const x = sprite.position.x + Math.cos(angle) * distance;
        const y = sprite.position.y + Math.sin(angle) * distance;
        this.createExplosionEffect(x, y, 0.4);
      }, Math.random() * 150);
    }

    this.createScreenFlash("#FFB6C1", 180);
  }

  private createUltimateStarBurst(sprite: Sprite): void {
    // Classic star explosion
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const distance = 45;
      const x = sprite.position.x + Math.cos(angle) * distance;
      const y = sprite.position.y + Math.sin(angle) * distance;

      setTimeout(() => {
        this.createExplosionEffect(x, y, 0.7);
      }, i * 30);
    }

    this.createScreenFlash("#FFD700", 150);
  }

  private createUltimateFireExplosion(sprite: Sprite): void {
    // Multi-layered fire explosion surpassing casino quality
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.0);

    // Ring of fire particles
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const x = sprite.position.x + Math.cos(angle) * 40;
      const y = sprite.position.y + Math.sin(angle) * 40;
      this.createExplosionEffect(x, y, 0.8);
    }

    // Heat distortion effect
    this.createScreenFlash("#FF4500", 150);
  }

  private createUltimateWaterSplash(sprite: Sprite): void {
    // Dynamic water physics simulation
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 1.5);

    // Cascade effect with multiple splash points
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        this.createExplosionEffect(sprite.position.x + offsetX, sprite.position.y + offsetY, 0.6);
      }, i * 50);
    }

    this.createScreenFlash("#0077BE", 120);
  }

  private createUltimateLightningBolt(sprite: Sprite): void {
    // Branching lightning effect
    this.createExplosionEffect(sprite.position.x, sprite.position.y, 2.5);

    // Electric arcs
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4;
      const endX = sprite.position.x + Math.cos(angle) * 80;
      const endY = sprite.position.y + Math.sin(angle) * 80;

      // Create lightning path
      for (let j = 0; j < 5; j++) {
        const t = j / 4;
        const x = sprite.position.x + (endX - sprite.position.x) * t;
        const y = sprite.position.y + (endY - sprite.position.y) * t;
        this.createExplosionEffect(x, y, 0.4);
      }
    }

    this.createScreenFlash("#FFFF00", 100);
  }

  private createUltimateLeafStorm(sprite: Sprite): void {
    // Swirling leaf tornado effect
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const angle = (Date.now() * 0.005 + i * 0.3) % (Math.PI * 2);
        const radius = 30 + i * 2;
        const x = sprite.position.x + Math.cos(angle) * radius;
        const y = sprite.position.y + Math.sin(angle) * radius;
        this.createExplosionEffect(x, y, 0.3);
      }, i * 25);
    }

    this.createScreenFlash("#228B22", 180);
  }

  private createUltimatePsychicWaves(sprite: Sprite): void {
    // Expanding psychic ripples
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const radius = (i + 1) * 25;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
          const x = sprite.position.x + Math.cos(angle) * radius;
          const y = sprite.position.y + Math.sin(angle) * radius;
          this.createExplosionEffect(x, y, 0.5);
        }
      }, i * 100);
    }

    this.createScreenFlash("#FF1493", 200);
  }

  private createUltimateDragonBreath(sprite: Sprite): void {
    // Intense dragon fire cone
    const angle = Math.random() * Math.PI * 2;
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const distance = i * 8;
        const spread = i * 3;

        for (let j = -1; j <= 1; j++) {
          const currentAngle = angle + (j * spread * Math.PI) / 180;
          const x = sprite.position.x + Math.cos(currentAngle) * distance;
          const y = sprite.position.y + Math.sin(currentAngle) * distance;
          this.createExplosionEffect(x, y, 1.0);
        }
      }, i * 30);
    }

    this.createScreenFlash("#8B0000", 250);
  }

  // Support methods for ultimate animations
  private easeInQuart(t: number): number {
    return t * t * t * t;
  }
  private easeOutQuart(t: number): number {
    return 1 - --t * t * t * t;
  }
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  private playSound(soundId: string): void {
    console.log(`Playing: ${soundId}`);
  }
  private updateReelSpeeds(speed: number): void {
    /* WebGL implementation */
  }
  private createMotionBlur(intensity: number): void {
    /* WebGL effect */
  }
  private createSpinningParticleTrails(): void {
    /* Particle system */
  }
  private createColumnStopEffect(column: number): void {
    /* Visual effect */
  }
  private createScreenShake(intensity: number, duration: number): void {
    /* Screen effect */
  }
  private createScreenEffect(type: string, intensity: number, duration: number): void {
    /* Screen effect */
  }
  private createScreenFlash(color: string, duration: number): string {
    const flashId = this.generateAnimationId();
    // Create full-screen flash effect
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: ${color}; opacity: 0.8; z-index: 9999;
      pointer-events: none; transition: opacity ${duration}ms ease-out;
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => document.body.removeChild(overlay), duration);
    }, 50);

    return flashId;
  }
  private createFireworksExplosion(count: number): void {
    /* Fireworks */
  }
  private createConfettiRain(count: number): void {
    /* Confetti */
  }
  private updateWinDisplay(amount: number, progress: number): void {
    /* UI update */
  }
  private getWinCelebrationLevel(win: number): string {
    if (win > 100) return "mega";
    if (win > 50) return "big";
    if (win > 10) return "good";
    return "standard";
  }
  private playStandardWinCelebration(): Promise<void> {
    return this.sleep(500);
  }
  private playGoodWinCelebration(): Promise<void> {
    return this.sleep(1000);
  }

  // Advanced cascade animation with physics
  public animateCascade(grid: Sprite[][], removedPositions: Array<[number, number]>): string {
    const timelineId = this.generateAnimationId();

    // Phase 1: Mark winning symbols with glow effect
    removedPositions.forEach(([row, col]) => {
      const sprite = grid[row][col];
      if (sprite) {
        this.addGlowEffect(sprite.id, 500);
      }
    });

    // Phase 2: Explosive removal with particles
    setTimeout(() => {
      removedPositions.forEach(([row, col]) => {
        const sprite = grid[row][col];
        if (sprite) {
          this.createExplosionEffect(sprite.position.x, sprite.position.y);
          this.animatePokemonDisappear(sprite.id, true);
        }
      });
    }, 500);

    // Phase 3: Gravity simulation for falling symbols
    setTimeout(() => {
      this.simulateGravityFall(grid);
    }, 800);

    // Phase 4: New symbols appearing from top
    setTimeout(() => {
      this.animateNewSymbolsAppear(grid);
    }, 1200);

    return timelineId;
  }

  // Multiplier effects with dynamic visuals
  public animateMultiplierIncrease(
    position: { x: number; y: number },
    oldValue: number,
    newValue: number
  ): string {
    const tier = this.getMultiplierTier(newValue);
    const multiplierSprite = this.createMultiplierSprite(position, newValue, tier);

    // Pulsing animation based on multiplier tier
    const pulseIntensity = Math.min(newValue / 2, 3.0);
    const glowColor = this.getMultiplierGlowColor(newValue);

    return this.timeline
      .add(() =>
        this.animateSprite(
          multiplierSprite.id,
          { scale: { x: 1.5, y: 1.5 } },
          { duration: 200, easing: Easing.easeOutQuad }
        )
      )
      .add(() => this.addPulsingGlow(multiplierSprite.id, glowColor, pulseIntensity))
      .add(() =>
        this.animateSprite(
          multiplierSprite.id,
          { scale: { x: 1, y: 1 } },
          { duration: 300, easing: Easing.easeOutBounce }
        )
      )
      .execute();
  }

  // Master Ball effect with cinematic flair
  public animateMasterBallEffect(multiplier: number): string {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    return this.timeline
      .add(() => this.createScreenFlash("#FFD700", 200)) // Gold flash
      .add(() => this.createRadialShockwave(centerX, centerY, 800))
      .add(() => this.createMasterBallParticles(centerX, centerY, multiplier))
      .add(() => this.animateAllMultipliersGlow(multiplier))
      .add(() => this.createFloatingText(`${multiplier}x MASTER BALL!`, centerX, centerY))
      .execute();
  }

  /**
   * ULTIMATE BONUS MODE ENTRANCE SYSTEM - Cinematic Quality Transitions
   * Surpassing casino game standards with Pokemon-themed bonus modes
   */
  public async animateBonusModeEntrance(
    bonusType: "frenzy" | "hunt" | "epic" | "legendary" | "master"
  ): Promise<string> {
    const timelineId = this.generateAnimationId();

    // Phase 1: Screen preparation and anticipation
    await this.prepareBonusModeScreen();

    // Phase 2: Dramatic mode-specific entrance
    await this.performBonusModeSpecificEntrance(bonusType);

    // Phase 3: Logo and title sequence
    await this.displayBonusModeTitle(bonusType);

    // Phase 4: Game board transformation
    await this.transformGameBoardForBonus(bonusType);

    // Phase 5: Environmental effects setup
    await this.setupBonusModeEnvironment(bonusType);

    // Phase 6: Final transition to gameplay
    await this.transitionToBonusGameplay(bonusType);

    return timelineId;
  }

  private async prepareBonusModeScreen(): Promise<void> {
    // Full screen fade to black with anticipation
    this.createScreenFlash("#000000", 800);
    await this.sleep(400);

    // Subtle screen shake building tension
    this.createScreenShake(0.5, 300);
    await this.sleep(300);

    // All symbols fade out dramatically
    this.sprites.forEach((sprite, id) => {
      if (!id.includes("ui") && !id.includes("background")) {
        this.animateSprite(
          id,
          { alpha: 0, scale: { x: 0.8, y: 0.8 } },
          { duration: 400, easing: Easing.easeInQuart }
        );
      }
    });

    await this.sleep(500);
  }

  private async performBonusModeSpecificEntrance(bonusType: string): Promise<void> {
    const config = this.getEnhancedBonusModeConfig(bonusType);

    switch (bonusType) {
      case "frenzy":
        await this.performFrenzyModeEntrance(config);
        break;
      case "hunt":
        await this.performHuntModeEntrance(config);
        break;
      case "epic":
        await this.performEpicModeEntrance(config);
        break;
      case "legendary":
        await this.performLegendaryModeEntrance(config);
        break;
      case "master":
        await this.performMasterModeEntrance(config);
        break;
    }
  }

  private async performFrenzyModeEntrance(config: any): Promise<void> {
    // Fire-themed frenzy mode entrance
    this.createScreenFlash("#FF4500", 300);
    await this.sleep(200);

    // Explosive particle bursts from multiple points
    const burstPoints = [
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.7 },
    ];

    for (let i = 0; i < burstPoints.length; i++) {
      setTimeout(() => {
        this.createExplosionEffect(burstPoints[i].x, burstPoints[i].y, 2.5);
        this.createScreenShake(1.5, 200);
      }, i * 150);
    }

    await this.sleep(500);

    // Fire tornado effect
    await this.createFireTornadoEffect();
  }

  private async performHuntModeEntrance(config: any): Promise<void> {
    // Nature-themed hunt mode entrance
    this.createScreenFlash("#228B22", 400);
    await this.sleep(300);

    // Forest ambiance with rustling effects
    await this.createForestRustlingEffect();

    // Mysterious shadow movements
    await this.createShadowMovements();

    // Hunter's focus effect (screen edges darken)
    await this.createHunterFocusEffect();
  }

  private async performEpicModeEntrance(config: any): Promise<void> {
    // Epic cinematic entrance
    this.createScreenFlash("#FFD700", 500);
    await this.sleep(300);

    // Lightning strikes from the sky
    await this.createLightningStrikesSequence();

    // Epic music crescendo timing
    this.createScreenShake(2.0, 600);

    // Golden light pillars
    await this.createGoldenLightPillars();
  }

  private async performLegendaryModeEntrance(config: any): Promise<void> {
    // Ultimate legendary entrance
    this.createScreenFlash("#FFFFFF", 300);
    await this.sleep(200);

    // Multiple screen flashes building intensity
    const flashColors = [
      "#FF0000",
      "#FF7F00",
      "#FFFF00",
      "#00FF00",
      "#0000FF",
      "#4B0082",
      "#9400D3",
    ];
    for (let i = 0; i < flashColors.length; i++) {
      this.createScreenFlash(flashColors[i], 150);
      await this.sleep(100);
    }

    // Legendary aura expansion
    await this.createLegendaryAuraExpansion();

    // Reality distortion effects
    await this.createRealityDistortionEffects();
  }

  private async performMasterModeEntrance(config: any): Promise<void> {
    // Master Ball themed entrance
    this.createScreenFlash("#8A2BE2", 400);
    await this.sleep(300);

    // Master Ball energy swirling
    await this.createMasterBallEnergySwirl();

    // Dimensional portal effect
    await this.createDimensionalPortalEffect();

    // All Pokemon sprites appear briefly as silhouettes
    await this.showPokemonSilhouettes();
  }

  private async displayBonusModeTitle(bonusType: string): Promise<void> {
    // Dramatic title appearance
    const titleConfig = this.getBonusModeTitleConfig(bonusType);

    // Title slides in from the top with particle trail
    await this.animateTitleSlideIn(titleConfig);

    // Title glow and pulsing effect
    await this.addTitleGlowEffect(titleConfig);

    // Subtitle appears with typewriter effect
    await this.animateSubtitleTypewriter(titleConfig);

    // Hold for dramatic effect
    await this.sleep(1500);

    // Title fades out smoothly
    await this.animateTitleFadeOut(titleConfig);
  }

  private async transformGameBoardForBonus(bonusType: string): Promise<void> {
    const transformConfig = this.getBoardTransformConfig(bonusType);

    // Board transformation effects
    switch (transformConfig.type) {
      case "energize":
        await this.energizeGameBoard();
        break;
      case "mystify":
        await this.mystifyGameBoard();
        break;
      case "crystallize":
        await this.crystallizeGameBoard();
        break;
      case "dimensionalize":
        await this.dimensionalizeGameBoard();
        break;
    }

    // New symbols appear with bonus mode aesthetics
    await this.introduceBonusSymbols(bonusType);
  }

  private async setupBonusModeEnvironment(bonusType: string): Promise<void> {
    const envConfig = this.getEnvironmentConfig(bonusType);

    // Background transformation
    await this.transformBackground(envConfig.background);

    // Ambient particle systems
    this.setupAmbientParticles(envConfig.particles);

    // Lighting changes
    this.adjustLighting(envConfig.lighting);

    // Sound environment setup
    // this.setupAmbientSounds(envConfig.sounds);
  }

  private async transitionToBonusGameplay(bonusType: string): Promise<void> {
    // Smooth transition to active gameplay
    this.createScreenFlash("#FFFFFF", 200);
    await this.sleep(150);

    // All elements fade in to final positions
    this.sprites.forEach((sprite, id) => {
      this.animateSprite(
        id,
        { alpha: 1, scale: { x: 1, y: 1 } },
        { duration: 500, easing: Easing.easeOutQuart }
      );
    });

    await this.sleep(600);

    // Ready indicator
    await this.showBonusModeReadyIndicator(bonusType);
  }

  // Enhanced configuration methods
  private getEnhancedBonusModeConfig(bonusType: string) {
    const configs: Record<string, any> = {
      frenzy: {
        primaryColor: "#FF4500",
        secondaryColor: "#FF6B6B",
        intensity: "high",
        theme: "fire",
        duration: 3000,
      },
      hunt: {
        primaryColor: "#228B22",
        secondaryColor: "#8B4513",
        intensity: "medium",
        theme: "nature",
        duration: 3500,
      },
      epic: {
        primaryColor: "#FFD700",
        secondaryColor: "#FFA500",
        intensity: "very_high",
        theme: "divine",
        duration: 4000,
      },
      legendary: {
        primaryColor: "#9400D3",
        secondaryColor: "#FF1493",
        intensity: "maximum",
        theme: "legendary",
        duration: 5000,
      },
      master: {
        primaryColor: "#8A2BE2",
        secondaryColor: "#4B0082",
        intensity: "ultimate",
        theme: "master",
        duration: 6000,
      },
    };

    return configs[bonusType] || configs["frenzy"];
  }

  // Specialized effect implementations
  private async createFireTornadoEffect(): Promise<void> {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const angle = (i * Math.PI) / 10;
        const radius = 50 + i * 8;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        this.createExplosionEffect(x, y, 1.0);
      }, i * 50);
    }

    await this.sleep(1000);
  }

  private async createForestRustlingEffect(): Promise<void> {
    // Gentle rustling particles across screen
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight * 0.3; // Top portion
        this.createExplosionEffect(x, y, 0.5);
      }, Math.random() * 800);
    }

    await this.sleep(1000);
  }

  private async createShadowMovements(): Promise<void> {
    // Quick shadow darting effects
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const startX = Math.random() * window.innerWidth;
        const endX = Math.random() * window.innerWidth;
        const y = window.innerHeight * (0.3 + Math.random() * 0.4);

        // Create shadow trail
        const steps = 10;
        for (let j = 0; j < steps; j++) {
          setTimeout(() => {
            const t = j / steps;
            const x = startX + (endX - startX) * t;
            this.createExplosionEffect(x, y, 0.3);
          }, j * 30);
        }
      }, i * 300);
    }

    await this.sleep(1200);
  }

  private async createHunterFocusEffect(): Promise<void> {
    // Screen edges darken to simulate focus/concentration
    this.createScreenFlash("#000000", 600);
    await this.sleep(300);

    // Center spotlight effect
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let radius = 200; radius > 50; radius -= 20) {
      setTimeout(
        () => {
          this.createEnergyWave({ x: centerX, y: centerY }, radius);
        },
        (200 - radius) * 5
      );
    }

    await this.sleep(800);
  }

  private async createLightningStrikesSequence(): Promise<void> {
    const strikePoints = [
      { x: window.innerWidth * 0.2, y: 0 },
      { x: window.innerWidth * 0.5, y: 0 },
      { x: window.innerWidth * 0.8, y: 0 },
    ];

    for (let i = 0; i < strikePoints.length; i++) {
      setTimeout(() => {
        // Lightning strike from top to bottom
        const startPoint = strikePoints[i];
        const endPoint = { x: startPoint.x + (Math.random() - 0.5) * 100, y: window.innerHeight };

        this.createLightningStrike(startPoint, endPoint);
        this.createScreenFlash("#FFFFFF", 100);
        this.createScreenShake(1.2, 150);
      }, i * 200);
    }

    await this.sleep(800);
  }

  private async createGoldenLightPillars(): Promise<void> {
    const pillarPositions = [
      window.innerWidth * 0.25,
      window.innerWidth * 0.5,
      window.innerWidth * 0.75,
    ];

    for (let i = 0; i < pillarPositions.length; i++) {
      setTimeout(() => {
        this.createLightPillar(pillarPositions[i], window.innerHeight);
      }, i * 150);
    }

    await this.sleep(1000);
  }

  private async createLegendaryAuraExpansion(): Promise<void> {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Expanding aura rings
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.createEnergyWave({ x: centerX, y: centerY }, (i + 1) * 80);
        this.createScreenFlash("#FFD700", 150);
      }, i * 200);
    }

    await this.sleep(1800);
  }

  private async createRealityDistortionEffects(): Promise<void> {
    // Reality bending visual effects
    this.createScreenShake(1.8, 1000);

    // Color distortion flashes
    const distortionColors = ["#FF0080", "#00FF80", "#8000FF", "#FF8000"];
    for (let i = 0; i < distortionColors.length; i++) {
      setTimeout(() => {
        this.createScreenFlash(distortionColors[i], 200);
      }, i * 100);
    }

    await this.sleep(1200);
  }

  private async createMasterBallEnergySwirl(): Promise<void> {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Spiral energy pattern
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const angle = (i * Math.PI) / 5;
        const radius = 40 + i * 3;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        this.createExplosionEffect(x, y, 0.8);
      }, i * 40);
    }

    await this.sleep(1200);
  }

  private async createDimensionalPortalEffect(): Promise<void> {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Portal opening effect
    for (let radius = 300; radius > 20; radius -= 15) {
      setTimeout(
        () => {
          this.createEnergyWave({ x: centerX, y: centerY }, radius);
        },
        (300 - radius) * 3
      );
    }

    this.createScreenFlash("#8A2BE2", 400);
    await this.sleep(1000);
  }

  private async showPokemonSilhouettes(): Promise<void> {
    // Show iconic Pokemon silhouettes briefly
    const pokemonPositions = [
      { x: window.innerWidth * 0.2, y: window.innerHeight * 0.5 },
      { x: window.innerWidth * 0.4, y: window.innerHeight * 0.3 },
      { x: window.innerWidth * 0.6, y: window.innerHeight * 0.7 },
      { x: window.innerWidth * 0.8, y: window.innerHeight * 0.4 },
    ];

    for (let i = 0; i < pokemonPositions.length; i++) {
      setTimeout(() => {
        this.createExplosionEffect(pokemonPositions[i].x, pokemonPositions[i].y, 1.2);
        this.createScreenFlash("#FFFFFF", 100);
      }, i * 100);
    }

    await this.sleep(800);
  }

  // Title and UI animation methods
  private async animateTitleSlideIn(config: any): Promise<void> {
    // Title animation implementation
    this.createScreenFlash(config.primaryColor, 200);
    await this.sleep(300);
  }

  private async addTitleGlowEffect(config: any): Promise<void> {
    // Title glow effect
    await this.sleep(500);
  }

  private async animateSubtitleTypewriter(config: any): Promise<void> {
    // Typewriter effect for subtitle
    await this.sleep(800);
  }

  private async animateTitleFadeOut(config: any): Promise<void> {
    // Title fade out
    this.createScreenFlash("#000000", 300);
    await this.sleep(400);
  }

  // Board transformation methods
  private async energizeGameBoard(): Promise<void> {
    // Electric energy throughout board
    this.sprites.forEach((sprite, id) => {
      if (!id.includes("ui")) {
        this.addPulsingGlow(id, [0.0, 1.0, 1.0], 1.5);
      }
    });
    await this.sleep(600);
  }

  private async mystifyGameBoard(): Promise<void> {
    // Mystical transformation
    this.createScreenFlash("#9400D3", 300);
    await this.sleep(400);
  }

  private async crystallizeGameBoard(): Promise<void> {
    // Crystal transformation
    this.createScreenFlash("#87CEEB", 350);
    await this.sleep(450);
  }

  private async dimensionalizeGameBoard(): Promise<void> {
    // Dimensional shift effect
    this.createScreenShake(1.5, 500);
    await this.sleep(600);
  }

  private async introduceBonusSymbols(bonusType: string): Promise<void> {
    // Introduce new symbols for bonus mode
    await this.sleep(400);
  }

  // Environment setup methods
  private async transformBackground(backgroundType: string): Promise<void> {
    // Background transformation
    await this.sleep(300);
  }

  private setupAmbientParticles(particleType: string): void {
    // Setup ambient particle effects
  }

  private adjustLighting(lightingType: string): void {
    // Adjust scene lighting
  }

  private async showBonusModeReadyIndicator(bonusType: string): Promise<void> {
    // Show ready indicator
    this.createScreenFlash("#00FF00", 150);
    await this.sleep(200);
  }

  // Configuration helper methods
  private getBonusModeTitleConfig(bonusType: string) {
    return {
      text: bonusType.toUpperCase() + " MODE",
      primaryColor: this.getEnhancedBonusModeConfig(bonusType).primaryColor,
      secondaryColor: this.getEnhancedBonusModeConfig(bonusType).secondaryColor,
    };
  }

  private getBoardTransformConfig(bonusType: string) {
    const transforms: Record<string, any> = {
      frenzy: { type: "energize" },
      hunt: { type: "mystify" },
      epic: { type: "crystallize" },
      legendary: { type: "dimensionalize" },
      master: { type: "dimensionalize" },
    };

    return transforms[bonusType] || transforms["frenzy"];
  }

  private getEnvironmentConfig(bonusType: string) {
    const environments: Record<string, any> = {
      frenzy: { background: "volcanic", particles: "fire", lighting: "warm", sounds: "intense" },
      hunt: {
        background: "forest",
        particles: "leaves",
        lighting: "mysterious",
        sounds: "ambient",
      },
      epic: { background: "divine", particles: "golden", lighting: "divine", sounds: "epic" },
      legendary: {
        background: "cosmic",
        particles: "stars",
        lighting: "ethereal",
        sounds: "legendary",
      },
      master: {
        background: "dimensional",
        particles: "energy",
        lighting: "otherworldly",
        sounds: "master",
      },
    };

    return environments[bonusType] || environments["frenzy"];
  }

  // Utility effect methods for bonus modes
  private createLightningStrike(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): void {
    const steps = 15;
    for (let i = 0; i <= steps; i++) {
      setTimeout(() => {
        const t = i / steps;
        const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 30; // Random zigzag
        const y = start.y + (end.y - start.y) * t;
        this.createExplosionEffect(x, y, 0.6);
      }, i * 20);
    }
  }

  private createLightPillar(x: number, height: number): void {
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        const y = height - (i * height) / steps;
        this.createExplosionEffect(x, y, 0.8);
      }, i * 30);
    }
  }

  // Particle system integration
  public createExplosionEffect(x: number, y: number, intensity: number = 1.0): string {
    const emitterId = this.generateAnimationId();

    const emitter: ParticleEmitter = {
      position: { x, y },
      velocity: { x: 0, y: 0, variance: 200 * intensity },
      acceleration: { x: 0, y: 300 }, // Gravity
      lifetime: { min: 0.5, max: 1.5 },
      size: { start: 10 * intensity, end: 2 },
      color: {
        start: [1.0, 0.8, 0.2, 1.0], // Bright yellow
        end: [1.0, 0.2, 0.0, 0.0], // Fade to red
      },
      emissionRate: 100,
      maxParticles: 200,
      blendMode: "add",
    };

    this.particleEmitters.set(emitterId, emitter);

    // Auto-cleanup after 2 seconds
    setTimeout(() => {
      this.particleEmitters.delete(emitterId);
    }, 2000);

    return emitterId;
  }

  public createPokemonSparkles(spriteId: string, pokemonType: string): string {
    const sprite = this.sprites.get(spriteId);
    if (!sprite) return "";

    const sparkleColor = this.getPokemonSparkleColor(pokemonType);

    return this.createExplosionEffect(sprite.position.x, sprite.position.y, 0.5);
  }

  // Advanced timing and sequencing
  public createAnimationSequence(animations: Array<() => string>): string {
    return this.timeline.sequence(animations).execute();
  }

  public createParallelAnimations(animations: Array<() => string>): string {
    return this.timeline.parallel(animations).execute();
  }

  // Performance monitoring and optimization
  public update(timestamp: number) {
    this.deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update all active animations
    this.updateAnimations(this.deltaTime);
    this.updateParticleEmitters(this.deltaTime);
    this.timeline.update(this.deltaTime);

    // Cleanup completed animations
    this.cleanupCompletedAnimations();
  }

  private updateAnimations(deltaTime: number) {
    this.animations.forEach((animation, id) => {
      animation.update(deltaTime);

      if (animation.isComplete()) {
        this.animations.delete(id);
        this.returnAnimationToPool(animation);
      }
    });
  }

  private updateParticleEmitters(deltaTime: number) {
    this.particleEmitters.forEach((emitter, id) => {
      // Update particle physics and lifetime
      this.updateParticleSystem(emitter, deltaTime);
    });
  }

  // Utility methods
  private generateAnimationId(): string {
    return `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createAnimation(
    target: any,
    properties: any,
    config: AnimationConfig,
    id: string
  ): PokemonAnimation {
    return new PokemonAnimation(target, properties, config, id);
  }

  private getMultiplierGlowColor(value: number): [number, number, number] {
    if (value <= 2) return [0.0, 1.0, 0.0]; // Green
    if (value <= 4) return [0.0, 0.5, 1.0]; // Blue
    if (value <= 8) return [1.0, 0.5, 0.0]; // Orange
    if (value <= 16) return [1.0, 0.0, 0.5]; // Pink
    return [1.0, 1.0, 0.0]; // Gold
  }

  private getPokemonSparkleColor(pokemonType: string): [number, number, number] {
    const colors: Record<string, [number, number, number]> = {
      pikachu: [1.0, 1.0, 0.0], // Yellow
      charmander: [1.0, 0.5, 0.0], // Orange
      squirtle: [0.0, 0.5, 1.0], // Blue
      bulbasaur: [0.0, 1.0, 0.0], // Green
      jigglypuff: [1.0, 0.5, 1.0], // Pink
      eevee: [0.8, 0.6, 0.4], // Brown
      wild: [1.0, 1.0, 1.0], // White
    };

    return colors[pokemonType] || colors["wild"];
  }

  private getBonusModeConfig(bonusType: string) {
    const configs: Record<string, any> = {
      frenzy: {
        backgroundColor: "#FF4500",
        boardEffect: "energize",
        particleEffect: "fire",
      },
      hunt: {
        backgroundColor: "#8B4513",
        boardEffect: "darken",
        particleEffect: "leaves",
      },
      epic: {
        backgroundColor: "#4B0082",
        boardEffect: "cosmic",
        particleEffect: "stars",
      },
    };

    return configs[bonusType] || configs["frenzy"];
  }

  // Effect methods returning animation IDs
  private addGlowEffect(spriteId: string, duration: number): string {
    return this.generateAnimationId();
  }
  private simulateGravityFall(grid: Sprite[][]): string {
    return this.generateAnimationId();
  }
  private animateNewSymbolsAppear(grid: Sprite[][]): string {
    return this.generateAnimationId();
  }
  private addPulsingGlow(spriteId: string, color: any, intensity: number): string {
    return this.generateAnimationId();
  }
  private createRadialShockwave(x: number, y: number, radius: number): string {
    return this.generateAnimationId();
  }
  private createMasterBallParticles(x: number, y: number, multiplier: number): string {
    return this.generateAnimationId();
  }
  private animateAllMultipliersGlow(multiplier: number): string {
    return this.generateAnimationId();
  }
  private createFloatingText(text: string, x: number, y: number): string {
    return this.generateAnimationId();
  }
  private createScreenTransition(color: string, duration: number): string {
    return this.generateAnimationId();
  }
  private createBonusLogo(type: string, config: any): string {
    return this.generateAnimationId();
  }
  private transformGameBoard(effect: string): string {
    return this.generateAnimationId();
  }
  private createAmbientParticles(effect: string): string {
    return this.generateAnimationId();
  }
  private updateParticleSystem(emitter: ParticleEmitter, deltaTime: number): void {}
  private cleanupCompletedAnimations(): void {}
  private returnAnimationToPool(animation: PokemonAnimation): void {}
  private createWinningEffects(spriteId: string): string {
    return this.generateAnimationId();
  }
}

// Supporting classes
class PokemonAnimation {
  private startTime: number = 0;
  private currentTime: number = 0;
  private initialValues: any = {};

  constructor(
    private target: any,
    private properties: any,
    private config: AnimationConfig,
    private id: string
  ) {
    this.captureInitialValues();
  }

  private captureInitialValues() {
    for (const prop in this.properties) {
      this.initialValues[prop] = this.target[prop];
    }
  }

  update(deltaTime: number) {
    this.currentTime += deltaTime;
    const progress = Math.min(this.currentTime / this.config.duration, 1.0);
    const easedProgress = this.config.easing(progress);

    // Interpolate values
    for (const prop in this.properties) {
      const startValue = this.initialValues[prop];
      const endValue = this.properties[prop];
      this.target[prop] = this.interpolate(startValue, endValue, easedProgress);
    }

    if (this.config.onUpdate) {
      this.config.onUpdate(progress, this.target);
    }

    if (progress >= 1.0 && this.config.onComplete) {
      this.config.onComplete();
    }
  }

  private interpolate(start: any, end: any, progress: number): any {
    if (typeof start === "number" && typeof end === "number") {
      return start + (end - start) * progress;
    }

    if (typeof start === "object" && typeof end === "object") {
      const result: any = {};
      for (const key in start) {
        result[key] = this.interpolate(start[key], end[key], progress);
      }
      return result;
    }

    return progress < 1.0 ? start : end;
  }

  isComplete(): boolean {
    return this.currentTime >= this.config.duration;
  }
}

class AnimationTimeline {
  private sequences: Array<() => string> = [];
  private parallelGroups: Array<Array<() => string>> = [];

  add(animation: () => string): AnimationTimeline {
    this.sequences.push(animation);
    return this;
  }

  sequence(animations: Array<() => string>): AnimationTimeline {
    this.sequences.push(...animations);
    return this;
  }

  parallel(animations: Array<() => string>): AnimationTimeline {
    this.parallelGroups.push(animations);
    return this;
  }

  execute(): string {
    const timelineId = `timeline_${Date.now()}`;
    // Execute timeline logic
    return timelineId;
  }

  update(deltaTime: number) {
    // Update timeline progress
  }
}
