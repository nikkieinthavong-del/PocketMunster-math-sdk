/**
 * PocketMon Genesis Reels - Special Effects System
 * Comprehensive particle effects, glows, and visual enhancements
 */

export interface ParticleConfig {
    name: string;
    type: 'sprite' | 'shape' | 'gradient';
    texture?: string;
    color: string;
    startColor?: string;
    endColor?: string;
    size: { min: number; max: number };
    lifetime: { min: number; max: number };
    velocity: { min: { x: number; y: number }; max: { x: number; y: number } };
    acceleration?: { x: number; y: number };
    rotation?: { min: number; max: number };
    rotationSpeed?: { min: number; max: number };
    alpha: { start: number; end: number };
    scale: { start: number; end: number };
    blendMode: 'normal' | 'additive' | 'multiply' | 'screen';
}

export interface ParticleEmitterConfig {
    name: string;
    maxParticles: number;
    emissionRate: number;
    duration: number; // -1 for infinite
    position: { x: number; y: number };
    positionVariance: { x: number; y: number };
    particleConfig: ParticleConfig;
    autoStart: boolean;
    loop: boolean;
}

export interface GlowConfig {
    name: string;
    color: string;
    intensity: number;
    radius: number;
    pulseSpeed?: number;
    pulseIntensity?: { min: number; max: number };
    blurAmount: number;
    animationType: 'static' | 'pulse' | 'wave' | 'rotate';
}

export interface SpecialEffectTrigger {
    event: 'appear' | 'win' | 'scatter' | 'wild' | 'bonus' | 'idle';
    delay: number;
    duration: number;
    effects: string[];
    priority: number;
}

export class PocketMonEffectsSystem {
    
    // Particle Effect Definitions
    static readonly PARTICLE_EFFECTS: Record<string, ParticleEmitterConfig> = {
        // Legendary Effects
        psychic_aura: {
            name: 'Psychic Aura',
            maxParticles: 50,
            emissionRate: 25,
            duration: -1,
            position: { x: 0, y: 0 },
            positionVariance: { x: 30, y: 30 },
            particleConfig: {
                name: 'psychic_particle',
                type: 'gradient',
                color: '#FF69B4',
                startColor: '#FF1493',
                endColor: '#9370DB',
                size: { min: 2, max: 8 },
                lifetime: { min: 1000, max: 2000 },
                velocity: { min: { x: -20, y: -20 }, max: { x: 20, y: 20 } },
                acceleration: { x: 0, y: -10 },
                rotation: { min: 0, max: 360 },
                rotationSpeed: { min: -90, max: 90 },
                alpha: { start: 0.8, end: 0.0 },
                scale: { start: 1.0, end: 0.3 },
                blendMode: 'additive'
            },
            autoStart: true,
            loop: true
        },

        ice_crystals: {
            name: 'Ice Crystals',
            maxParticles: 30,
            emissionRate: 15,
            duration: -1,
            position: { x: 0, y: 0 },
            positionVariance: { x: 40, y: 40 },
            particleConfig: {
                name: 'ice_particle',
                type: 'sprite',
                texture: 'assets/effects/ice_crystal.png',
                color: '#87CEEB',
                size: { min: 4, max: 12 },
                lifetime: { min: 1500, max: 3000 },
                velocity: { min: { x: -15, y: -25 }, max: { x: 15, y: -5 } },
                acceleration: { x: 0, y: 5 },
                rotation: { min: 0, max: 360 },
                rotationSpeed: { min: -45, max: 45 },
                alpha: { start: 0.9, end: 0.0 },
                scale: { start: 0.5, end: 1.2 },
                blendMode: 'screen'
            },
            autoStart: true,
            loop: true
        },

        lightning_bolts: {
            name: 'Lightning Bolts',
            maxParticles: 20,
            emissionRate: 10,
            duration: -1,
            position: { x: 0, y: 0 },
            positionVariance: { x: 25, y: 25 },
            particleConfig: {
                name: 'lightning_particle',
                type: 'shape',
                color: '#FFFF00',
                startColor: '#FFFFFF',
                endColor: '#FFD700',
                size: { min: 1, max: 3 },
                lifetime: { min: 200, max: 600 },
                velocity: { min: { x: -50, y: -50 }, max: { x: 50, y: 50 } },
                alpha: { start: 1.0, end: 0.0 },
                scale: { start: 2.0, end: 0.1 },
                blendMode: 'additive'
            },
            autoStart: true,
            loop: true
        },

        fire_embers: {
            name: 'Fire Embers',
            maxParticles: 40,
            emissionRate: 20,
            duration: -1,
            position: { x: 0, y: 0 },
            positionVariance: { x: 35, y: 35 },
            particleConfig: {
                name: 'fire_particle',
                type: 'gradient',
                color: '#FF4500',
                startColor: '#FF0000',
                endColor: '#FFD700',
                size: { min: 3, max: 10 },
                lifetime: { min: 800, max: 1800 },
                velocity: { min: { x: -30, y: -40 }, max: { x: 30, y: -10 } },
                acceleration: { x: 0, y: -15 },
                alpha: { start: 0.9, end: 0.0 },
                scale: { start: 1.0, end: 0.2 },
                blendMode: 'additive'
            },
            autoStart: true,
            loop: true
        },

        // Special Symbol Effects
        capture_beam: {
            name: 'Capture Beam',
            maxParticles: 100,
            emissionRate: 50,
            duration: 2000,
            position: { x: 0, y: 0 },
            positionVariance: { x: 10, y: 10 },
            particleConfig: {
                name: 'beam_particle',
                type: 'shape',
                color: '#00BFFF',
                size: { min: 2, max: 6 },
                lifetime: { min: 500, max: 1000 },
                velocity: { min: { x: -5, y: -30 }, max: { x: 5, y: -10 } },
                alpha: { start: 0.8, end: 0.0 },
                scale: { start: 0.5, end: 1.5 },
                blendMode: 'additive'
            },
            autoStart: false,
            loop: false
        },

        transform_sparkles: {
            name: 'Transform Sparkles',
            maxParticles: 60,
            emissionRate: 40,
            duration: 1500,
            position: { x: 0, y: 0 },
            positionVariance: { x: 50, y: 50 },
            particleConfig: {
                name: 'sparkle_particle',
                type: 'sprite',
                texture: 'assets/effects/sparkle.png',
                color: '#FFB6C1',
                size: { min: 4, max: 8 },
                lifetime: { min: 600, max: 1200 },
                velocity: { min: { x: -25, y: -25 }, max: { x: 25, y: 25 } },
                rotation: { min: 0, max: 360 },
                rotationSpeed: { min: -180, max: 180 },
                alpha: { start: 1.0, end: 0.0 },
                scale: { start: 0.3, end: 1.0 },
                blendMode: 'additive'
            },
            autoStart: false,
            loop: false
        },

        // Win Effects
        coin_burst: {
            name: 'Coin Burst',
            maxParticles: 80,
            emissionRate: 80,
            duration: 1000,
            position: { x: 0, y: 0 },
            positionVariance: { x: 20, y: 20 },
            particleConfig: {
                name: 'coin_particle',
                type: 'sprite',
                texture: 'assets/effects/coin.png',
                color: '#FFD700',
                size: { min: 8, max: 16 },
                lifetime: { min: 1000, max: 2000 },
                velocity: { min: { x: -40, y: -60 }, max: { x: 40, y: -20 } },
                acceleration: { x: 0, y: 30 },
                rotation: { min: 0, max: 360 },
                rotationSpeed: { min: -360, max: 360 },
                alpha: { start: 1.0, end: 0.8 },
                scale: { start: 1.0, end: 0.5 },
                blendMode: 'normal'
            },
            autoStart: false,
            loop: false
        }
    };

