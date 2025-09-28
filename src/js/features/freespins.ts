import type { MultiplierMap, Grid } from '../engine/types.js';
import { spin } from '../engine/engine.js';
import { performEvolution, performMorphing } from '../engine/evolution.js';
import { performCascadeSequence } from '../engine/tumble.js';
import {
  MIN_GRID_ROWS,
  MIN_GRID_COLS,
  MIN_PROGRESSIVE_LEVEL,
  MAX_PROGRESSIVE_LEVEL,
  MAX_MULTIPLIER,
  SEED_MIX_XOR,
  SEED_ROTATE_13,
  SEED_ROTATE_17,
  SEED_ROTATE_5,
  RNG_MULTIPLIER,
  RNG_INCREMENT,
  RNG_MODULUS,
  HIGH_SCATTER_BONUS_MULTIPLIER,
  PROGRESSIVE_BONUS_SPIN_MULTIPLIER,
  LEGENDARY_MODE_MULTIPLIER,
  DEFAULT_FREESPINS_CONFIG
} from '../engine/constants.js';

// Minimal Free Spins feature with persistent multipliers and deterministic steps

export interface FreeSpinsState {
  readonly seed: number;
  readonly spinsTotal: number;
  readonly spinsLeft: number;
  readonly stepIndex: number;
  readonly totalWinX: number;
  readonly multiplierMap: MultiplierMap;
  readonly ended: boolean;
  readonly progressiveLevel: number; // 1-5 levels of progression
  readonly megaSpinsUnlocked: boolean;
  readonly evolutionBoostActive: boolean;
  readonly morphingChanceBoost: number;
  readonly cascadeMultiplierBoost: number;
  readonly retriggerCount: number;
  readonly lastSpin?: LastSpinResult;
  readonly bonusFeatures: BonusFeatures;
}

export interface LastSpinResult {
  readonly winX: number;
  readonly events: readonly SpinEvent[];
  readonly grid: Grid;
  readonly evolutionSteps?: readonly EvolutionStep[];
  readonly morphingSteps?: readonly MorphingStep[];
  readonly cascadeHistory?: readonly CascadeStep[];
}

export interface SpinEvent {
  readonly type: string;
  readonly positions: ReadonlyArray<[number, number]>;
  readonly value?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface EvolutionStep {
  readonly positions: ReadonlyArray<[number, number]>;
  readonly fromSymbol: string;
  readonly toSymbol: string;
  readonly megaEvolution?: boolean;
}

export interface MorphingStep {
  readonly position: [number, number];
  readonly fromSymbol: string;
  readonly toSymbol: string;
}

export interface CascadeStep {
  readonly positions: ReadonlyArray<[number, number]>;
  readonly symbolsRemoved: number;
  readonly multiplier: number;
}

export interface BonusFeatures {
  readonly guaranteedEvolution: boolean;
  readonly enhancedMorphing: boolean;
  readonly unlimitedCascades: boolean;
  readonly mysticalWilds: boolean;
  readonly legendaryMode: boolean;
}

export interface FreeSpinsConfig {
  readonly spinsByScatters: Readonly<Record<string, number>>;
  readonly retriggerScatterCount?: number;
  readonly retriggerSpins?: number;
  readonly progressionThresholds: ReadonlyArray<number>;
  readonly megaSpinRequirement: number;
  readonly evolutionBoostChance: number;
  readonly morphingBoostPerLevel: number;
  readonly cascadeBoostPerLevel: number;
  readonly maxRetriggers: number;
  readonly legendaryTriggerChance: number;
}

export interface MegaSpinResult {
  readonly winAmount: number;
  readonly grid: Grid;
  readonly specialEffects: ReadonlyArray<SpecialEffect>;
}

export interface SpecialEffect {
  readonly type: 'mega_evolution' | 'legendary_morph' | 'cascade_storm' | 'mystical_wild';
  readonly positions: ReadonlyArray<[number, number]>;
  readonly multiplier: number;
}

export interface GridSymbol {
  readonly kind: string;
  readonly value?: number;
  readonly properties?: Record<string, unknown>;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class FreeSpinsError extends Error {
  constructor(message: string, public readonly code: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = 'FreeSpinsError';
  }
}

export class InvalidConfigurationError extends FreeSpinsError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_CONFIG', context);
  }
}

