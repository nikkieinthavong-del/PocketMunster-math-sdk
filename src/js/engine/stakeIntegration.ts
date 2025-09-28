/**
 * Stake.com Platform Integration for Pocket Monsters
 * Casino-Grade Game Engine Interface
 */

import { enhancedSpin, EnhancedEngineOptions } from "./enhancedEngine.js";
import { AdvancedGraphicsEngine, GraphicsConfig } from "../graphics/AdvancedGraphicsEngine.js";
import { PokemonAnimationSystem } from "../animations/PokemonAnimationSystem.js";

export interface StakeGameConfig {
  // Core game settings
  gameId: string;
  version: string;
  provider: "pokemongenesis";

  // Stake platform requirements
  currency: string;
  minBet: number;
  maxBet: number;
  maxWin: number;

  // RTP (Return to Player) configuration
  baseRTP: number;
  bonusRTP: number;

  // Game mechanics
  grid: { rows: number; cols: number };
  maxCascades: number;

  // Visual settings
  quality: "low" | "medium" | "high" | "ultra";
  enableEffects: boolean;
  enableSound: boolean;

  // Platform integration
  jurisdictionCode?: string;
  gameMode: "real" | "demo" | "tournament";
  sessionId: string;
}

export interface StakeSpinRequest {
  bet: number;
  currency: string;
  sessionId: string;
  seed?: number;
  bonusMode?: "base" | "frenzy" | "hunt" | "epic";
  gameId: string;
}

export interface StakeSpinResponse {
  success: boolean;
  gameId: string;
  sessionId: string;
  roundId: string;

  // Game result
  result: {
    totalWin: number;
    currency: string;
    grid: any[][];
    multipliers: number[][];

    // Bonus information
    bonusTriggered?: boolean;
    bonusType?: string;
    freeSpinsAwarded?: number;

    // Visual effects data
    visualEffects?: {
      cascadeCount: number;
      specialEffects: string[];
      animationDuration: number;
    };
  };

  // Platform data
  balance?: {
    before: number;
    after: number;
  };

  // Error handling
  error?: {
    code: string;
    message: string;
  };

  // Compliance
  gameHistory?: {
    roundId: string;
    timestamp: number;
    verificationHash: string;
  };
}

export class StakePocketMonstersEngine {
  private config: StakeGameConfig;
  private graphicsEngine: AdvancedGraphicsEngine | null = null;
  private animationSystem: PokemonAnimationSystem | null = null;
  private sessionData: Map<string, any> = new Map();

  constructor(config: StakeGameConfig) {
    this.config = config;
    this.initializeVisualSystems();
  }

  private async initializeVisualSystems() {
    try {
      if (this.config.enableEffects) {
        // Initialize graphics engine
        const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
        if (canvas) {
          const graphicsConfig: GraphicsConfig = {
            canvas,
            gridSize: this.config.grid,
            cellSize: { width: 80, height: 80 },
            animationSpeed: this.config.quality === "low" ? 0.5 : 1.0,
            particleCount: this.getParticleCountForQuality(),
            qualitySettings: this.config.quality,
          };

          this.graphicsEngine = new AdvancedGraphicsEngine(graphicsConfig);

          // Initialize animation system
          this.animationSystem = new PokemonAnimationSystem();

          console.log(
            `[Stake Engine] Visual systems initialized - Quality: ${this.config.quality}`
          );
        }
      }
    } catch (error) {
      console.warn("[Stake Engine] Failed to initialize visual systems:", error);
    }
  }

  private getParticleCountForQuality(): number {
    switch (this.config.quality) {
      case "low":
        return 50;
      case "medium":
        return 150;
      case "high":
        return 300;
      case "ultra":
        return 500;
      default:
        return 150;
    }
  }

  /**
   * Main spin function compatible with Stake.com platform
   */
  async spin(request: StakeSpinRequest): Promise<StakeSpinResponse> {
    const startTime = Date.now();
    const roundId = this.generateRoundId();

    try {
      // Validate request
      const validation = this.validateSpinRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          gameId: request.gameId,
          sessionId: request.sessionId,
          roundId,
          result: {} as any,
          error: {
            code: "INVALID_REQUEST",
            message: validation.error || "Invalid spin request",
          },
        };
      }

