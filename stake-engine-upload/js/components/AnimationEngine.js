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
// ERROR CLASSES
// ============================================================================
export class AnimationError extends Error {
    code;
    context;
    constructor(message, code, context) {
        super(message);
        this.code = code;
        this.context = context;
        this.name = 'AnimationError';
    }
}
export class ConfigurationError extends AnimationError {
    constructor(message, context) {
        super(message, 'CONFIG_ERROR', context);
        this.name = 'ConfigurationError';
    }
}
// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================
export class AnimationConfigManager {
    static instance;
    config;
    reelConfig;
    constructor() {
        this.config = this.getDefaultAnimationConfig();
        this.reelConfig = this.getDefaultReelConfig();
    }
    static getInstance() {
        if (!AnimationConfigManager.instance) {
            AnimationConfigManager.instance = new AnimationConfigManager();
        }
        return AnimationConfigManager.instance;
    }
    updateAnimationConfig(config) {
        this.validateAnimationConfig(config);
        this.config = { ...this.config, ...config };
    }
    updateReelConfig(config) {
        this.validateReelConfig(config);
        this.reelConfig = { ...this.reelConfig, ...config };
    }
    getAnimationConfig() {
        return { ...this.config };
    }
    getReelConfig() {
        return { ...this.reelConfig };
    }
    getDefaultAnimationConfig() {
        return {
            enableParticles: true,
            enableSpine: false,
            quality: 'high',
            frameRate: 60,
            particleDensity: 1.0,
            maxConcurrentAnimations: 50,
        };
    }
    getDefaultReelConfig() {
        return {
            spinDuration: 2000,
            anticipationDelay: 300,
            easeType: 'elastic',
            blurEffect: true,
            reelSeparation: true,
        };
    }
    validateAnimationConfig(config) {
        if (config.frameRate !== undefined && (config.frameRate < 30 || config.frameRate > 120)) {
            throw new ConfigurationError('Frame rate must be between 30 and 120 FPS', { frameRate: config.frameRate });
        }
        if (config.particleDensity !== undefined && (config.particleDensity < 0.1 || config.particleDensity > 2.0)) {
            throw new ConfigurationError('Particle density must be between 0.1 and 2.0', { particleDensity: config.particleDensity });
        }
    }
    validateReelConfig(config) {
        if (config.spinDuration !== undefined && config.spinDuration < 500) {
            throw new ConfigurationError('Spin duration must be at least 500ms', { spinDuration: config.spinDuration });
        }
    }
}
// ============================================================================
// PARTICLE SYSTEM WITH OBJECT POOLING
// ============================================================================
export class ParticlePool {
    static instance;
    pool = new Map();
    activeParticles = new Set();
    static getInstance() {
        if (!ParticlePool.instance) {
            ParticlePool.instance = new ParticlePool();
        }
        return ParticlePool.instance;
    }
    getParticle(effectType) {
        const pool = this.pool.get(effectType) || [];
        const particle = pool.pop();
        if (particle) {
            this.activeParticles.add(particle.id);
        }
        return particle || null;
    }
    releaseParticle(particle) {
        if (this.activeParticles.has(particle.id)) {
            this.activeParticles.delete(particle.id);
            const pool = this.pool.get(particle.type) || [];
            pool.push(particle);
            this.pool.set(particle.type, pool);
        }
    }
    createParticle(effectType, config) {
        const particle = {
            id: `particle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: effectType,
            startTime: performance.now(),
            ...config,
        };
        this.activeParticles.add(particle.id);
        return particle;
    }
    cleanup() {
        this.activeParticles.clear();
        this.pool.clear();
    }
}
// ============================================================================
// EASING UTILITIES
// ============================================================================
export class EasingUtils {
    static bounce(t) {
        if (t < 0.5)
            return 2 * t * t;
        return -1 + (4 - 2 * t) * t;
    }
    static elastic(t) {
        if (t === 0 || t === 1)
            return t;
        const p = 0.3;
        const s = p / 4;
        return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }
    static smooth(t) {
        return t * t * (3 - 2 * t);
    }
    static sharp(t) {
        return t * t;
    }
    static applyEasing(t, type) {
        switch (type) {
            case 'bounce': return this.bounce(t);
            case 'elastic': return this.elastic(t);
            case 'smooth': return this.smooth(t);
            case 'sharp': return this.sharp(t);
            default: return t;
        }
    }
}
// ============================================================================
// MAIN ANIMATION ENGINE
// ============================================================================
export class AnimationEngine {
    canvas; // HTMLCanvasElement
    ctx; // CanvasRenderingContext2D
    configManager;
    particlePool;
    animationMetrics;
    lastFrameTime = 0;
    frameCount = 0;
    metricsUpdateInterval = 1000; // Update metrics every second
    // Animation collections with proper typing
    activeParticles = new Map();
    activeSpineAnimations = new Map();
    activeCinematicEffects = new Map();
    constructor(canvas, config) {
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
    validateCanvas(canvas) {
        if (!canvas) {
            throw new AnimationError('Canvas element is required', 'CANVAS_REQUIRED');
        }
    }
    getCanvasContext(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new AnimationError('Failed to get 2D rendering context', 'CONTEXT_ERROR');
        }
        return ctx;
    }
    setupCanvas() {
        try {
            const dpr = (window && window.devicePixelRatio) || 1;
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;
            this.ctx.scale(dpr, dpr);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
        }
        catch (error) {
            throw new AnimationError('Failed to setup canvas', 'CANVAS_SETUP_ERROR', { error });
        }
    }
    startRenderLoop() {
        const render = (timestamp) => {
            try {
                this.updateMetrics(timestamp);
                this.clearCanvas();
                this.updateAnimations(timestamp);
                this.renderFrame(timestamp);
                this.cleanupCompletedAnimations();
            }
            catch (error) {
                console.error('Animation render error:', error);
            }
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
    updateMetrics(timestamp) {
        this.frameCount++;
        const deltaTime = timestamp - this.lastFrameTime;
        if (deltaTime >= this.metricsUpdateInterval) {
            this.animationMetrics.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.animationMetrics.activeAnimations =
                this.activeParticles.size + this.activeSpineAnimations.size + this.activeCinematicEffects.size;
            this.animationMetrics.lastFrameTime = deltaTime;
            this.frameCount = 0;
        }
        this.lastFrameTime = timestamp;
    }
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    updateAnimations(timestamp) {
        this.updateParticles(timestamp);
        this.updateSpineAnimations(timestamp);
        this.updateCinematicEffects(timestamp);
    }
    cleanupCompletedAnimations() {
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
    getTotalActiveAnimations() {
        return this.activeParticles.size + this.activeSpineAnimations.size + this.activeCinematicEffects.size;
    }
    cleanupExcessAnimations() {
        // Remove oldest particles first
        const particles = Array.from(this.activeParticles.values())
            .sort((a, b) => a.startTime - b.startTime);
        const excessCount = this.getTotalActiveAnimations() - this.configManager.getAnimationConfig().maxConcurrentAnimations;
        for (let i = 0; i < excessCount && i < particles.length; i++) {
            const particle = particles[i];
            this.particlePool.releaseParticle(particle);
            this.activeParticles.delete(particle.id);
        }
    }
    // ============================================================================
    // REEL ANIMATION MANAGER
    // ============================================================================
    async spinReels(reelConfigs) {
        try {
            this.validateReelConfigs(reelConfigs);
            const promises = reelConfigs.map(config => this.spinSingleReel(config));
            await Promise.all(promises);
        }
        catch (error) {
            throw new AnimationError('Failed to spin reels', 'REEL_SPIN_ERROR', { error, reelConfigs });
        }
    }
    async spinSingleReel(config) {
        return new Promise((resolve, reject) => {
            try {
                this.validateReelConfig(config);
                const startTime = performance.now();
                const reelConfig = this.configManager.getReelConfig();
                const totalDuration = reelConfig.spinDuration + (config.anticipation ? reelConfig.anticipationDelay : 0);
                const animateReel = (currentTime) => {
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
                        }
                        else {
                            resolve();
                        }
                    }
                    catch (error) {
                        reject(new AnimationError('Reel animation failed', 'REEL_ANIMATION_ERROR', { error, config }));
                    }
                };
                requestAnimationFrame(animateReel);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    validateReelConfigs(reelConfigs) {
        if (!Array.isArray(reelConfigs) || reelConfigs.length === 0) {
            throw new AnimationError('Reel configs must be a non-empty array', 'INVALID_REEL_CONFIGS');
        }
        reelConfigs.forEach((config, index) => {
            this.validateReelConfig(config, index);
        });
    }
    validateReelConfig(config, index) {
        if (typeof config.reelIndex !== 'number' || config.reelIndex < 0) {
            throw new AnimationError('Invalid reel index', 'INVALID_REEL_INDEX', { config, index });
        }
        if (!Array.isArray(config.symbols) || config.symbols.length === 0) {
            throw new AnimationError('Symbols must be a non-empty array', 'INVALID_SYMBOLS', { config, index });
        }
        if (typeof config.finalPosition !== 'number') {
            throw new AnimationError('Final position must be a number', 'INVALID_FINAL_POSITION', { config, index });
        }
    }
    calculateReelPosition(progress, finalPosition) {
        // Add extra rotations for dramatic effect
        const extraRotations = 3 + Math.random() * 2;
        const totalRotation = extraRotations * 360 + finalPosition;
        return totalRotation * progress;
    }
    applyMotionBlur(reelIndex, progress) {
        const blurAmount = Math.max(0, 1 - progress) * 10;
        this.ctx.filter = `blur(${blurAmount}px)`;
    }
    renderReel(reelIndex, position, symbols) {
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
    renderSymbol(symbol, x, y) {
        this.ctx.fillStyle = this.getSymbolColor(symbol);
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(symbol, x, y);
    }
    getSymbolColor(symbol) {
        const colors = {
            'pikachu': '#FFD700',
            'charizard': '#FF6B35',
            'blastoise': '#4FC3F7',
            'venusaur': '#66BB6A',
            'mewtwo': '#AB47BC',
            'scatter': '#F06292',
        };
        return colors[symbol] || '#FFFFFF';
    }
    // ============================================================================
    // ANIMATION METHODS
    // ============================================================================
    /**
     * Evolution animation with spectacular effects
     */
    async playEvolutionAnimation(positions, fromSpecies, toSpecies) {
        try {
            this.validateEvolutionAnimationInput(positions, fromSpecies, toSpecies);
            // Add particle burst at evolution positions
            positions.forEach(([row, col]) => {
                const particle = this.particlePool.createParticle('evolution_burst', {
                    position: this.gridToScreen(row, col),
                    duration: 2000,
                    intensity: 0.8,
                    color: '#FFD700',
                    particleCount: 50,
                });
                this.activeParticles.set(particle.id, particle);
            });
            // Add cinematic effects
            const flashEffect = {
                id: `flash_${Date.now()}`,
                type: 'flash',
                intensity: 0.6,
                duration: 500,
                startTime: performance.now(),
            };
            this.activeCinematicEffects.set(flashEffect.id, flashEffect);
            const shakeEffect = {
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
        }
        catch (error) {
            throw new AnimationError('Evolution animation failed', 'EVOLUTION_ANIMATION_ERROR', { error, positions });
        }
    }
    validateEvolutionAnimationInput(positions, fromSpecies, toSpecies) {
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
    async playClusterWinAnimation(positions, tier) {
        try {
            this.validateClusterWinInput(positions, tier);
            const intensity = Math.min(tier / 3, 1);
            positions.forEach(([row, col], index) => {
                setTimeout(() => {
                    const particle = this.particlePool.createParticle('win_sparkle', {
                        position: this.gridToScreen(row, col),
                        duration: 1500,
                        intensity,
                        color: tier >= 3 ? '#FF6B35' : '#4FC3F7',
                        particleCount: 25 * tier,
                    });
                    this.activeParticles.set(particle.id, particle);
                }, index * 100);
            });
            if (tier >= 3) {
                const zoomEffect = {
                    id: `zoom_${Date.now()}`,
                    type: 'zoom',
                    intensity: 0.3,
                    duration: 1000,
                    startTime: performance.now(),
                };
                this.activeCinematicEffects.set(zoomEffect.id, zoomEffect);
            }
            await this.delay(2000);
        }
        catch (error) {
            throw new AnimationError('Cluster win animation failed', 'CLUSTER_WIN_ERROR', { error, positions, tier });
        }
    }
    validateClusterWinInput(positions, tier) {
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
    async playCascadeAnimation(removedPositions, newPositions) {
        try {
            this.validateCascadeInput(removedPositions, newPositions);
            // Explosion effect at removed positions
            removedPositions.forEach(([row, col]) => {
                const particle = this.particlePool.createParticle('cascade_explosion', {
                    position: this.gridToScreen(row, col),
                    duration: 800,
                    intensity: 0.6,
                    color: '#FF9800',
                    particleCount: 20,
                });
                this.activeParticles.set(particle.id, particle);
            });
            // Falling symbol animation for new positions
            this.animateNewSymbolsFalling(newPositions);
            await this.delay(1200);
        }
        catch (error) {
            throw new AnimationError('Cascade animation failed', 'CASCADE_ERROR', { error, removedPositions, newPositions });
        }
    }
    validateCascadeInput(removedPositions, newPositions) {
        if (!Array.isArray(removedPositions)) {
            throw new AnimationError('Removed positions must be an array', 'INVALID_REMOVED_POSITIONS');
        }
        if (!Array.isArray(newPositions)) {
            throw new AnimationError('New positions must be an array', 'INVALID_NEW_POSITIONS');
        }
    }
    animateNewSymbolsFalling(positions) {
        positions.forEach(([row, col], index) => {
            setTimeout(() => {
                const screenPos = this.gridToScreen(row, col);
                this.animateSymbolFall(screenPos.x, screenPos.y);
            }, index * 50);
        });
    }
    animateSymbolFall(x, y) {
        const startY = -100;
        const duration = 600;
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Bounce easing for landing effect
            const easedProgress = progress < 0.8
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
    async playMegaWinAnimation(winAmount) {
        try {
            this.validateWinAmount(winAmount);
            // Lightning effect
            const lightningEffect = {
                id: `lightning_${Date.now()}`,
                type: 'lightning',
                intensity: 1.0,
                duration: 2000,
                startTime: performance.now(),
            };
            this.activeCinematicEffects.set(lightningEffect.id, lightningEffect);
            // Screen shake
            const shakeEffect = {
                id: `shake_${Date.now()}`,
                type: 'screen_shake',
                intensity: 0.8,
                duration: 3000,
                startTime: performance.now(),
            };
            this.activeCinematicEffects.set(shakeEffect.id, shakeEffect);
            // Slow motion effect
            const slowMotionEffect = {
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
                        duration: 3000,
                        intensity: 1.0,
                        color: '#FFD700',
                        particleCount: 100,
                    });
                    this.activeParticles.set(particle.id, particle);
                }, i * 200);
            }
            await this.delay(4000);
        }
        catch (error) {
            throw new AnimationError('Mega win animation failed', 'MEGA_WIN_ERROR', { error, winAmount });
        }
    }
    validateWinAmount(winAmount) {
        if (typeof winAmount !== 'number' || winAmount <= 0) {
            throw new AnimationError('Win amount must be a positive number', 'INVALID_WIN_AMOUNT');
        }
    }
    // ============================================================================
    // PRIVATE ANIMATION UPDATE METHODS
    // ============================================================================
    updateParticles(timestamp) {
        // Particles are now managed with Maps for better performance
        // Cleanup is handled in cleanupCompletedAnimations()
    }
    updateSpineAnimations(timestamp) {
        // Update Spine2D animations if available
        for (const [id, animation] of this.activeSpineAnimations.entries()) {
            // Spine animation update logic would go here
            // This would integrate with the Spine WebGL runtime
        }
    }
    updateCinematicEffects(timestamp) {
        for (const [id, effect] of this.activeCinematicEffects.entries()) {
            const age = timestamp - effect.startTime;
            if (age < 0)
                continue; // Not started yet
            if (age > effect.duration) {
                this.activeCinematicEffects.delete(id);
                continue;
            }
            this.applyCinematicEffect(effect, age / effect.duration);
        }
    }
    applyCinematicEffect(effect, progress) {
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
    applyScreenShake(intensity) {
        const shakeX = (Math.random() - 0.5) * intensity * 10;
        const shakeY = (Math.random() - 0.5) * intensity * 10;
        this.ctx.translate(shakeX, shakeY);
    }
    applyFlash(intensity) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    applyZoom(scale) {
        this.ctx.scale(scale, scale);
    }
    applyLightning(intensity, progress) {
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
    renderFrame(timestamp) {
        // Render all active particle systems
        for (const [id, effect] of this.activeParticles.entries()) {
            this.renderParticleSystem(effect, timestamp);
        }
    }
    renderParticleSystem(effect, timestamp) {
        const age = timestamp - effect.startTime;
        const progress = Math.min(age / effect.duration, 1);
        for (let i = 0; i < effect.particleCount; i++) {
            const particleProgress = Math.max(0, progress - (i / effect.particleCount) * 0.3);
            if (particleProgress <= 0)
                continue;
            const angle = (i / effect.particleCount) * Math.PI * 2;
            const distance = particleProgress * 100 * effect.intensity;
            const x = effect.position.x + Math.cos(angle) * distance;
            const y = effect.position.y + Math.sin(angle) * distance;
            const alpha = 1 - particleProgress;
            this.ctx.fillStyle = `${effect.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            this.ctx.fillRect(x - 2, y - 2, 4, 4);
        }
    }
    gridToScreen(row, col) {
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
    getMetrics() {
        return { ...this.animationMetrics };
    }
    /**
     * Update animation configuration
     */
    updateConfig(config) {
        this.configManager.updateAnimationConfig(config);
    }
    /**
     * Update reel configuration
     */
    updateReelConfig(config) {
        this.configManager.updateReelConfig(config);
    }
    /**
     * Preload particle effects for better performance
     */
    preloadParticleEffects() {
        const effectTypes = [
            'evolution_burst', 'win_sparkle', 'scatter_magic',
            'cascade_explosion', 'mega_aura'
        ];
        effectTypes.forEach(type => {
            for (let i = 0; i < 10; i++) {
                this.particlePool.createParticle(type, {
                    position: { x: 0, y: 0 },
                    duration: 1000,
                    intensity: 1.0,
                    color: '#FFFFFF',
                    particleCount: 50,
                });
            }
        });
    }
    /**
     * Clean up all animations and resources
     */
    dispose() {
        this.activeParticles.clear();
        this.activeSpineAnimations.clear();
        this.activeCinematicEffects.clear();
        this.particlePool.cleanup();
    }
    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Spine2D Integration for Professional Pokemon Animations
 */
export class SpineAnimationManager {
    spineRuntime; // Spine WebGL runtime
    skeletons = new Map();
    canvas;
    constructor(canvas) {
        this.canvas = canvas;
        this.initializeSpineRuntime(canvas);
    }
    initializeSpineRuntime(canvas) {
        try {
            // This would initialize the Spine WebGL runtime
            // Implementation depends on the actual Spine runtime integration
            console.log('Spine runtime initialized for canvas:', canvas);
        }
        catch (error) {
            throw new AnimationError('Failed to initialize Spine runtime', 'SPINE_INIT_ERROR', { error });
        }
    }
    async loadPokemonSkeleton(pokemonName, skeletonPath, atlasPath) {
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
        }
        catch (error) {
            throw new AnimationError('Failed to load Pokemon skeleton', 'SKELETON_LOAD_ERROR', {
                error,
                pokemonName,
                skeletonPath,
                atlasPath
            });
        }
    }
    async playPokemonAnimation(pokemonName, animationName, position) {
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
        }
        catch (error) {
            throw new AnimationError('Failed to play Pokemon animation', 'ANIMATION_PLAY_ERROR', {
                error,
                pokemonName,
                animationName,
                position
            });
        }
    }
    validateSkeletonInput(pokemonName, skeletonPath, atlasPath) {
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
    validateAnimationInput(pokemonName, animationName, position) {
        if (typeof pokemonName !== 'string' || pokemonName.trim() === '') {
            throw new AnimationError('Pokemon name must be a non-empty string', 'INVALID_POKEMON_NAME');
        }
        if (typeof animationName !== 'string' || animationName.trim() === '') {
            throw new AnimationError('Animation name must be a non-empty string', 'INVALID_ANIMATION_NAME');
        }
        if (typeof position.x !== 'number' || typeof position.y !== 'number') {
            throw new AnimationError('Position must have valid x and y coordinates', 'INVALID_POSITION');
        }
    }
    /**
     * Clean up Spine resources
     */
    dispose() {
        this.skeletons.clear();
        // Clean up Spine runtime resources
    }
}
