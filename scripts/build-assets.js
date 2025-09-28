// scripts/build-assets.js (updated)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // Add image processing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const outputDir = path.join(rootDir, 'dist-web', 'assets');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${sourcePath} -> ${destPath}`);
    }
  }
}

// Process specific asset directories
function processAssets() {
  // Copy main assets
  console.log('Copying main assets...');
  copyDirectory(assetsDir, outputDir);
  
  // Copy sprites
  const spritesDir = path.join(assetsDir, 'sprites');
  const spritesOutputDir = path.join(outputDir, 'sprites');
  if (fs.existsSync(spritesDir)) {
    console.log('Copying sprites...');
    copyDirectory(spritesDir, spritesOutputDir);
  }
  
  // Copy UI assets
  const uiDir = path.join(assetsDir, 'ui');
  const uiOutputDir = path.join(outputDir, 'ui');
  if (fs.existsSync(uiDir)) {
    console.log('Copying UI assets...');
    copyDirectory(uiDir, uiOutputDir);
  }
  
  // Copy gameplay assets
  const gameplayDir = path.join(assetsDir, 'gameplay');
  const gameplayOutputDir = path.join(outputDir, 'gameplay');
  if (fs.existsSync(gameplayDir)) {
    console.log('Copying gameplay assets...');
    copyDirectory(gameplayDir, gameplayOutputDir);
  }
  
  // Copy pokemon assets
  const pokemonDir = path.join(assetsDir, 'pokemon');
  const pokemonOutputDir = path.join(outputDir, 'pokemon');
  if (fs.existsSync(pokemonDir)) {
    console.log('Copying pokemon assets...');
    copyDirectory(pokemonDir, pokemonOutputDir);
  }
  
  // Copy spine animations
  const spineDir = path.join(assetsDir, 'spine');
  const spineOutputDir = path.join(outputDir, 'spine');
  if (fs.existsSync(spineDir)) {
    console.log('Copying spine animations...');
    copyDirectory(spineDir, spineOutputDir);
  }
}

// Process and optimize images
async function optimizeImages() {
  console.log('Optimizing images...');
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const imagesToProcess = [];
  
  // Find all images in the output directory
  function findImages(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        findImages(fullPath);
      } else if (imageExtensions.includes(path.extname(entry.name).toLowerCase())) {
        imagesToProcess.push(fullPath);
      }
    }
  }
  
  findImages(outputDir);
  
  // Process each image
  for (const imagePath of imagesToProcess) {
    try {
      // Skip spine atlas images as they need to maintain exact dimensions
      if (imagePath.includes('/spine/') && imagePath.endsWith('.png')) {
        continue;
      }
      
      // Optimize the image
      await sharp(imagePath)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      
      console.log(`Optimized: ${imagePath}`);
    } catch (error) {
      console.error(`Error optimizing ${imagePath}:`, error);
    }
  }
}

// Main build function
async function buildAssets() {
  console.log('Building assets...');
  
  // Step 1: Process and copy assets
  processAssets();
  
  // Step 2: Optimize images
  await optimizeImages();
  
  console.log('Assets built successfully!');
}

// Run the build process
buildAssets().catch(error => {
  console.error('Error building assets:', error);
  process.exit(1);
});
// src/js/math/SlotsMathModel.js
export class SlotsMathModel {
  constructor(config = {}) {
    this.config = {
      rtp: 95.5, // Target RTP within 92-96.5% range
      volatility: 'medium-high',
      ...config
    };
    
    // Base game configuration
    this.baseGame = {
      reels: [
        // 5x3 grid configuration with symbol distribution
        [/* Symbol weights for reel 1 */],
        [/* Symbol weights for reel 2 */],
        [/* Symbol weights for reel 3 */],
        [/* Symbol weights for reel 4 */],
        [/* Symbol weights for reel 5 */]
      ],
      paylines: 20, // Standard paylines
      ways: 243,    // Ways to win (3x5x3x5x3)
      symbols: {
        // Define symbols with their payout values
        WILD: { multiplier: 1, substitutes: true },
        SCATTER: { triggers: 'FREE_SPINS', count: 3 },
        HIGH1: { pays: [0, 0, 5, 25, 100] },
        HIGH2: { pays: [0, 0, 5, 20, 80] },
        // Add more symbols...
      }
    };
    
    // Free spins feature
    this.freeSpins = {
      initialSpins: 10,
      multiplier: 2,
      retrigger: true,
      specialSymbols: {
        // Special symbols that appear only in free spins
      }
    };
    
    // Tumble/Cascade feature
    this.tumble = {
      enabled: true,
      multiplierProgression: [1, 2, 3, 5], // Multiplier increases with each cascade
      maxTumbles: 10
    };
    
    // Cluster pays feature
    this.cluster = {
      minClusterSize: 5,
      payTable: {
        // Payouts based on cluster size
        5: { multiplier: 1 },
        6: { multiplier: 2 },
        // More cluster sizes...
      }
    };
  }
  
  // Calculate win for a specific spin result
  calculateWin(spinResult) {
    // Implementation of win calculation logic
  }
  
  // Determine if free spins are triggered
  checkFreeSpinsTriggered(spinResult) {
    // Logic to check for free spins trigger
  }
  
  // Process tumble/cascade mechanics
  processTumble(currentGrid) {
    // Logic for tumble/cascade feature
  }
  
  // Calculate cluster wins
  calculateClusterWins(grid) {
    // Logic for cluster pays
  }
}
// src/js/components/GameSymbol.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './GameSymbol.css';

export const GameSymbol = ({ type, size = 'medium', animated = false }) => {
  return (
    <div className={`game-symbol ${size} ${animated ? 'animated' : ''}`} data-symbol={type}>
      <img src={`/assets/symbols/${type.toLowerCase()}.png`} alt={type} />
      {animated && <div className="symbol-animation"></div>}
    </div>
  );
};

GameSymbol.propTypes = {
  type: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
};

// src/js/components/GameSymbol.stories.jsx
import { GameSymbol } from './GameSymbol';

export default {
  title: 'PocketMon/GameSymbol',
  component: GameSymbol,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: { 
      control: 'select', 
      options: ['WILD', 'SCATTER', 'HIGH1', 'HIGH2', 'MID1', 'MID2', 'LOW1', 'LOW2', 'LOW3', 'LOW4'] 
    },
  },
};

export const Default = {
  args: {
    type: 'WILD',
    size: 'medium',
    animated: false,
  },
};

export const Animated = {
  args: {
    type: 'WILD',
    size: 'medium',
    animated: true,
  },
};
// src/js/components/GameGrid.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { GameSymbol } from './GameSymbol';
import './GameGrid.css';

export const GameGrid = ({ grid, winningPositions = [], onSymbolClick }) => {
  return (
    <div className="game-grid">
      {grid.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid-row">
          {row.map((symbol, colIndex) => {
            const isWinning = winningPositions.some(
              pos => pos.row === rowIndex && pos.col === colIndex
            );
            
            return (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`grid-cell ${isWinning ? 'winning' : ''}`}
                onClick={() => onSymbolClick(rowIndex, colIndex, symbol)}
              >
                <GameSymbol 
                  type={symbol} 
                  animated={isWinning} 
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

GameGrid.propTypes = {
  grid: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  winningPositions: PropTypes.arrayOf(
    PropTypes.shape({
      row: PropTypes.number,
      col: PropTypes.number,
    })
  ),
  onSymbolClick: PropTypes.func,
};

// src/js/components/GameGrid.stories.jsx
import { GameGrid } from './GameGrid';

export default {
  title: 'PocketMon/GameGrid',
  component: GameGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    grid: [
      ['WILD', 'HIGH1', 'MID1', 'LOW1', 'LOW3'],
      ['HIGH2', 'SCATTER', 'LOW2', 'MID2', 'LOW4'],
      ['MID1', 'LOW1', 'WILD', 'HIGH1', 'MID2'],
    ],
    winningPositions: [
      { row: 0, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ],
    onSymbolClick: (row, col, symbol) => {
      console.log(`Clicked symbol ${symbol} at position [${row}, ${col}]`);
    },
  },
};
// src/js/components/SpineAnimation.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Spine } from '@esotericsoftware/spine-webgl';
import './SpineAnimation.css';

export const SpineAnimation = ({ 
  skeletonData, 
  animation = 'idle', 
  skin = 'default',
  loop = true,
  scale = 1,
  speed = 1,
  onComplete,
  mixDuration = 0.2
}) => {
  const canvasRef = useRef(null);
  const spineRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current || !skeletonData) return;
    
    // Initialize Spine
    const canvas = canvasRef.current;
    const context = canvas.getContext('webgl2');
    
    // Create spine instance
    // This is a simplified version - actual implementation would use the Spine runtime
    spineRef.current = new Spine.SpineCanvas(canvas, skeletonData);
    
    // Set animation
    spineRef.current.setAnimation(0, animation, loop);
    spineRef.current.setSkin(skin);
    spineRef.current.setScale(scale);
    spineRef.current.setTimeScale(speed);
    
    if (onComplete && !loop) {
      spineRef.current.addAnimationCompleteListener(() => {
        onComplete();
      });
    }
    
    return () => {
      // Cleanup
      if (spineRef.current) {
        spineRef.current.dispose();
      }
    };
  }, [skeletonData]);
  
  // Handle animation changes
  useEffect(() => {
    if (!spineRef.current) return;
    
    spineRef.current.setAnimation(0, animation, loop, mixDuration);
  }, [animation, loop]);
  
  return (
    <div className="spine-animation-container">
      <canvas ref={canvasRef} className="spine-canvas" />
    </div>
  );
};

SpineAnimation.propTypes = {
  skeletonData: PropTypes.object.isRequired,
  animation: PropTypes.string,
  skin: PropTypes.string,
  loop: PropTypes.bool,
  scale: PropTypes.number,
  speed: PropTypes.number,
  onComplete: PropTypes.func,
  mixDuration: PropTypes.number,
};
// src/js/features/TumbleFeature.js
export class TumbleFeature {
  constructor(config = {}) {
    this.config = {
      multiplierProgression: [1, 2, 3, 5, 8],
      maxTumbles: 10,
      ...config
    };
    
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
  }
  
  reset() {
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
  }
  
  getMultiplier() {
    return this.currentMultiplier;
  }
  
  processTumble(grid) {
    // Process winning symbols removal
    const winningPositions = this.findWinningPositions(grid);
    
    if (winningPositions.length === 0) {
      return { 
        hasMoreTumbles: false, 
        updatedGrid: grid,
        removedPositions: []
      };
    }
    
    // Remove winning symbols
    const updatedGrid = this.removeWinningSymbols(grid, winningPositions);
    
    // Fill empty spaces with new symbols
    const filledGrid = this.fillEmptySpaces(updatedGrid);
    
    // Increment tumble counter and update multiplier
    this.currentTumble++;
    const multiplierIndex = Math.min(this.currentTumble, this.config.multiplierProgression.length - 1);
    this.currentMultiplier = this.config.multiplierProgression[multiplierIndex];
    
    return {
      hasMoreTumbles: this.currentTumble < this.config.maxTumbles,
      updatedGrid: filledGrid,
      removedPositions: winningPositions
    };
  }
  
  // Implementation details for finding winning positions, removing symbols, and filling spaces
  // ...
}
// src/js/features/FreeSpinsFeature.js
export class FreeSpinsFeature {
  constructor(config = {}) {
    this.config = {
      initialSpins: 10,
      retriggeredSpins: 5,
      maxSpins: 100,
      multiplier: 2,
      specialSymbols: {},
      ...config
    };
    
    this.active = false;
    this.remainingSpins = 0;
    this.totalWin = 0;
  }
  
  activate() {
    this.active = true;
    this.remainingSpins = this.config.initialSpins;
    this.totalWin = 0;
    
    return {
      active: this.active,
      remainingSpins: this.remainingSpins
    };
  }
  
  retrigger() {
    const newSpins = this.config.retriggeredSpins;
    this.remainingSpins = Math.min(this.remainingSpins + newSpins, this.config.maxSpins);
    
    return {
      active: this.active,
      remainingSpins: this.remainingSpins,
      addedSpins: newSpins
    };
  }
  
  spin() {
    if (!this.active || this.remainingSpins <= 0) {
      return { active: false, complete: true };
    }
    
    this.remainingSpins--;
    
    return {
      active: this.active,
      remainingSpins: this.remainingSpins,
      complete: this.remainingSpins === 0
    };
  }
  
  addWin(amount) {
    const multipliedAmount = amount * this.config.multiplier;
    this.totalWin += multipliedAmount;
    
    return {
      win: multipliedAmount,
      totalWin: this.totalWin,
      multiplier: this.config.multiplier
    };
  }
  
  complete() {
    const result = {
      active: false,
      totalWin: this.totalWin
    };
    
    this.active = false;
    this.remainingSpins = 0;
    this.totalWin = 0;
    
    return result;
  }
}
// scripts/build-assets.js (updated)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // Add image processing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const outputDir = path.join(rootDir, 'dist-web', 'assets');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${sourcePath} -> ${destPath}`);
    }
  }
}

// Process specific asset directories
function processAssets() {
  // Copy main assets
  console.log('Copying main assets...');
  copyDirectory(assetsDir, outputDir);
  
  // Copy sprites
  const spritesDir = path.join(assetsDir, 'sprites');
  const spritesOutputDir = path.join(outputDir, 'sprites');
  if (fs.existsSync(spritesDir)) {
    console.log('Copying sprites...');
    copyDirectory(spritesDir, spritesOutputDir);
  }
  
  // Copy UI assets
  const uiDir = path.join(assetsDir, 'ui');
  const uiOutputDir = path.join(outputDir, 'ui');
  if (fs.existsSync(uiDir)) {
    console.log('Copying UI assets...');
    copyDirectory(uiDir, uiOutputDir);
  }
  
  // Copy gameplay assets
  const gameplayDir = path.join(assetsDir, 'gameplay');
  const gameplayOutputDir = path.join(outputDir, 'gameplay');
  if (fs.existsSync(gameplayDir)) {
    console.log('Copying gameplay assets...');
    copyDirectory(gameplayDir, gameplayOutputDir);
  }
  
  // Copy pokemon assets
  const pokemonDir = path.join(assetsDir, 'pokemon');
  const pokemonOutputDir = path.join(outputDir, 'pokemon');
  if (fs.existsSync(pokemonDir)) {
    console.log('Copying pokemon assets...');
    copyDirectory(pokemonDir, pokemonOutputDir);
  }
  
  // Copy spine animations
  const spineDir = path.join(assetsDir, 'spine');
  const spineOutputDir = path.join(outputDir, 'spine');
  if (fs.existsSync(spineDir)) {
    console.log('Copying spine animations...');
    copyDirectory(spineDir, spineOutputDir);
  }
}

// Process and optimize images
async function optimizeImages() {
  console.log('Optimizing images...');
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const imagesToProcess = [];
  
  // Find all images in the output directory
  function findImages(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        findImages(fullPath);
      } else if (imageExtensions.includes(path.extname(entry.name).toLowerCase())) {
        imagesToProcess.push(fullPath);
      }
    }
  }
  
  findImages(outputDir);
  
  // Process each image
  for (const imagePath of imagesToProcess) {
    try {
      // Skip spine atlas images as they need to maintain exact dimensions
      if (imagePath.includes('/spine/') && imagePath.endsWith('.png')) {
        continue;
      }
      
      // Optimize the image
      await sharp(imagePath)
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
      
      console.log(`Optimized: ${imagePath}`);
    } catch (error) {
      console.error(`Error optimizing ${imagePath}:`, error);
    }
  }
}

