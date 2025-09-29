/**
 * Main Game Controller for PocketMon Genesis
 * Orchestrates all game mechanics, animations, and RTP optimization
 */

import { spin } from '../engine/engine.js';
import { performEvolution, performMorphing } from '../engine/evolution.js';
import { performCascadeSequence } from '../engine/tumble.js';
import { calculateWaysWins, calculateMegaWays } from '../engine/ways.js';
import { findClusters } from '../engine/cluster.js';
import { enterFreeSpins, stepFreeSpins, executeMegaSpin } from '../features/freespins.js';
import { AnimationEngine } from './AnimationEngine.js';
import type { Grid, MultiplierMap, SpinResult } from '../engine/types.js';

export interface GameState {
  balance: number;
  currentBet: number;
  totalWinX: number;
  multiplierMap: MultiplierMap;
  freeSpinsState?: any;
  currentGrid: Grid;
  gameMode: 'base' | 'freespins' | 'megaspin';
  rtpTarget: number;
  sessionStats: {
    totalSpins: number;
    totalWins: number;
    biggestWin: number;
    rtpCurrent: number;
    evolutionCount: number;
    megaWinCount: number;
  };
}

export interface RTOConfig {
  targetRTP: number; // 0.92 - 0.965
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  hitFrequency: number; // 0.20 - 0.40
  maxWinCap: number; // Maximum single win as multiple of bet
  features: {
    clusterPays: boolean;
    waysPays: boolean;
    tumbleMechanics: boolean;
    evolutionSystem: boolean;
    morphingMechanics: boolean;
    freeSpins: boolean;
    megaSpins: boolean;
  };
}

export class GameController {
  private gameState: GameState;
  private config: any;
  private rtpConfig: RTOConfig;
  private animationEngine?: AnimationEngine;
  private paytables: Map<string, Record<number, number>> = new Map();

  constructor(canvas?: HTMLCanvasElement, config: any = {}) {
    this.config = config;
    this.rtpConfig = this.createOptimalRTPConfig();
    this.gameState = this.initializeGameState();

    if (canvas) {
      this.animationEngine = new AnimationEngine(canvas, {
        enableParticles: true,
        enableSpine: true,
        quality: 'ultra',
        frameRate: 60,
        particleDensity: 1.0,
      });
      // Warm up particle pools for smoother first visuals
      this.animationEngine.preloadParticleEffects();
    }

    this.setupPaytables();
  }

  private createOptimalRTPConfig(): RTOConfig {
    return {
      targetRTP: 0.965, // Target 96.5% RTP per Stake guidelines
      volatility: 'high',
      hitFrequency: 0.28,
      maxWinCap: 5000, // 5000x max win
      features: {
        clusterPays: true,
        waysPays: true,
        tumbleMechanics: true,
        evolutionSystem: true,
        morphingMechanics: true,
        freeSpins: true,
        megaSpins: true,
      },
    };
  }

  private initializeGameState(): GameState {
    return {
      balance: 1000,
      currentBet: 1,
      totalWinX: 0,
      multiplierMap: Array.from({ length: 7 }, () => Array.from({ length: 7 }, () => 1)),
      currentGrid: Array.from({ length: 7 }, () =>
        Array.from({ length: 7 }, () => ({
          kind: 'standard' as const,
          tier: 1 as const,
          id: 'tier1_blank',
        })),
      ),
      gameMode: 'base',
      rtpTarget: this.rtpConfig.targetRTP,
      sessionStats: {
        totalSpins: 0,
        totalWins: 0,
        biggestWin: 0,
        rtpCurrent: 0,
        evolutionCount: 0,
        megaWinCount: 0,
      },
    };
  }

