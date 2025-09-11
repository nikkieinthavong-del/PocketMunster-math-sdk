import React, { useState, useEffect, useCallback } from 'react';
import { MathEngineService } from '../services/MathEngineService';
import { StakeWebSDKIntegration } from '../services/StakeWebSDK';
import { GameConfig, GameState, SpinResult } from '../types';

interface GameEngineProps {
  gameId: string;
  apiUrl: string;
  websocketUrl: string;
  initialBalance: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({
  gameId,
  apiUrl,
  websocketUrl,
  initialBalance
}) => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    gameId,
    sessionId: `session_${Date.now()}`,
    bet: 1.0,
    balance: initialBalance,
    isPlaying: false
  });
  const [mathEngine] = useState(() => new MathEngineService(apiUrl, websocketUrl));
  const [stakeSDK] = useState(() => new StakeWebSDKIntegration());
  const [isConnected, setIsConnected] = useState(false);

  // Initialize math engine and Stake SDK
  useEffect(() => {
    const initialize = async () => {
      try {
        // Connect to math engine
        await mathEngine.connect();
        setIsConnected(true);

        // Load game configuration
        const config = await mathEngine.getGameConfig(gameId);
        setGameConfig(config);

        // Configure Stake SDK
        stakeSDK.configureGame(config);

        console.log(`Game engine initialized for ${gameId}`);
      } catch (error) {
        console.error('Failed to initialize game engine:', error);
        stakeSDK.showMessage('Failed to initialize game', 'error');
      }
    };

    initialize();

    return () => {
      mathEngine.disconnect();
    };
  }, [gameId, mathEngine, stakeSDK, apiUrl, websocketUrl]);

  // Handle spin execution
  const executeSpin = useCallback(async () => {
    if (!isConnected || gameState.isPlaying || gameState.balance < gameState.bet) {
      return;
    }

    setGameState(prev => ({ ...prev, isPlaying: true }));

    try {
      // Execute spin through math engine
      const spinResult = await mathEngine.executeSpin(gameId, gameState.bet, gameState);

      // Update balance
      const newBalance = gameState.balance - gameState.bet + spinResult.totalWin;
      const updatedGameState = {
        ...gameState,
        balance: newBalance,
        isPlaying: false,
        currentSpin: spinResult
      };

      setGameState(updatedGameState);

      // Display results through Stake SDK
      stakeSDK.displaySpinResults(spinResult);
      stakeSDK.updateBalance(newBalance);
      stakeSDK.updateGameState(updatedGameState);

      if (spinResult.totalWin > 0) {
        stakeSDK.showMessage(`You won ${spinResult.totalWin.toFixed(2)}!`, 'info');
      }

    } catch (error) {
      console.error('Spin execution failed:', error);
      setGameState(prev => ({ ...prev, isPlaying: false }));
      stakeSDK.showMessage('Spin failed - please try again', 'error');
    }
  }, [isConnected, gameState, gameId, mathEngine, stakeSDK]);

  // Handle bet change
  const updateBet = useCallback((newBet: number) => {
    if (newBet > 0 && newBet <= gameState.balance) {
      setGameState(prev => ({ ...prev, bet: newBet }));
    }
  }, [gameState.balance]);

  // Render game interface
  if (!gameConfig) {
    return (
      <div className="game-engine-loading">
        <h2>Loading Game Engine...</h2>
        <p>Initializing {gameId}</p>
      </div>
    );
  }

  return (
    <div className="game-engine">
      <div className="game-header">
        <h1>{gameConfig.workingName}</h1>
        <div className="game-info">
          <span>RTP: {(gameConfig.rtp * 100).toFixed(2)}%</span>
          <span>Max Win: {gameConfig.winCap}x</span>
        </div>
      </div>

      <div className="game-controls">
        <div className="balance-display">
          <label>Balance:</label>
          <span>${gameState.balance.toFixed(2)}</span>
        </div>

        <div className="bet-control">
          <label>Bet:</label>
          <input
            type="number"
            value={gameState.bet}
            onChange={(e) => updateBet(parseFloat(e.target.value) || 0)}
            min="0.01"
            max={gameState.balance}
            step="0.01"
            disabled={gameState.isPlaying}
          />
        </div>

        <button
          onClick={executeSpin}
          disabled={gameState.isPlaying || gameState.balance < gameState.bet || !isConnected}
          className="spin-button"
        >
          {gameState.isPlaying ? 'Spinning...' : 'SPIN'}
        </button>
      </div>

      <div className="game-display">
        {gameState.currentSpin && (
          <div className="spin-results">
            <h3>Last Spin Results:</h3>
            <div className="reels">
              {gameState.currentSpin.reels.map((reel, reelIndex) => (
                <div key={reelIndex} className="reel">
                  {reel.map((symbol, symbolIndex) => (
                    <div key={symbolIndex} className="symbol">
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {gameState.currentSpin.wins.length > 0 && (
              <div className="wins">
                <h4>Wins:</h4>
                {gameState.currentSpin.wins.map((win, index) => (
                  <div key={index} className="win">
                    {win.winType}: ${win.payout.toFixed(2)}
                  </div>
                ))}
                <div className="total-win">
                  Total Win: ${gameState.currentSpin.totalWin.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="connection-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
    </div>
  );
};