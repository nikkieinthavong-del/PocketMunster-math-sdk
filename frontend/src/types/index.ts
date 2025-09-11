// Type definitions for Stake Engine Frontend SDK

export interface GameConfig {
  gameId: string;
  providerNumber: number;
  workingName: string;
  winCap: number;
  winType: string;
  rtp: number;
  numReels: number;
  numRows?: number;
  paylines?: number;
  ways?: number;
}

export interface GameState {
  gameId: string;
  sessionId: string;
  bet: number;
  balance: number;
  isPlaying: boolean;
  currentSpin?: SpinResult;
}

export interface SpinResult {
  reels: number[][];
  wins: WinResult[];
  totalWin: number;
  nextGameState?: string;
  features?: FeatureResult[];
}

export interface WinResult {
  winType: string;
  symbols: number[];
  positions?: number[][];
  multiplier: number;
  payout: number;
}

export interface FeatureResult {
  featureType: string;
  triggered: boolean;
  data?: any;
}

export interface MathEngineEvent {
  type: string;
  gameId: string;
  timestamp: number;
  data: any;
}

export interface FrontendSDKConfig {
  apiUrl: string;
  websocketUrl: string;
  gameConfig: GameConfig;
  enableLiveUpdates: boolean;
  debugMode: boolean;
}