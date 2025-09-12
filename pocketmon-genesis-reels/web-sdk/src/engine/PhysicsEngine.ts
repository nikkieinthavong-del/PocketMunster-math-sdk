import * as PIXI from 'pixi.js';

export class PhysicsEngine {
    private gravity: number;
    private friction: number;

    constructor(gravity: number = 9.8, friction: number = 0.1) {
        this.gravity = gravity;
        this.friction = friction;
    }

    public applyGravity(sprite: PIXI.Sprite): void {
        sprite.y += this.gravity;
    }

    public applyFriction(sprite: PIXI.Sprite): void {
        sprite.vx *= (1 - this.friction);
        sprite.vy *= (1 - this.friction);
    }

    public update(sprite: PIXI.Sprite): void {
        this.applyGravity(sprite);
        this.applyFriction(sprite);
    }
}