// Main build function
async function buildAssets() {
  console.log('Building assets...');
  
  // Step 1: Process and copy assets
  processAssets();
  
  // Step 2: Optimize images
  await optimizeImages();
  
  console.log('Assets built successfully!');
}

// Run the build process
buildAssets().catch(error => {
  console.error('Error building assets:', error);
  process.exit(1);
});
// .storybook/main.js
/** @type { import('@storybook/react-webpack5').StorybookConfig } */
const config = {
  stories: [
    '../src/js/components/**/*.mdx',
    '../src/js/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../assets'],
};
export default config;
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
// scripts/rtp-calibration.js
import { SlotsMathModel } from '../src/js/math/SlotsMathModel.js';

// Configuration parameters
const TARGET_RTP = 95.5; // Target RTP within 92-96.5% range
const SIMULATION_COUNT = 1000000; // Number of spins to simulate
const TOLERANCE = 0.1; // Acceptable deviation from target RTP

// Function to simulate spins and calculate RTP
function simulateRTP(mathModel, spins) {
  let totalBet = 0;
  let totalWin = 0;
  
  for (let i = 0; i < spins; i++) {
    const bet = 1.0; // Standard bet amount
    totalBet += bet;
    
    // Simulate a spin
    const result = mathModel.spin(bet);
    totalWin += result.totalWin;
    
    // Log progress
    if (i % 100000 === 0) {
      console.log(`Simulated ${i} spins. Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }
  
  const rtp = totalWin / totalBet;
  return {
    spins,
    totalBet,
    totalWin,
    rtp,
    rtpPercentage: (rtp * 100).toFixed(2) + '%'
  };
}

// Function to adjust parameters to reach target RTP
function calibrateRTP(initialConfig, targetRTP, tolerance, maxIterations = 20) {
  let currentConfig = { ...initialConfig };
  let iteration = 0;
  let bestConfig = null;
  let bestRTPDiff = Infinity;
  
  while (iteration < maxIterations) {
    iteration++;
    console.log(`\nIteration ${iteration} of ${maxIterations}`);
    
    // Create math model with current configuration
    const mathModel = new SlotsMathModel(currentConfig);
    
    // Simulate with smaller sample for faster iterations
    const sampleSize = Math.min(100000, SIMULATION_COUNT);
    const result = simulateRTP(mathModel, sampleSize);
    
    console.log(`Simulated RTP: ${result.rtpPercentage}`);
    
    // Calculate difference from target
    const rtpDiff = Math.abs(result.rtp - targetRTP);
    
    // Save best configuration
    if (rtpDiff < bestRTPDiff) {
      bestRTPDiff = rtpDiff;
      bestConfig = { ...currentConfig };
      console.log(`New best configuration found! RTP diff: ${rtpDiff.toFixed(4)}`);
    }
    
    // Check if we're within tolerance
    if (rtpDiff <= tolerance) {
      console.log(`Target RTP achieved within tolerance! Actual: ${result.rtpPercentage}, Target: ${(targetRTP * 100).toFixed(2)}%`);
      break;
    }
    
    // Adjust parameters based on result
    const adjustmentFactor = (targetRTP / result.rtp);
    
    // Apply adjustments to symbol payouts
    currentConfig = adjustSymbolPayouts(currentConfig, adjustmentFactor);
    
    console.log(`Adjusted configuration with factor: ${adjustmentFactor.toFixed(4)}`);
  }
  
  // Final verification with larger sample
  if (bestConfig) {
    console.log('\nPerforming final verification with best configuration...');
    const mathModel = new SlotsMathModel(bestConfig);
    const finalResult = simulateRTP(mathModel, SIMULATION_COUNT);
    
    console.log(`\nFinal RTP: ${finalResult.rtpPercentage}`);
    console.log(`Target RTP: ${(targetRTP * 100).toFixed(2)}%`);
    console.log(`Difference: ${Math.abs(finalResult.rtp - targetRTP).toFixed(4)}`);
    
    return {
      config: bestConfig,
      result: finalResult
    };
  }
  
  return null;
}

// Helper function to adjust symbol payouts
function adjustSymbolPayouts(config, factor) {
  const newConfig = { ...config };
  
  // Adjust base game symbol payouts
  for (const symbolKey in newConfig.baseGame.symbols) {
    const symbol = newConfig.baseGame.symbols[symbolKey];
    if (symbol.pays) {
      symbol.pays = symbol.pays.map(pay => pay > 0 ? pay * factor : pay);
    }
  }
  
  // Adjust other parameters as needed
  // ...
  
  return newConfig;
}

// Run the calibration
console.log(`Starting RTP calibration. Target: ${TARGET_RTP * 100}%, Tolerance: ${TOLERANCE * 100}%`);

const initialConfig = {
  // Initial configuration parameters
  // ...
};

const calibrationResult = calibrateRTP(initialConfig, TARGET_RTP, TOLERANCE);

if (calibrationResult) {
  console.log('\nCalibration successful!');
  console.log('Optimized configuration:');
  console.log(JSON.stringify(calibrationResult.config, null, 2));
  
  // Save the calibrated configuration
  const fs = require('fs');
  fs.writeFileSync('calibrated-config.json', JSON.stringify(calibrationResult.config, null, 2));
  console.log('Configuration saved to calibrated-config.json');
} else {
  console.log('\nCalibration failed to reach target RTP within tolerance.');
}
"dependencies": {
  "@esotericsoftware/spine-webgl": "^4.2.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "prop-types": "^15.8.1"
},
"devDependencies": {
  "sharp": "^0.32.6",
  ...existing devDependencies
}
// Optimize the image
await sharp(imagePath)
  .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
  .toBuffer()
  .then(async (data) => {
    // Save optimized original format
    await sharp(data).toFile(imagePath);
    
    // Save WebP version
    await sharp(data)
      .webp({ quality: 85 })
      .toFile(imagePath.replace(/\.(png|jpg|jpeg)$/i, '.webp'));
  });
module.exports = {
  stories: ['../src/js/components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  }
};
// src/js/math/SlotsMathModel.js
export class SlotsMathModel {
  constructor(config = {}) {
    this.config = {
      rtp: 95.5, // Target RTP within 92-96.5% range
      volatility: 'medium-high',
      ...config
    };
    
    // Base game configuration
    this.baseGame = {
      reels: [
        // 5x4 grid configuration with symbol distribution
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        // Repeat for other reels with adjusted weights
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: '
// src/js/math/SlotsMathModel.js
export class SlotsMathModel {
  constructor(config = {}) {
    this.config = {
      rtp: 95.5, // Target RTP within 92-96.5% range
      volatility: 'medium-high',
      ...config
    };
    
    // Base game configuration
    this.baseGame = {
      reels: [
        // 5x4 grid configuration with symbol distribution
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        // Repeat for other reels with adjusted weights
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 4 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'LOW1', weight: 6 },
          { symbol: 'LOW2', weight: 6 },
          { symbol: 'LOW3', weight: 6 },
          { symbol: 'LOW4', weight: 6 },
          { symbol: 'EGG', weight: 2 },
        ]
      ],
      paylines: 20, // Standard paylines
      ways: 1024,   // Ways to win (4x4x4x4x4)
      symbols: {
        // Define symbols with their payout values
        WILD: { multiplier: 1, substitutes: true, pays: [0, 0, 5, 25, 100] },
        SCATTER: { triggers: 'FREE_SPINS', count: 3, pays: [0, 0, 2, 10, 50] },
        HIGH1: { pays: [0, 0, 5, 25, 100], evolution: { target: 'HIGH2', count: 4 } },
        HIGH2: { pays: [0, 0, 5, 20, 80], evolution: { target: 'HIGH3', count: 4 } },
        HIGH3: { pays: [0, 0, 4, 15, 60] },
        MID1: { pays: [0, 0, 3, 10, 40], evolution: { target: 'MID2', count: 5 } },
        MID2: { pays: [0, 0, 3, 8, 30] },
        LOW1: { pays: [0, 0, 2, 6, 25] },
        LOW2: { pays: [0, 0, 2, 6, 20] },
        LOW3: { pays: [0, 0, 1, 5, 15] },
        LOW4: { pays: [0, 0, 1, 4, 10] },
        EGG: { special: 'EVOLUTION_TRIGGER', pays: [0, 0, 3, 8, 30] }
      }
    };
    
    // Free spins feature
    this.freeSpins = {
      initialSpins: 10,
      multiplier: 2,
      retrigger: true,
      retriggerSpins: 5,
      specialSymbols: {
        // Special symbols that appear only in free spins
        MEGA_WILD: { weight: 2, multiplier: 3, substitutes: true },
        EVOLUTION_BOOST: { weight: 2, special: 'BOOST_EVOLUTION' }
      },
      // Modified reel strips for free spins
      reels: [
        // Enhanced weights for free spins
        // Similar structure to base game but with better odds
      ]
    };
    
    // Tumble/Cascade feature
    this.tumble = {
      enabled: true,
      multiplierProgression: [1, 2, 3, 5, 8, 10], // Multiplier increases with each cascade
      maxTumbles: 15,
      // Special events that can trigger during tumbles
      specialEvents: {
        WILD_EXPLOSION: { chance: 0.05, minTumble: 3 },
        SYMBOL_UPGRADE: { chance: 0.1, minTumble: 2 }
      }
    };
    
    // Cluster pays feature
    this.cluster = {
      minClusterSize: 5,
      payTable: {
        // Payouts based on cluster size
        5: { multiplier: 1 },
        6: { multiplier: 2 },
        7: { multiplier: 3 },
        8: { multiplier: 5 },
        9: { multiplier: 8 },
        10: { multiplier: 10 },
        11: { multiplier: 15 },
        12: { multiplier: 20 },
        13: { multiplier: 30 },
        14: { multiplier: 40 },
        15: { multiplier: 50 },
        // More cluster sizes...
      }
    };
    
    // Evolution/Morphing feature
    this.evolution = {
      enabled: true,
      requirements: {
        // Number of symbols needed for evolution
        standard: 4,
        boosted: 3
      },
      chains: {
        // Evolution chains
        'HIGH1': ['HIGH2', 'HIGH3'],
        'MID1': ['MID2'],
        // More evolution chains...
      }
    };
    
    // Bonus game configuration
    this.bonusGame = {
      trigger: 'BONUS_SYMBOL',
      triggerCount: 3,
      stages: 3,
      multipliers: [2, 3, 5, 8, 10, 15, 20, 50, 100],
      specialFeatures: {
        EXTRA_PICK: { chance: 0.2 },
        MULTIPLIER_BOOST: { chance: 0.15 }
      }
    };
  }
  
  // Calculate win for a specific spin result
  calculateWin(spinResult) {
    let totalWin = 0;
    
    // Calculate line wins
    if (this.config.winType === 'WAYS' || this.config.winType === 'BOTH') {
      totalWin += this.calculateWaysWin(spinResult);
    }
    
    // Calculate payline wins
    if (this.config.winType === 'LINES' || this.config.winType === 'BOTH') {
      totalWin += this.calculateLineWin(spinResult);
    }
    
    // Calculate cluster wins
    if (this.config.winType === 'CLUSTER' || this.config.winType === 'BOTH') {
      totalWin += this.calculateClusterWin(spinResult);
    }
    
    // Apply tumble multiplier if applicable
    if (spinResult.tumbleCount > 0 && this.tumble.enabled) {
      const multiplierIndex = Math.min(spinResult.tumbleCount - 1, this.tumble.multiplierProgression.length - 1);
      totalWin *= this.tumble.multiplierProgression[multiplierIndex];
    }
    
    // Apply free spins multiplier if in free spins mode
    if (spinResult.gameMode === 'FREE_SPINS') {
      totalWin *= this.freeSpins.multiplier;
    }
    
    return totalWin;
  }
  
  // Calculate wins based on ways to win
  calculateWaysWin(spinResult) {
    // Implementation of ways to win calculation
    // This would check for matching symbols on adjacent reels
    return 0; // Placeholder
  }
  
  // Calculate wins based on paylines
  calculateLineWin(spinResult) {
    // Implementation of payline win calculation
    return 0; // Placeholder
  }
  
  // Calculate cluster wins
  calculateClusterWin(spinResult) {
    // Implementation of cluster win calculation
    return 0; // Placeholder
  }
  
  // Determine if free spins are triggered
  checkFreeSpinsTriggered(spinResult) {
    // Count scatter symbols
    const scatterCount = spinResult.grid.flat().filter(cell => cell.symbol === 'SCATTER').length;
    
    // Check if we have enough scatters to trigger free spins
    return scatterCount >= this.baseGame.symbols.SCATTER.count;
  }
  
  // Process tumble/cascade mechanics
  processTumble(currentGrid) {
    // Implementation of tumble/cascade logic
    // This would remove winning symbols and drop new ones from above
    return {
      newGrid: currentGrid, // Placeholder
      removedPositions: [], // Placeholder
      newSymbols: [] // Placeholder
    };
  }
  
  // Process symbol evolution
  processEvolution(grid) {
    // Implementation of evolution/morphing logic
    // This would check for evolution conditions and transform symbols
    return {
      evolved: false, // Placeholder
      newGrid: grid, // Placeholder
      evolvedPositions: [] // Placeholder
    };
  }
  
  // Calculate cluster wins
  calculateClusterWins(grid) {
    // Implementation of cluster pays logic
    // This would identify clusters of matching symbols
    return {
      clusters: [], // Placeholder
      totalWin: 0 // Placeholder
    };
  }
  
  // Generate a random spin result
  generateSpin(seed) {
    // Implementation of random spin generation
    // This would use the seed to generate a deterministic but random-seeming result
    return {
      grid: [], // Placeholder
      wins: [], // Placeholder
      totalWin: 0 // Placeholder
    };
  }
  
  // Simulate multiple spins to verify RTP
  simulateRTP(spins = 100000) {
    let totalBet = spins;
    let totalWin = 0;
    
    for (let i = 0; i < spins; i++) {
      const result = this.generateSpin(i);
      totalWin += result.totalWin;
    }
    
    return (totalWin / totalBet) * 100;
  }
  
  // Adjust weights to target a specific RTP
  calibrateRTP(targetRTP = 95.5, tolerance = 0.1) {
    // Implementation of RTP calibration
    // This would adjust symbol weights to achieve the target RTP
    return {
      success: true, // Placeholder
      actualRTP: targetRTP, // Placeholder
      adjustments: [] // Placeholder
    };
  }
}
// src/js/features/TumbleFeature.js
import { makeRemoveMask, applyTumble } from '../engine/tumble.js';
import { findClusters } from '../engine/cluster.js';
import { bumpMultipliers } from '../engine/multipliers.js';

export class TumbleFeature {
  constructor(config = {}) {
    this.config = {
      multiplierProgression: [1, 2, 3, 5, 8, 10, 15],
      maxTumbles: 15,
      specialEvents: {
        WILD_EXPLOSION: { chance: 0.05, minTumble: 3 },
        SYMBOL_UPGRADE: { chance: 0.1, minTumble: 2 }
      },
      ...config
    };
    
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
    this.tumbleHistory = [];
  }
  
  reset() {
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
    this.tumbleHistory = [];
  }
  
  getMultiplier() {
    const index = Math.min(this.currentTumble, this.config.multiplierProgression.length - 1);
    return this.config.multiplierProgression[index];
  }
  
  processTumble(grid, rng, spinConfig) {
    // Find winning clusters
    const clusters = findClusters(grid, 5); // Minimum cluster size of 5
    
    if (clusters.length === 0) {
      return { 
        hasMoreTumbles: false, 
        updatedGrid: grid,
        removedPositions: [],
        multiplier: this.getMultiplier(),
        specialEvents: []
      };
    }
    
    // Create removal mask from clusters
    const removeMask = makeRemoveMask(grid.length, grid[0].length);
    const allPositions = [];
    
    clusters.forEach(cluster => {
      cluster.positions.forEach(([r, c]) => {
        removeMask[r][c] = true;
        allPositions.push([r, c]);
      });
    });
    
    // Apply tumble to get new grid
    const updatedGrid = applyTumble(
      grid, 
      removeMask, 
      () => generateCell(spinConfig, rng), 
      rng
    );
    
    // Increment tumble counter
    this.currentTumble++;
    
    // Check for special events
    const specialEvents = this.checkSpecialEvents(rng);
    
    // Record tumble in history
    this.tumbleHistory.push({
      tumbleNumber: this.currentTumble,
      removedPositions: allPositions,
      clusters: clusters.length,
      multiplier: this.getMultiplier(),
      specialEvents
    });
    
    return {
      hasMoreTumbles: this.currentTumble < this.config.maxTumbles,
      updatedGrid,
      removedPositions: allPositions,
      multiplier: this.getMultiplier(),
      specialEvents
    };
  }
  
  checkSpecialEvents(rng) {
    const events = [];
    
    // Check for WILD_EXPLOSION
    if (this.currentTumble >= this.config.specialEvents.WILD_EXPLOSION.minTumble) {
      if (rng() < this.config.specialEvents.WILD_EXPLOSION.chance) {
        events.push('WILD_EXPLOSION');
      }
    }
    
    // Check for SYMBOL_UPGRADE
    if (this.currentTumble >= this.config.specialEvents.SYMBOL_UPGRADE.minTumble) {
      if (rng() < this.config.specialEvents.SYMBOL_UPGRADE.chance) {
        events.push('SYMBOL_UPGRADE');
      }
    }
    
    return events;
  }
  
  getTumbleHistory() {
    return this.tumbleHistory;
  }
  
  getTumbleStats() {
    return {
      totalTumbles: this.currentTumble,
      maxMultiplier: this.getMultiplier(),
      specialEventsTriggered: this.tumbleHistory.reduce((count, tumble) => 
        count + tumble.specialEvents.length, 0)
    };
  }
}

// Helper function to generate a cell (simplified version)
function generateCell(cfg, rng) {
  // This would be replaced with the actual implementation from grid.js
  // Just a placeholder for the example
  return { kind: 'standard', tier: 1, id: 'tier1_0' };
}
// src/js/features/EvolutionFeature.js
import { cloneGrid } from '../engine/grid.js';

export class EvolutionFeature {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      requirements: {
        standard: 4,
        boosted: 3
      },
      chains: {
        'HIGH1': ['HIGH2', 'HIGH3'],
        'MID1': ['MID2'],
      },
      ...config
    };
  }
  
  processEvolution(grid, boosted = false) {
    if (!this.config.enabled) {
      return {
        evolved: false,
        newGrid: grid,
        evolvedPositions: []
      };
    }
    
    const newGrid = cloneGrid(grid);
    const rows = grid.length;
    const cols = grid[0].length;
    const requiredCount = boosted ? this.config.requirements.boosted : this.config.requirements.standard;
    
    // Find groups of identical symbols
    const symbolGroups = this.findSymbolGroups(newGrid);
    const evolvedPositions = [];
    let evolved = false;
    
    // Process each group for potential evolution
    for (const [symbolKey, positions] of Object.entries(symbolGroups)) {
      if (positions.length >= requiredCount) {
        // Check if this symbol can evolve
        const [kind, tier] = symbolKey.split('_');
        const evolutionTarget = this.getEvolutionTarget(kind, Number(tier));
        
        if (evolutionTarget) {
          // Evolve the symbols
          positions.forEach(([r, c]) => {
            newGrid[r][c] = {
              ...newGrid[r][c],
              kind: evolutionTarget.kind,
              tier: evolutionTarget.tier,
              id: `${evolutionTarget.kind}${evolutionTarget.tier}_0`
            };
            evolvedPositions.push([r, c]);
          });
          evolved = true;
        }
      }
    }
    
    return {
      evolved,
      newGrid,
      evolvedPositions
    };
  }
  
  findSymbolGroups(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const groups = {};
    
    // Group identical symbols
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const key = `${cell.kind}_${cell.tier}`;
        
        if (!groups[key]) {
          groups[key] = [];
        }
        
        groups[key].push([r, c]);
      }
    }
    
    return groups;
  }
  
  getEvolutionTarget(kind, tier) {
    // Check if this symbol has an evolution chain
    const chain = this.config.chains[`${kind}${tier}`];
    
    if (chain && chain.length > 0) {
      const nextSymbol = chain[0];
      // Parse the next symbol to get kind and tier
      const match = nextSymbol.match(/([A-Z]+)(\d+)/);
      
      if (match) {
        return {
          kind: match[1],
          tier: Number(match[2])
        };
      }
    }
    
    return null;
  }
  
  canEvolve(symbolKind, symbolTier) {
    return !!this.getEvolutionTarget(symbolKind, symbolTier);
  }
}
// src/js/features/FreeSpinsFeature.js
import { spin } from '../engine/engine.js';
import { makeMultiplierMap } from '../engine/multipliers.js';

export class FreeSpinsFeature {
  constructor(config = {}) {
    this.config = {
      initialSpins: 10,
      multiplier: 2,
      retrigger: true,
      retriggerSpins: 5,
      retriggerScatterCount: 3,
      specialSymbols: {
        MEGA_WILD: { weight: 2, multiplier: 3, substitutes: true },
        EVOLUTION_BOOST: { weight: 2, special: 'BOOST_EVOLUTION' }
      },
      ...config
    };
    
    this.state = {
      active: false,
      spinsRemaining: 0,
      spinsAwarded: 0,
      totalWin: 0,
      multiplierMap: null,
      specialSymbolsActive: {},
      spinHistory: []
    };
  }
  
  activate(scatterCount, rows, cols) {
    // Determine initial spins based on scatter count
    const initialSpins = this.getInitialSpins(scatterCount);
    
    this.state = {
      active: true,
      spinsRemaining: initialSpins,
      spinsAwarded: initialSpins,
      totalWin: 0,
      multiplierMap: makeMultiplierMap(rows, cols),
      specialSymbolsActive: {},
      spinHistory: []
    };
    
    return {
      activated: true,
      spinsAwarded: initialSpins
    };
  }
  
  getInitialSpins(scatterCount) {
    // Base spins
    let spins = this.config.initialSpins;
    
    // Bonus spins for extra scatters
    if (scatterCount > 3) {
      spins += (scatterCount - 
// src/js/features/FreeSpinsFeature.js
import { spin } from '../engine/engine.js';
import { makeMultiplierMap } from '../engine/multipliers.js';

export class FreeSpinsFeature {
  constructor(config = {}) {
    this.config = {
      initialSpins: 10,
      multiplier: 2,
      retrigger: true,
      retriggerSpins: 5,
      retriggerScatterCount: 3,
      specialSymbols: {
        MEGA_WILD: { weight: 2, multiplier: 3, substitutes: true },
        EVOLUTION_BOOST: { weight: 2, special: 'BOOST_EVOLUTION' }
      },
      ...config
    };
    
    this.state = {
      active: false,
      spinsRemaining: 0,
      spinsAwarded: 0,
      totalWin: 0,
      multiplierMap: null,
      specialSymbolsActive: {},
      spinHistory: []
    };
  }
  
  activate(scatterCount, rows, cols) {
    // Determine initial spins based on scatter count
    const initialSpins = this.getInitialSpins(scatterCount);
    
    this.state = {
      active: true,
      spinsRemaining: initialSpins,
      spinsAwarded: initialSpins,
      totalWin: 0,
      multiplierMap: makeMultiplierMap(rows, cols),
      specialSymbolsActive: {},
      spinHistory: []
    };
    
    return {
      activated: true,
      spinsAwarded: initialSpins
    };
  }
  
  getInitialSpins(scatterCount) {
    // Base spins
    let spins = this.config.initialSpins;
    
    // Bonus spins for extra scatters
    if (scatterCount > 3) {
      spins += (scatterCount - 3) * 2;
    }
    
    return spins;
  }
  
  processSpin(configJson, bet, seed) {
    if (!this.state.active || this.state.spinsRemaining <= 0) {
      return {
        error: 'Free spins not active or no spins remaining'
      };
    }
    
    // Modify config for free spins (e.g., different weights, special symbols)
    const freeSpinConfig = this.modifyConfigForFreeSpins(configJson);
    
    // Execute the spin with the modified config
    const spinResult = spin(
      freeSpinConfig, 
      bet, 
      { 
        seed, 
        initMultiplierMap: this.state.multiplierMap 
      }
    );
    
    // Apply free spins multiplier to the win
    spinResult.totalWinX *= this.config.multiplier;
    
    // Update state
    this.state.spinsRemaining--;
    this.state.totalWin += spinResult.totalWinX * bet;
    this.state.multiplierMap = spinResult.multiplierMap;
    
    // Check for retrigger
    const retriggered = this.checkRetrigger(spinResult);
    
    // Record spin in history
    this.state.spinHistory.push({
      spinNumber: this.state.spinsAwarded - this.state.spinsRemaining,
      win: spinResult.totalWinX * bet,
      retriggered,
      specialEvents: spinResult.events.filter(e => e.type === 'special')
    });
    
    // Check if free spins feature is complete
    const isComplete = this.state.spinsRemaining <= 0;
    if (isComplete) {
      this.state.active = false;
    }
    
    return {
      spinResult,
      freeSpinsState: {
        spinsRemaining: this.state.spinsRemaining,
        totalWin: this.state.totalWin,
        isComplete
      },
      retriggered
    };
  }
  
  modifyConfigForFreeSpins(configJson) {
    // Create a deep copy of the config
    const freeSpinConfig = JSON.parse(JSON.stringify(configJson));
    
    // Modify symbol weights to include special free spin symbols
    if (freeSpinConfig.weights) {
      // Add special symbols with their weights
      Object.entries(this.config.specialSymbols).forEach(([symbol, data]) => {
        freeSpinConfig.weights[symbol] = data.weight;
      });
      
      // Optionally adjust other symbol weights for better odds
      // For example, increase WILD frequency
      if (freeSpinConfig.weights.WILD) {
        freeSpinConfig.weights.WILD *= 1.5;
      }
    }
    
    return freeSpinConfig;
  }
  
  checkRetrigger(spinResult) {
    if (!this.config.retrigger) return false;
    
    // Count scatter symbols
    const scatterCount = spinResult.grid.flat().filter(cell => 
      cell.kind === 'scatter_pokeball' || cell.kind === 'scatter_pikachu'
    ).length;
    
    // Check if we have enough scatters to retrigger
    if (scatterCount >= this.config.retriggerScatterCount) {
      const additionalSpins = this.config.retriggerSpins;
      this.state.spinsRemaining += additionalSpins;
      this.state.spinsAwarded += additionalSpins;
      return true;
    }
    
    return false;
  }
  
  getState() {
    return { ...this.state };
  }
  
  isActive() {
    return this.state.active && this.state.spinsRemaining > 0;
  }
  
  getFreeSpinsStats() {
    return {
      spinsAwarded: this.state.spinsAwarded,
      spinsPlayed: this.state.spinsAwarded - this.state.spinsRemaining,
      spinsRemaining: this.state.spinsRemaining,
      totalWin: this.state.totalWin,
      averageWinPerSpin: this.state.totalWin / (this.state.spinsAwarded - this.state.spinsRemaining),
      retriggersCount: this.state.spinHistory.filter(spin => spin.retriggered).length
    };
  }
}
// src/js/components/GameGrid.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { GameSymbol } from './GameSymbol';
import './GameGrid.css';

export const GameGrid = ({ 
  grid, 
  winningPositions = [], 
  evolvedPositions = [],
  multiplierMap = [],
  onSymbolClick,
  animationState = 'idle', // idle, spinning, tumbling, evolving
  onAnimationComplete
}) => {
  const gridRef = useRef(null);
  
  // Handle animation effects
  useEffect(() => {
    if (!gridRef.current) return;
    
    // Apply different animations based on state
    if (animationState === 'spinning') {
      // Spinning animation
      const spinAnimation = gridRef.current.animate(
        [
          { transform: 'translateY(-20px)', opacity: 0.5 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        { 
          duration: 800, 
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'forwards'
        }
      );
      
      spinAnimation.onfinish = () => {
        onAnimationComplete && onAnimationComplete('spinning');
      };
    } else if (animationState === 'tumbling') {
      // Tumbling animation
      // This would be more complex in a real implementation
      setTimeout(() => {
        onAnimationComplete && onAnimationComplete('tumbling');
      }, 600);
    } else if (animationState === 'evolving') {
      // Evolution animation
      setTimeout(() => {
        onAnimationComplete && onAnimationComplete('evolving');
      }, 800);
    }
  }, [animationState, onAnimationComplete]);
  
  return (
    <div className={`game-grid ${animationState}`} ref={gridRef}>
      {grid.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid-row">
          {row.map((cell, colIndex) => {
            const isWinning = winningPositions.some(
              pos => pos[0] === rowIndex && pos[1] === colIndex
            );
            
            const isEvolved = evolvedPositions.some(
              pos => pos[0] === rowIndex && pos[1] === colIndex
            );
            
            const multiplier = multiplierMap[rowIndex]?.[colIndex] || 1;
            
            return (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`grid-cell ${isWinning ? 'winning' : ''} ${isEvolved ? 'evolved' : ''}`}
                onClick={() => onSymbolClick && onSymbolClick(rowIndex, colIndex, cell)}
              >
                <GameSymbol 
                  type={cell.kind} 
                  tier={cell.tier}
                  id={cell.id}
                  animated={isWinning || isEvolved} 
                />
                {multiplier > 1 && (
                  <div className="cell-multiplier">x{multiplier}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

GameGrid.propTypes = {
  grid: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.object)).isRequired,
  winningPositions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  evolvedPositions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  multiplierMap: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  onSymbolClick: PropTypes.func,
  animationState: PropTypes.oneOf(['idle', 'spinning', 'tumbling', 'evolving']),
  onAnimationComplete: PropTypes.func
};
// src/js/components/GameGrid.stories.jsx
import { GameGrid } from './GameGrid';

export default {
  title: 'PocketMon/GameGrid',
  component: GameGrid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

// Create a sample grid for the story
const sampleGrid = [
  [
    { kind: 'wild', tier: 0, id: 'wild_0' },
    { kind: 'standard', tier: 1, id: 'tier1_0' },
    { kind: 'standard', tier: 2, id: 'tier2_1' },
    { kind: 'standard', tier: 3, id: 'tier3_2' },
    { kind: 'scatter_pokeball', tier: 0, id: 'scatter_pokeball' },
  ],
  [
    { kind: 'standard', tier: 4, id: 'tier4_0' },
    { kind: 'scatter_pikachu', tier: 0, id: 'scatter_pikachu' },
    { kind: 'standard', tier: 1, id: 'tier1_3' },
    { kind: 'standard', tier: 2, id: 'tier2_2' },
    { kind: 'standard', tier: 3, id: 'tier3_1' },
  ],
  [
    { kind: 'standard', tier: 5, id: 'tier5_0' },
    { kind: 'standard', tier: 4, id: 'tier4_1' },
    { kind: 'wild', tier: 0, id: 'wild_0' },
    { kind: 'standard', tier: 1, id: 'tier1_4' },
    { kind: 'standard', tier: 2, id: 'tier2_3' },
  ],
  [
    { kind: 'egg', tier: 0, id: 'egg_0' },
    { kind: 'standard', tier: 5, id: 'tier5_1' },
    { kind: 'standard', tier: 4, id: 'tier4_2' },
    { kind: 'standard', tier: 3, id: 'tier3_3' },
    { kind: 'scatter_trainer', tier: 0, id: 'scatter_trainer' },
  ],
];

const sampleMultiplierMap = [
  [1, 1, 1, 1, 1],
  [1, 2, 1, 1, 1],
  [1, 1, 3, 1, 1],
  [1, 1, 1, 2, 1],
];

export const Default = {
  args: {
    grid: sampleGrid,
    winningPositions: [],
    evolvedPositions: [],
    multiplierMap: sampleMultiplierMap,
    onSymbolClick: (row, col, symbol) => {
      console.log(`Clicked symbol ${symbol.kind} at position [${row}, ${col}]`);
    },
    animationState: 'idle',
  },
};

export const WithWinningPositions = {
  args: {
    ...Default.args,
    winningPositions: [
      [0, 0], [1, 0], [2, 0], // Vertical win
      [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], // Horizontal win
    ],
  },
};

export const WithEvolution = {
  args: {
    ...Default.args,
    evolvedPositions: [
      [1, 1], [1, 2], [2, 1], [2, 2], // 2x2 evolution
    ],
    animationState: 'evolving',
  },
};

export const Spinning = {
  args: {
    ...Default.args,
    animationState: 'spinning',
    onAnimationComplete: (state) => {
      console.log(`Animation complete: ${state}`);
    },
  },
};

export const Tumbling = {
  args: {
    ...Default.args,
    animationState: 'tumbling',
    winningPositions: [
      [0, 0], [1, 0], [2, 0], // Vertical win
    ],
    onAnimationComplete: (state) => {
      console.log(`Animation complete: ${state}`);
    },
  },
};
// src/js/components/PocketMonGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GameGrid } from './GameGrid';
import { SpineAnimation } from './SpineAnimation';
import { Button } from './Button';
import { spin } from '../engine/engine';
import { TumbleFeature } from '../features/TumbleFeature';
import { EvolutionFeature } from '../features/EvolutionFeature';
import { FreeSpinsFeature } from '../features/FreeSpinsFeature';
import './PocketMonGame.css';

export const PocketMonGame = ({ 
  config, 
  initialBalance = 1000,
  betOptions = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],
  onWin,
  onFreeSpinsStart,
  onFreeSpinsEnd
}) => {
  // Game state
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(betOptions[2]); // Default to third option
  const [gameState, setGameState] = useState('idle'); // idle, spinning, tumbling, evolving, freespins
  const [grid, setGrid] = useState([]);
  const [winningPositions, setWinningPositions] = useState([]);
  const [evolvedPositions, setEvolvedPositions] = useState([]);
  const [multiplierMap, setMultiplierMap] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  
  // Feature instances
  const [tumbleFeature] = useState(() => new TumbleFeature());
  const [evolutionFeature] = useState(() => new EvolutionFeature());
  const [freeSpinsFeature] = useState(() => new FreeSpinsFeature());
  
  // Animation state
  const [animationState, setAnimationState] = useState('idle');
  
  // Initialize the game
  useEffect(() => {
    // Initial empty grid
    const emptyGrid = Array(4).fill().map(() => 
      Array(5).fill().map(() => ({ kind: 'empty', tier: 0, id: 'empty_0' }))
    );
    setGrid(emptyGrid);
    
    // Initial multiplier map
    const initialMultiplierMap = Array(4).fill().map(() => Array(5).fill(1));
    setMultiplierMap(initialMultiplierMap);
  }, []);
  
  // Handle spin button click
  const handleSpin = useCallback(() => {
    // Check if we have enough balance
    if (balance < bet) {
      alert('Insufficient balance!');
      return;
    }
    
    // Check if we're in free spins mode
    if (freeSpinsFeature.isActive()) {
      handleFreeSpinStep();
      return;
    }
    
    // Deduct bet from balance
    setBalance(prev => prev - bet);
    
    // Reset features
    tumbleFeature.reset();
    
    // Set game state to spinning
    setGameState('spinning');
    setAnimationState('spinning');
    
    // Generate a random
// src/js/components/PocketMonGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GameGrid } from './GameGrid';
import { SpineAnimation } from './SpineAnimation';
import { Button } from './Button';
import { spin } from '../engine/engine';
import { TumbleFeature } from '../features/TumbleFeature';
import { EvolutionFeature } from '../features/EvolutionFeature';
import { FreeSpinsFeature } from '../features/FreeSpinsFeature';
import './PocketMonGame.css';

export const PocketMonGame = ({ 
  config, 
  initialBalance = 1000,
  betOptions = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],
  onWin,
  onFreeSpinsStart,
  onFreeSpinsEnd
}) => {
  // Game state
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(betOptions[2]); // Default to third option
  const [gameState, setGameState] = useState('idle'); // idle, spinning, tumbling, evolving, freespins
  const [grid, setGrid] = useState([]);
  const [winningPositions, setWinningPositions] = useState([]);
  const [evolvedPositions, setEvolvedPositions] = useState([]);
  const [multiplierMap, setMultiplierMap] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  
  // Feature instances
  const [tumbleFeature] = useState(() => new TumbleFeature());
  const [evolutionFeature] = useState(() => new EvolutionFeature());
  const [freeSpinsFeature] = useState(() => new FreeSpinsFeature());
  
  // Animation state
  const [animationState, setAnimationState] = useState('idle');
  
  // Initialize the game
  useEffect(() => {
    // Initial empty grid
    const emptyGrid = Array(4).fill().map(() => 
      Array(5).fill().map(() => ({ kind: 'empty', tier: 0, id: 'empty_0' }))
    );
    setGrid(emptyGrid);
    
    // Initial multiplier map
    const initialMultiplierMap = Array(4).fill().map(() => Array(5).fill(1));
    setMultiplierMap(initialMultiplierMap);
  }, []);
  
  // Handle spin button click
  const handleSpin = useCallback(() => {
    // Check if we have enough balance
    if (balance < bet) {
      alert('Insufficient balance!');
      return;
    }
    
    // Check if we're in free spins mode
    if (freeSpinsFeature.isActive()) {
      handleFreeSpinStep();
      return;
    }
    
    // Deduct bet from balance
    setBalance(prev => prev - bet);
    
    // Reset features
    tumbleFeature.reset();
    
    // Set game state to spinning
    setGameState('spinning');
    setAnimationState('spinning');
    
    // Generate a random seed
    const seed = Math.floor(Math.random() * 1000000);
    
    // Execute the spin
    const spinResult = spin(config, bet, { seed });
    
    // Update the grid and multiplier map
    setGrid(spinResult.grid);
    setMultiplierMap(spinResult.multiplierMap);
    
    // Process wins
    const clusters = spinResult.events.filter(e => e.type === 'win');
    const winPositions = [];
    
    clusters.forEach(cluster => {
      cluster.payload.positions.forEach(pos => {
        winPositions.push(pos);
      });
    });
    
    setWinningPositions(winPositions);
    
    // Calculate total win
    const winAmount = spinResult.totalWinX * bet;
    setLastWin(winAmount);
    
    // Check for free spins trigger
    const scatterEvents = spinResult.events.filter(e => e.type === 'scatters');
    if (scatterEvents.length > 0 && scatterEvents[0].payload.count >= 3) {
      // Activate free spins
      const rows = grid.length;
      const cols = grid[0].length;
      const freeSpinsResult = freeSpinsFeature.activate(scatterEvents[0].payload.count, rows, cols);
      
      // Notify about free spins start
      onFreeSpinsStart && onFreeSpinsStart(freeSpinsResult.spinsAwarded);
    }
  }, [balance, bet, config, freeSpinsFeature, tumbleFeature, grid, onFreeSpinsStart]);
  
  // Handle free spin step
  const handleFreeSpinStep = useCallback(() => {
    // Set game state to spinning
    setGameState('fre
// src/js/components/PocketMonGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GameGrid } from './GameGrid';
import { SpineAnimation } from './SpineAnimation';
import { Button } from './Button';
import { spin } from '../engine/engine';
import { TumbleFeature } from '../features/TumbleFeature';
import { EvolutionFeature } from '../features/EvolutionFeature';
import { FreeSpinsFeature } from '../features/FreeSpinsFeature';
import './PocketMonGame.css';

export const PocketMonGame = ({ 
  config, 
  initialBalance = 1000,
  betOptions = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],
  onWin,
  onFreeSpinsStart,
  onFreeSpinsEnd
}) => {
  // Game state
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(betOptions[2]); // Default to third option
  const [gameState, setGameState] = useState('idle'); // idle, spinning, tumbling, evolving, freespins
  const [grid, setGrid] = useState([]);
  const [winningPositions, setWinningPositions] = useState([]);
  const [evolvedPositions, setEvolvedPositions] = useState([]);
  const [multiplierMap, setMultiplierMap] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  
  // Feature instances
  const [tumbleFeature] = useState(() => new TumbleFeature());
  const [evolutionFeature] = useState(() => new EvolutionFeature());
  const [freeSpinsFeature] = useState(() => new FreeSpinsFeature());
  
  // Animation state
  const [animationState, setAnimationState] = useState('idle');
  
  // Initialize the game
  useEffect(() => {
    // Initial empty grid
    const emptyGrid = Array(4).fill().map(() => 
      Array(5).fill().map(() => ({ kind: 'empty', tier: 0, id: 'empty_0' }))
    );
    setGrid(emptyGrid);
    
    // Initial multiplier map
    const initialMultiplierMap = Array(4).fill().map(() => Array(5).fill(1));
    setMultiplierMap(initialMultiplierMap);
  }, []);
  
  // Handle spin button click
  const handleSpin = useCallback(() => {
    // Check if we have enough balance
    if (balance < bet) {
      alert('Insufficient balance!');
      return;
    }
    
    // Check if we're in free spins mode
    if (freeSpinsFeature.isActive()) {
      handleFreeSpinStep();
      return;
    }
    
    // Deduct bet from balance
    setBalance(prev => prev - bet);
    
    // Reset features
    tumbleFeature.reset();
    
    // Set game state to spinning
    setGameState('spinning');
    setAnimationState('spinning');
    
    // Generate a random seed
    const seed = Math.floor(Math.random() * 1000000);
    
    // Execute the spin
    const spinResult = spin(config, bet, { seed });
    
    // Update the grid and multiplier map
    setGrid(spinResult.grid);
    setMultiplierMap(spinResult.multiplierMap);
    
    // Process wins
    const clusters = spinResult.events.filter(e => e.type === 'win');
    const winPositions = [];
    
    clusters.forEach(cluster => {
      cluster.payload.positions.forEach(pos => {
        winPositions.push(pos);
      });
    });
    
    setWinningPositions(winPositions);
    
    // Calculate total win
    const winAmount = spinResult.totalWinX * bet;
    setLastWin(winAmount);
    
    // Check for free spins trigger
    const scatterEvents = spinResult.events.filter(e => e.type === 'scatters');
    if (scatterEvents.length > 0 && scatterEvents[0].payload.count >= 3) {
      // Activate free spins
      const rows = grid.length;
      const cols = grid[0].length;
      const freeSpinsResult = freeSpinsFeature.activate(scatterEvents[0].payload.count, rows, cols);
      
      // Notify about free spins start
      onFreeSpinsStart && onFreeSpinsStart(freeSpinsResult.spinsAwarded);
    }
  }, [balance, bet, config, freeSpinsFeature, tumbleFeature, grid, onFreeSpinsStart]);
  
  // Handle free spin step
  const handleFreeSpinStep = useCallback(() => {
    // Set game state to spinning
    setGameState('freespins');
    setAnimationState('spinning');
    
    // Generate a random seed
    const seed = Math.floor(Math.random() * 1000000);
    
    // Execute the free spin
    const freeSpinResult = freeSpinsFeature.processSpin(config, bet, seed);
    
    // Update the grid and multiplier map
    setGrid(freeSpinResult.spinResult.grid);
    setMultiplierMap(freeSpinResult.spinResult.multiplierMap);
    
    // Process wins
    const clusters = freeSpinResult.spinResult.events.filter(e => e.type === 'win');
    const winPositions = [];
    
    clusters.forEach(cluster => {
      cluster.payload.positions.forEach(pos => {
        winPositions.push(pos);
      });
    });
    
    setWinningPositions(winPositions);
    
    // Calculate win
    const winAmount = freeSpinResult.spinResult.totalWinX * bet;
    setLastWin(winAmount);
    setTotalWin(prev => prev + winAmount);
    
    // Check if free spins are complete
    if (freeSpinResult.freeSpinsState.isComplete) {
      // Add total win to balance
      setBalance(prev => prev + freeSpinResult.freeSpinsState.totalWin);
      
      // Notify about free spins end
      onFreeSpinsEnd && onFreeSpinsEnd(freeSpinResult.freeSpinsState.totalWin);
      
      // Reset game state
      setGameState('idle');
    }
  }, [config, bet, freeSpinsFeature, onFreeSpinsEnd]);
  
  // Handle animation complete
  const handleAnimationComplete = useCallback((state) => {
    if (state === 'spinning') {
      // Check for wins
      if (winningPositions.length > 0) {
        // Process tumble
        setAnimationState('tumbling');
        
        // Add win to balance
        setBalance(prev => prev + lastWin);
        setTotalWin(prev => prev + lastWin);
        
        // Notify about win
        onWin && onWin(lastWin);
      } else {
        // No wins, return to idle
        setAnimationState('idle');
        setGameState('idle');
      }
    } else if (state === 'tumbling') {
      // Check for evolution
      const evolutionResult = evolutionFeature.processEvolution(grid);
      
      if (evolutionResult.evolved) {
        // Apply evolution
        setGrid(evolutionResult.newGrid);
        setEvolvedPositions(evolutionResult.evolvedPositions);
        setAnimationState('evolving');
      } else {
        // Process next tumble
        const tumbleResult = tumbleFeature.processTumble(grid, () => Math.random(), config);
        
        if (tumbleResult.hasMoreTumbles && tumbleResult.removedPositions.length > 0) {
          // Continue tumbling
          setGrid(tumbleResult.updatedGrid);
          setWinningPositions(tumbleResult.removedPositions);
          setAnimationState('tumbling');
        } else {
          // Tumbling complete
          setAnimationState('idle');
          setGameState('idle');
        }
      }
    } else if (state === 'evolving') {
      // Evolution complete, check for new wins
      setAnimationState('idle');
      setGameState('idle');
    }
  }, [winningPositions, lastWin, grid, evolutionFeature, tumbleFeature, config, onWin]);
  
  // Handle bet change
  const handleBetChange = (newBet) => {
    if (gameState === 'idle') {
      setBet(newBet);
    }
  };
  
  return (
    <div className="pocketmon-game">
      <div className="game-header">
        <div className="balance-display">
          Balance: ${balance.toFixed(2)}
        </div>
        <div className="bet-controls">
          <Button 
            onClick={() => handleBetChange(Math.max(betOptions[0], bet / 2))}
            disabled={gameState !== 'idle' || bet <= betOptions[0]}
          >
            Bet -
          </Button>
          <div className="current-bet">
            Bet: ${bet.toFixed(2)}
          </div>
          <Button 
            onClick={() => handleBetChange(Math.min(betOptions[betOptions.length - 1], bet * 2))}
            disabled={gameState !== 'idle' || bet >= betOptions[betOptions.length - 1]}
          >
            Bet +
          </Button>
        </div>
        <div className="win-display">
          Win: ${lastWin.toFixed(2)}
        </div>
      </div>
      
      <div className="game-grid-container">
        <GameGrid 
          grid={grid}
          winningPositions={winningPositions}
          evolvedPositions={evolvedPositions}
          multiplierMap={multiplierMap}
          animationState={animationState}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
      
      <div className="game-controls">
        <Button 
          onClick={handleSpin}
          disabled={gameState !== 'idle' || balance < bet}
          variant="primary"
          size="large"
        >
          {freeSpinsFeature.isActive() 
            ? `Free Spin (${freeSpinsFeature.getState().spinsRemaining} left)` 
            : 'SPIN'
          }
        </Button>
      </div>
      
      {freeSpinsFeature.isActive() && (
        <div className="free-spins-info">
          <div className="free-spins-count">
            Free Spins: {freeSpinsFeature.getState().spinsRemaining} / {freeSpinsFeature.getState().spinsAwarded}
          </div>
          <div className="free-spins-win">
            Total Win: ${freeSpinsFeature.getState().totalWin.toFixed(2)}
          </div>
        </div>
      )}
      
      {totalWin > 0 && (
        <div className="total-win-display">
          Total Win: ${totalWin.toFixed(2)}
        </div>
      )}
    </div>
  );
};

PocketMonGame.propTypes = {
  config: PropTypes.object.isRequired,
  initialBalance: PropTypes.number,
  betOptions: PropTypes.arrayOf(PropTypes.number),
  onWin: PropTypes.func,
  onFreeSpinsStart: PropTypes.func,
  onFreeSpinsEnd: PropTypes.func
};
// src/js/components/PocketMonGame.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GameGrid } from './GameGrid';
import { SpineAnimation } from './SpineAnimation';
import { Button } from './Button';
import { spin } from '../engine/engine';
import { TumbleFeature } from '../features/TumbleFeature';
import { EvolutionFeature } from '../features/EvolutionFeature';
import { FreeSpinsFeature } from '../features/FreeSpinsFeature';
import './PocketMonGame.css';

export const PocketMonGame = ({ 
  config, 
  initialBalance = 1000,
  betOptions = [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],
  onWin,
  onFreeSpinsStart,
  onFreeSpinsEnd
}) => {
  // Game state
  const [balance, setBalance] = useState(initialBalance);
  const [bet, setBet] = useState(betOptions[2]); // Default to third option
  const [gameState, setGameState] = useState('idle'); // idle, spinning, tumbling, evolving, freespins
  const [grid, setGrid] = useState([]);
  const [winningPositions, setWinningPositions] = useState([]);
  const [evolvedPositions, setEvolvedPositions] = useState([]);
  const [multiplierMap, setMultiplierMap] = useState([]);
  const [totalWin, setTotalWin] = useState(0);
  const [lastWin, setLastWin] = useState(0);
  
  // Feature instances
  const [tumbleFeature] = useState(() => new TumbleFeature());
  const [evolutionFeature] = useState(() => new EvolutionFeature());
  const [freeSpinsFeature] = useState(() => new FreeSpinsFeature());
  
  // Animation state
  const [animationState, setAnimationState] = useState('idle');
  
  // Initialize the game
  useEffect(() => {
    // Initial empty grid
    const emptyGrid = Array(4).fill().map(() => 
      Array(5).fill().map(() => ({ kind: 'empty', tier: 0, id: 'empty_0' }))
    );
    setGrid(emptyGrid);
    
    // Initial multiplier map
    const initialMultiplierMap = Array(4).fill().map(() => Array(5).fill(1));
    setMultiplierMap(initialMultiplierMap);
  }, []);
  
  // Handle spin button click
  const handleSpin = useCallback(() => {
    // Check if we have enough balance
    if (balance < bet) {
      alert('Insufficient balance!');
      return;
    }
    
    // Check if we're in free spins mode
    if (freeSpinsFeature.isActive()) {
      handleFreeSpinStep();
      return;
    }
    
    // Deduct bet from balance
    setBalance(prev => prev - bet);
    
    // Reset features
    tumbleFeature.reset();
    
    // Set game state to spinning
    setGameState('spinning');
    setAnimationState('spinning');
    
    // Generate a random seed
    const seed = Math.floor(Math.random() * 1000000);
    
    // Execute the spin
    const spinResult = spin(config, bet, { seed });
    
    // Update the grid and multiplier map
    setGrid(spinResult.grid);
    setMultiplierMap(spinResult.multiplierMap);
    
    // Process wins
    const clusters = spinResult.events.filter(e => e.type === 'win');
    const winPositions = [];
    
    clusters.forEach(cluster => {
      cluster.payload.positions.forEach(pos => {
        winPositions.push(pos);
      });
    });
    
    setWinningPositions(winPositions);
    
    // Calculate total win
    const winAmount = spinResult.totalWinX * bet;
    setLastWin(winAmount);
    
    // Check for free spins trigger
    const scatterEvents = spinResult.events.filter(e => e.type === 'scatters');
    if (scatterEvents.length > 0 && scatterEvents[0].payload.count >= 3) {
      // Activate free spins
      const rows = grid.length;
      const cols = grid[0].length;
      const freeSpinsResult = freeSpinsFeature.activate(scatterEvents[0].payload.count, rows, cols);
      
      // Notify about free spins start
      onFreeSpinsStart && onFreeSpinsStart(freeSpinsResult.spinsAwarded);
    }
  }, [balance, bet, config, freeSpinsFeature, tumbleFeature, grid, onFreeSpinsStart]);
  
  // Handle free spin step
  const handleFreeSpinStep = useCallback(() => {
    // Set game state to spinning
    setGameState('freespins');
    setAnimationState('spinning');
    
    // Generate a random seed
    const seed = Math.floor(Math.random() * 1000000);
    
    // Execute the free spin
    const freeSpinResult = freeSpinsFeature.processSpin(config, bet, seed);
    
    // Update the grid and multiplier map
    setGrid(freeSpinResult.spinResult.grid);
    setMultiplierMap(freeSpinResult.spinResult.multiplierMap);
    
    // Process wins
    const clusters = freeSpinResult.spinResult.events.filter(e => e.type === 'win');
    const winPositions = [];
    
    clusters.forEach(cluster => {
      cluster.payload.positions.forEach(pos => {
        winPositions.push(pos);
      });
    });
    
    setWinningPositions(winPositions);
    
    // Calculate win
    const winAmount = freeSpinResult.spinResult.totalWinX * bet;
    setLastWin(winAmount);
    setTotalWin(prev => prev + winAmount);
    
    // Check if free spins are complete
    if (freeSpinResult.freeSpinsState.isComplete) {
      // Add total win to balance
      setBalance(prev => prev + freeSpinResult.freeSpinsState.totalWin);
      
      // Notify about free spins end
      onFreeSpinsEnd && onFreeSpinsEnd(freeSpinResult.freeSpinsState.totalWin);
      
      // Reset game state
      setGameState('idle');
    }
  }, [config, bet, freeSpinsFeature, onFreeSpinsEnd]);
  
  // Handle animation complete
  const handleAnimationComplete = useCallback((state) => {
    if (state === 'spinning') {
      // Check for wins
      if (winningPositions.length > 0) {
        // Process tumble
        setAnimationState('tumbling');
        
        // Add win to balance
        setBalance(prev => prev + lastWin);
        setTotalWin(prev => prev + lastWin);
        
        // Notify about win
        onWin && onWin(lastWin);
      } else {
        // No wins, return to idle
        setAnimationState('idle');
        setGameState('idle');
      }
    } else if (state === 'tumbling') {
      // Check for evolution
      const evolutionResult = evolutionFeature.processEvolution(grid);
      
      if (evolutionResult.evolved) {
        // Apply evolution
        setGrid(evolutionResult.newGrid);
        setEvolvedPositions(evolutionResult.evolvedPositions);
        setAnimationState('evolving');
      } else {
        // Process next tumble
        const tumbleResult = tumbleFeature.processTumble(grid, () => Math.random(), config);
        
        if (tumbleResult.hasMoreTumbles && tumbleResult.removedPositions.length > 0) {
          // Continue tumbling
          setGrid(tumbleResult.updatedGrid);
          setWinningPositions(tumbleResult.removedPositions);
          setAnimationState('tumbling');
        } else {
          // Tumbling complete
          setAnimationState('idle');
          setGameState('idle');
        }
      }
    } else if (state === 'evolving') {
      // Evolution complete, check for new wins
      setAnimationState('idle');
      setGameState('idle');
    }
  }, [winningPositions, lastWin, grid, evolutionFeature, tumbleFeature, config, onWin]);
  
  // Handle bet change
  const handleBetChange = (newBet) => {
    if (gameState === 'idle') {
      setBet(newBet);
    }
  };
  
  return (
    <div className="pocketmon-game">
      <div className="game-header">
        <div className="balance-display">
          Balance: ${balance.toFixed(2)}
        </div>
        <div className="bet-controls">
          <Button 
            onClick={() => handleBetChange(Math.max(betOptions[0], bet / 2))}
            disabled={gameState !== 'idle' || bet <= betOptions[0]}
          >
            Bet -
          </Button>
          <div className="current-bet">
            Bet: ${bet.toFixed(2)}
          </div>
          <Button 
            onClick={() => handleBetChange(Math.min(betOptions[betOptions.length - 1], bet * 2))}
            disabled={gameState !== 'idle' || bet >= betOptions[betOptions.length - 1]}
          >
            Bet +
          </Button>
        </div>
        <div className="win-display">
          Win: ${lastWin.toFixed(2)}
        </div>
      </div>
      
      <div className="game-grid-container">
        <GameGrid 
          grid={grid}
          winningPositions={winningPositions}
          evolvedPositions={evolvedPositions}
          multiplierMap={multiplierMap}
          animationState={animationState}
          onAnimationComplete={handleAnimationComplete}
        />
      </div>
      
      <div className="game-controls">
        <Button 
          onClick={handleSpin}
          disabled={gameState !== 'idle' || balance < bet}
          variant="primary"
          size="large"
        >
          {freeSpinsFeature.isActive() 
            ? `Free Spin (${freeSpinsFeature.getState().spinsRemaining} left)` 
            : 'SPIN'
          }
        </Button>
      </div>
      
      {freeSpinsFeature.isActive() && (
        <div className="free-spins-info">
          <div className="free-spins-count">
            Free Spins: {freeSpinsFeature.getState().spinsRemaining} / {freeSpinsFeature.getState().spinsAwarded}
          </div>
          <div className="free-spins-win">
            Total Win: ${freeSpinsFeature.getState().totalWin.toFixed(2)}
          </div>
        </div>
      )}
      
      {totalWin > 0 && (
        <div className="total-win-display">
          Total Win: ${totalWin.toFixed(2)}
        </div>
      )}
    </div>
  );
};

PocketMonGame.propTypes = {
  config: PropTypes.object.isRequired,
  initialBalance: PropTypes.number,
  betOptions: PropTypes.arrayOf(PropTypes.number),
  onWin: PropTypes.func,
  onFreeSpinsStart: PropTypes.func,
  onFreeSpinsEnd: PropTypes.func
};
// src/js/components/PocketMonGame.stories.jsx
import { PocketMonGame } from './PocketMonGame';

export default {
  title: 'PocketMon/PocketMonGame',
  component: PocketMonGame,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

// Sample game configuration
const gameConfig = {
  grid: {
    rows: 4,
    cols: 5
  },
  weights: {
    tier1: 30,
    tier2: 20,
    tier3: 15,
    tier4: 10,
    tier5: 5,
    wild: 3,
    egg: 5,
    pikachuScatter: 2,
    pokeballScatter: 2,
    trainerScatter: 1
  },
  cellMultiplierCap: 8,
  features: {
    freespins: {
      spinsByScatters: { '3': 10, '4': 15, '5': 20 },
      retriggerScatterCount: 3,
      retriggerSpins: 5
    },
    tumble: {
      multiplierProgression: [1, 2, 3, 5, 8, 10, 15],
      maxTumbles: 15
    },
    evolution: {
      enabled: true,
      requirements: {
        standard: 4,
        boosted: 3
      }
    }
  },
  paytable: {
    // Cluster pays for different tiers
    tier1: [0, 0, 0, 0, 1, 2, 3, 5, 8, 10, 15, 20, 30],
    tier2: [0, 0, 0, 0, 2, 3, 5, 8, 12, 15, 20, 30, 40
// src/js/components/PocketMonGame.stories.jsx
import { PocketMonGame } from './PocketMonGame';

export default {
  title: 'PocketMon/PocketMonGame',
  component: PocketMonGame,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

// Sample game configuration
const gameConfig = {
  grid: {
    rows: 4,
    cols: 5
  },
  weights: {
    tier1: 30,
    tier2: 20,
    tier3: 15,
    tier4: 10,
    tier5: 5,
    wild: 3,
    egg: 5,
    pikachuScatter: 2,
    pokeballScatter: 2,
    trainerScatter: 1
  },
  cellMultiplierCap: 8,
  features: {
    freespins: {
      spinsByScatters: { '3': 10, '4': 15, '5': 20 },
      retriggerScatterCount: 3,
      retriggerSpins: 5
    },
    tumble: {
      multiplierProgression: [1, 2, 3, 5, 8, 10, 15],
      maxTumbles: 15
    },
    evolution: {
      enabled: true,
      requirements: {
        standard: 4,
        boosted: 3
      }
    }
  },
  paytable: {
    // Cluster pays for different tiers
    tier1: [0, 0, 0, 0, 1, 2, 3, 5, 8, 10, 15, 20, 30],
    tier2: [0, 0, 0, 0, 2, 3, 5, 8, 12, 15, 20, 30, 40],
    tier3: [0, 0, 0, 0, 3, 5, 8, 12, 15, 20, 30, 40, 50],
    tier4: [0, 0, 0, 0, 5, 8, 12, 15, 20, 30, 40, 50, 75],
    tier5: [0, 0, 0, 0, 8, 12, 15, 20, 30, 40, 50, 75, 100]
  }
};

export const Default = {
  args: {
    config: gameConfig,
    initialBalance: 1000,
    betOptions: [0.20, 0.50, 1, 2, 5, 10, 20, 50, 100],
    onWin: (amount) => {
      console.log(`Win: $${amount.toFixed(2)}`);
    },
    onFreeSpinsStart: (spins) => {
      console.log(`Free Spins Started: ${spins} spins awarded`);
    },
    onFreeSpinsEnd: (totalWin) => {
      console.log(`Free Spins Ended: Total win $${totalWin.toFixed(2)}`);
    }
  },
};
/* src/js/components/GameGrid.css */
.game-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.grid-row {
  display: flex;
  gap: 4px;
}

.grid-cell {
  width: 120px;
  height: 120px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.grid-cell.winning {
  animation: pulse 0.8s infinite alternate;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  z-index: 2;
}

.grid-cell.evolved {
  animation: evolve 1s forwards;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
  z-index: 2;
}

.cell-multiplier {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 215, 0, 0.9);
  color: #000;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 14px;
  z-index: 3;
}

/* Animation for spinning */
.game-grid.spinning .grid-cell {
  animation: spin-in 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

/* Animation for tumbling */
.game-grid.tumbling .grid-cell.winning {
  animation: tumble-out 0.6s forwards;
}

/* Animation for evolving */
.game-grid.evolving .grid-cell.evolved {
  animation: evolve 0.8s forwards;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  100% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

@keyframes spin-in {
  0% {
    transform: translateY(-50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes tumble-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

@keyframes evolve {
  0% {
    filter: brightness(1);
    transform: scale(1);
  }
  50% {
    filter: brightness(1.5);
    transform: scale(1.2);
  }
  100% {
    filter: brightness(1.2);
    transform: scale(1);
  }
}
/* src/js/components/GameSymbol.css */
.game-symbol {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.game-symbol img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.game-symbol.small img {
  max-width: 70%;
  max-height: 70%;
}

.game-symbol.large img {
  max-width: 100%;
  max-height: 100%;
}

.game-symbol.animated img {
  animation: symbol-pulse 0.8s infinite alternate;
}

.symbol-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Wild symbol special effects */
.game-symbol[data-symbol="WILD"] .symbol-animation {
  background: radial-gradient(circle, transparent 30%, rgba(255, 215, 0, 0.2) 70%);
  animation: wild-glow 2s infinite alternate;
}

/* Scatter symbol special effects */
.game-symbol[data-symbol="SCATTER"] .symbol-animation {
  background: radial-gradient(circle, transparent 30%, rgba(0, 191, 255, 0.2) 70%);
  animation: scatter-glow 2s infinite alternate;
}

@keyframes symbol-pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes wild-glow {
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    opacity: 0.5;
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    opacity: 0.8;
  }
}

@keyframes scatter-glow {
  0% {
    box-shadow: 0 0 5px rgba(0, 191, 255, 0.5);
    opacity: 0.5;
  }
  100% {
    box-shadow: 0 0 20px rgba(0, 191, 255, 0.8);
    opacity: 0.8;
  }
}
/* src/js/components/PocketMonGame.css */
.pocketmon-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(to bottom, #121212, #2c3e50);
  min-height: 100vh;
  color: white;
  font-family: 'Arial', sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.balance-display, .win-display {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.win-display {
  color: #ffd700;
}

.bet-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-bet {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  min-width: 100px;
  text-align: center;
}

.game-grid-container {
  margin: 20px 0;
  perspective: 1000px;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.free-spins-info {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: glow 1.
/* src/js/components/PocketMonGame.css */
.pocketmon-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(to bottom, #121212, #2c3e50);
  min-height: 100vh;
  color: white;
  font-family: 'Arial', sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.balance-display, .win-display {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
}

.win-display {
  color: #ffd700;
}

.bet-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-bet {
  font-size: 18px;
  font-weight: bold;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  min-width: 100px;
  text-align: center;
}

.game-grid-container {
  margin: 20px 0;
  perspective: 1000px;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 20px;
}

.free-spins-info {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: glow 1.5s infinite alternate;
}

.free-spins-count, .free-spins-win {
  font-size: 18px;
  font-weight: bold;
}

.total-win-display {
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  animation: win-pulse 1s infinite alternate;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

@keyframes win-pulse {
  0% {
    transform: scale(1);
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
  }
  100% {
    transform: scale(1.05);
    text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .grid-cell {
    width: 80px;
    height: 80px;
  }
}
// src/js/config/gameConfig.js
export const gameConfig = {
  // Grid configuration
  grid: {
    rows: 4,
    cols: 5
  },
  
  // Symbol weights for the base game
  weights: {
    tier
// src/js/config/gameConfig.js
export const gameConfig = {
  // Grid configuration
  grid: {
    rows: 4,
    cols: 5
  },
  
  // Symbol weights for the base game
  weights: {
    tier
// src/js/math/SlotsMathModel.js
export class SlotsMathModel {
  constructor(config = {}) {
    this.config = {
      rtp: 95.5, // Target RTP within 92-96.5% range
      volatility: 'medium-high',
      ...config
    };
    
    // Define Pokemon-themed symbols
    this.symbols = {
      WILD: { id: 'WILD', name: 'Masterball', isWild: true, multiplier: 1 },
      SCATTER: { id: 'SCATTER', name: 'Pokeball', isScatter: true },
      BONUS: { id: 'BONUS', name: 'Ultra Ball', isBonus: true },
      HIGH1: { id: 'HIGH1', name: 'Charizard', category: 'high' },
      HIGH2: { id: 'HIGH2', name: 'Blastoise', category: 'high' },
      HIGH3: { id: 'HIGH3', name: 'Venusaur', category: 'high' },
      MID1: { id: 'MID1', name: 'Pikachu', category: 'mid' },
      MID2: { id: 'MID2', name: 'Eevee', category: 'mid' },
      MID3: { id: 'MID3', name: 'Snorlax', category: 'mid' },
      LOW1: { id: 'LOW1', name: 'Fire', category: 'low' },
      LOW2: { id: 'LOW2', name: 'Water', category: 'low' },
      LOW3: { id: 'LOW3', name: 'Grass', category: 'low' },
      LOW4: { id: 'LOW4', name: 'Electric', category: 'low' }
    };
    
    // Base game configuration
    this.baseGame = {
      gridSize: { rows: 5, cols: 5 }, // 5x5 grid for cluster pays
      reels: [
        // Symbol weights for each reel (5x5 grid)
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 2 },
          { symbol: 'BONUS', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 3 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'MID3', weight: 5 },
          { symbol: 'LOW1', weight: 8 },
          { symbol: 'LOW2', weight: 8 },
          { symbol: 'LOW3', weight: 8 },
          { symbol: 'LOW4', weight: 8 }
        ],
        // Repeat similar weights for other reels with slight variations
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 2 },
          { symbol: 'BONUS', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 3 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'MID3', weight: 5 },
          { symbol: 'LOW1', weight: 8 },
          { symbol: 'LOW2', weight: 8 },
          { symbol: 'LOW3', weight: 8 },
          { symbol: 'LOW4', weight: 8 }
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 2 },
          { symbol: 'BONUS', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 3 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'MID3', weight: 5 },
          { symbol: 'LOW1', weight: 8 },
          { symbol: 'LOW2', weight: 8 },
          { symbol: 'LOW3', weight: 8 },
          { symbol: 'LOW4', weight: 8 }
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 2 },
          { symbol: 'BONUS', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 3 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'MID3', weight: 5 },
          { symbol: 'LOW1', weight: 8 },
          { symbol: 'LOW2', weight: 8 },
          { symbol: 'LOW3', weight: 8 },
          { symbol: 'LOW4', weight: 8 }
        ],
        [
          { symbol: 'WILD', weight: 1 },
          { symbol: 'SCATTER', weight: 2 },
          { symbol: 'BONUS', weight: 1 },
          { symbol: 'HIGH1', weight: 3 },
          { symbol: 'HIGH2', weight: 3 },
          { symbol: 'HIGH3', weight: 3 },
          { symbol: 'MID1', weight: 5 },
          { symbol: 'MID2', weight: 5 },
          { symbol: 'MID3', weight: 5 },
          { symbol: 'LOW1', weight: 8 },
          { symbol: 'LOW2', weight: 8 },
          { symbol: 'LOW3', weight: 8 },
          { symbol: 'LOW4', weight: 8 }
        ]
      ],
      payTable: {
        // Symbol payouts for 3, 4, and 5 of a kind
        'WILD': [0, 0, 10, 25, 100],
        'HIGH1': [0, 0, 5, 15, 50],
        'HIGH2': [0, 0, 5, 12, 40],
        'HIGH3': [0, 0, 4, 10, 35],
        'MID1': [0, 0, 3, 8, 25],
        'MID2': [0, 0, 3, 7, 20],
        'MID3': [0, 0, 2, 6, 15],
        'LOW1': [0, 0, 1, 4, 10],
        'LOW2': [0, 0, 1, 3, 8],
        'LOW3': [0, 0, 1, 3, 7],
        'LOW4': [0, 0, 1, 2, 5]
      }
    };
    
    // Free spins feature
    this.freeSpins = {
      initialSpins: 10,
      scatterTriggerCount: 3,
      retrigger: true,
      retriggeredSpins: 5,
      multiplier: 2,
      specialSymbols: {
        // Enhanced symbols during free spins
        'WILD': { multiplier: 3 },
        'HIGH1': { multiplier: 2 },
        'HIGH2': { multiplier: 2 },
        'HIGH3': { multiplier: 2 }
      }
    };
    
    // Tumble/Cascade feature
    this.tumble = {
      enabled: true,
      multiplierProgression: [1, 2, 3, 5, 8, 10], // Multiplier increases with each cascade
      maxTumbles: 10
    };
    
    // Cluster pays feature
    this.cluster = {
      enabled: true,
      minClusterSize: 5,
      payTable: {
        // Payouts based on cluster size
        5: { multiplier: 1 },
        6: { multiplier: 2 },
        7: { multiplier: 3 },
        8: { multiplier: 4 },
        9: { multiplier: 5 },
        10: { multiplier: 7 },
        11: { multiplier: 10 },
        12: { multiplier: 15 },
        13: { multiplier: 20 },
        14: { multiplier: 25 },
        15: { multiplier: 50 },
        16: { multiplier: 75 },
        17: { multiplier: 100 },
        18: { multiplier: 150 },
        19: { multiplier: 200 },
        20: { multiplier: 300 },
        21: { multiplier: 400 },
        22: { multiplier: 500 },
        23: { multiplier: 750 },
        24: { multiplier: 1000 },
        25: { multiplier: 5000 }
      }
    };
    
    // Evolution feature (Pokemon-themed)
    this.evolution = {
      enabled: true,
      triggerChance: 0.05, // 5% chance per spin
      evolutions: {
        'MID1': 'HIGH3', // Pikachu evolves to Venusaur
        'MID2': 'HIGH2', // Eevee evolves to Blastoise
        'MID3': 'HIGH1', // Snorlax evolves to Charizard
        'LOW1': 'MID1', // Fire evolves to Pikachu
        'LOW2': 'MID2', // Water evolves to Eevee
        'LOW3': 'MID3', // Grass evolves to Snorlax
        'LOW4': 'MID1'  // Electric evolves to Pikachu
      },
      multiplier: 2 // Win multiplier when evolution occurs
    };
    
    // Bonus game (Catch Pokemon)
    this.bonusGame = {
      enabled: true,
      triggerSymbol: 'BONUS',
      triggerCount: 3,
      picks: 5, // Player gets 5 picks
      prizes: [
        { type: 'multiplier', value: 5, weight: 30 },
        { type: 'multiplier', value: 10, weight: 20 },
        { type: 'multiplier', value: 15, weight: 15 },
        { type: 'multiplier', value: 20, weight: 10 },
        { type: 'multiplier', value: 25, weight: 8 },
        { type: 'multiplier', value: 50, weight: 5 },
        { type: 'multiplier', value: 100, weight: 3 },
        { type: 'multiplier', value: 500, weight: 1 },
        { type: 'freespins', value: 10, weight: 8 }
      ]
    };
  }
  
  // Generate a random spin result
  spin(bet = 1.0) {
    // Create empty grid
    const grid = this.generateGrid();
    
    // Check for special features
    const features = this.checkFeatures(grid);
    
    // Calculate wins
    const wins = this.calculateWins(grid, bet);
    
    // Calculate total win
    const totalWin = this.calculateTotalWin(wins, features);
    
    return {
      grid,
      features,
      wins,
      totalWin,
      bet
    };
  }
  
  // Generate a random grid based on reel weights
  generateGrid() {
    const { rows, cols } = this.baseGame.gridSize;
    const grid = [];
    
    for (let row = 0; row < rows; row++) {
      const rowSymbols = [];
      for (let col = 0; col < cols; col++) {
        const reel = this.baseGame.reels[col];
        const symbol = this.getRandomSymbol(reel);
        rowSymbols.push(symbol);
      }
      grid.push(rowSymbols);
    }
    
    return grid;
  }
  
  // Get a random symbol based on weights
  getRandomSymbol(reel) {
    const totalWeight = reel.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { symbol, weight } of reel) {
      random -= weight;
      if (random <= 0) {
        return symbol;
      }
    }
    
    // Fallback (should never reach here)
    return reel[0].symbol;
  }
  
  // Check for features (free spins, bonus game, etc.)
  checkFeatures(grid) {
    const features = {
      freeSpins: false,
      bonusGame: false,
      evolution: false,
      freeSpin: {
        count: 0,
        multiplier: 1
      },
      bonus: {
        triggered: false,
        picks: 0
      }
    };
    
    // Count scatter symbols
    let scatterCount = 0;
    let bonusCount = 0;
    
    // Flatten grid for easier counting
    const flatGrid = grid.flat();
    
    for (const symbol of flatGrid) {
      if (symbol === 'SCATTER') {
        scatterCount++;
      } else if (symbol === 'BONUS') {
        bonusCount++;
      }
    }
    
    // Check for free spins
    if (scatterCount >= this.freeSpins.scatterTriggerCount) {
      features.freeSpins = true;
      features.freeSpin.count = this.freeSpins.initialSpins;
      features.freeSpin.multiplier = this.freeSpins.multiplier;
    }
    
    // Check for bonus game
    if (bonusCount >= this.bonusGame.triggerCount) {
      features.bonusGame = true;
      features.bonus.triggered = true;
      features.bonus.picks = this.bonusGame.picks;
    }
    
    // Check for evolution (random chance)
    if (this.evolution.enabled && Math.random() < this.evolution.triggerChance) {
      features.evolution = true;
    }
    
    return features;
  }
  
  // Calculate wins based on clusters
  calculateWins(grid, bet) {
    const wins = [];
    
    if (this.cluster.enabled) {
      // Find clusters
      const clusters = this.findClusters(grid);
      
      // Calculate win for each cluster
      for (const cluster of clusters) {
        const { symbol, positions } = cluster;
        const clusterSize = positions.length;
        
        // Skip if cluster is too small
        if (clusterSize < this.cluster.minClusterSize) {
          continue;
        }
        
        // Get multiplier from cluster pay table
        const sizeKey = Math.min(clusterSize, 25); // Cap at 25 (5x5 grid)
        const multiplier = this.cluster.payTable[sizeKey]?.multiplier || 0;
        
        // Get symbol payout
        const symbolPayout = this.baseGame.payTable[symbol]?.[4] || 0; // Use 5-of-a-kind payout
        
        // Calculate win
        const win = bet * multiplier * symbolPayout;
        
        if (win > 0) {
          wins.push({
            type: 'cluster',
            symbol,
            positions,
            clusterSize,
            multiplier,
            win
          });
        }
      }
    } else {
      // Calculate line wins (fallback)
      // Implementation for line wins if needed
    }
    
    return wins;
  }
  
  // Find clusters of connected identical symbols
  findClusters(grid) {
    const { rows, cols } = this.baseGame.gridSize;
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));
    const clusters = [];
    
    // Helper function for DFS
    const dfs = (row, col, symbol, positions) => {
      // Check bounds and if already visited
      if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col]) {
        return;
      }
      
      // Check if same symbol or wild
      const currentSymbol = grid[row][col];
      if (currentSymbol !== symbol && currentSymbol !== 'WILD') {
        return;
      }
      
      // Mark as visited and add to positions
      visited[row][col] = true;
      positions.push({ row, col });
      
      // Check adjacent cells (including diagonals for cluster pays)
      dfs(row - 1, col, symbol, positions); // Up
      dfs(row + 1, col, symbol, positions); // Down
      dfs(row, col - 1, symbol, positions); // Left
      dfs(row, col + 1, symbol, positions); // Right
      dfs(row - 1, col - 1, symbol, positions); // Up-Left
      dfs(row - 1, col + 1, symbol, positions); // Up-Right
      dfs(row + 1, col - 1, symbol, positions); // Down-Left
      dfs(row + 1, col + 1, symbol, positions); // Down-Right
    };
    
    // Find all clusters
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col] && grid[row][col] !== 'WILD' && grid[row][col] !== 'SCATTER' && grid[row][col] !== 'BONUS') {
          const positions = [];
          dfs(row, col, grid[row][col], positions);
          
          if (positions.length > 0) {
            clusters.push({
              symbol: grid[row][col],
              positions
            });
          }
        }
      }
    }
    
    return clusters;
  }
  
  // Calculate total win including feature multipliers
  calculateTotalWin(wins, features) {
    let totalWin = 0;
    
    // Sum all wins
    for (const win of wins) {
      totalWin += win.win;
    }
    
    // Apply feature multipliers
    if (features.freeSpins) {
      totalWin *= features.freeSpin.multiplier;
    }
    
    if (features.evolution) {
      totalWin *= this.evolution.multiplier;
    }
    
    return totalWin;
  }
  
  // Process tumble/cascade mechanics
  processTumble(grid, currentTumble = 0) {
    if (!this.tumble.enabled || currentTumble >= this.tumble.maxTumbles) {
      return { grid, hasMoreTumbles: false, multiplier: 1 };
    }
    
    // Find winning positions
    const clusters = this.findClusters(grid);
    const winningPositions = [];
    
    for (const cluster of clusters) {
      if (cluster.positions.length >= this.cluster.minClusterSize) {
        winningPositions.push(...cluster.positions);
      }
    }
    
    if (winningPositions.length === 0) {
      return { 
        grid, 
        hasMoreTumbles: false, 
        multiplier: this.tumble.multiplierProgression[currentTumble] || 1 
      };
    }
    
    // Create a copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    // Remove winning symbols (set to null)
    for (const { row, col } of winningPositions) {
      newGrid[row][col] = null;
    }
    
    // Drop symbols down
    this.dropSymbols(newGrid);
    
    // Fill empty spaces with new symbols
    this.fillEmptySpaces(newGrid);
    
    // Get current multiplier
    const multiplier = this.tumble.multiplierProgression[currentTumble] || 1;
    
    return {
      grid: newGrid,
      hasMoreTumbles: true,
      multiplier,
      removedPositions: winningPositions
    };
  }
  
  // Drop symbols down after removing winning symbols
  dropSymbols(grid) {
    const { rows, cols } = this.baseGame.gridSize;
    
    // Process each column
    for (let col = 0; col < cols; col++) {
      // Start from the bottom and move up
      let emptyRow = rows - 1;
      
      for (let row = rows - 1; row >= 0; row--) {
        if (grid[row][col] !== null) {
          // Swap with the lowest empty position
          if (emptyRow !== row) {
            grid[emptyRow][col] = grid[row][col];
            grid[row][col] = null;
          }
          emptyRow--;
        }
      }
    }
  }
  
  // Fill empty spaces with new random symbols
  fillEmptySpaces(grid) {
    const { rows, cols } = this.baseGame.gridSize;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] === null) {
          const reel = this.baseGame.reels[col];
          grid[row][col] = this.getRandomSymbol(reel);
        }
      }
    }
  }
  
  // Simulate bonus game
  playBonusGame(picks) {
    const results = [];
    const availablePrizes = [...this.bonusGame.prizes];
    
    // Get random prizes based on weights
    for (let i = 0; i < picks; i++) {
      const totalWeight = availablePrizes.reduce((sum, { weight }) => sum + weight, 0);
      let random = Math.random() * totalWeight;
      
      for (let j = 0; j < availablePrizes.length; j++) {
        random -= availablePrizes[j].weight;
        if (random <= 0) {
          results.push({
            type: availablePrizes[j].type,
            value: availablePrizes[j].value
          });
          break;
        }
      }
    }
    
    return results;
  }
  
  // Apply evolution to the grid
  applyEvolution(grid) {
    if (!this.evolution.enabled) {
      return grid;
    }
    
    // Create a copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid));
    const { rows, cols } = this.baseGame.gridSize;
    
    // Apply evolutions
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const symbol = newGrid[row][col];
        const evolution = this.evolution.evolutions[symbol];
        
        if (evolution) {
          newGrid[row][col] = evolution;
        }
      }
    }
    
    return newGrid;
  }
}
// src/js/features/TumbleFeature.js
export class TumbleFeature {
  constructor(config = {}) {
    this.config = {
      multiplierProgression: [1, 2, 3, 5, 8, 10],
      maxTumbles: 10,
      ...config
    };
    
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
    this.totalWin = 0;
    this.tumbleWins = [];
  }
  
  reset() {
    this.currentTumble = 0;
    this.currentMultiplier = this.config.multiplierProgression[0];
    this.totalWin = 0;
    this.tumbleWins = [];
  }
  
  getMultiplier() {
    return this.currentMultiplier;
  }
  
  getCurrentTumble() {
    return this.currentTumble;
  }
  
  incrementTumble() {
    this.currentTumble++;
    if (this.currentTumble < this.config.multiplierProgression.length) {
      this.currentMultiplier = this.config.multiplierProgression[this.currentTumble];
    }
  }
  
  addWin(win) {
    const multipliedWin = win * this.currentMultiplier;
    this.totalWin += multipliedWin;
    
    this.tumbleWins.push({
      tumble: this.currentTumble,
      baseWin: win,
      multiplier: this.currentMultiplier,
      multipliedWin
    });
    
    return multipliedWin;
  }
  
  getTotalWin() {
    return this.totalWin;
  }
  
  getTumbleWins() {
    return this.tumbleWins;
  }
  
  canContinue() {
    return this.currentTumble < this.config.maxTumbles;
  }
  
  // Process winning symbols removal
  findWinningPositions(grid, mathModel) {
    return mathModel.findClusters(grid)
      .filter(cluster => cluster.positions.length >= mathModel.cluster.minClusterSize)
      .flatMap(cluster => cluster.positions);
  }
  
  // Remove winning symbols
  removeWinningSymbols(grid, winningPositions) {
    const newGrid = JSON.parse(JSON.stringify(grid));
    
    for (const { row, col } of winningPositions) {
      newGrid[row][col] = null;
    }
    
    return newGrid;
  }
  
  // Process a tumble
  processTumble(grid, mathModel) {
    if (!this.canContinue()) {
      return { 
        hasMoreTumbles: false, 
        updatedGrid: grid,
        removedPositions: [],
        multiplier: this.currentMultiplier
      };
    }
    
    // Find winning positions
    const winningPositions = this.findWinningPositions(grid, mathModel);
    
    if (winningPositions.length === 0) {
      return { 
        hasMoreTumbles: false, 
        updatedGrid: grid,
        removedPositions: [],
        multiplier: this.currentMultiplier
      };
    }
    
    // Remove winning symbols
    const updatedGrid = this.removeWinningSymbols(grid, winningPositions);
    
    // Drop symbols down
    mathModel.dropSymbols(updatedGrid);
    
    // Fill empty spaces with new symbols
    mathModel.fillEmptySpaces(updatedGrid);
    
    // Increment tumble counter and update multiplier
    this.incrementTumble();
    
    return {
      hasMoreTumbles: true,
      updatedGrid,
      removedPositions: winningPositions,
      multiplier: this.currentMultiplier
    };
  }
  
  // Simulate all tumbles for a grid
  simulateAllTumbles(initialGrid, mathModel, bet = 1.0) {
    this.reset();
    
    let currentGrid = JSON.parse(JSON.stringify(initialGrid));
    let hasMoreTumbles = true;
    const allTumbles = [];
    
    // Initial win calculation
    let wins = mathModel.calculateWins(currentGrid, bet);
    let tumbleWin = wins.reduce((sum, win) => sum + win.win, 0);
    this.addWin(tumbleWin);
    
    allTumbles.push({
      tumble: 0,
      grid: currentGrid,
      wins,
      multiplier: this.getMultiplier(),
      tumbleWin,
      totalWin: this.getTotalWin()
    });
    
    // Process tumbles until no more wins or max tumbles reached
    while (hasMoreTumbles && this.canContinue()) {
      const tumbleResult = this.processTumble(currentGrid, mathModel);
      
      if (!tumbleResult.hasMoreTumbles) {
        break;
      }
      
      currentGrid = tumbleResult.updatedGrid;
      
      // Calculate wins for this tumble
      wins = mathModel.calculateWins(currentGrid, bet);
      tumbleWin = wins.reduce((sum, win) => sum + win.win, 0);
      this.addWin(tumbleWin);
      
      allTumbles.push({
        tumble: this.getCurrentTumble(),
        grid: currentGrid,
        wins,
        multiplier: this.getMultiplier(),
        tumbleWin,
        totalWin: this.getTotalWin()
      });
      
      // Check if we should continue
      hasMoreTumbles = tumbleWin > 0;
    }
    
    return {
      allTumbles,
      totalWin: this.getTotalWin(),
      tumbleCount: this.getCurrentTumble()
    };
  }
}
// src/js/features/ClusterFeature.js
export class ClusterFeature {
  constructor(config = {}) {
    this.config = {
      minClusterSize: 5,
      payTable: {
        5: { multiplier: 1 },
        6: { multiplier: 2 },
        7: { multiplier: 3 },
        8: { multiplier: 4 },
        9: { multiplier: 5 },
        10: { multiplier: 7 },
        11: { multiplier: 10 },
        12: { multiplier: 15 },
        13: { multiplier: 20 },
        14: { multiplier: 25 },
        15: { multiplier: 50 },
        16: { multiplier: 75 },
        17: { multiplier: 100 },
        18: { multiplier: 150 },
        19: { multiplier: 200 },
        20: { multiplier: 300 },
        21: { multiplier: 400 },
        22: { multiplier: 500 },
        23: { multiplier: 750 },
        24: { multiplier: 1000 },
        25: { multiplier: 5000 }
      },
      ...config
    };
  }
  
  // Find all clusters in the grid
  findClusters(grid) {
    const rows = grid.length;
    const cols = grid[0].length;
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));
    const clusters = [];
    
    // Helper function for DFS
    const dfs = (row, col, symbol, positions) => {
      // Check bounds and if already visited
      if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col]) {
        return;
      }
      
      // Check if same symbol or wild
      const currentSymbol = grid[row][col];
      if (currentSymbol !== symbol && currentSymbol !== 'WILD') {
        return;
      }
      
      // Mark as visited and add to positions
      visited[row][col] = true;
      positions.push({ row, col, symbol: currentSymbol });
      
      // Check adjacent cells (including diagonals for cluster pays)
      dfs(row - 1, col, symbol, positions); // Up
      dfs(row + 1, col, symbol, positions); // Down
      dfs(row, col - 1, symbol, positions); // Left
      dfs(row, col + 1, symbol, positions); // Right
      dfs(row - 1, col - 1, symbol, positions); // Up-Left
      dfs(row - 1, col + 1, symbol, positions); // Up-Right
      dfs(row + 1, col - 1, symbol, positions); // Down-Left
      dfs(row + 1, col + 1, symbol, positions); // Down-Right
    };
    
    // Find all clusters
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col] && grid[row][col] !== 'WILD' && grid[row][col] !== 'SCATTER' && grid[row][col] !== 'BONUS') {
          const positions = [];
          dfs(row, col, grid[row][col], positions);
          
          if (positions.length >= this.config.minClusterSize) {
            clusters.push({
              symbol: grid[row][col],
              positions,
              size: positions.length
            });
          }
        }
      }
    }
    
    // Find wild clusters
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!visited[row][col] && grid[row][col] === 'WILD') {
          const positions = [];
          dfs(row, col, 'WILD', positions);
          
          if (positions.length >= this.config.minClusterSize) {
            clusters.push({
              symbol: 'WILD',
              positions,
              size: positions.length
            });
          }
        }
      }
    }
    
    return clusters;
  }
  
  // Calculate win for a cluster
  calculateClusterWin(cluster, symbolPayTable, bet = 1.0) {
    const { symbol, size } = cluster;
    
    // Get multiplier from cluster pay table
    const sizeKey = Math.min(size, 25); // Cap at 25 (5x5 grid)
    const multiplier = this.config.payTable[sizeKey]?.multiplier || 0;
    
    // Get symbol payout (use 5-of-a-kind payout)
    const symbolPayout = symbolPayTable[symbol]?.[4] || 0;
    
    // Calculate win
    const win = bet * multiplier * symbolPayout;
    
    return {
      symbol,
      size,
      multiplier,
      win
    };
  }
  
  // Calculate all cluster wins for a grid
  calculateAllClusterWins(grid, symbolPayTable, bet = 1.0) {
    const clusters = this.findClusters(grid);
    const wins = [];
    
    for (const cluster of clusters) {
      const winResult = this.calculateClusterWin(cluster, symbolPayTable, bet);
      
      if (winResult.win > 0) {
        wins.push({
          ...winResult,
          positions: cluster.positions
        });
      }
    }
    
    return wins;
  }
  
  // Get the multiplier for a specific cluster size
  getMultiplierForSize(size) {
    const sizeKey = Math.min(size, 25); // Cap at 25 (5x5 grid)
    return this.config.payTable[sizeKey]?.multiplier || 0;
  }
}
// src/js/features/FreeSpinsFeature.js
export class FreeSpinsFeature {
  constructor(config = {}) {
    this.config = {
      initialSpins: 10,
      scatterTriggerCount: 3,
      retrigger: true,
      retriggeredSpins: 5,
      multiplier: 2,
      specialSymbols: {
        'WILD': { multiplier: 3 },
        'HIGH1': { multiplier: 2 },
        'HIGH2': { multiplier: 2 },
        'HIGH3': { multiplier: 2 }
      },
      ...config
    };
    
    this.active = false;
    this.spinsRemaining = 0;
    this.totalWin = 0;
    this.spinsPlayed = 0;
    this.spinsHistory = [];
  }
  
  reset() {
    this.active = false;
    this.spinsRemaining = 0;
    this.totalWin = 0;
    this.spinsPlayed = 0;
    this.spinsHistory = [];
  }
  
  trigger() {
    this.active = true;
    this.spinsRemaining = this.config.initialSpins;
    return this.config.initialSpins;
  }
  
  retrigger() {
    if (this.config.retrigger) {
      this.spinsRemaining += this.config.retriggeredSpins;
      return this.config.retriggeredSpins;
    }
    return 0;
  }
  
  isActive() {
    return this.active;
  }
  
  getSpinsRemaining() {
    return this.spinsRemaining;
  }
  
  getMultiplier() {
    return this.config.multiplier;
  }
  
  getTotalWin() {
    return this.totalWin;
  }
  
  getSpinsPlayed() {
    return this.spinsPlayed;
  }
  
  getSpinsHistory() {
    return this.spinsHistory;
  }
  
  // Check if free spins are triggered
  checkTrigger(grid) {
    // Count scatter symbols
    let scatterCount = 0;
    
    // Flatten grid for easier counting
    const flatGrid = grid.flat();
    
    for (const symbol of flatGrid) {
      if (symbol === 'SCATTER') {
        scatterCount++;
      }
    }
    
    return scatterCount >= this.config.scatterTriggerCount;
  }
  
  // Check if free spins are retriggered
  checkRetrigger(grid) {
    if (!this.config.retrigger) {
      return false;
    }
    
    // Count scatter symbols
    let scatterCount = 0;
    
    // Flatten grid for easier counting
    const flatGrid = grid.flat();
    
    for (const symbol of flatGrid) {
      if (symbol === 'SCATTER') {
        scatterCount++;
      }
    }
    
    return scatterCount >= this.config.scatterTriggerCount;
  }
  
  // Play a free spin
  playSpin(mathModel, bet = 1.0) {
    if (!this.active || this.spinsRemaining <= 0) {
      return null;
    }
    
    // Decrement spins remaining
    this.spinsRemaining--;
    this.spinsPlayed++;
    
    // Generate spin result
    const spinResult = mathModel.spin(bet);
    
    // Apply free spins multiplier
    spinResult.totalWin *= this.config.multiplier;
    
    // Add to total win
    this.totalWin += spinResult.totalWin;
    
    // Check for retrigger
    if (this.checkRetrigger(spinResult.grid)) {
      const additionalSpins = this.retrigger();
      spinResult.retriggered = true;
      spinResult.additionalSpins = additionalSpins;
    } else {
      spinResult.retriggered = false;
      spinResult.additionalSpins = 0;
    }
    
    // Add to history
    this.spinsHistory.push({
      spinNumber: this.spinsPlayed,
      grid: spinResult.grid,
      win: spinResult.totalWin,
      retriggered: spinResult.retriggered,
      additionalSpins: spinResult.additionalSpins,
      spinsRemaining: this.spinsRemaining
    });
    
    // Check if free spins are complete
    if (this.spinsRemaining <= 0) {
      this.active = false;
      spinResult.freeSpinsComplete = true;
    } else {
      spinResult.freeSpinsComplete = false;
    }
    
    return spinResult;
  }
  
  // Simulate all free spins
  simulateAllSpins(mathModel, bet = 1.0) {
    if (!this.active || this.spinsRemaining <= 0) {
      return {
        totalWin: 0,
        spinsPlayed: 0,
        spinsHistory: []
      };
    }
    
    const results = [];
    
    // Play all free spins
    while (this.active && this.spinsRemaining > 0) {
      const spinResult = this.playSpin(mathModel, bet);
      results.push(spinResult);
    }
    
    return {
      totalWin: this.totalWin,
      spinsPlayed: this.spinsPlayed,
      spinsHistory: this.spinsHistory,
      results
    };
  }
}
// src/js/features/EvolutionFeature.js
export class EvolutionFeature {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      triggerChance: 0.05, // 5% chance per spin
      evolutions: {
        'MID1': 'HIGH3', // Pikachu evolves to Venusaur
        'MID2': 'HIGH2', // Eevee evolves to Blastoise
        'MID3': 'HIGH1', // Snorlax evolves to Charizard
        'LOW1': 'MID1', // Fire evolves to Pikachu
        'LOW2': 'MID2', // Water evolves to Eevee
        'LOW3': 'MID3', // Grass evolves to Snorlax
        'LOW4': 'MID1'  // Electric evolves to Pikachu
      },
      multiplier: 2, // Win multiplier when evolution occurs
      ...config
    };
  }
  
  // Check if evolution is triggered
  checkTrigger() {
    if (!this.config.enabled) {
      return false;
    }
    
    return Math.random() < this.config.triggerChance;
  }
  
  // Apply evolution to the grid
  applyEvolution(grid) {
    if (!this.config.enabled) {
      return { grid, evolved: false, evolutions: [] };
    }
    
    // Create a copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid));
    const rows = grid.length;
    const cols = grid[0].length;
    const evolutions = [];
    
    // Apply evolutions
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const symbol = newGrid[row][col];
        const evolution = this.config.evolutions[symbol];
        
        if (evolution) {
          newGrid[row][col] = evolution;
          evolutions.push({
            position: { row, col },
            from: symbol,
            to: evolution
          });
        }
      }
    }
    
    return {
      grid: newGrid,
      evolved: evolutions.length > 0,
      evolutions
    };
  }
  
  // Get multiplier for evolution
  getMultiplier() {
    return this.config.multiplier;
  }
  
  // Get evolution for a specific symbol
  getEvolution(symbol) {
    return this.config.evolutions[symbol] || null;
  }
  
  // Check if a symbol can evolve
  canEvolve(symbol) {
    return !!this.config.evolutions[symbol];
  }
}
// src/js/features/BonusGameFeature.js
export class BonusGameFeature {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      triggerSymbol: 'BONUS',
      triggerCount: 3,
      picks: 5, // Player gets 5 picks
      prizes: [
        { type: 'multiplier', value: 5, weight: 30 },
        { type: 'multiplier', value: 10, weight: 20 },
        { type: 'multiplier', value: 15, weight: 15 },
        { type: 'multiplier', value: 20, weight: 10 },
        { type: 'multiplier', value: 25, weight: 8 },
        { type: 'multiplier', value: 50, weight: 5 },
        { type: 'multiplier', value: 100, weight: 3 },
        { type: 'multiplier', value: 500, weight: 1 },
        { type: 'freespins', value: 10, weight: 8 }
      ],
      ...config
    };
    
    this.active = false;
    this.picksRemaining = 0;
    this.selectedPrizes = [];
    this.totalMultiplier = 0;
    this.freeSpinsAwarded = 0;
  }
  
  reset() {
    this.active = false;
    this.picksRemaining = 0;
    this.selectedPrizes = [];
    this.totalMultiplier = 0;
    this.freeSpinsAwarded = 0;
  }
  
  trigger() {
    if (!this.config.enabled) {
      return false;
    }
    
    this.active = true;
    this.picksRemaining = this.config.picks;
    return true;
  }
  
  isActive() {
    return this.active;
  }
  
  getPicksRemaining() {
    return this.picksRemaining;
  }
  
  getSelectedPrizes() {
    return this.selectedPrizes;
  }
  
  getTotalMultiplier() {
    return this.totalMultiplier;
  }
  
  getFreeSpinsAwarded() {
    return this.freeSpinsAwarded;
  }
  
  // Check if bonus game is triggered
  checkTrigger(grid) {
    if (!this.config.enabled) {
      return false;
    }
    
    // Count bonus symbols
    let bonusCount = 0;
    
    // Flatten grid for easier counting
    const flatGrid = grid.flat();
    
    for (const symbol of flatGrid) {
      if (symbol === this.config.triggerSymbol) {
        bonusCount++;
      }
    }
    
    return bonusCount >= this.config.triggerCount;
  }
  
  // Make a pick in the bonus game
  makePick() {
    if (!this.active || this.picksRemaining <= 0) {
      return null;
    }
    
    // Decrement picks remaining
    this.picksRemaining--;
    
    // Get random prize based on weights
    const prize = this.getRandomPrize();
    
    // Add to selected prizes
    this.selectedPrizes.push(prize);
    
    // Update totals
    if (prize.type === 'multiplier') {
      this.totalMultiplier += prize.value;
    } else if (prize.type === 'freespins') {
      this.freeSpinsAwarded += prize.value;
    }
    
    // Check if bonus game is complete
    if (this.picksRemaining <= 0) {
      this.active = false;
    }
    
    return {
      prize,
      picksRemaining: this.picksRemaining,
      complete: !this.active
    };
  }
  
  // Get a random prize based on weights
  getRandomPrize() {
    const totalWeight = this.config.prizes.reduce((sum, { weight }) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const prize of this.config.prizes) {
      random -= prize.weight;
      if (random <= 0) {
        return {
          type: prize.type,
          value: prize.value
        };
      }
    }
    
    // Fallback (should never reach here)
    return this.config.prizes[0];
  }
  
  // Simulate all picks
  simulateAllPicks() {
    if (!this.active) {
      return {
        prizes: [],
        totalMultiplier: 0,
        freeSpinsAwarded: 0
      };
    }
    
    const results = [];
    
    // Make all picks
    while (this.active && this.picksRemaining > 0) {
      const pickResult = this.makePick();
      results.push(pickResult);
    }
    
    return {
      prizes: this.selectedPrizes,
      totalMultiplier: this.totalMultiplier,
      freeSpinsAwarded: this.freeSpinsAwarded,
      results
    };
  }
}
// src/js/components/GameSymbol.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './GameSymbol.css';

export const GameSymbol = ({ 
  type, 
  size = 'medium', 
  animated = false,
  evolution = false,
  onClick
}) => {
  const symbolRef = useRef(null);
  
  // Handle animation effects
  useEffect(() => {
    if (animated && symbolRef.current) {
      // Add animation class
      symbolRef.current.classList.add('animate');
      
      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        if (symbolRef.current) {
          symbolRef.current.classList.remove('animate');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [animated]);
  
  // Handle evolution animation
  useEffect(() => {
    if (evolution && symbolRef.current) {
      // Add evolution animation class
      symbolRef.current.classList.add('evolve');
      
      // Remove evolution animation class after animation completes
      const timer = setTimeout(() => {
        if (symbolRef.current) {
          symbolRef.current.classList.remove('evolve');
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [evolution]);
  
  return (
    <div 
      ref={symbolRef}
      className={`game-symbol ${size} ${animated ? 'animated' : ''} ${evolution ? 'evolution' : ''}`} 
      data-symbol={type}
      onClick={onClick}
    >
      <img 
        src={`/assets/symbols/${type.toLowerCase()}.png`} 
        alt={type} 
        className="symbol-image"
      />
      
      {animated && (
        <div className="symbol-animation">
          <div className="glow"></div>
          <div className="particles"></div>
        </div>
      )}
      
      {evolution && (
        <div className="evolution-animation">
          <div className="evolution-glow"></div>
          <div className="evolution-particles"></div>
        </div>
      )}
    </div>
  );
};

GameSymbol.propTypes = {
  type: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  evolution: PropTypes.bool,
  onClick: PropTypes.func
};
/* src/js/components/GameSymbol.css */
.game-symbol {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.game-symbol:hover {
  transform: scale(1.05);
}

.game-symbol.small {
  width: 50px;
  height: 50px;
}

.game-symbol.medium {
  width: 80px;
  height: 80px;
}

.game-symbol.large {
  width: 120px;
  height: 120px;
}

.symbol-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Animation effects */
.game-symbol.animated {
  animation: pulse 0.5s infinite alternate;
}

.symbol-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  animation: glow 1s infinite alternate;
}

.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.particles::before,
.particles::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  animation: particle 1s infinite linear;
}

.particles::before {
  top: 20%;
  left: 20%;
  animation-delay: 0.2s;
}

.particles::after {
  bottom: 20%;
  right: 20%;
  animation-delay: 0.5s;
}

/* Evolution animation */
.game-symbol.evolution {
  animation: evolve 2s forwards;
}

.evolution-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.evolution-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,215,0,0) 70%);
  animation: evolution-glow 2s forwards;
}

.evolution-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.evolution-particles::before,
.evolution-particles::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 215, 0, 0.8);
  animation: evolution-particle 2s infinite linear;
}

.evolution-particles::before {
  top: 30%;
  left: 30%;
  animation-delay: 0.3s;
}

.evolution-particles::after {
  bottom: 30%;
  right: 30%;
  animation-delay: 0.7s;
}

/* Symbol-specific styling */
.game-symbol[data-symbol="WILD"] {
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
}

.game-symbol[data-symbol="SCATTER"] {
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.7);
}

.game-symbol[data-symbol="BONUS"] {
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.7);
}

/* Animations */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(1.1);
  }
}

@keyframes glow {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes particle {
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(20px, 20px);
    opacity: 0;
  }
}

@keyframes evolve {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.3);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes evolution-glow {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}

@keyframes evolution-particle {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(30px, 30px) scale(0);
    opacity: 0;
  }
}
// src/js/components/GameGrid.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { GameSymbol } from './GameSymbol';
import './GameGrid.css';

export const GameGrid = ({ 
  grid, 
  winningPositions = [], 
  evolutionPositions = [],
  tumbling = false,
  onSymbolClick,
  onTumbleComplete
}) => {
  const gridRef = useRef(null);
  
  // Handle tumble animation
  useEffect(() => {
    if (tumbling && gridRef.current) {
      // Add tumble animation class
      gridRef.current.classList.add('tumbling');
      
      // Remove tumble animation class after animation completes
      const timer = setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.classList.remove('tumbling');
          if (onTumbleComplete) {
            onTumbleComplete();
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [tumbling, onTumbleComplete]);
  
  // Check if a position is in the winning positions
  const isWinningPosition = (rowIndex, colIndex) => {
    return winningPositions.some(
      pos => pos.row === rowIndex && pos.col === colIndex
    );
  };
  
  // Check if a position is evolving
  const isEvolvingPosition = (rowIndex, colIndex) => {
    return evolutionPositions.some(
      pos => pos.position.row === rowIndex && pos.position.col === colIndex
    );
  };
  
  return (
    <div ref={gridRef} className={`game-grid ${tumbling ? 'tumbling' : ''}`}>
      {grid.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid-row">
          {row.map((symbol, colIndex) => {
            const isWinning = isWinningPosition(rowIndex, colIndex);
            const isEvolving = isEvolvingPosition(rowIndex, colIndex);
            
            return (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={`grid-cell ${isWinning ? 'winning' : ''} ${isEvolving ? 'evolving' : ''}`}
              >
                <GameSymbol 
                  type={symbol} 
                  animated={isWinning} 
                  evolution={isEvolving}
                  onClick={() => onSymbolClick && onSymbolClick(rowIndex, colIndex, symbol)}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

GameGrid.propTypes = {
  grid: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  winningPositions: PropTypes.arrayOf(
    PropTypes.shape({
      row: PropTypes.number,
      col: PropTypes.number,
    })
  ),
  evolutionPositions: PropTypes.arrayOf(
    PropTypes.shape({
      position: PropTypes.shape({
        row: PropTypes.number,
        col: PropTypes.number,
      }),
      from: PropTypes.string,
      to: PropTypes.string,
    })
  ),
  tumbling: PropTypes.bool,
  onSymbolClick: PropTypes.func,
  onTumbleComplete: PropTypes.func
};
/* src/js/components/GameGrid.css */
.game-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.grid-row {
  display: flex;
  gap: 8px;
}

.grid-cell {
  position: relative;
  width: 90px;
  height: 90px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.grid-cell.winning {
  background-color: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  z-index: 2;
// Build assets script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const outputDir = path.join(rootDir, 'dist-web', 'assets');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to copy directory recursively
function copyDirectory(source, destination) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Get all files and directories in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied: ${sourcePath} -> ${destPath}`);
    }
  }
}

