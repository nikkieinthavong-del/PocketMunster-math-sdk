import React from 'react';
import { ReelStrip } from '../types/GameTypes';
import SymbolSprite from './SymbolSprite';

interface ReelContainerProps {
    reelStrip: ReelStrip;
    onSymbolClick: (symbol: string) => void;
}

const ReelContainer: React.FC<ReelContainerProps> = ({ reelStrip, onSymbolClick }) => {
    return (
        <div className="reel-container">
            {reelStrip.symbols.map((symbol, index) => (
                <SymbolSprite
                    key={index}
                    symbol={symbol}
                    onClick={() => onSymbolClick(symbol)}
                />
            ))}
        </div>
    );
};

export default ReelContainer;