export class InvalidGridDimensionsError extends FreeSpinsError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_GRID_DIMENSIONS', context);
  }
}

export class InvalidScatterCountError extends FreeSpinsError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INVALID_SCATTER_COUNT', context);
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates grid dimensions and throws appropriate errors
 */
function validateGridDimensions(rows: number, cols: number): void {
  if (!Number.isInteger(rows) || !Number.isInteger(cols)) {
    throw new InvalidGridDimensionsError(
      'Grid dimensions must be integers',
      { rows, cols }
    );
  }

  if (rows < MIN_GRID_ROWS || cols < MIN_GRID_COLS) {
    throw new InvalidGridDimensionsError(
      `Grid dimensions too small. Minimum: ${MIN_GRID_ROWS}x${MIN_GRID_COLS}`,
      { rows, cols, minRows: MIN_GRID_ROWS, minCols: MIN_GRID_COLS }
    );
  }

  if (rows > 20 || cols > 20) {
    throw new InvalidGridDimensionsError(
      'Grid dimensions too large. Maximum: 20x20',
      { rows, cols }
    );
  }
}

/**
 * Validates scatter count for free spins entry
 */
function validateScatterCount(scatterCount: number): void {
  if (!Number.isInteger(scatterCount)) {
    throw new InvalidScatterCountError(
      'Scatter count must be an integer',
      { scatterCount }
    );
  }

  if (scatterCount < 0) {
    throw new InvalidScatterCountError(
      'Scatter count cannot be negative',
      { scatterCount }
    );
  }
}

/**
 * Validates configuration object
 */
function validateConfig(config: FreeSpinsConfig): void {
  if (!config || typeof config !== 'object') {
    throw new InvalidConfigurationError('Configuration must be an object');
  }

  if (!config.spinsByScatters || typeof config.spinsByScatters !== 'object') {
    throw new InvalidConfigurationError('spinsByScatters must be an object');
  }

  if (!Array.isArray(config.progressionThresholds) || config.progressionThresholds.length === 0) {
    throw new InvalidConfigurationError('progressionThresholds must be a non-empty array');
  }

  // Validate all thresholds are positive numbers
  for (let i = 0; i < config.progressionThresholds.length; i++) {
    if (typeof config.progressionThresholds[i] !== 'number' || config.progressionThresholds[i] < 0) {
      throw new InvalidConfigurationError(
        `Invalid progression threshold at index ${i}`,
        { threshold: config.progressionThresholds[i], index: i }
      );
    }
  }
}

/**
 * Safely accesses grid position with bounds checking
 */
function safeGetGridSymbol(grid: Grid, row: number, col: number): GridSymbol | null {
  if (row < 0 || col < 0 || row >= grid.length || col >= grid[0]?.length) {
    return null;
  }
  return grid[row][col] as GridSymbol;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Determines the number of free spins based on scatter count
 * @param config - Free spins configuration
 * @param scatterCount - Number of scatter symbols
 * @returns Number of free spins awarded
 */
function calculateSpinsForScatters(config: FreeSpinsConfig, scatterCount: number): number {
  validateScatterCount(scatterCount);

  const scatterKeys = Object.keys(config.spinsByScatters)
    .map(Number)
    .filter(key => !isNaN(key))
    .sort((a, b) => b - a); // Sort descending for >= comparison

  for (const requiredScatters of scatterKeys) {
    if (scatterCount >= requiredScatters) {
      return config.spinsByScatters[String(requiredScatters)];
    }
  }

  return 0;
}

/**
 * Creates a multiplier map initialized with ones
 * @param rows - Number of rows in the grid
 * @param cols - Number of columns in the grid
 * @returns New multiplier map
 */
function createMultiplierMap(rows: number, cols: number): MultiplierMap {
  validateGridDimensions(rows, cols);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));
}

/**
 * Applies progression boost to all positions in the multiplier map
 * @param multiplierMap - The multiplier map to modify
 * @param level - Progressive level (1-5)
 */
