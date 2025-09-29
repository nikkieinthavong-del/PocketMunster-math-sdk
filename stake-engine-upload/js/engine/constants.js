/**
 * Game Constants for PocketMon Genesis
 * Production-ready configuration values
 */
// Grid Configuration
export const MIN_GRID_ROWS = 3;
export const MIN_GRID_COLS = 3;
export const DEFAULT_GRID_ROWS = 7;
export const DEFAULT_GRID_COLS = 7;
// Progressive System
export const MIN_PROGRESSIVE_LEVEL = 1;
export const MAX_PROGRESSIVE_LEVEL = 5;
// Multiplier Limits
export const MAX_MULTIPLIER = 8192;
export const MIN_MULTIPLIER = 1;
// Random Number Generation
export const RNG_MULTIPLIER = 1664525;
export const RNG_INCREMENT = 1013904223;
export const RNG_MODULUS = 0x100000000;
// Seed Operations
export const SEED_MIX_XOR = 0x9e3779b1;
export const SEED_ROTATE_13 = 13;
export const SEED_ROTATE_17 = 17;
export const SEED_ROTATE_5 = 5;
// Free Spins Configuration
export const HIGH_SCATTER_BONUS_MULTIPLIER = 1.5;
export const PROGRESSIVE_BONUS_SPIN_MULTIPLIER = 1.5;
export const LEGENDARY_MODE_MULTIPLIER = 10;
// Default Free Spins Configuration
export const DEFAULT_FREESPINS_CONFIG = {
    spinsByScatters: { '3': 8, '4': 10, '5': 12, '6': 15, '7': 20 },
    retriggerScatterCount: 3,
    retriggerSpins: 5,
    progressionThresholds: [5, 15, 35, 70, 150],
    megaSpinRequirement: 3,
    evolutionBoostChance: 0.25,
    morphingBoostPerLevel: 0.15,
    cascadeBoostPerLevel: 2,
    maxRetriggers: 5,
    legendaryTriggerChance: 0.05,
};
// Game Mechanics
export const DEFAULT_CLUSTER_MIN_SIZE = 5;
export const DEFAULT_WAYS_MIN_SYMBOLS = 3;
export const DEFAULT_MAX_CASCADES = 8;
// RTP Configuration
export const MIN_RTP = 0.92;
export const MAX_RTP = 0.965;
export const DEFAULT_TARGET_RTP = 0.945;
// Volatility Settings
export const VOLATILITY_MULTIPLIERS = {
    low: { base: 0.8, variance: 0.5 },
    medium: { base: 1.0, variance: 1.0 },
    high: { base: 1.2, variance: 2.0 },
    extreme: { base: 1.5, variance: 4.0 }
};
// Hit Frequencies by Volatility
export const HIT_FREQUENCIES = {
    low: 0.35,
    medium: 0.28,
    high: 0.22,
    extreme: 0.18,
};
// Animation Constants
export const DEFAULT_ANIMATION_CONFIG = {
    enableParticles: true,
    enableSpine: true,
    quality: 'ultra',
    frameRate: 60,
    particleDensity: 1.0,
};
// Reel Motion Configuration
export const DEFAULT_REEL_CONFIG = {
    spinDuration: 2000,
    anticipationDelay: 300,
    easeType: 'elastic',
    blurEffect: true,
    reelSeparation: true,
};
// Feature Contribution Percentages (for RTP calculation)
export const FEATURE_CONTRIBUTIONS = {
    basePays: 0.35,
    clusterPays: 0.15,
    waysPays: 0.10,
    tumbleMechanics: 0.12,
    evolutionSystem: 0.08,
    freeSpins: 0.15,
    megaFeatures: 0.05,
};
// Max Win Caps
export const MAX_WIN_CAP = 5000; // 5000x bet
export const MEGA_WIN_CAP = 1000000; // Absolute cap for mega features
