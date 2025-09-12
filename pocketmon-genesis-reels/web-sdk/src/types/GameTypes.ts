export interface SymbolData {
    name: string;
    baseValue: number;
    isWild?: boolean;
    isScatter?: boolean;
    isBonus?: boolean;
}

export interface ReelStrip {
    symbols: string[];
    weights: number[];
    cumulativeWeights: number[];
    totalWeight: number;
}

export interface Cluster {
    symbol: string;
    positions: GridPosition[];
    size: number;
}

export interface GameConfig {
    symbols: Record<string, SymbolData>;
    reelStrips: Record<string, ReelStrip>;
    clusterPaytable: Record<string, Record<number, number>>;
    evolutionRules: Record<string, any>;
    bonusTriggers: Record<string, any>;
}

export interface SpinResult {
    board: number[][];
    totalWin: number;
    events: GameEvent[];
}

export interface GameEvent {
    type: string;
    [key: string]: any; // Additional properties based on event type
}

export interface GridPosition {
    row: number;
    col: number;
}