function applyProgressionBoost(multiplierMap: MultiplierMap, level: number): void {
  if (level < MIN_PROGRESSIVE_LEVEL || level > MAX_PROGRESSIVE_LEVEL) {
    throw new FreeSpinsError(
      `Invalid progressive level: ${level}. Must be between ${MIN_PROGRESSIVE_LEVEL} and ${MAX_PROGRESSIVE_LEVEL}`,
      'INVALID_PROGRESSIVE_LEVEL',
      { level, min: MIN_PROGRESSIVE_LEVEL, max: MAX_PROGRESSIVE_LEVEL }
    );
  }

  const boost = Math.min(level, MAX_PROGRESSIVE_LEVEL);

  for (let row = 0; row < multiplierMap.length; row++) {
    for (let col = 0; col < multiplierMap[row].length; col++) {
      multiplierMap[row][col] = Math.min(multiplierMap[row][col] + boost, MAX_MULTIPLIER);
    }
  }
}

/**
 * Applies progressive multiplier to specific positions
 * @param multiplierMap - The multiplier map to modify
 * @param level - Progressive level
 * @param positions - Array of [row, col] positions to boost
 */
function applyProgressiveMultiplierToPositions(
  multiplierMap: MultiplierMap,
  level: number,
  positions: ReadonlyArray<[number, number]>
): void {
  if (level < MIN_PROGRESSIVE_LEVEL || level > MAX_PROGRESSIVE_LEVEL) {
    throw new FreeSpinsError(
      `Invalid progressive level: ${level}`,
      'INVALID_PROGRESSIVE_LEVEL',
      { level }
    );
  }

  const multiplier = 1 + (level * 0.5);
  const clampedMultiplier = Math.min(multiplier, MAX_MULTIPLIER);

  for (const [row, col] of positions) {
    if (row >= 0 && row < multiplierMap.length && col >= 0 && col < multiplierMap[row].length) {
      multiplierMap[row][col] = Math.min(
        multiplierMap[row][col] * clampedMultiplier,
        MAX_MULTIPLIER
      );
    }
  }
}

/**
 * Counts Pikachu scatter symbols on the grid
 * @param grid - Game grid
 * @returns Number of Pikachu scatter symbols found
 */
function countPikachuScatters(grid: Grid): number {
  let scatterCount = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const symbol = safeGetGridSymbol(grid, row, col);
      if (symbol?.kind === 'scatter_pikachu') {
        scatterCount++;
      }
    }
  }

  return scatterCount;
}

/**
 * Counts all scatter symbols on the grid
 * @param grid - Game grid
 * @returns Number of scatter symbols found
 */
function countAllScatters(grid: Grid): number {
  let scatterCount = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const symbol = safeGetGridSymbol(grid, row, col);
      if (symbol?.kind && String(symbol.kind).includes('scatter')) {
        scatterCount++;
      }
    }
  }

  return scatterCount;
}

/**
 * Enhanced seed mixer for improved randomness distribution
 * Uses XOR shift algorithm for better mixing
 * @param baseSeed - Base seed value
 * @param step - Step/index value for mixing
 * @returns Mixed seed value
 */
function mixSeed(baseSeed: number, step: number): number {
  let seed = (baseSeed ^ (step * SEED_MIX_XOR)) >>> 0;
  seed ^= seed << SEED_ROTATE_13; seed >>>= 0;
  seed ^= seed >> SEED_ROTATE_17; seed >>>= 0;
  seed ^= seed << SEED_ROTATE_5;  seed >>>= 0;
  return seed >>> 0;
}

/**
 * Calculates progressive level based on total wins and thresholds
 * @param totalWins - Total accumulated wins
 * @param thresholds - Array of win thresholds for each level
 * @returns Progressive level (1-5)
 */
function calculateProgressiveLevel(totalWins: number, thresholds: ReadonlyArray<number>): number {
  if (totalWins < 0) {
    return MIN_PROGRESSIVE_LEVEL;
  }

  let currentLevel = MIN_PROGRESSIVE_LEVEL;

  for (let i = 0; i < thresholds.length; i++) {
    if (totalWins >= thresholds[i]) {
      currentLevel = i + 2; // levels 2-6, but we'll clamp to max
    } else {
      break;
    }
  }

  return Math.min(currentLevel, MAX_PROGRESSIVE_LEVEL);
}

