// Utility functions for frontend SDK

import { GameConfig, SpinResult } from '../types';

// Format currency values
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `$${amount.toFixed(decimals)}`;
}

// Format percentage values
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Validate game configuration
export function validateGameConfig(config: GameConfig): boolean {
  return !!(
    config.gameId &&
    config.workingName &&
    config.rtp > 0 && config.rtp <= 1 &&
    config.winCap > 0 &&
    config.numReels > 0
  );
}

// Calculate win display data
export function calculateWinDisplay(spinResult: SpinResult): {
  totalPayout: number;
  winCount: number;
  biggestWin: number;
  winTypes: string[];
} {
  const wins = spinResult.wins;
  const totalPayout = spinResult.totalWin;
  const winCount = wins.length;
  const biggestWin = wins.length > 0 ? Math.max(...wins.map(w => w.payout)) : 0;
  const winTypes = [...new Set(wins.map(w => w.winType))];

  return {
    totalPayout,
    winCount,
    biggestWin,
    winTypes
  };
}

// Generate unique session ID
export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `session_${timestamp}_${random}`;
}

// Validate bet amount
export function validateBet(bet: number, balance: number, minBet: number = 0.01): {
  isValid: boolean;
  reason?: string;
} {
  if (bet < minBet) {
    return { isValid: false, reason: `Minimum bet is ${formatCurrency(minBet)}` };
  }
  
  if (bet > balance) {
    return { isValid: false, reason: 'Insufficient balance' };
  }
  
  if (!Number.isFinite(bet) || bet <= 0) {
    return { isValid: false, reason: 'Invalid bet amount' };
  }

  return { isValid: true };
}

// Convert math engine reels to display format
export function formatReelsForDisplay(reels: number[][]): string[][] {
  // Convert numeric symbols to display strings
  // This would typically map to actual game symbols
  const symbolMap: { [key: number]: string } = {
    0: '🍒', // Cherry
    1: '🍋', // Lemon  
    2: '🍊', // Orange
    3: '🍇', // Grapes
    4: '🔔', // Bell
    5: '💎', // Diamond
    6: '⭐', // Star
    7: '🍀', // Lucky
    8: '👑', // Crown
    9: '💰'  // Money
  };

  return reels.map(reel => 
    reel.map(symbol => symbolMap[symbol] || `S${symbol}`)
  );
}

// Debounce function for user input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}