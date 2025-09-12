/**
 * PocketMon Genesis Reels - Complete Sprite Integration System
 * Combines all sprite, animation, and effects systems for full game integration
 */

import { PocketMonSpriteLoader, SpriteConfig } from './sprites/SpriteLoader';
import { PocketMonAnimationSystem, AnimationSequence, PokemonAnimations } from './sprites/AnimationSystem';
import { PocketMonEffectsSystem, SpecialEffectTrigger } from './effects/EffectsSystem';

export interface PokemonRenderConfig {
    sprite: HTMLImageElement;
    animations?: PokemonAnimations;
    effects: SpecialEffectTrigger[];
    position: { x: number; y: number };
    scale: number;
    tier: number;
}

export interface GameSymbolRenderer {
    pokemonName: string;
    tier: number;
    isAnimated: boolean;
    currentAnimation?: any;
    activeEffects: any[];
    renderConfig: PokemonRenderConfig;
}

export class PocketMonSpriteIntegration {
    private spriteLoader: PocketMonSpriteLoader;
    private renderers: Map<string, GameSymbolRenderer> = new Map();
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private isInitialized = false;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.spriteLoader = new PocketMonSpriteLoader();
    }

    /**
     * Initialize complete sprite system
     */
    async initialize(): Promise<void> {
        console.log('Initializing PocketMon Sprite Integration System...');
        
        try {
            // Initialize sprite loader
            await this.spriteLoader.initialize();
            
            // Validate effects configuration
            if (!PocketMonEffectsSystem.validateConfiguration()) {
                throw new Error('Effects configuration validation failed');
            }
            
            this.isInitialized = true;
            console.log('✅ PocketMon Sprite Integration System ready');
            
            // Log system stats
            const cacheStats = this.spriteLoader.getCacheStats();
            console.log(`📊 System Stats:`, {
                spritesLoaded: cacheStats.sprites,
                animationsLoaded: cacheStats.animations,
                effectsRegistered: Object.keys(PocketMonEffectsSystem.PARTICLE_EFFECTS).length,
                glowsRegistered: Object.keys(PocketMonEffectsSystem.GLOW_EFFECTS).length
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize sprite system:', error);
            throw error;
        }
    }

    /**
     * Create symbol renderer for game reel
     */
    async createSymbolRenderer(pokemonName: string, tier: number, position: { x: number; y: number }): Promise<GameSymbolRenderer> {
        if (!this.isInitialized) {
            throw new Error('Sprite system not initialized');
        }

        try {
            // Load sprite
            const sprite = await this.spriteLoader.getSprite(pokemonName, tier);
            
            // Get animations if available
            const animations = PocketMonAnimationSystem.getAnimation(pokemonName, tier);
            
            // Get effect triggers
            const effects = PocketMonEffectsSystem.getEffectTriggers(pokemonName);
            
            // Determine scale based on tier
            const scale = this.getTierScale(tier);
            
            const renderConfig: PokemonRenderConfig = {
                sprite,
                animations: animations ? { idle: animations } : undefined,
                effects,
                position,
                scale,
                tier
            };

            const renderer: GameSymbolRenderer = {
                pokemonName,
                tier,
                isAnimated: !!animations,
                activeEffects: [],
                renderConfig
            };

            // Start idle animation if available
            if (animations && renderer.isAnimated) {
                renderer.currentAnimation = PocketMonAnimationSystem.createAnimationPlayer(
                    animations,
                    (frameIndex) => this.onAnimationFrameChange(pokemonName, frameIndex)
                );
                renderer.currentAnimation.play();
            }

            // Start idle effects
            this.startEffectsForEvent(renderer, 'idle');
            
            const rendererId = `${pokemonName}_${position.x}_${position.y}`;
            this.renderers.set(rendererId, renderer);
            
            console.log(`🎮 Created renderer for ${pokemonName} (Tier ${tier}) at ${position.x}, ${position.y}`);
            return renderer;
            
        } catch (error) {
            console.error(`❌ Failed to create renderer for ${pokemonName}:`, error);
            throw error;
        }
    }

    /**
     * Render all symbols on canvas
     */
    renderFrame(timestamp: number): void {
        if (!this.isInitialized) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and render all symbols
        for (const renderer of this.renderers.values()) {
            this.updateRenderer(renderer, timestamp);
            this.renderSymbol(renderer);
        }
    }

    /**
     * Update individual renderer
     */
    private updateRenderer(renderer: GameSymbolRenderer, timestamp: number): void {
        // Update animation
        if (renderer.currentAnimation?.isPlaying()) {
            renderer.currentAnimation.update(timestamp);
        }
        
        // Update effects (simplified - would integrate with actual particle system)
        for (const effect of renderer.activeEffects) {
            // Update effect state
            if (effect.update) {
                effect.update(timestamp);
            }
        }
    }

    /**
     * Render individual symbol
     */
    private renderSymbol(renderer: GameSymbolRenderer): void {
        const { sprite, position, scale } = renderer.renderConfig;
        const { x, y } = position;
        
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(x + sprite.width * scale / 2, y + sprite.height * scale / 2);
        
        // Apply animation transformations if active
        if (renderer.currentAnimation?.isPlaying()) {
            const frame = renderer.currentAnimation.getCurrentFrame();
            
            if (frame.scaleX !== undefined || frame.scaleY !== undefined) {
                this.ctx.scale(frame.scaleX || 1, frame.scaleY || 1);
            }
            
            if (frame.rotation !== undefined) {
                this.ctx.rotate((frame.rotation * Math.PI) / 180);
            }
            
            if (frame.alpha !== undefined) {
                this.ctx.globalAlpha = frame.alpha;
            }
        }
        
        // Render glow effects
        this.renderGlowEffects(renderer);
        
        // Render sprite
        this.ctx.drawImage(
            sprite,
            -sprite.width * scale / 2,
            -sprite.height * scale / 2,
            sprite.width * scale,
            sprite.height * scale
        );
        
        // Render particle effects
        this.renderParticleEffects(renderer);
        
        this.ctx.restore();
    }

    /**
     * Render glow effects for symbol
     */
    private renderGlowEffects(renderer: GameSymbolRenderer): void {
        const glowTriggers = renderer.renderConfig.effects.filter(effect => 
            effect.effects.some(effectName => PocketMonEffectsSystem.getGlowEffect(effectName))
        );
        
        for (const trigger of glowTriggers) {
            for (const effectName of trigger.effects) {
                const glowConfig = PocketMonEffectsSystem.getGlowEffect(effectName);
                if (glowConfig) {
                    this.renderGlow(glowConfig);
                }
            }
        }
    }

    /**
     * Render particle effects for symbol
     */
    private renderParticleEffects(renderer: GameSymbolRenderer): void {
        // Simplified particle rendering - would integrate with full particle system
        const particleTriggers = renderer.renderConfig.effects.filter(effect => 
            effect.effects.some(effectName => PocketMonEffectsSystem.getParticleEffect(effectName))
        );
        
        for (const trigger of particleTriggers) {
            for (const effectName of trigger.effects) {
                const particleConfig = PocketMonEffectsSystem.getParticleEffect(effectName);
                if (particleConfig) {
                    this.renderSimpleParticles(particleConfig);
                }
            }
        }
    }

    /**
     * Render glow effect
     */
    private renderGlow(glowConfig: any): void {
        const { sprite } = this.renderers.values().next().value.renderConfig;
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.shadowColor = glowConfig.color;
        this.ctx.shadowBlur = glowConfig.blurAmount;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Simple glow effect
        this.ctx.fillStyle = glowConfig.color;
        this.ctx.globalAlpha = glowConfig.intensity * 0.3;
        this.ctx.fillRect(-sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
        
        this.ctx.restore();
    }

    /**
     * Render simple particles
     */
    private renderSimpleParticles(particleConfig: any): void {
        // Simplified particle rendering
        for (let i = 0; i < 10; i++) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillStyle = particleConfig.particleConfig.color;
            
            const x = (Math.random() - 0.5) * 50;
            const y = (Math.random() - 0.5) * 50;
            const size = Math.random() * 4 + 2;
            
            this.ctx.fillRect(x, y, size, size);
            this.ctx.restore();
        }
    }

    /**
     * Trigger effects for specific event
     */
    triggerEvent(pokemonName: string, event: string): void {
        const renderer = Array.from(this.renderers.values())
            .find(r => r.pokemonName === pokemonName);
            
        if (renderer) {
            this.startEffectsForEvent(renderer, event);
        }
    }

    /**
     * Start effects for event
     */
    private startEffectsForEvent(renderer: GameSymbolRenderer, event: string): void {
        const triggers = PocketMonEffectsSystem.getTriggersForEvent(renderer.pokemonName, event);
        
        for (const trigger of triggers) {
            setTimeout(() => {
                console.log(`🎆 Starting effects for ${renderer.pokemonName} on ${event}:`, trigger.effects);
                // Would start actual particle/glow effects here
                renderer.activeEffects.push({
                    trigger,
                    startTime: Date.now(),
                    duration: trigger.duration
                });
            }, trigger.delay);
        }
    }

    /**
     * Get tier-based scale factor
     */
    private getTierScale(tier: number): number {
        switch (tier) {
            case 5: return 1.2; // Legendary
            case 4: return 1.1; // Rare
            case 3: return 1.05; // Stage 2
            case 2: return 0.9; // Stage 1
            case 1: return 0.8; // Basic
            default: return 1.0; // Special
        }
    }

    /**
     * Animation frame change callback
     */
    private onAnimationFrameChange(pokemonName: string, frameIndex: number): void {
        // Handle frame-specific effects or sounds
        console.log(`🎬 ${pokemonName} animation frame: ${frameIndex}`);
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.renderers.clear();
        this.spriteLoader.clearCache();
        console.log('🧹 Sprite integration system cleaned up');
    }

    /**
     * Get system status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            activeRenderers: this.renderers.size,
            cacheStats: this.spriteLoader.getCacheStats(),
            preloadProgress: this.spriteLoader.getPreloadProgress()
        };
    }
}

// Export for game integration
export default PocketMonSpriteIntegration;