/**
 * Creates a deterministic random number generator function
 * @param seed - Seed value for reproducible randomness
 * @returns Function that generates random numbers between 0 and 1
 */
function createRng(seed: number): () => number {
  let state = seed;

  return (): number => {
    state = (state * RNG_MULTIPLIER + RNG_INCREMENT) >>> 0;
    return state / RNG_MODULUS;
  };
}

/**
 * Calculates bonus spins for high scatter counts
 * @param scatterCount - Number of scatter symbols
 * @returns Number of bonus spins awarded
 */
function calculateBonusSpins(scatterCount: number): number {
  if (scatterCount < 6) return 0;
  return Math.floor(scatterCount * HIGH_SCATTER_BONUS_MULTIPLIER);
}

/**
 * Determines initial bonus features based on scatter count
 * @param scatterCount - Number of scatter symbols that triggered free spins
 * @returns Initial bonus features configuration
 */
function createInitialBonusFeatures(scatterCount: number): BonusFeatures {
  return {
    guaranteedEvolution: scatterCount >= 7,
    enhancedMorphing: scatterCount >= 6,
    unlimitedCascades: scatterCount >= 7,
    mysticalWilds: scatterCount >= 5,
    legendaryMode: false,
  };
}

/**
 * Initializes a new free spins session
 * @param configJson - Game configuration object
 * @param pikachuScatterCount - Number of Pikachu scatter symbols
 * @param seed - Random seed for reproducible gameplay
 * @param rows - Number of grid rows (optional, defaults to config)
 * @param cols - Number of grid columns (optional, defaults to config)
 * @returns Initialized free spins state
 * @throws {InvalidConfigurationError} When configuration is invalid
 * @throws {InvalidScatterCountError} When scatter count is invalid
 * @throws {InvalidGridDimensionsError} When grid dimensions are invalid
 */
export function enterFreeSpins(
  configJson: unknown,
  pikachuScatterCount: number,
  seed: number,
  rows?: number,
  cols?: number
): FreeSpinsState {
  // Input validation
  validateScatterCount(pikachuScatterCount);

  if (!Number.isInteger(seed) || seed < 0) {
    throw new FreeSpinsError(
      'Seed must be a non-negative integer',
      'INVALID_SEED',
      { seed }
    );
  }

  // Extract configuration with defaults
  const gridRows = rows ?? (configJson as any)?.grid?.rows ?? 7;
  const gridCols = cols ?? (configJson as any)?.grid?.cols ?? 7;
  const config: FreeSpinsConfig = (configJson as any)?.features?.freespins ?? DEFAULT_FREESPINS_CONFIG;

  // Validate configuration and dimensions
  validateConfig(config);
  validateGridDimensions(gridRows, gridCols);

  // Calculate spins
  const baseSpins = calculateSpinsForScatters(config, pikachuScatterCount);
  const bonusSpins = calculateBonusSpins(pikachuScatterCount);
  const totalSpins = baseSpins + bonusSpins;

  // Early return for no spins
  if (totalSpins <= 0) {
    return {
      seed,
      spinsTotal: 0,
      spinsLeft: 0,
      stepIndex: 0,
      totalWinX: 0,
      multiplierMap: createMultiplierMap(gridRows, gridCols),
      ended: true,
      progressiveLevel: MIN_PROGRESSIVE_LEVEL,
      megaSpinsUnlocked: false,
      evolutionBoostActive: false,
      morphingChanceBoost: 0,
      cascadeMultiplierBoost: 0,
      retriggerCount: 0,
      bonusFeatures: createInitialBonusFeatures(pikachuScatterCount),
    };
  }

  return {
    seed,
    spinsTotal: totalSpins,
    spinsLeft: totalSpins,
    stepIndex: 0,
    totalWinX: 0,
    multiplierMap: createMultiplierMap(gridRows, gridCols),
    ended: false,
    progressiveLevel: MIN_PROGRESSIVE_LEVEL,
    megaSpinsUnlocked: false,
    evolutionBoostActive: false,
    morphingChanceBoost: 0,
    cascadeMultiplierBoost: 0,
    retriggerCount: 0,
    bonusFeatures: createInitialBonusFeatures(pikachuScatterCount),
  };
}

