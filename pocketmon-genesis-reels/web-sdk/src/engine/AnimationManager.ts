import * as PIXI from 'pixi.js';
import { ElementType, GridPosition } from '../types/GameTypes';

export class AnimationManager {
    private app: PIXI.Application;
    private particleContainers: Map<string, PIXI.ParticleContainer>;
    private animations: Map<string, PIXI.AnimatedSprite>;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.particleContainers = new Map();
        this.animations = new Map();
    }

    public async playEvolutionAnimation(
        sprite: PIXI.Sprite,
        from: string,
        to: string,
        position: GridPosition
    ): Promise<void> {
        const elementType = this.getElementTypeFromPocketMon(to);
        const particles = this.createElementalParticles(elementType, position);
        await this.playTransformationSequence(sprite, from, to);
        this.cleanupParticles(particles);
    }

    private createElementalParticles(element: ElementType, position: GridPosition): PIXI.ParticleContainer {
        const particles = new PIXI.ParticleContainer(1000, {
            scale: true,
            position: true,
            rotation: true,
            uvs: true,
            alpha: true
        });

        const emitterConfig = this.getElementEmitterConfig(element);
        const emitter = new PIXI.particles.Emitter(
            particles,
            emitterConfig
        );

        emitter.playOnceAndDestroy();
        this.app.stage.addChild(particles);

        return particles;
    }

    private getElementEmitterConfig(element: ElementType): any {
        const baseConfig = {
            lifetime: { min: 0.5, max: 2 },
            frequency: 0.1,
            emitterLifetime: 1,
            maxParticles: 1000,
            pos: { x: 0, y: 0 },
            behaviors: []
        };

        switch (element) {
            case 'fire':
                return {
                    ...baseConfig,
                    behaviors: [
                        {
                            type: 'alpha',
                            config: {
                                alpha: {
                                    list: [
                                        { value: 0, time: 0 },
                                        { value: 1, time: 0.1 },
                                        { value: 0, time: 1 }
                                    ]
                                }
                            }
                        },
                        {
                            type: 'scale',
                            config: {
                                scale: {
                                    list: [
                                        { value: 0.5, time: 0 },
                                        { value: 1, time: 0.5 },
                                        { value: 0.5, time: 1 }
                                    ]
                                }
                            }
                        }
                    ]
                };
        }
    }
}