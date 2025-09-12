import { GameConfig, SpinResult } from '../types/GameTypes';

export class BonusRounds {
    private config: GameConfig;

    constructor(config: GameConfig) {
        this.config = config;
    }

    public startBonusRound(spinResult: SpinResult): void {
        // Logic to start the bonus round based on the spin result
        const bonusSymbols = this.getBonusSymbols(spinResult);
        if (bonusSymbols.length > 0) {
            this.triggerBonus(bonusSymbols);
        }
    }

    private getBonusSymbols(spinResult: SpinResult): string[] {
        // Extract bonus symbols from the spin result
        return spinResult.events
            .filter(event => event.type === 'bonus_triggered')
            .map(event => event.symbol);
    }

    private triggerBonus(bonusSymbols: string[]): void {
        // Implement the logic for triggering the bonus round
        console.log('Bonus round triggered with symbols:', bonusSymbols);
        // Additional bonus round logic goes here
    }
}