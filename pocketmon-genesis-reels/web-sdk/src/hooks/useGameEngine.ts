import { useEffect, useState } from 'react';
import { PocketMonGameEngine } from '../engine/GameEngine';

export const useGameEngine = () => {
    const [engine, setEngine] = useState<PocketMonGameEngine | null>(null);

    useEffect(() => {
        const gameEngine = new PocketMonGameEngine(/* pass any required config here */);
        setEngine(gameEngine);

        return () => {
            gameEngine.destroy(); // Clean up the engine on unmount
        };
    }, []);

    return engine;
};