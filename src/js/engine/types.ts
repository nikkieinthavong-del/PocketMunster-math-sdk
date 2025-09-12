export type Kind = 'standard' | 'wild' | 'egg' | 'scatter_pokeball' | 'scatter_pikachu' | 'scatter_trainer';

export interface Cell {
  kind: Kind;
  tier: 1 | 2 | 3 | 4 | 5 | 0; // 0 for specials
  id: string;
}

export interface SpinConfig {
  rows: number;
  cols: number;
  weights: Record<string, number>;
  cellMultiplierCap: number;
}

export interface SpinEvent {
  type:
    | 'spinStart'
    | 'win'
    | 'tumbleStart'
    | 'tumbleEnd'
    | 'cellMultiplierUp'
    | 'evolutionStep'
    | 'raidStart'
    | 'raidResolve'
    | 'featureEnter'
    | 'spinEnd'
    | 'scatters';
  payload?: any;
}

export type Grid = Cell[][];
export type MultiplierMap = number[][];

export interface SpinResult {
  grid: Grid;
  multiplierMap: MultiplierMap;
  events: SpinEvent[];
  totalWinX: number;
  uiHints?: any; // feature previews, etc.
}

export interface EvolutionOutcome {
  evolved: boolean;
  steps: Array<{ fromTier: number; toTier: number; positions: Array<[number, number]> }>;
}