    // Glow Effect Definitions
    static readonly GLOW_EFFECTS: Record<string, GlowConfig> = {
        legendary_shine: {
            name: 'Legendary Shine',
            color: '#FFD700',
            intensity: 1.5,
            radius: 20,
            pulseSpeed: 2.0,
            pulseIntensity: { min: 0.8, max: 1.8 },
            blurAmount: 15,
            animationType: 'pulse'
        },

        mythical_glow: {
            name: 'Mythical Glow',
            color: '#FF69B4',
            intensity: 1.3,
            radius: 18,
            pulseSpeed: 1.5,
            pulseIntensity: { min: 0.7, max: 1.6 },
            blurAmount: 12,
            animationType: 'wave'
        },

        scatter_glow: {
            name: 'Scatter Glow',
            color: '#00BFFF',
            intensity: 1.2,
            radius: 15,
            pulseSpeed: 3.0,
            pulseIntensity: { min: 0.6, max: 1.4 },
            blurAmount: 10,
            animationType: 'pulse'
        },

        multiplier_glow: {
            name: 'Multiplier Glow',
            color: '#32CD32',
            intensity: 1.4,
            radius: 16,
            pulseSpeed: 2.5,
            pulseIntensity: { min: 0.9, max: 1.7 },
            blurAmount: 12,
            animationType: 'rotate'
        },

        wild_symbol_glow: {
            name: 'Wild Symbol Glow',
            color: '#9370DB',
            intensity: 1.1,
            radius: 12,
            pulseSpeed: 1.8,
            pulseIntensity: { min: 0.8, max: 1.3 },
            blurAmount: 8,
            animationType: 'pulse'
        },

        win_highlight: {
            name: 'Win Highlight',
            color: '#FFFF00',
            intensity: 2.0,
            radius: 25,
            pulseSpeed: 4.0,
            pulseIntensity: { min: 1.0, max: 2.5 },
            blurAmount: 20,
            animationType: 'pulse'
        }
    };