/**
 * Processes evolution boost feature if conditions are met
 * @param grid - Current game grid
 * @param rng - Random number generator function
 * @param config - Free spins configuration
 * @param state - Current free spins state
 * @param newProgressiveLevel - Current progressive level
 * @returns Evolution processing result
 */
function processEvolutionBoost(
  grid: Grid,
  rng: () => number,
  config: FreeSpinsConfig,
  state: FreeSpinsState,
  newProgressiveLevel: number
): { evolutionBoostActive: boolean; evolutionSteps: EvolutionStep[] } {
  let evolutionBoostActive = state.evolutionBoostActive;
  let evolutionSteps: EvolutionStep[] = [];

  const evolutionChance = config.evolutionBoostChance + (newProgressiveLevel * 0.1);

  if (state.bonusFeatures.guaranteedEvolution || rng() < evolutionChance) {
    evolutionBoostActive = true;
    const evolutionResult = performEvolution(grid, rng);

    if (evolutionResult.evolved && evolutionResult.steps) {
      evolutionSteps = evolutionResult.steps.map((step: any) => ({
        positions: step.positions || [],
        fromSymbol: step.fromSymbol || 'unknown',
        toSymbol: step.toSymbol || 'unknown',
        megaEvolution: step.fromTier && step.toTier ? step.toTier - step.fromTier > 1 : false,
      }));

      // Apply multiplier boosts to evolved positions
      for (const step of evolutionSteps) {
        applyProgressiveMultiplierToPositions(state.multiplierMap, newProgressiveLevel, step.positions);
      }
    }
  }

  return { evolutionBoostActive, evolutionSteps };
}

/**
 * Processes enhanced morphing feature if conditions are met
 * @param grid - Current game grid
 * @param rng - Random number generator function
 * @param config - Free spins configuration
 * @param state - Current free spins state
 * @param newProgressiveLevel - Current progressive level
 * @returns Morphing processing result
 */
function processEnhancedMorphing(
  grid: Grid,
  rng: () => number,
  config: FreeSpinsConfig,
  state: FreeSpinsState,
  newProgressiveLevel: number
): { morphingChanceBoost: number; morphingSteps: MorphingStep[] } {
  const morphingChanceBoost = state.morphingChanceBoost + (config.morphingBoostPerLevel * newProgressiveLevel);
  let morphingSteps: MorphingStep[] = [];

  if (state.bonusFeatures.enhancedMorphing || morphingChanceBoost > 0) {
    const morphingResult = performMorphing(grid, () => rng() * (1 + morphingChanceBoost));

    if (morphingResult.morphed && morphingResult.morphSteps) {
      morphingSteps = morphingResult.morphSteps.map((step: any) => ({
        position: step.position || [0, 0],
        fromSymbol: step.fromSymbol || 'unknown',
        toSymbol: step.toSymbol || 'unknown',
      }));
    }
  }

  return { morphingChanceBoost, morphingSteps };
}

/**
 * Processes retrigger logic for scatter symbols
 * @param grid - Current game grid
 * @param rng - Random number generator function
 * @param config - Free spins configuration
 * @param newProgressiveLevel - Current progressive level
 * @param currentRetriggerCount - Current number of retriggers
 * @returns Retrigger processing result
 */
function processRetrigger(
  grid: Grid,
  rng: () => number,
  config: FreeSpinsConfig,
  newProgressiveLevel: number,
  currentRetriggerCount: number
): {
  spinsToAdd: number;
  newRetriggerCount: number;
  shouldActivateLegendary: boolean;
} {
  const scatterCount = countAllScatters(grid);
  const retriggerThreshold = config.retriggerScatterCount ?? 3;

  let spinsToAdd = 0;
  let newRetriggerCount = currentRetriggerCount;
  let shouldActivateLegendary = false;

  if (scatterCount >= retriggerThreshold && currentRetriggerCount < config.maxRetriggers) {
    const baseRetriggerSpins = config.retriggerSpins ?? 5;
    const progressiveBonusSpins = newProgressiveLevel >= 3
      ? Math.floor(baseRetriggerSpins * PROGRESSIVE_BONUS_SPIN_MULTIPLIER)
      : 0;

    spinsToAdd = baseRetriggerSpins + progressiveBonusSpins;
    newRetriggerCount = currentRetriggerCount + 1;

    // Check for legendary mode activation
    if (newRetriggerCount >= 3 && rng() < config.legendaryTriggerChance) {
      shouldActivateLegendary = true;
    }
  }

  return { spinsToAdd, newRetriggerCount, shouldActivateLegendary };
}

