import React from 'react';
import { Sprite } from 'pixi.js';
import { SymbolData } from '../types/GameTypes';

interface SymbolSpriteProps {
    symbol: SymbolData;
    x: number;
    y: number;
    onClick?: () => void;
}

const SymbolSprite: React.FC<SymbolSpriteProps> = ({ symbol, x, y, onClick }) => {
    const sprite = new Sprite(symbol.texture);

    sprite.x = x;
    sprite.y = y;
    sprite.interactive = true;
    sprite.buttonMode = true;

    if (onClick) {
        sprite.on('click', onClick);
    }

    return <>{sprite}</>;
};

export default SymbolSprite;