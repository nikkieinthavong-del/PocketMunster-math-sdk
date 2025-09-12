import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import { useGameEngine } from '../hooks/useGameEngine';
import { GridPosition, SymbolData } from '../types/GameTypes';

interface PocketMonGridProps {
    width: number;
    height: number;
    rows: number;
    columns: number;
    onSymbolClick?: (symbol: SymbolData, position: GridPosition) => void;
}

export const PocketMonGrid: React.FC<PocketMonGridProps> = ({
    width,
    height,
    rows,
    columns,
    onSymbolClick
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const gameEngine = useGameEngine();
    const pixiAppRef = useRef<PIXI.Application>();

    useEffect(() => {
        if (gridRef.current) {
            initializePixiApp();
            setupGrid();
        }

        return () => {
            if (pixiAppRef.current) {
                pixiAppRef.current.destroy(true);
            }
        };
    }, []);

    const initializePixiApp = async (): Promise<void> => {
        pixiAppRef.current = new PIXI.Application({
            width,
            height,
            transparent: true,
            resolution: window.devicePixelRatio || 1
        });

        gridRef.current?.appendChild(pixiAppRef.current.view as HTMLCanvasElement);
        
        // Load grid textures and setup initial state
        await loadGridTextures();
        setupInitialSymbols();
    };

    const setupGrid = (): void => {
        // Create grid background
        const gridBackground = new PIXI.Graphics();
        gridBackground.beginFill(0x2c3e50, 0.8);
        gridBackground.drawRoundedRect(0, 0, width, height, 15);
        gridBackground.endFill();
        
        pixiAppRef.current?.stage.addChild(gridBackground);

        // Create grid lines
        const gridLines = new PIXI.Graphics();
        gridLines.lineStyle(2, 0x34495e, 0.6);
        
        const cellWidth = width / columns;
        const cellHeight = height / rows;

        for (let i = 1; i < columns; i++) {
            gridLines.moveTo(i * cellWidth, 0);
            gridLines.lineTo(i * cellWidth, height);
        }

        for (let i = 1; i < rows; i++) {
            gridLines.moveTo(0, i * cellHeight);
            gridLines.lineTo(width, i * cellHeight);
        }

        pixiAppRef.current?.stage.addChild(gridLines);
    };

    const loadGridTextures = async (): Promise<void> => {
        // Pre-load all symbol textures
        const symbols = gameEngine.getSymbols();
        for (const symbol of symbols) {
            const texture = await PIXI.Assets.load(
                `assets/symbols/${symbol.name}.png`
            );
            gameEngine.cacheTexture(symbol.name, texture);
        }
    };

    const setupInitialSymbols = (): void => {
        const cellWidth = width / columns;
        const cellHeight = height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const symbol = gameEngine.getSymbolAt({ row, col });
                const texture = gameEngine.getTexture(symbol.name);
                
                const sprite = new PIXI.Sprite(texture);
                sprite.width = cellWidth - 10;
                sprite.height = cellHeight - 10;
                sprite.x = col * cellWidth + 5;
                sprite.y = row * cellHeight + 5;
                sprite.interactive = true;
                sprite.buttonMode = true;
                
                sprite.on('click', () => {
                    onSymbolClick?.(symbol, { row, col });
                });

                pixiAppRef.current?.stage.addChild(sprite);
            }
        }
    };

    return <div ref={gridRef} className="pocketmon-grid" />;
};