  private setupPaytables(): void {
    // Tier 1 Pokemon (Basic forms)
    this.paytables.set('tier1', {
      3: 0.5, // 3 symbols = 0.5x bet
      4: 2, // 4 symbols = 2x bet
      5: 8, // 5 symbols = 8x bet
      6: 25, // 6 symbols = 25x bet
      7: 100, // 7 symbols = 100x bet
    });

    // Tier 2 Pokemon (First evolutions)
    this.paytables.set('tier2', {
      3: 1.5,
      4: 6,
      5: 24,
      6: 75,
      7: 300,
    });

    // Tier 3 Pokemon (Final evolutions)
    this.paytables.set('tier3', {
      3: 5,
      4: 20,
      5: 80,
      6: 250,
      7: 1000,
    });

    // Mega Pokemon (Special forms)
    this.paytables.set('mega', {
      2: 10,
      3: 50,
      4: 200,
      5: 800,
      6: 2000,
      7: 5000,
    });

    // Cluster pay multipliers
    this.paytables.set('cluster_bonus', {
      5: 1, // 5-symbol cluster
      8: 2, // 8-symbol cluster
      12: 5, // 12-symbol cluster
      15: 10, // 15-symbol cluster
      20: 25, // 20-symbol cluster
      25: 100, // 25+ symbol cluster
    });
  }

