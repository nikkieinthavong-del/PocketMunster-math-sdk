import React from 'react';
import { PocketMonGrid } from './PocketMonGrid';
import { ReelContainer } from './ReelContainer';
import { useGameEngine } from '../hooks/useGameEngine';

const GameUI: React.FC = () => {
    const { gameState, handleSymbolClick } = useGameEngine();

    return (
        <div className="game-ui">
            <h1>PocketMon Genesis Reels</h1>
            <ReelContainer reels={gameState.reels} />
            <PocketMonGrid 
                width={800} 
                height={600} 
                rows={7} 
                columns={7} 
                onSymbolClick={handleSymbolClick} 
            />
            <div className="game-info">
                <p>Current Bet: {gameState.currentBet}</p>
                <p>Total Wins: {gameState.totalWins}</p>
            </div>
        </div>
    );
};

export default GameUI;