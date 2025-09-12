/**
 * PocketMon Genesis Reels - Complete Animation System
 * Frame-by-frame animation definitions for all animated sprites
 */

export interface AnimationFrame {
    frameIndex: number;
    duration: number; // milliseconds
    offsetX?: number;
    offsetY?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    alpha?: number;
}

export interface AnimationSequence {
    name: string;
    frames: AnimationFrame[];
    loop: boolean;
    totalDuration: number;
    fps: number;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface PokemonAnimations {
    idle: AnimationSequence;
    appear?: AnimationSequence;
    win?: AnimationSequence;
    special?: AnimationSequence;
    exit?: AnimationSequence;
}

export class PocketMonAnimationSystem {
    
    // Legendary Pokemon Animations (Tier 5)
    static readonly LEGENDARY_ANIMATIONS: Record<string, PokemonAnimations> = {
        mewtwo: {
            idle: {
                name: 'mewtwo_idle',
                frames: [
                    { frameIndex: 0, duration: 200, alpha: 1.0 },
                    { frameIndex: 1, duration: 200, alpha: 0.95, offsetY: -2 },
                    { frameIndex: 2, duration: 200, alpha: 0.9, offsetY: -4 },
                    { frameIndex: 3, duration: 200, alpha: 0.95, offsetY: -2 },
                    { frameIndex: 4, duration: 200, alpha: 1.0, offsetY: 0 },
                    { frameIndex: 5, duration: 200, alpha: 1.05, offsetY: 2, scaleX: 1.05 },
                    { frameIndex: 6, duration: 200, alpha: 1.1, offsetY: 4, scaleX: 1.1 },
                    { frameIndex: 7, duration: 200, alpha: 1.05, offsetY: 2, scaleX: 1.05 }
                ],
                loop: true,
                totalDuration: 1600,
                fps: 5,
                easing: 'ease-in-out'
            },
            appear: {
                name: 'mewtwo_appear',
                frames: [
                    { frameIndex: 0, duration: 100, alpha: 0, scaleX: 0.5, scaleY: 0.5 },
                    { frameIndex: 1, duration: 150, alpha: 0.3, scaleX: 0.7, scaleY: 0.7 },
                    { frameIndex: 2, duration: 150, alpha: 0.6, scaleX: 0.9, scaleY: 0.9 },
                    { frameIndex: 3, duration: 200, alpha: 1.0, scaleX: 1.0, scaleY: 1.0 }
                ],
                loop: false,
                totalDuration: 600,
                fps: 6
            },
            win: {
                name: 'mewtwo_win',
                frames: [
                    { frameIndex: 0, duration: 100, alpha: 1.0, scaleX: 1.0 },
                    { frameIndex: 1, duration: 100, alpha: 1.2, scaleX: 1.1, offsetY: -5 },
                    { frameIndex: 2, duration: 100, alpha: 1.4, scaleX: 1.2, offsetY: -10 },
                    { frameIndex: 3, duration: 150, alpha: 1.6, scaleX: 1.3, offsetY: -15, rotation: 5 },
                    { frameIndex: 4, duration: 150, alpha: 1.4, scaleX: 1.2, offsetY: -10, rotation: -5 },
                    { frameIndex: 5, duration: 100, alpha: 1.2, scaleX: 1.1, offsetY: -5 },
                    { frameIndex: 6, duration: 100, alpha: 1.0, scaleX: 1.0, offsetY: 0 }
                ],
                loop: false,
                totalDuration: 800,
                fps: 8
            }
        },
        
        articuno: {
            idle: {
                name: 'articuno_idle',
                frames: [
                    { frameIndex: 0, duration: 250, alpha: 1.0, offsetY: 0 },
                    { frameIndex: 1, duration: 250, alpha: 0.95, offsetY: -3, rotation: 2 },
                    { frameIndex: 2, duration: 250, alpha: 0.9, offsetY: -6, rotation: 4 },
                    { frameIndex: 3, duration: 250, alpha: 0.95, offsetY: -3, rotation: 2 },
                    { frameIndex: 4, duration: 250, alpha: 1.0, offsetY: 0, rotation: 0 },
                    { frameIndex: 5, duration: 250, alpha: 1.05, offsetY: 3, rotation: -2 }
                ],
                loop: true,
                totalDuration: 1500,
                fps: 4
            }
        },
        
        zapdos: {
            idle: {
                name: 'zapdos_idle',
                frames: [
                    { frameIndex: 0, duration: 200, alpha: 1.0, scaleX: 1.0 },
                    { frameIndex: 1, duration: 150, alpha: 1.1, scaleX: 1.05, offsetX: 2 },
                    { frameIndex: 2, duration: 100, alpha: 1.2, scaleX: 1.1, offsetX: 4 },
                    { frameIndex: 3, duration: 150, alpha: 1.1, scaleX: 1.05, offsetX: 2 },
                    { frameIndex: 4, duration: 200, alpha: 1.0, scaleX: 1.0, offsetX: 0 },
                    { frameIndex: 5, duration: 200, alpha: 0.9, scaleX: 0.95, offsetX: -2 }
                ],
                loop: true,
                totalDuration: 1000,
                fps: 5
            }
        },
        
        moltres: {
            idle: {
                name: 'moltres_idle',
                frames: [
                    { frameIndex: 0, duration: 150, alpha: 1.0, rotation: 0 },
                    { frameIndex: 1, duration: 150, alpha: 1.1, rotation: 3, offsetY: -2 },
                    { frameIndex: 2, duration: 150, alpha: 1.2, rotation: 6, offsetY: -4 },
                    { frameIndex: 3, duration: 150, alpha: 1.3, rotation: 3, offsetY: -2 },
                    { frameIndex: 4, duration: 150, alpha: 1.2, rotation: 0, offsetY: 0 },
                    { frameIndex: 5, duration: 150, alpha: 1.1, rotation: -3, offsetY: 2 },
                    { frameIndex: 6, duration: 150, alpha: 1.0, rotation: -6, offsetY: 4 },
                    { frameIndex: 7, duration: 150, alpha: 1.1, rotation: -3, offsetY: 2 }
                ],
                loop: true,
                totalDuration: 1200,
                fps: 6
            }
        }
    };