// Process specific asset directories
function processAssets() {
  // Copy main assets
  console.log('Copying main assets...');
  copyDirectory(assetsDir, outputDir);
  
  // Copy sprites
  const spritesDir = path.join(assetsDir, 'sprites');
  const spritesOutputDir = path.join(outputDir, 'sprites');
  if (fs.existsSync(spritesDir)) {
    console.log('Copying sprites...');
    copyDirectory(spritesDir, spritesOutputDir);
  }
  
  // Copy UI assets
  const uiDir = path.join(assetsDir, 'ui');
  const uiOutputDir = path.join(outputDir, 'ui');
  if (fs.existsSync(uiDir)) {
    console.log('Copying UI assets...');
    copyDirectory(uiDir, uiOutputDir);
  }
  
  // Copy gameplay assets
  const gameplayDir = path.join(assetsDir, 'gameplay');
  const gameplayOutputDir = path.join(outputDir, 'gameplay');
  if (fs.existsSync(gameplayDir)) {
    console.log('Copying gameplay assets...');
    copyDirectory(gameplayDir, gameplayOutputDir);
  }
  
  // Copy pokemon assets
  const pokemonDir = path.join(assetsDir, 'pokemon');
  const pokemonOutputDir = path.join(outputDir, 'pokemon');
  if (fs.existsSync(pokemonDir)) {
    console.log('Copying pokemon assets...');
    copyDirectory(pokemonDir, pokemonOutputDir);
  }
}

// Process and optimize images (placeholder for future implementation)
function optimizeImages() {
  console.log('Image optimization is not implemented yet.');
  // Future implementation: compress and optimize images
}

// Main build function
async function buildAssets() {
  console.log('Building assets...');
  
  // Step 1: Process and copy assets
  processAssets();
  
  // Step 2: Optimize images (future implementation)
  optimizeImages();
  
  console.log('Assets built successfully!');
}

// Run the build process
buildAssets().catch(error => {
  console.error('Error building assets:', error);
  process.exit(1);
});