  /**
   * Execute a complete game spin with all mechanics
   */
  public async executeSpin(bet: number = this.gameState.currentBet): Promise<{
    result: SpinResult;
    animations: Array<{ type: string; data: any }>;
    winAmount: number;
    features: Array<{ type: string; data: any }>;
  }> {
    this.gameState.currentBet = bet;
    this.gameState.sessionStats.totalSpins++;

    // RTP adjustment based on session performance
    const adjustedConfig = this.adjustConfigForRTP();

    // Execute base spin
    const spinResult = spin(adjustedConfig, bet, {
      seed: Date.now() + Math.random() * 1000000,
      initMultiplierMap: this.gameState.multiplierMap,
    });

    this.gameState.currentGrid = spinResult.grid as Grid;
    let totalWinAmount = spinResult.totalWinX || 0;
    const animations: Array<{ type: string; data: any }> = [];
    const features: Array<{ type: string; data: any }> = [];

    // Animate reel spin
    // Animate reel spin (gated by visuals config)
    if (this.animationEngine && this.isVisualEnabled('enableReelSpin', true)) {
      animations.push({
        type: 'reel_spin',
        data: { duration: 2000, anticipation: totalWinAmount > bet * 10 },
      });
    }

    // Process cluster pays
    if (this.rtpConfig.features.clusterPays) {
      const clusters = findClusters(this.gameState.currentGrid, 5);
      if (clusters.length > 0) {
        const clusterWins = this.calculateClusterWins(clusters);
        totalWinAmount += clusterWins.totalWin;

        features.push({
          type: 'cluster_wins',
          data: { clusters, winAmount: clusterWins.totalWin },
        });

        if (this.animationEngine && this.isVisualEnabled('enableClusterCelebrate', true)) {
          animations.push({
            type: 'cluster_celebration',
            data: { clusters, tier: Math.max(...clusters.map((c) => c.tier)) },
          });
        }
      }
    }

    // Process ways pays
    if (this.rtpConfig.features.waysPays) {
      const waysResult = calculateWaysWins(this.gameState.currentGrid, this.getPaytableForWays());
      if (waysResult.totalWinAmount > 0) {
        totalWinAmount += waysResult.totalWinAmount;

        features.push({
          type: 'ways_wins',
          data: waysResult,
        });
      }

      // Check for mega ways
      const megaWaysResult = calculateMegaWays(
        this.gameState.currentGrid,
        this.getPaytableForWays(),
      );
      if (megaWaysResult.megaWins.length > 0) {
        totalWinAmount += megaWaysResult.megaWins.reduce((sum, win) => sum + win.bonusAmount, 0);
        this.gameState.sessionStats.megaWinCount++;

        features.push({
          type: 'mega_ways',
          data: megaWaysResult.megaWins,
        });

        if (this.animationEngine && this.isVisualEnabled('enableMegaWinCelebration', true)) {
          animations.push({
            type: 'mega_win_celebration',
            data: { winAmount: totalWinAmount },
          });
        }
      }
    }

    // Process evolution mechanics
    if (this.rtpConfig.features.evolutionSystem) {
      const evolutionResult = performEvolution(this.gameState.currentGrid);
      if (evolutionResult.evolved) {
        this.gameState.sessionStats.evolutionCount++;

        features.push({
          type: 'evolution',
          data: evolutionResult,
        });

        // Evolution bonus multiplier
        const evolutionBonus = this.calculateEvolutionBonus(evolutionResult.steps);
        totalWinAmount += evolutionBonus;

        if (this.animationEngine && this.isVisualEnabled('enableEvolutionAnimation', true)) {
          animations.push({
            type: 'evolution_animation',
            data: evolutionResult,
          });
        }
      }
    }

    // Process morphing mechanics
    if (this.rtpConfig.features.morphingMechanics) {
      const morphingResult = performMorphing(this.gameState.currentGrid);
      if (morphingResult.morphed) {
        features.push({
          type: 'morphing',
          data: morphingResult,
        });

        // Recalculate wins after morphing
        const postMorphWins = this.recalculateWinsAfterMorphing();
        totalWinAmount += postMorphWins;

        // Enqueue light morphing FX
        if (this.animationEngine && this.isVisualEnabled('enableMorphingFX', true)) {
          animations.push({ type: 'morphing_fx', data: { steps: morphingResult.morphSteps } });
        }
      }
    }

    // Process tumble/cascade mechanics
    if (this.rtpConfig.features.tumbleMechanics && totalWinAmount > 0) {
      const cascadeResult = await this.processCascadeSequence();
      totalWinAmount += cascadeResult.totalWins;

      if (cascadeResult.cascadeCount > 0) {
        features.push({
          type: 'cascades',
          data: cascadeResult,
        });

        if (this.animationEngine && this.isVisualEnabled('enableCascadeFX', true)) {
          animations.push({
            type: 'cascade_sequence',
            data: cascadeResult,
          });
        }
      }
    }

    // Check for free spins trigger
    if (this.rtpConfig.features.freeSpins) {
      const scatterPositions: Array<[number, number]> = [];
      let scatterCount = 0;
      for (let r = 0; r < this.gameState.currentGrid.length; r++) {
        for (let c = 0; c < this.gameState.currentGrid[0].length; c++) {
          if (this.gameState.currentGrid[r][c].kind.includes('scatter')) {
            scatterCount++;
            scatterPositions.push([r, c]);
          }
        }
      }
      if (scatterPositions.length > 0 && this.isVisualEnabled('enableScatterPulse', true)) {
        // Add a light visual pulse when scatters land (gated by visuals config)
        animations.push({
          type: 'scatters_pulse',
          data: { positions: scatterPositions, count: scatterCount },
        });
      }
      // Near-miss anticipation: exactly 2 scatters
      if (
        scatterCount === 2 &&
        this.animationEngine &&
        this.isVisualEnabled('enableScatterAnticipation', true)
      ) {
        animations.push({ type: 'scatter_anticipation', data: { positions: scatterPositions } });
      }
      if (scatterCount >= 3) {
        const freeSpinsState = enterFreeSpins(adjustedConfig, scatterCount, Date.now());
        this.gameState.freeSpinsState = freeSpinsState;
        this.gameState.gameMode = 'freespins';

        features.push({
          type: 'freespins_trigger',
          data: { scatterCount, spinsAwarded: freeSpinsState.spinsTotal },
        });

        if (this.animationEngine) {
          if (this.animationEngine && this.isVisualEnabled('enableFsEntrance', true)) {
            animations.push({
              type: 'freespins_entrance',
              data: { scatterCount },
            });
          }
        }
      }
    }

    // Update session stats
    this.updateSessionStats(totalWinAmount, bet);

    // Track biggest win
    if (totalWinAmount > this.gameState.sessionStats.biggestWin) {
      this.gameState.sessionStats.biggestWin = totalWinAmount;
    }

    // RTP compliance check
    this.verifyRTPCompliance();

    // If an AnimationEngine is present, play the queued animations now
    if (this.animationEngine && animations.length > 0) {
      await this.playQueuedAnimations(animations, totalWinAmount);
    }

    return {
      result: {
        ...spinResult,
        totalWinX: totalWinAmount,
      },
      animations,
      winAmount: totalWinAmount,
      features,
    };
  }

