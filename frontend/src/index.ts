// Main entry point for Stake Engine Frontend SDK

export { GameEngine } from './components/GameEngine';
export { MathEngineService } from './services/MathEngineService';
export { StakeWebSDKIntegration } from './services/StakeWebSDK';

export type {
  GameConfig,
  GameState, 
  SpinResult,
  WinResult,
  FeatureResult,
  MathEngineEvent,
  FrontendSDKConfig
} from './types';

// SDK utilities
export * from './utils';

// Default configuration
export const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:8000/api',
  websocketUrl: 'ws://localhost:8000',
  enableLiveUpdates: true,
  debugMode: process.env.NODE_ENV === 'development'
};

// Initialize SDK with default settings
export function initializeStakeEngineSDK(config?: Partial<typeof DEFAULT_CONFIG>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  console.log('Stake Engine Frontend SDK initialized with config:', finalConfig);
  return finalConfig;
}