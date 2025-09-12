import { GameConfig, SymbolData } from '../types/GameTypes';

export class FeatureEngine {
    private config: GameConfig;
    private activeFeatures: Set<string>;

    constructor(config: GameConfig) {
        this.config = config;
        this.activeFeatures = new Set();
    }

    public activateFeature(featureName: string): void {
        if (this.config.features.includes(featureName)) {
            this.activeFeatures.add(featureName);
            this.triggerFeatureActivation(featureName);
        }
    }

    public deactivateFeature(featureName: string): void {
        if (this.activeFeatures.has(featureName)) {
            this.activeFeatures.delete(featureName);
            this.triggerFeatureDeactivation(featureName);
        }
    }

    private triggerFeatureActivation(featureName: string): void {
        // Logic to handle feature activation
        console.log(`Feature activated: ${featureName}`);
    }

    private triggerFeatureDeactivation(featureName: string): void {
        // Logic to handle feature deactivation
        console.log(`Feature deactivated: ${featureName}`);
    }

    public getActiveFeatures(): string[] {
        return Array.from(this.activeFeatures);
    }
}