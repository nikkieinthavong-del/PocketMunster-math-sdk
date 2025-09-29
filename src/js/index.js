/**
 * PocketMon Genesis - Main Integration File
 * Professional-grade Pokemon-themed slots game for Stake.com
 * Features: Cluster pays, Ways (117,649), Evolution, Morphing, Tumble, Free Spins
 * RTP: 92-96.5% with optimized math and cinema-quality animations
 */

import { GameController } from './components/GameController.js';
import { AnimationEngine } from './components/AnimationEngine.js';
import { RTOOptimizer } from './engine/rtpOptimizer.js';

// Game Configuration
const GAME_CONFIG = {
  grid: { rows: 7, cols: 7 },
  multipliers: { cellMax: 8192 },
  engine: {
    demo: {
      winChance: 0.28,
      baseFactor: 0.6894905710424741,
      scatterWeights: [
        [0, 940], [1, 35], [2, 15], [3, 6],
        [4, 3], [5, 0.7], [6, 0.2], [7, 0.05]
      ]
    }
  },
  features: {
    freespins: {
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
    }
  }
};

class PocketMonGenesis {
  constructor(canvasElement) {
    console.log('🎮 Initializing PocketMon Genesis - Professional Slots Game');
    console.log('🎯 Target RTP: 92-96.5% | Features: Cluster+Ways+Evolution+Morphing+Tumble+FreeSpin');

    // Initialize RTP optimizer
    this.rtpOptimizer = new RTOOptimizer(0.945, 'high'); // 94.5% RTP, high volatility
    this.optimizedPaytables = this.rtpOptimizer.optimizePaytables();

    console.log(`✅ RTP Optimization Complete: ${(this.optimizedPaytables.achievedRTP * 100).toFixed(2)}%`);
    console.log(`📊 Volatility: ${this.optimizedPaytables.volatilityClass.toUpperCase()}`);
    console.log(`🎰 Hit Frequency: ${(this.optimizedPaytables.hitFrequency * 100).toFixed(1)}%`);

    // Initialize game controller
    this.gameController = new GameController(canvasElement, GAME_CONFIG);

    // Setup UI if canvas provided
    if (canvasElement) {
      this.setupGameUI();
      this.startGameLoop();
    }

    // Display feature contributions
    this.displayFeatureContributions();
  }

  displayFeatureContributions() {
    console.log('🎯 RTP Feature Contributions:');
    const contributions = this.optimizedPaytables.featureContributions;
    Object.entries(contributions).forEach(([feature, percentage]) => {
      console.log(`   ${feature}: ${(percentage * 100).toFixed(1)}%`);
    });
  }

  setupGameUI() {
    // Create game UI elements
    this.createSpinButton();
    this.createBetControls();
    this.createStatsDisplay();
    this.createFeatureToggles();
  }