  /**
   * Translate simple animation descriptors into concrete AnimationEngine calls.
   * Intentionally lightweight to keep momentum; extend mapping as we add effects.
   */
  private async playQueuedAnimations(
    animations: Array<{ type: string; data: any }>,
    totalWinAmount: number,
  ): Promise<void> {
    const engine = this.animationEngine!;

    // A tiny default symbol set for mock reel rendering
    const DEFAULT_SYMBOLS = ['pikachu', 'charizard', 'blastoise', 'venusaur', 'mewtwo'];

    for (const item of animations) {
      try {
        switch (item.type) {
          case 'reel_spin': {
            // Drive a basic 7-reel spin with optional anticipation
            const anticipation = !!item.data?.anticipation;
            const reelConfigs = Array.from({ length: 7 }, (_, reelIndex) => ({
              reelIndex,
              symbols: DEFAULT_SYMBOLS,
              finalPosition: 100 + reelIndex * 25,
              anticipation,
            }));
            await engine.spinReels(reelConfigs);
            break;
          }

          case 'evolution_animation': {
            const steps = item.data?.steps ?? [];
            if (Array.isArray(steps) && steps.length > 0) {
              for (const step of steps) {
                const positions: Array<[number, number]> = step.positions ?? [];
                const fromSpecies: string = step.species ?? 'unknown';
                const toSpecies: string = step.nextForm ?? 'evolved';
                if (positions.length > 0) {
                  await engine.playEvolutionAnimation(positions, fromSpecies, toSpecies);
                }
              }
            }
            break;
          }

          case 'cluster_celebration': {
            const clusters = item.data?.clusters ?? [];
            const tier = item.data?.tier ?? 1;
            // Flatten positions across clusters for a quick celebratory burst
            const positions: Array<[number, number]> = clusters.flatMap((c: any) => c.positions);
            if (positions.length > 0) {
              await engine.playClusterWinAnimation(positions, tier);
            }
            break;
          }

          case 'mega_win_celebration': {
            const winAmount = item.data?.winAmount ?? totalWinAmount;
            if (winAmount > 0) {
              await engine.playMegaWinAnimation(winAmount);
            }
            break;
          }

          case 'scatters_pulse': {
            const positions: Array<[number, number]> = item.data?.positions ?? [];
            const count = item.data?.count ?? positions.length;
            if (positions.length > 0) {
              // Slightly stronger pulse as more scatters land
              const intensity = Math.min(0.4 + Math.max(count - 1, 0) * 0.12, 1.0);
              await engine.playScatterPulse(positions, intensity);
            }
            break;
          }

          // Skip cascade_sequence here: cascades are already animated within processCascadeSequence()
          case 'cascade_sequence':
            break;

          // Future: add a dedicated entrance animation in AnimationEngine
          case 'freespins_entrance':
            await engine.playFreeSpinsEntrance(item.data?.scatterCount ?? 3);
            break;

          case 'scatter_anticipation': {
            const positions: Array<[number, number]> = item.data?.positions ?? [];
            if (positions.length > 0) {
              await engine.playScatterAnticipation(positions);
            }
            break;
          }

          case 'morphing_fx': {
            const steps = item.data?.steps ?? [];
            if (Array.isArray(steps) && steps.length > 0) {
              const positions: Array<[number, number]> = steps
                .map((s: any) => s.position)
                .filter(Boolean);
              if (positions.length > 0) {
                await engine.playMorphingAnimation(positions);
              }
            }
            break;
          }

          default:
            // Unknown animation type; ignore to keep flow resilient
            break;
        }
      } catch (err) {
        // Swallow animation errors to avoid breaking the spin result
        // eslint-disable-next-line no-console
        console.warn('Animation play failed:', item.type, err);
      }
    }
  }