    // Special Symbol Animations (Pokeball, Masterball)
    static readonly SPECIAL_ANIMATIONS: Record<string, PokemonAnimations> = {
        pokeball: {
            idle: {
                name: 'pokeball_spin',
                frames: [
                    { frameIndex: 0, duration: 125, rotation: 0, scaleX: 1.0, scaleY: 1.0 },
                    { frameIndex: 1, duration: 125, rotation: 45, scaleX: 1.05, scaleY: 1.05 },
                    { frameIndex: 2, duration: 125, rotation: 90, scaleX: 1.1, scaleY: 1.1 },
                    { frameIndex: 3, duration: 125, rotation: 135, scaleX: 1.05, scaleY: 1.05 },
                    { frameIndex: 4, duration: 125, rotation: 180, scaleX: 1.0, scaleY: 1.0 },
                    { frameIndex: 5, duration: 125, rotation: 225, scaleX: 1.05, scaleY: 1.05 },
                    { frameIndex: 6, duration: 125, rotation: 270, scaleX: 1.1, scaleY: 1.1 },
                    { frameIndex: 7, duration: 125, rotation: 315, scaleX: 1.05, scaleY: 1.05 }
                ],
                loop: true,
                totalDuration: 1000,
                fps: 8
            },
            special: {
                name: 'pokeball_trigger',
                frames: [
                    { frameIndex: 0, duration: 100, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 1, duration: 100, scaleX: 1.2, scaleY: 1.2, alpha: 1.2 },
                    { frameIndex: 2, duration: 100, scaleX: 1.4, scaleY: 1.4, alpha: 1.4 },
                    { frameIndex: 3, duration: 100, scaleX: 1.6, scaleY: 1.6, alpha: 1.6 },
                    { frameIndex: 4, duration: 150, scaleX: 1.8, scaleY: 1.8, alpha: 1.8 },
                    { frameIndex: 5, duration: 100, scaleX: 1.6, scaleY: 1.6, alpha: 1.6 },
                    { frameIndex: 6, duration: 100, scaleX: 1.4, scaleY: 1.4, alpha: 1.4 },
                    { frameIndex: 7, duration: 100, scaleX: 1.2, scaleY: 1.2, alpha: 1.2 }
                ],
                loop: false,
                totalDuration: 850,
                fps: 8
            }
        },
        
        masterball: {
            idle: {
                name: 'masterball_pulse',
                frames: [
                    { frameIndex: 0, duration: 150, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 1, duration: 150, scaleX: 1.05, scaleY: 1.05, alpha: 1.1 },
                    { frameIndex: 2, duration: 150, scaleX: 1.1, scaleY: 1.1, alpha: 1.2 },
                    { frameIndex: 3, duration: 150, scaleX: 1.15, scaleY: 1.15, alpha: 1.3 },
                    { frameIndex: 4, duration: 150, scaleX: 1.2, scaleY: 1.2, alpha: 1.4 },
                    { frameIndex: 5, duration: 150, scaleX: 1.15, scaleY: 1.15, alpha: 1.3 },
                    { frameIndex: 6, duration: 150, scaleX: 1.1, scaleY: 1.1, alpha: 1.2 },
                    { frameIndex: 7, duration: 150, scaleX: 1.05, scaleY: 1.05, alpha: 1.1 },
                    { frameIndex: 8, duration: 150, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 9, duration: 150, scaleX: 0.95, scaleY: 0.95, alpha: 0.9 }
                ],
                loop: true,
                totalDuration: 1500,
                fps: 6
            }
        }
    };