  createSpinButton() {
    const spinButton = document.createElement('button');
    spinButton.textContent = '🎰 SPIN';
    spinButton.className = 'spin-button';
    spinButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 15px 30px;
      font-size: 20px;
      font-weight: bold;
      background: linear-gradient(45deg, #FF6B35, #F7931E);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    spinButton.addEventListener('click', () => this.executeSpin());
    document.body.appendChild(spinButton);
  }

  createBetControls() {
    const betControls = document.createElement('div');
    betControls.className = 'bet-controls';
    betControls.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 10px;
      color: white;
    `;

    betControls.innerHTML = `
      <label>Bet: $<input type="number" id="betAmount" value="1" min="0.1" max="100" step="0.1" style="width: 80px;"></label>
    `;

    document.body.appendChild(betControls);
  }

  createStatsDisplay() {
    const statsDisplay = document.createElement('div');
    statsDisplay.id = 'statsDisplay';
    statsDisplay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.9);
      padding: 20px;
      border-radius: 10px;
      color: #00FF88;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      min-width: 300px;
    `;

    document.body.appendChild(statsDisplay);
    this.updateStatsDisplay();
  }

  createFeatureToggles() {
    const featurePanel = document.createElement('div');
    featurePanel.className = 'feature-panel';
    featurePanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 10px;
      color: white;
      max-width: 250px;
    `;

    featurePanel.innerHTML = `
      <h3>🎮 Game Features</h3>
      <label><input type="checkbox" checked> Cluster Pays (5+ symbols)</label><br>
      <label><input type="checkbox" checked> Ways Pays (117,649 ways)</label><br>
      <label><input type="checkbox" checked> Evolution System</label><br>
      <label><input type="checkbox" checked> Morphing Mechanics</label><br>
      <label><input type="checkbox" checked> Tumble/Cascade</label><br>
      <label><input type="checkbox" checked> Free Spins</label><br>
      <label><input type="checkbox" checked> Mega Spins</label><br>
      <hr>
      <div style="font-size: 12px; color: #888;">
        RTP: ${(this.optimizedPaytables.achievedRTP * 100).toFixed(2)}%<br>
        Max Win: ${this.optimizedPaytables.maxWinPotential.toFixed(0)}x<br>
        Volatility: ${this.optimizedPaytables.volatilityClass}
      </div>
    `;

    document.body.appendChild(featurePanel);
  }

  async executeSpin() {
    const betAmount = parseFloat(document.getElementById('betAmount')?.value || '1');

    console.log(`🎰 Executing spin with $${betAmount} bet...`);

    try {
      const spinResult = await this.gameController.executeSpin(betAmount);

      console.log(`💰 Spin Result: $${spinResult.winAmount.toFixed(2)} win`);

      // Log features triggered
      if (spinResult.features.length > 0) {
        console.log('🎉 Features Triggered:');
        spinResult.features.forEach(feature => {
          console.log(`   ${feature.type}: ${JSON.stringify(feature.data)}`);
        });
      }

      // Log animations
      if (spinResult.animations.length > 0) {
        console.log('✨ Animations Playing:');
        spinResult.animations.forEach(animation => {
          console.log(`   ${animation.type}`);
        });
      }

      this.updateStatsDisplay();

    } catch (error) {
      console.error('❌ Spin execution failed:', error);
    }
  }

  updateStatsDisplay() {
    const stats = this.gameController.getGameStats();
    const statsElement = document.getElementById('statsDisplay');

    if (statsElement) {
      statsElement.innerHTML = `
        <h3>📊 GAME STATISTICS</h3>
        <div>💰 Balance: $${stats.currentBalance.toFixed(2)}</div>
        <div>🎲 Total Spins: ${stats.totalSpins}</div>
        <div>💸 Total Wins: $${stats.totalWins.toFixed(2)}</div>
        <div>🏆 Biggest Win: $${stats.biggestWin.toFixed(2)}</div>
        <div>📈 Current RTP: ${(stats.rtpCurrent * 100).toFixed(2)}%</div>
        <div>🎯 Target RTP: ${(stats.rtpTarget * 100).toFixed(2)}%</div>
        <div>🧬 Evolutions: ${stats.evolutionCount}</div>
        <div>💫 Mega Wins: ${stats.megaWinCount}</div>
        <hr>
        <div style="font-size: 12px; color: #888;">
          Volatility: ${stats.volatility}<br>
          Max Win Potential: ${stats.maxWin}<br>
          RTP Range: ${stats.rtpRange}
        </div>
      `;
    }
  }

  // Demo mode for automatic play
  startDemoMode(spins = 100) {
    console.log(`🎮 Starting Demo Mode: ${spins} spins`);

    let currentSpin = 0;
    const demoInterval = setInterval(async () => {
      if (currentSpin >= spins) {
        clearInterval(demoInterval);
        console.log('🏁 Demo mode completed');
        this.logFinalStats();
        return;
      }

      await this.executeSpin();
      currentSpin++;

      if (currentSpin % 10 === 0) {
        console.log(`📊 Demo Progress: ${currentSpin}/${spins} spins completed`);
      }
    }, 500); // 500ms between spins
  }

  logFinalStats() {
    const stats = this.gameController.getGameStats();
    console.log('🏆 FINAL STATISTICS:');
    console.log(`   Total Spins: ${stats.totalSpins}`);
    console.log(`   Total Wins: $${stats.totalWins.toFixed(2)}`);
    console.log(`   Achieved RTP: ${(stats.rtpCurrent * 100).toFixed(3)}%`);
    console.log(`   Biggest Win: $${stats.biggestWin.toFixed(2)}`);
    console.log(`   Evolution Count: ${stats.evolutionCount}`);
    console.log(`   Mega Win Count: ${stats.megaWinCount}`);

    // RTP compliance check
    if (stats.rtpCurrent >= 0.92 && stats.rtpCurrent <= 0.965) {
      console.log('✅ RTP COMPLIANCE: PASSED');
    } else {
      console.log('⚠️ RTP COMPLIANCE: ATTENTION NEEDED');
    }
  }

  startGameLoop() {
    // Optional: Auto-update stats display
    setInterval(() => {
      this.updateStatsDisplay();
    }, 1000);
  }

  // Static methods for external integration
  static generateOptimizedConfig(targetRTP = 0.945) {
    const optimizer = new RTOOptimizer(targetRTP, 'high');
    return optimizer.optimizePaytables();
  }

  static validateGameCompliance(config) {
    return RTOOptimizer.validateRTPCompliance(config.paytables);
  }

  static getMarketConfigurations() {
    return RTOOptimizer.generateMarketSpecificPaytables();
  }
}

// Auto-initialize if canvas exists
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    window.pocketMonGenesis = new PocketMonGenesis(canvas);
    console.log('🚀 PocketMon Genesis initialized with canvas');
  } else {
    console.log('🎮 PocketMon Genesis ready (no canvas found)');
    window.PocketMonGenesis = PocketMonGenesis;
  }
});

// Expose for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PocketMonGenesis;
}

// Demo functions for testing
window.runPocketMonDemo = function(spins = 50) {
  if (window.pocketMonGenesis) {
    window.pocketMonGenesis.startDemoMode(spins);
  } else {
    console.log('🎮 Initializing PocketMon Genesis for demo...');
    window.pocketMonGenesis = new PocketMonGenesis();
    window.pocketMonGenesis.startDemoMode(spins);
  }
};

window.testRTPCompliance = function() {
  console.log('🧪 Testing RTP Compliance across different configurations...');

  const markets = PocketMonGenesis.getMarketConfigurations();
  Object.entries(markets).forEach(([market, config]) => {
    const compliance = PocketMonGenesis.validateGameCompliance({ paytables: config });
    console.log(`${market.toUpperCase()}: RTP ${(compliance.actualRTP * 100).toFixed(2)}% - ${compliance.isCompliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
  });
};

// Export the main class
export default PocketMonGenesis;