  private calculateClusterWins(
    clusters: Array<{ id: string; positions: Array<[number, number]>; tier: number }>,
  ): {
    totalWin: number;
    clusterWins: Array<{ cluster: any; winAmount: number }>;
  } {
    let totalWin = 0;
    const clusterWins: Array<{ cluster: any; winAmount: number }> = [];

    for (const cluster of clusters) {
      const tierKey = `tier${cluster.tier}`;
      const basePayout = this.paytables.get(tierKey)?.[cluster.positions.length] || 0;

      // Cluster size bonus
      const clusterBonus =
        this.paytables.get('cluster_bonus')?.[Math.min(cluster.positions.length, 25)] || 1;

      // Position multipliers
      const positionMultiplier = cluster.positions.reduce((mult, [r, c]) => {
        return mult * (this.gameState.multiplierMap[r][c] || 1);
      }, 1);

      const winAmount = basePayout * clusterBonus * positionMultiplier * this.gameState.currentBet;
      totalWin += winAmount;

      clusterWins.push({ cluster, winAmount });
    }

    return { totalWin, clusterWins };
  }

  private calculateEvolutionBonus(evolutionSteps: any[]): number {
    let bonus = 0;
    for (const step of evolutionSteps) {
      const evolutionMultiplier = step.megaEvolution ? 50 : 10;
      bonus += this.gameState.currentBet * evolutionMultiplier * step.positions.length;
    }
    return bonus;
  }

  private async processCascadeSequence(): Promise<{
    totalWins: number;
    cascadeCount: number;
    finalGrid: Grid;
  }> {
    let totalWins = 0;
    let cascadeCount = 0;
    let currentGrid = this.gameState.currentGrid;

    while (cascadeCount < 8) {
      // Max 8 cascades
      const clusters = findClusters(currentGrid, 5);
      if (clusters.length === 0) break;

      // Calculate wins for this cascade
      const cascadeWins = this.calculateClusterWins(clusters);
      totalWins += cascadeWins.totalWin;

      // Apply cascade multiplier
      const cascadeMultiplier = 1 + cascadeCount * 0.5; // +50% per cascade
      totalWins *= cascadeMultiplier;

      // Remove winning symbols and tumble
      // (Simplified - actual implementation would use the tumble system)
      cascadeCount++;

      // Animate cascade if animation engine available
      if (this.animationEngine) {
        await this.animationEngine.playCascadeAnimation(
          clusters.flatMap((c) => c.positions),
          [], // New positions would be calculated by tumble system
        );
      }
    }

    return {
      totalWins,
      cascadeCount,
      finalGrid: currentGrid,
    };
  }

