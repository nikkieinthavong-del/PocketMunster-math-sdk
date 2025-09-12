/**
 * PocketMon Genesis Reels - Frontend Sprite Loading System
 * Optimized sprite management with preloading, caching, and animations
 */

export interface SpriteConfig {
    id: number;
    tier: number;
    spritePath: string;
    animated: boolean;
    animationFrames?: number;
    animationSpeed?: number;
    dimensions: { width: number; height: number };
    scale: number;
    specialEffects?: string[];
    particleEffect?: string;
    glowEffect?: boolean;
}

export interface SpriteManifest {
    version: string;
    totalAssets: number;
    spriteCategories: {
        [category: string]: {
            count: number;
            priority: string;
            preload: boolean;
            sprites: string[];
        };
    };
    animationAssets: {
        [category: string]: {
            [pokemonName: string]: {
                frames: number;
                fps: number;
                files: string[];
            };
        };
    };
}

export class PocketMonSpriteLoader {
    private spriteCache: Map<string, HTMLImageElement> = new Map();
    private animationCache: Map<string, HTMLImageElement[]> = new Map();
    private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
    private manifest: SpriteManifest | null = null;
    private preloadProgress: number = 0;
    
    constructor(private basePath: string = '/assets/') {}

    /**
     * Initialize sprite system and load manifest
     */
    async initialize(): Promise<void> {
        try {
            const manifestResponse = await fetch(`${this.basePath}sprite_manifest.json`);
            this.manifest = await manifestResponse.json();
            
            // Preload critical sprites
            await this.preloadCriticalSprites();
            
            console.log('PocketMon sprite system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize sprite system:', error);
            throw error;
        }
    }

    /**
     * Preload high-priority sprites for immediate gameplay
     */
    private async preloadCriticalSprites(): Promise<void> {
        if (!this.manifest) return;

        const criticalCategories = ['special', 'legendary', 'rare'];
        const preloadPromises: Promise<void>[] = [];

        for (const category of criticalCategories) {
            const categoryData = this.manifest.spriteCategories[category];
            if (categoryData?.preload) {
                for (const spritePath of categoryData.sprites) {
                    preloadPromises.push(this.loadSprite(spritePath));
                }
            }
        }

        // Update progress as sprites load
        let completed = 0;
        const total = preloadPromises.length;
        
        const progressPromises = preloadPromises.map(async (promise) => {
            await promise;
            completed++;
            this.preloadProgress = (completed / total) * 100;
        });

        await Promise.all(progressPromises);
        console.log(`Preloaded ${total} critical sprites`);
    }

    /**
     * Load a single sprite with caching
     */
    async loadSprite(spritePath: string): Promise<HTMLImageElement> {
        // Check cache first
        if (this.spriteCache.has(spritePath)) {
            return this.spriteCache.get(spritePath)!;
        }

        // Check if already loading
        if (this.loadingPromises.has(spritePath)) {
            return this.loadingPromises.get(spritePath)!;
        }

        // Start loading
        const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.spriteCache.set(spritePath, img);
                this.loadingPromises.delete(spritePath);
                resolve(img);
            };
            
            img.onerror = () => {
                this.loadingPromises.delete(spritePath);
                console.error(`Failed to load sprite: ${spritePath}`);
                // Load fallback sprite
                this.loadFallbackSprite().then(resolve).catch(reject);
            };
            
            img.src = `${this.basePath}${spritePath}`;
        });

        this.loadingPromises.set(spritePath, loadPromise);
        return loadPromise;
    }

    /**
     * Load animation frames for animated sprites
     */
    async loadAnimation(pokemonName: string, category: 'legendary' | 'special' | 'rare'): Promise<HTMLImageElement[]> {
        const cacheKey = `${category}_${pokemonName}`;
        
        if (this.animationCache.has(cacheKey)) {
            return this.animationCache.get(cacheKey)!;
        }

        if (!this.manifest?.animationAssets[`${category}_animations`]?.[pokemonName]) {
            throw new Error(`Animation not found: ${pokemonName} in ${category}`);
        }

        const animData = this.manifest.animationAssets[`${category}_animations`][pokemonName];
        const framePromises = animData.files.map(filePath => this.loadSprite(filePath));
        
        const frames = await Promise.all(framePromises);
        this.animationCache.set(cacheKey, frames);
        
        return frames;
    }

    /**
     * Get sprite for Pokemon with fallback handling
     */
    async getSprite(pokemonName: string, tier: number): Promise<HTMLImageElement> {
        const category = this.getTierCategory(tier);
        const spritePath = `sprites/${category}/${pokemonName}.png`;
        
        try {
            return await this.loadSprite(spritePath);
        } catch (error) {
            console.warn(`Sprite not found for ${pokemonName}, using fallback`);
            return this.loadFallbackSprite();
        }
    }

    /**
     * Get animation frames for Pokemon
     */
    async getAnimation(pokemonName: string, tier: number): Promise<HTMLImageElement[] | null> {
        const category = this.getAnimationCategory(tier);
        if (!category) return null;

        try {
            return await this.loadAnimation(pokemonName, category);
        } catch (error) {
            console.warn(`Animation not found for ${pokemonName}`);
            return null;
        }
    }

    /**
     * Batch load sprites for performance
     */
    async batchLoadSprites(pokemonList: string[], maxConcurrent: number = 5): Promise<Map<string, HTMLImageElement>> {
        const results = new Map<string, HTMLImageElement>();
        const batches: string[][] = [];
        
        // Split into batches
        for (let i = 0; i < pokemonList.length; i += maxConcurrent) {
            batches.push(pokemonList.slice(i, i + maxConcurrent));
        }

        // Process batches sequentially
        for (const batch of batches) {
            const batchPromises = batch.map(async (pokemon) => {
                try {
                    const sprite = await this.getSprite(pokemon, 1); // Default tier 1
                    results.set(pokemon, sprite);
                } catch (error) {
                    console.error(`Failed to load sprite for ${pokemon}:`, error);
                }
            });
            
            await Promise.all(batchPromises);
        }

        return results;
    }

    /**
     * Load fallback sprite for errors
     */
    private async loadFallbackSprite(): Promise<HTMLImageElement> {
        const fallbackPath = 'sprites/ui/pokeball_simple.png';
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Fallback sprite failed to load'));
            img.src = `${this.basePath}${fallbackPath}`;
        });
    }

    /**
     * Get sprite category based on tier
     */
    private getTierCategory(tier: number): string {
        switch (tier) {
            case 5: return 'legendary';
            case 4: return 'rare';
            case 3:
            case 2: return 'evolution';
            case 1: return 'basic';
            default: return 'special';
        }
    }

    /**
     * Get animation category if supported
     */
    private getAnimationCategory(tier: number): 'legendary' | 'special' | 'rare' | null {
        switch (tier) {
            case 5: return 'legendary';
            case 4: return 'rare';
            case 0: return 'special';
            default: return null;
        }
    }

    /**
     * Clear cache to free memory
     */
    clearCache(): void {
        this.spriteCache.clear();
        this.animationCache.clear();
        this.loadingPromises.clear();
        console.log('Sprite cache cleared');
    }

    /**
     * Get preload progress percentage
     */
    getPreloadProgress(): number {
        return this.preloadProgress;
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { sprites: number; animations: number; loading: number } {
        return {
            sprites: this.spriteCache.size,
            animations: this.animationCache.size,
            loading: this.loadingPromises.size
        };
    }
}

// Export singleton instance
export const spriteLoader = new PocketMonSpriteLoader();