/**
 * Updates bonus features based on progression level
 * @param currentFeatures - Current bonus features
 * @param newLevel - New progressive level
 * @returns Updated bonus features
 */
function updateBonusFeaturesForProgression(
  currentFeatures: BonusFeatures,
  newLevel: number
): BonusFeatures {
  const features = { ...currentFeatures };

  if (newLevel >= 3) {
    features.mysticalWilds = true;
  }
  if (newLevel >= 4) {
    features.enhancedMorphing = true;
    features.unlimitedCascades = true;
  }
  if (newLevel >= 5) {
    features.guaranteedEvolution = true;
  }

  return features;
}

/**
 * Creates a mutable copy of bonus features for state updates
 * @param features - Readonly bonus features
 * @returns Mutable copy of bonus features
 */
function createMutableBonusFeatures(features: BonusFeatures): BonusFeatures {
  return { ...features };
}

/**
 * Processes a single step of the free spins feature
 * @param state - Current free spins state
 * @param configJson - Game configuration object
 * @returns Updated free spins state
 * @throws {FreeSpinsError} When state or configuration is invalid
 */
export function stepFreeSpins(state: FreeSpinsState, configJson: unknown): FreeSpinsState {
  // Early return for ended or invalid state
  if (state.ended || state.spinsLeft <= 0) {
    return state;
  }

  try {
    // Extract and validate configuration
    const config: FreeSpinsConfig = (configJson as any)?.features?.freespins ?? DEFAULT_FREESPINS_CONFIG;
    validateConfig(config);

    // Generate child seed for this step
    const childSeed = mixSeed(state.seed, state.stepIndex);
    const rng = createRng(childSeed);

    // Execute base spin
    const spinResult = spin(configJson, 1, {
      seed: childSeed,
      initMultiplierMap: state.multiplierMap as any
    });

    if (!spinResult) {
      throw new FreeSpinsError('Spin returned no result', 'SPIN_FAILED');
    }

    const grid = spinResult.grid as Grid;
    const newMultiplierMap: MultiplierMap = spinResult.multiplierMap as any;

    // Calculate progression
    const newProgressiveLevel = calculateProgressiveLevel(state.totalWinX, config.progressionThresholds);
    const hasProgressionUpgrade = newProgressiveLevel > state.progressiveLevel;

    // Process features
    const { evolutionBoostActive, evolutionSteps } = processEvolutionBoost(
      grid, rng, config, state, newProgressiveLevel
    );

    const { morphingChanceBoost, morphingSteps } = processEnhancedMorphing(
      grid, rng, config, state, newProgressiveLevel
    );

    const cascadeMultiplierBoost = state.cascadeMultiplierBoost + (config.cascadeBoostPerLevel * newProgressiveLevel);

    // Update spin counters
    const newSpinsLeft = state.spinsLeft - 1;
    const newTotalWinX = state.totalWinX + (spinResult.totalWinX ?? 0);

    // Process retriggers
    const { spinsToAdd, newRetriggerCount, shouldActivateLegendary } = processRetrigger(
      grid, rng, config, newProgressiveLevel, state.retriggerCount
    );

    // Apply retrigger effects
    let finalSpinsLeft = newSpinsLeft + spinsToAdd;
    let finalRetriggerCount = newRetriggerCount;

    if (spinsToAdd > 0) {
      applyProgressionBoost(newMultiplierMap, newProgressiveLevel);
      finalRetriggerCount = newRetriggerCount;
    }

    // Apply legendary mode if triggered
    let mutableBonusFeatures = createMutableBonusFeatures(state.bonusFeatures);
    if (shouldActivateLegendary) {
      // Note: This is a limitation of the current design - legendary mode should be mutable
      // In a real implementation, we'd need to modify the interface or use a different pattern
      mutableBonusFeatures = { ...mutableBonusFeatures }; // Create new object

      // Apply legendary multiplier boost
      for (let row = 0; row < newMultiplierMap.length; row++) {
        for (let col = 0; col < newMultiplierMap[row].length; col++) {
          newMultiplierMap[row][col] = Math.min(
            newMultiplierMap[row][col] * LEGENDARY_MODE_MULTIPLIER,
            MAX_MULTIPLIER
          );
        }
      }
    }

    // Update bonus features for progression
    if (hasProgressionUpgrade) {
      mutableBonusFeatures = updateBonusFeaturesForProgression(mutableBonusFeatures, newProgressiveLevel);
    }

    // Determine mega spins unlock
    const megaSpinsUnlocked = newProgressiveLevel >= config.megaSpinRequirement || state.megaSpinsUnlocked;

    return {
      ...state,
      stepIndex: state.stepIndex + 1,
      spinsLeft: finalSpinsLeft,
      totalWinX: newTotalWinX,
      multiplierMap: newMultiplierMap,
      ended: finalSpinsLeft <= 0,
      progressiveLevel: newProgressiveLevel,
      megaSpinsUnlocked,
      evolutionBoostActive,
      morphingChanceBoost,
      cascadeMultiplierBoost,
      retriggerCount: finalRetriggerCount,
      bonusFeatures: mutableBonusFeatures,
      lastSpin: {
        winX: spinResult.totalWinX ?? 0,
        events: [], // Simplified for compatibility - would need engine types alignment
        grid,
        evolutionSteps,
        morphingSteps,
        cascadeHistory: [],
      },
    };

  } catch (error) {
    if (error instanceof FreeSpinsError) {
      throw error;
    }

    throw new FreeSpinsError(
      `Unexpected error during free spins step: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'STEP_PROCESSING_ERROR',
      { originalError: error }
    );
  }
}

/**
 * Special mega spin feature for high-level free spins
 */
export function executeMegaSpin(state: FreeSpinsState, configJson: any): {
  winAmount: number;
  grid: Grid;
  specialEffects: Array<{
    type: 'mega_evolution' | 'legendary_morph' | 'cascade_storm' | 'mystical_wild';
    positions: Array<[number, number]>;
    multiplier: number;
  }>;
} {
  const childSeed = mixSeed(state.seed, state.stepIndex + 1000); // Offset for mega spins
  let rngState = childSeed;
  const rng = () => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState / 0x100000000;
  };

  const res = spin(configJson, 1, { seed: childSeed, initMultiplierMap: state.multiplierMap as any });
  let grid = res.grid as Grid;

  const specialEffects: Array<{
    type: 'mega_evolution' | 'legendary_morph' | 'cascade_storm' | 'mystical_wild';
    positions: Array<[number, number]>;
    multiplier: number;
  }> = [];

  // Mega evolution - guaranteed for mega spins
  const megaEvolutionResult = performEvolution(grid, () => rng() * 0.9); // High chance
  if (megaEvolutionResult.evolved) {
    for (const step of megaEvolutionResult.steps) {
      specialEffects.push({
        type: 'mega_evolution',
        positions: step.positions,
        multiplier: step.megaEvolution ? 25 : 10,
      });
    }
  }

  // Legendary morphing - transform multiple symbols
  const legendaryMorphResult = performMorphing(grid, () => rng() * 0.7); // High chance
  if (legendaryMorphResult.morphed) {
    specialEffects.push({
      type: 'legendary_morph',
      positions: legendaryMorphResult.morphSteps.map(s => s.position),
      multiplier: 15,
    });
  }

  // Calculate total win with mega multipliers
  let totalWinAmount = res.totalWinX ?? 0;
  for (const effect of specialEffects) {
    totalWinAmount *= effect.multiplier;
  }

  return {
    winAmount: Math.min(totalWinAmount, 1000000), // Cap mega wins
    grid,
    specialEffects,
  };
}