      // Prepare enhanced engine options
      const engineOptions: EnhancedEngineOptions = {
        seed: request.seed || Date.now(),
        maxCascades: this.config.maxCascades,
        inBonusMode: request.bonusMode || "base",
        graphicsEngine: this.graphicsEngine || undefined,
        animationSystem: this.animationSystem || undefined,
        enableAdvancedEffects: this.config.enableEffects,
        qualitySettings: this.config.quality,
      };

      // Get game configuration
      const gameConfig = this.buildGameConfig();

      // Execute enhanced spin
      const spinResult = await enhancedSpin(gameConfig, request.bet, engineOptions);

      // Process bonuses
      const bonusInfo = this.processBonuses(spinResult);

      // Calculate visual effects data
      const visualEffectsData = this.calculateVisualEffects(spinResult, startTime);

      // Build Stake-compatible response
      const response: StakeSpinResponse = {
        success: true,
        gameId: request.gameId,
        sessionId: request.sessionId,
        roundId,
        result: {
          totalWin: spinResult.totalWinX * request.bet,
          currency: request.currency,
          grid: spinResult.grid,
          multipliers: spinResult.multiplierMap,
          bonusTriggered: bonusInfo.triggered,
          bonusType: bonusInfo.type,
          freeSpinsAwarded: bonusInfo.freeSpins,
          visualEffects: visualEffectsData,
        },
        gameHistory: {
          roundId,
          timestamp: startTime,
          verificationHash: this.generateVerificationHash(roundId, spinResult, request),
        },
      };

      // Store session data for compliance
      this.sessionData.set(roundId, {
        request,
        result: spinResult,
        timestamp: startTime,
      });

