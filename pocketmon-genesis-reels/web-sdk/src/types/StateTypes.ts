export interface GameState {
    isLoading: boolean;
    isGameActive: boolean;
    currentBet: number;
    totalWin: number;
    spinResult: SpinResult | null;
    freeSpinCount: number;
    evolutionTriggered: boolean;
}

export interface SpinResult {
    board: number[][];
    totalWin: number;
    events: GameEvent[];
}

export interface GameEvent {
    type: string;
    symbol?: string;
    positions?: GridPosition[];
    cluster?: ClusterData;
    bonusType?: string;
}

export interface ClusterData {
    symbol: string;
    positions: GridPosition[];
    size: number;
}

export interface GridPosition {
    row: number;
    col: number;
}