    // Effect Trigger Configurations
    static readonly EFFECT_TRIGGERS: Record<string, SpecialEffectTrigger[]> = {
        mewtwo: [
            { event: 'appear', delay: 0, duration: 2000, effects: ['psychic_aura', 'legendary_shine'], priority: 1 },
            { event: 'win', delay: 100, duration: 3000, effects: ['psychic_aura', 'coin_burst', 'win_highlight'], priority: 2 },
            { event: 'idle', delay: 0, duration: -1, effects: ['psychic_aura'], priority: 0 }
        ],

        articuno: [
            { event: 'appear', delay: 0, duration: 2000, effects: ['ice_crystals', 'legendary_shine'], priority: 1 },
            { event: 'win', delay: 100, duration: 3000, effects: ['ice_crystals', 'coin_burst'], priority: 2 },
            { event: 'idle', delay: 0, duration: -1, effects: ['ice_crystals'], priority: 0 }
        ],

        zapdos: [
            { event: 'appear', delay: 0, duration: 2000, effects: ['lightning_bolts', 'legendary_shine'], priority: 1 },
            { event: 'win', delay: 100, duration: 3000, effects: ['lightning_bolts', 'coin_burst'], priority: 2 },
            { event: 'idle', delay: 0, duration: -1, effects: ['lightning_bolts'], priority: 0 }
        ],

        moltres: [
            { event: 'appear', delay: 0, duration: 2000, effects: ['fire_embers', 'legendary_shine'], priority: 1 },
            { event: 'win', delay: 100, duration: 3000, effects: ['fire_embers', 'coin_burst'], priority: 2 },
            { event: 'idle', delay: 0, duration: -1, effects: ['fire_embers'], priority: 0 }
        ],

        ditto: [
            { event: 'wild', delay: 0, duration: 1500, effects: ['transform_sparkles', 'wild_symbol_glow'], priority: 2 },
            { event: 'appear', delay: 0, duration: 1000, effects: ['transform_sparkles'], priority: 1 }
        ],

        pokeball: [
            { event: 'scatter', delay: 0, duration: 2000, effects: ['capture_beam', 'scatter_glow'], priority: 3 },
            { event: 'appear', delay: 0, duration: 1000, effects: ['scatter_glow'], priority: 1 },
            { event: 'idle', delay: 0, duration: -1, effects: ['scatter_glow'], priority: 0 }
        ],

        masterball: [
            { event: 'bonus', delay: 0, duration: 3000, effects: ['capture_beam', 'multiplier_glow', 'coin_burst'], priority: 4 },
            { event: 'appear', delay: 0, duration: 1500, effects: ['multiplier_glow'], priority: 1 },
            { event: 'idle', delay: 0, duration: -1, effects: ['multiplier_glow'], priority: 0 }
        ]
    };

    /**
     * Get particle effect configuration
     */
    static getParticleEffect(effectName: string): ParticleEmitterConfig | null {
        return this.PARTICLE_EFFECTS[effectName] || null;
    }

    /**
     * Get glow effect configuration  
     */
    static getGlowEffect(effectName: string): GlowConfig | null {
        return this.GLOW_EFFECTS[effectName] || null;
    }

    /**
     * Get all effect triggers for a Pokemon
     */
    static getEffectTriggers(pokemonName: string): SpecialEffectTrigger[] {
        return this.EFFECT_TRIGGERS[pokemonName] || [];
    }

    /**
     * Get effect triggers for a specific event
     */
    static getTriggersForEvent(pokemonName: string, event: string): SpecialEffectTrigger[] {
        const triggers = this.getEffectTriggers(pokemonName);
        return triggers.filter(trigger => trigger.event === event)
                      .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Create effect system configuration export
     */
    static exportConfiguration() {
        return {
            particleEffects: this.PARTICLE_EFFECTS,
            glowEffects: this.GLOW_EFFECTS,
            effectTriggers: this.EFFECT_TRIGGERS,
            version: '1.0.0',
            totalEffects: Object.keys(this.PARTICLE_EFFECTS).length + Object.keys(this.GLOW_EFFECTS).length
        };
    }

    /**
     * Validate effect configuration
     */
    static validateConfiguration(): boolean {
        // Check that all referenced effects exist
        for (const [pokemonName, triggers] of Object.entries(this.EFFECT_TRIGGERS)) {
            for (const trigger of triggers) {
                for (const effectName of trigger.effects) {
                    if (!this.PARTICLE_EFFECTS[effectName] && !this.GLOW_EFFECTS[effectName]) {
                        console.error(`Effect '${effectName}' referenced by '${pokemonName}' does not exist`);
                        return false;
                    }
                }
            }
        }
        return true;
    }
}