      console.log(
        `[Stake Engine] Spin completed - Round: ${roundId}, Win: ${response.result.totalWin}`
      );
      return response;
    } catch (error) {
      console.error("[Stake Engine] Spin error:", error);
      return {
        success: false,
        gameId: request.gameId,
        sessionId: request.sessionId,
        roundId,
        result: {} as any,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred during spin execution",
        },
      };
    }
  }

  private validateSpinRequest(request: StakeSpinRequest): { valid: boolean; error?: string } {
    if (!request.bet || request.bet < this.config.minBet || request.bet > this.config.maxBet) {
      return {
        valid: false,
        error: `Bet must be between ${this.config.minBet} and ${this.config.maxBet}`,
      };
    }

    if (!request.currency || request.currency !== this.config.currency) {
      return { valid: false, error: `Invalid currency: ${request.currency}` };
    }

    if (!request.sessionId) {
      return { valid: false, error: "Session ID is required" };
    }

    if (!request.gameId || request.gameId !== this.config.gameId) {
      return { valid: false, error: `Invalid game ID: ${request.gameId}` };
    }

    return { valid: true };
  }

  private buildGameConfig(): any {
    return {
      grid: this.config.grid,
      basePays: {
        pikachu: 1.0,
        charmander: 1.2,
        squirtle: 1.4,
        bulbasaur: 1.6,
        jigglypuff: 2.0,
        eevee: 2.5,
      },
      symbolWeights: {
        pikachu: 12,
        charmander: 11,
        squirtle: 11,
        bulbasaur: 11,
        jigglypuff: 10,
        eevee: 9,
        wild: 1,
        freeSpins: 1,
        pokeball: 1,
        egg: 1,
      },
      engine: {
        chanceAddMultiplier: 0.3,
        chanceMasterBall: 0.15,
        hunt: {
          rushTarget: 50,
          wildPerCascade: 2,
        },
      },
      multipliers: {
        cellMax: 8192,
      },
      evolution: {
        tiers: {
          pikachu: { 2: "raichu" },
          charmander: { 2: "charmeleon", 3: "charizard" },
          squirtle: { 2: "wartortle", 3: "blastoise" },
          bulbasaur: { 2: "ivysaur", 3: "venusaur" },
        },
      },
    };
  }

  private processBonuses(spinResult: any): {
    triggered: boolean;
    type?: string;
    freeSpins?: number;
  } {
    const scatters = spinResult.uiHints?.scatters || {};

    if (scatters.freeSpins >= 3) {
      return {
        triggered: true,
        type: "frenzy",
        freeSpins: 10 + (scatters.freeSpins - 3) * 5,
      };
    }

    if (scatters.pokeball >= 4) {
      return {
        triggered: true,
        type: "hunt",
        freeSpins: 8 + (scatters.pokeball - 4) * 3,
      };
    }

    return { triggered: false };
  }

  private calculateVisualEffects(spinResult: any, startTime: number): any {
    const effects: string[] = [];
    let animationDuration = 1000; // Base duration

    // Add effects based on game events
    const masterBallEvents = spinResult.events.filter((e: any) => e.type === "masterBall");
    if (masterBallEvents.length > 0) {
      effects.push("masterball_explosion");
      animationDuration += masterBallEvents.length * 2000;
    }

    const cascadeEvents = spinResult.events.filter((e: any) => e.type === "cascadeEnd");
    if (cascadeEvents.length > 5) {
      effects.push("mega_cascade");
      animationDuration += 1000;
    }

    const totalWin = spinResult.totalWinX;
    if (totalWin > 50) {
      effects.push("big_win");
      animationDuration += 1500;
    }
    if (totalWin > 100) {
      effects.push("mega_win");
      animationDuration += 2000;
    }

    return {
      cascadeCount: cascadeEvents.length,
      specialEffects: effects,
      animationDuration: Math.min(animationDuration, 10000), // Cap at 10 seconds
    };
  }

  private generateRoundId(): string {
    return `PKM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationHash(
    roundId: string,
    result: any,
    request: StakeSpinRequest
  ): string {
    // Simple hash for demo - in production, use proper cryptographic hash
    const data = `${roundId}${result.totalWinX}${request.bet}${request.seed}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  /**
   * Get game information for Stake platform
   */
  getGameInfo(): any {
    return {
      gameId: this.config.gameId,
      name: "Pocket Monsters",
      provider: this.config.provider,
      version: this.config.version,
      rtp: {
        base: this.config.baseRTP,
        bonus: this.config.bonusRTP,
      },
      betLimits: {
        min: this.config.minBet,
        max: this.config.maxBet,
        maxWin: this.config.maxWin,
      },
      features: [
        "cascading_reels",
        "multipliers",
        "bonus_rounds",
        "free_spins",
        "special_symbols",
        "progressive_multipliers",
      ],
      grid: this.config.grid,
      paylines: "cluster_pays",
      volatility: "medium-high",
      theme: "pokemon",
      technology: "webgl2_enhanced",
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.graphicsEngine) {
      // Cleanup graphics engine resources (implementation specific)
      this.graphicsEngine = null;
    }

    if (this.animationSystem) {
      // Cleanup animation system resources (implementation specific)
      this.animationSystem = null;
    }

    this.sessionData.clear();
    console.log("[Stake Engine] Resources disposed");
  }

  /**
   * Update quality settings dynamically
   */
  updateQualitySettings(quality: "low" | "medium" | "high" | "ultra"): void {
    this.config.quality = quality;

    if (this.graphicsEngine) {
      // Reinitialize graphics engine with new quality settings
      const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
      if (canvas) {
        const graphicsConfig: GraphicsConfig = {
          canvas,
          gridSize: this.config.grid,
          cellSize: { width: 80, height: 80 },
          animationSpeed: quality === "low" ? 0.5 : 1.0,
          particleCount: this.getParticleCountForQuality(),
          qualitySettings: quality,
        };

        this.graphicsEngine = new AdvancedGraphicsEngine(graphicsConfig);
      }
    }

    console.log(`[Stake Engine] Quality updated to: ${quality}`);
  }
}

// Export factory function for easy initialization
export function createStakePocketMonstersEngine(
  config: StakeGameConfig
): StakePocketMonstersEngine {
  return new StakePocketMonstersEngine(config);
}

// Default configuration for Stake.com platform
export const defaultStakeConfig: StakeGameConfig = {
  gameId: "pocket_monsters_genesis",
  version: "1.0.0",
  provider: "pokemongenesis",
  currency: "USD",
  minBet: 0.01,
  maxBet: 100.0,
  maxWin: 50000,
  baseRTP: 96.5,
  bonusRTP: 97.2,
  grid: { rows: 7, cols: 7 },
  maxCascades: 20,
  quality: "high",
  enableEffects: true,
  enableSound: true,
  gameMode: "real",
  sessionId: "default_session",
};