    // Rare Pokemon Animations (Tier 4) 
    static readonly RARE_ANIMATIONS: Record<string, PokemonAnimations> = {
        ditto: {
            idle: {
                name: 'ditto_morph',
                frames: [
                    { frameIndex: 0, duration: 200, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 1, duration: 200, scaleX: 0.9, scaleY: 1.1, alpha: 0.95 },
                    { frameIndex: 2, duration: 200, scaleX: 0.8, scaleY: 1.2, alpha: 0.9 },
                    { frameIndex: 3, duration: 200, scaleX: 0.9, scaleY: 1.1, alpha: 0.95 },
                    { frameIndex: 4, duration: 200, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 5, duration: 200, scaleX: 1.1, scaleY: 0.9, alpha: 1.05 }
                ],
                loop: true,
                totalDuration: 1200,
                fps: 5
            },
            special: {
                name: 'ditto_transform',
                frames: [
                    { frameIndex: 0, duration: 100, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 1, duration: 100, scaleX: 0.5, scaleY: 1.5, alpha: 0.8 },
                    { frameIndex: 2, duration: 100, scaleX: 0.3, scaleY: 1.7, alpha: 0.6 },
                    { frameIndex: 3, duration: 100, scaleX: 0.5, scaleY: 1.5, alpha: 0.8 },
                    { frameIndex: 4, duration: 100, scaleX: 1.0, scaleY: 1.0, alpha: 1.0 },
                    { frameIndex: 5, duration: 100, scaleX: 1.5, scaleY: 0.5, alpha: 1.2 }
                ],
                loop: false,
                totalDuration: 600,
                fps: 10
            }
        }
    };

