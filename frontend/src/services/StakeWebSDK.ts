// Integration with Stake Web SDK
import { GameState, SpinResult, GameConfig } from '../types';

// Mock Stake SDK imports - replace with actual imports when available
declare global {
  interface Window {
    Stake?: {
      init: (config: any) => void;
      game: {
        updateBalance: (amount: number) => void;
        displayWin: (amount: number) => void;
        updateGameState: (state: any) => void;
        showSpinResults: (results: SpinResult) => void;
      };
      ui: {
        showMessage: (message: string, type?: 'info' | 'warning' | 'error') => void;
        updateReels: (reels: number[][]) => void;
        highlightWins: (wins: any[]) => void;
      };
    };
  }
}

export class StakeWebSDKIntegration {
  private isInitialized: boolean = false;
  private gameConfig: GameConfig | null = null;

  constructor() {
    this.initializeSDK();
  }

  // Initialize Stake Web SDK
  private initializeSDK(): void {
    try {
      if (typeof window !== 'undefined' && window.Stake) {
        window.Stake.init({
          // SDK configuration
          enableDebug: process.env.NODE_ENV === 'development',
          theme: 'dark',
          language: 'en'
        });
        this.isInitialized = true;
        console.log('Stake Web SDK initialized successfully');
      } else {
        console.warn('Stake Web SDK not available - running in mock mode');
        this.setupMockSDK();
      }
    } catch (error) {
      console.error('Failed to initialize Stake Web SDK:', error);
      this.setupMockSDK();
    }
  }

  // Setup mock SDK for development/testing
  private setupMockSDK(): void {
    window.Stake = {
      init: (config: any) => console.log('Mock Stake SDK initialized', config),
      game: {
        updateBalance: (amount: number) => console.log('Balance updated:', amount),
        displayWin: (amount: number) => console.log('Win displayed:', amount),
        updateGameState: (state: any) => console.log('Game state updated:', state),
        showSpinResults: (results: SpinResult) => console.log('Spin results:', results)
      },
      ui: {
        showMessage: (message: string, type?: string) => console.log(`Message (${type}):`, message),
        updateReels: (reels: number[][]) => console.log('Reels updated:', reels),
        highlightWins: (wins: any[]) => console.log('Wins highlighted:', wins)
      }
    };
    this.isInitialized = true;
  }

  // Configure game with Stake SDK
  configureGame(gameConfig: GameConfig): void {
    this.gameConfig = gameConfig;
    if (this.isInitialized && window.Stake) {
      // Configure the game with Stake SDK
      console.log('Game configured with Stake SDK:', gameConfig);
    }
  }

  // Update player balance
  updateBalance(newBalance: number): void {
    if (this.isInitialized && window.Stake) {
      window.Stake.game.updateBalance(newBalance);
    }
  }

  // Display spin results
  displaySpinResults(results: SpinResult): void {
    if (this.isInitialized && window.Stake) {
      // Update reels display
      window.Stake.ui.updateReels(results.reels);
      
      // Highlight wins
      if (results.wins.length > 0) {
        window.Stake.ui.highlightWins(results.wins);
        window.Stake.game.displayWin(results.totalWin);
      }
      
      // Show complete results
      window.Stake.game.showSpinResults(results);
    }
  }

  // Update game state
  updateGameState(gameState: GameState): void {
    if (this.isInitialized && window.Stake) {
      window.Stake.game.updateGameState(gameState);
    }
  }

  // Show message to player
  showMessage(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (this.isInitialized && window.Stake) {
      window.Stake.ui.showMessage(message, type);
    }
  }

  // Check if SDK is ready
  isReady(): boolean {
    return this.isInitialized;
  }
}