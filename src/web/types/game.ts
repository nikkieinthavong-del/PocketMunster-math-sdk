export type GameState = 'base' | 'hunt' | 'arena' | 'spins';

export type BonusFeatures = {
  upgradedEggs?: boolean;
  upgradedExplosion?: boolean;
  extraSpins?: boolean;
};

export type HistoryEvent =
  | { type: 'win'; clusters: number; size: number; win: number; timestamp: string }
  | { type: 'feature'; feature: string; spins?: number; upgrades?: number; cost?: number; timestamp: string }
  | { type: 'feature_win'; feature: 'hunt' | 'arena'; symbol?: string; leader?: string; ball?: string; combo?: number; win: number; timestamp?: string }
  | { type: 'feature_loss'; feature: 'hunt' | 'arena'; symbol?: string; timestamp?: string };