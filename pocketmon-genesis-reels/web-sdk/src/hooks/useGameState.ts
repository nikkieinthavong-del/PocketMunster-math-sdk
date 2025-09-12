import { useState, useEffect } from 'react';
import { GameState } from '../types/StateTypes';

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        // Initialize game state here
        const initialState: GameState = {
            isRunning: false,
            currentBet: 1,
            totalWins: 0,
            // Add other state properties as needed
        };
        setGameState(initialState);
    }, []);

    const updateGameState = (newState: Partial<GameState>) => {
        setGameState(prevState => ({
            ...prevState,
            ...newState,
        }));
    };

    return { gameState, updateGameState };
};