    // Evolution Pokemon Animations (Tier 3)
    static readonly EVOLUTION_ANIMATIONS: Record<string, PokemonAnimations> = {
        charizard: {
            idle: {
                name: 'charizard_breathe',
                frames: [
                    { frameIndex: 0, duration: 300, scaleX: 1.0, scaleY: 1.0, offsetY: 0 },
                    { frameIndex: 1, duration: 300, scaleX: 1.02, scaleY: 1.02, offsetY: -2 },
                    { frameIndex: 2, duration: 300, scaleX: 1.04, scaleY: 1.04, offsetY: -4 },
                    { frameIndex: 3, duration: 300, scaleX: 1.02, scaleY: 1.02, offsetY: -2 },
                    { frameIndex: 4, duration: 300, scaleX: 1.0, scaleY: 1.0, offsetY: 0 },
                    { frameIndex: 5, duration: 300, scaleX: 0.98, scaleY: 0.98, offsetY: 2 },
                    { frameIndex: 6, duration: 300, scaleX: 0.96, scaleY: 0.96, offsetY: 4 },
                    { frameIndex: 7, duration: 300, scaleX: 0.98, scaleY: 0.98, offsetY: 2 }
                ],
                loop: true,
                totalDuration: 2400,
                fps: 3
            }
        },
        
        pikachu: {
            idle: {
                name: 'pikachu_sparkle',
                frames: [
                    { frameIndex: 0, duration: 200, scaleX: 1.0, alpha: 1.0 },
                    { frameIndex: 1, duration: 200, scaleX: 1.05, alpha: 1.1, offsetY: -1 },
                    { frameIndex: 2, duration: 200, scaleX: 1.1, alpha: 1.2, offsetY: -2 },
                    { frameIndex: 3, duration: 200, scaleX: 1.05, alpha: 1.1, offsetY: -1 }
                ],
                loop: true,
                totalDuration: 800,
                fps: 5
            }
        }
    };

    /**
     * Get animation data for a Pokemon
     */
    static getAnimation(pokemonName: string, tier: number, animationType: keyof PokemonAnimations = 'idle'): AnimationSequence | null {
        let animationSet: Record<string, PokemonAnimations> | undefined;
        
        switch (tier) {
            case 5:
                animationSet = this.LEGENDARY_ANIMATIONS;
                break;
            case 4:
                animationSet = this.RARE_ANIMATIONS;
                break;
            case 3:
            case 2:
                animationSet = this.EVOLUTION_ANIMATIONS;
                break;
            case 0:
                animationSet = this.SPECIAL_ANIMATIONS;
                break;
            default:
                return null;
        }
        
        const pokemonAnims = animationSet?.[pokemonName];
        return pokemonAnims?.[animationType] || null;
    }

    /**
     * Create animation player for Canvas or WebGL rendering
     */
    static createAnimationPlayer(sequence: AnimationSequence, onFrameChange?: (frameIndex: number) => void) {
        let currentFrame = 0;
        let elapsedTime = 0;
        let isPlaying = false;
        let lastTimestamp = 0;

        const player = {
            play() {
                isPlaying = true;
                lastTimestamp = performance.now();
            },
            
            pause() {
                isPlaying = false;
            },
            
            reset() {
                currentFrame = 0;
                elapsedTime = 0;
            },
            
            update(timestamp: number) {
                if (!isPlaying) return;
                
                const deltaTime = timestamp - lastTimestamp;
                elapsedTime += deltaTime;
                lastTimestamp = timestamp;
                
                // Check if we need to advance frame
                const frame = sequence.frames[currentFrame];
                if (elapsedTime >= frame.duration) {
                    elapsedTime = 0;
                    currentFrame++;
                    
                    if (currentFrame >= sequence.frames.length) {
                        if (sequence.loop) {
                            currentFrame = 0;
                        } else {
                            currentFrame = sequence.frames.length - 1;
                            isPlaying = false;
                        }
                    }
                    
                    onFrameChange?.(sequence.frames[currentFrame].frameIndex);
                }
            },
            
            getCurrentFrame(): AnimationFrame {
                return sequence.frames[currentFrame];
            },
            
            isPlaying() {
                return isPlaying;
            }
        };
        
        return player;
    }
}