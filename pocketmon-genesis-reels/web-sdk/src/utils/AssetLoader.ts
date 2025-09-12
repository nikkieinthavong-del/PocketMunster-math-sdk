import * as PIXI from 'pixi.js';

export class AssetLoader {
    private static symbolTextures: Map<string, PIXI.Texture> = new Map();

    public static async loadSymbolTextures(symbols: string[]): Promise<void> {
        const loadPromises = symbols.map(async (symbol) => {
            const texture = await PIXI.Assets.load(`assets/symbols/${symbol}.png`);
            this.symbolTextures.set(symbol, texture);
        });

        await Promise.all(loadPromises);
    }

    public static getSymbolTexture(symbol: string): PIXI.Texture | undefined {
        return this.symbolTextures.get(symbol);
    }

    public static async loadAudioAssets(audioFiles: string[]): Promise<void> {
        const loadPromises = audioFiles.map(async (audioFile) => {
            await PIXI.Assets.load(`assets/audio/${audioFile}`);
        });

        await Promise.all(loadPromises);
    }
}