  private countScatters(grid: Grid): number {
    let count = 0;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        if (grid[r][c].kind.includes('scatter')) {
          count++;
        }
      }
    }
    return count;
  }

  // Read a visuals flag from config with a default fallback
  private isVisualEnabled(
    flag:
      | 'enableReelSpin'
      | 'enableScatterPulse'
      | 'enableFsEntrance'
      | 'enableEvolutionAnimation'
      | 'enableMorphingFX'
      | 'enableClusterCelebrate'
      | 'enableMegaWinCelebration'
      | 'enableCascadeFX'
      | 'enableScatterAnticipation',
    def = true,
  ): boolean {
    const visuals = this.config?.engine?.visuals ?? {};
    const val = visuals[flag];
    return typeof val === 'boolean' ? val : def;
  }

  private recalculateWinsAfterMorphing(): number {
    // Recalculate cluster and ways wins after morphing
    const clusters = findClusters(this.gameState.currentGrid, 5);
    const clusterWins = this.calculateClusterWins(clusters);

    const waysResult = calculateWaysWins(this.gameState.currentGrid, this.getPaytableForWays());

    return clusterWins.totalWin + waysResult.totalWinAmount;
  }

  private getPaytableForWays(): Record<string, Record<number, number>> {
    const paytable: Record<string, Record<number, number>> = {};

    // Convert our tier-based paytables to symbol-based for ways calculation
    for (let tier = 1; tier <= 3; tier++) {
      const tierPaytable = this.paytables.get(`tier${tier}`) || {};
      paytable[`tier${tier}`] = tierPaytable;
    }

    return paytable;
  }

  private adjustConfigForRTP(): any {
    const currentRTP = this.gameState.sessionStats.rtpCurrent;
    const targetRTP = this.rtpConfig.targetRTP;

    // Adjust win chances based on RTP performance
    let winChanceAdjustment = 1;
    if (currentRTP < targetRTP - 0.02) {
      winChanceAdjustment = 1.2; // Increase win chance by 20%
    } else if (currentRTP > targetRTP + 0.02) {
      winChanceAdjustment = 0.8; // Decrease win chance by 20%
    }

    return {
      ...this.config,
      engine: {
        ...this.config.engine,
        demo: {
          ...this.config.engine?.demo,
          winChance: (this.config.engine?.demo?.winChance || 0.28) * winChanceAdjustment,
        },
      },
    };
  }

  private updateSessionStats(winAmount: number, bet: number): void {
    this.gameState.sessionStats.totalWins += winAmount;

    // Calculate current RTP
    const totalWagered = this.gameState.sessionStats.totalSpins * bet;
    this.gameState.sessionStats.rtpCurrent =
      totalWagered > 0 ? this.gameState.sessionStats.totalWins / totalWagered : 0;
  }

  private verifyRTPCompliance(): void {
    const { rtpCurrent, totalSpins } = this.gameState.sessionStats;
    const targetRTP = this.rtpConfig.targetRTP;

    // Only check RTP after significant sample size
    if (totalSpins < 100) return;

    const rtpDeviation = Math.abs(rtpCurrent - targetRTP);

    if (rtpDeviation > 0.05) {
      // 5% deviation threshold
      console.warn(
        `RTP deviation detected: Current ${(rtpCurrent * 100).toFixed(2)}%, Target ${(targetRTP * 100).toFixed(2)}%`,
      );
    }

    // Ensure we stay within 92-96.5% range
    if (rtpCurrent < 0.92 || rtpCurrent > 0.965) {
      console.error(`RTP out of acceptable range: ${(rtpCurrent * 100).toFixed(2)}%`);
    }
  }

  /**
   * Execute free spins round
   */
  public async executeFreeSpinStep(): Promise<any> {
    if (!this.gameState.freeSpinsState || this.gameState.gameMode !== 'freespins') {
      throw new Error('Not in free spins mode');
    }

    const newState = stepFreeSpins(this.gameState.freeSpinsState, this.config);
    this.gameState.freeSpinsState = newState;

    if (newState.ended) {
      this.gameState.gameMode = 'base';
      this.gameState.freeSpinsState = undefined;
    }

    return newState;
  }

  /**
   * Execute mega spin feature
   */
  public async executeMegaSpinFeature(): Promise<any> {
    if (!this.gameState.freeSpinsState?.megaSpinsUnlocked) {
      throw new Error('Mega spins not unlocked');
    }

    const megaResult = executeMegaSpin(this.gameState.freeSpinsState, this.config);

    if (this.animationEngine) {
      await this.animationEngine.playMegaWinAnimation(megaResult.winAmount);
    }

    return megaResult;
  }

  /**
   * Get current game statistics
   */
  public getGameStats(): any {
    return {
      ...this.gameState.sessionStats,
      rtpTarget: this.rtpConfig.targetRTP,
      rtpRange: '92.0% - 96.5%',
      currentBalance: this.gameState.balance,
      volatility: this.rtpConfig.volatility,
      maxWin: `${this.rtpConfig.maxWinCap}x`,
    };
  }

  /**
   * Reset game session
   */
  public resetSession(): void {
    this.gameState = this.initializeGameState();
  }
}
