export type Grid = any[][];

export type MultiplierMap = number[][];

export interface SpinConfig {
  rows: number;
  cols: number;
  weights: Record<string, number>;
  cellMultiplierCap: number;
}

export type SpinEvent =
  | { type: 'spinStart'; payload: { seed?: number } }
  | { type: 'cascadeStart'; payload: { index: number; chainMultiplier: number } }
  | { type: 'evolution'; payload: { step: 'T1_T2' | 'T2_T3'; species: string; tierBefore: number; tierAfter: number; cells: Array<{ row: number; col: number }>; eggsConsumed: Array<{ row: number; col: number }> } }
  | { type: 'win'; payload: { clusterId: string; cells: Array<{ row: number; col: number }>; symbol: { id: string; tier: number }; size: number; multiplier: number; winAmount: number } }
  | { type: 'wildInject'; payload: { index: number; positions: Array<{ row: number; col: number }> } }
  | { type: 'masterBall'; payload: { index: number; multiplier: number } }
  | { type: 'cascadeEnd'; payload: { index: number; removed: number } }
  | { type: 'spinEnd'; payload: { totalWinX: number } };

export interface SpinResult {
  grid: Grid;
  multiplierMap: MultiplierMap;
  totalWinX: number;
  events: SpinEvent[];
  uiHints: {
    scatters: Record<string, number>;
    bonusHint?: 'frenzy' | 'hunt' | 'epic';
    rush?: { progress: number; target: number };
  };
}
