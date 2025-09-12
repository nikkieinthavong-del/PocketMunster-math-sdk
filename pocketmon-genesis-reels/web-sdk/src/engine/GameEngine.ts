import * as PIXI from 'pixi.js';
import { EventEmitter } from 'eventemitter3';
import { GameConfig, SymbolData, ReelStrip } from '../types/GameTypes';

export class PocketMonGameEngine extends EventEmitter {
    private app: PIXI.Application;
    private config: GameConfig;
    private currentState: GameState;
    private symbolTextures: Map<string, PIXI.Texture>;
    private animationManager: AnimationManager;
    private soundManager: SoundManager;

    constructor(config: GameConfig) {
        super();
        this.config = config;
        this.initEngine();
    }

    private async initEngine(): Promise<void> {
        // Initialize PIXI Application
        this.app = new PIXI.Application({
            width: 1920,
            height: 1080,
            backgroundColor: 0x1099bb,
            antialias: true
        });

        // Load all game assets
        await this.loadAssets();
        
        // Initialize managers
        this.animationManager = new AnimationManager(this.app);
        this.soundManager = new SoundManager();
        
        // Initialize game state
        this.currentState = this.createInitialState();
    }

    private async loadAssets(): Promise<void> {
        // Load all PocketMon sprites
        for (const symbol of this.config.symbols) {
            const texture = await PIXI.Assets.load(`assets/sprites/${symbol.name}.png`);
            this.symbolTextures.set(symbol.name, texture);
        }

        // Load animations and sounds
        await this.animationManager.loadAnimations();
        await this.soundManager.loadSounds();
    }

    public async processSpinResult(result: SpinResult): Promise<void> {
        // Process each event in the result
        for (const event of result.events) {
            await this.processEvent(event);
        }
        
        // Update game state
        this.updateGameState(result);
    }

    private async processEvent(event: GameEvent): Promise<void> {
        switch (event.type) {
            case 'symbols_landed':
                await this.animateSymbolsLanding(event.symbols);
                break;
            
            case 'cluster_win':
                await this.animateClusterWin(event.cluster);
                break;
            
            case 'evolution':
                await this.animateEvolution(event.from, event.to, event.positions);
                break;
            
            case 'cascade':
                await this.animateCascade(event.oldPositions, event.newSymbols);
                break;
            
            case 'bonus_triggered':
                await this.enterBonusMode(event.bonusType);
                break;
        }
    }

    private async animateEvolution(from: string, to: string, positions: GridPosition[]): Promise<void> {
        // Create elemental effects based on evolution type
        const element = this.getElementFromPocketMonType(to);
        
        // Play evolution animation for each position
        for (const position of positions) {
            const sprite = this.getSymbolAt(position);
            
            // Create particle effects
            const particles = this.createElementalParticles(element);
            
            // Transform sprite
            await this.animationManager.playEvolutionAnimation(sprite, from, to, particles);
            
            // Play sound effects
            this.soundManager.playEvolutionSound(element);
        }
    }
}