import { PocketMonGameEngine } from '../engine/GameEngine';
import { GameConfig } from '../types/GameTypes';

export class GenesisReels {
    private engine: PocketMonGameEngine;
    private config: GameConfig;

    constructor(config: GameConfig) {
        this.config = config;
        this.engine = new PocketMonGameEngine(this.config);
    }

    public startGame(): void {
        this.engine.initialize();
        this.engine.start();
    }

    public spinReels(): void {
        const result = this.engine.simulateSpin();
        this.handleSpinResult(result);
    }

    private handleSpinResult(result: any): void {
        // Process the result of the spin
        console.log('Spin Result:', result);
        // Additional logic for handling the spin result can be added here
    }

    public stopGame(): void {
        this.engine.stop();
    }
}