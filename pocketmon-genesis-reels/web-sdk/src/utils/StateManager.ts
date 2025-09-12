import { GameState } from '../types/StateTypes';

export class StateManager {
    private state: GameState;

    constructor(initialState: GameState) {
        this.state = initialState;
    }

    public getState(): GameState {
        return this.state;
    }

    public setState(newState: Partial<GameState>): void {
        this.state = { ...this.state, ...newState };
    }

    public resetState(): void {
        this.state = this.getInitialState();
    }

    private getInitialState(): GameState {
        return {
            score: 0,
            level: 1,
            isGameOver: false,
            // Add other initial state properties as needed
        };
    }
}