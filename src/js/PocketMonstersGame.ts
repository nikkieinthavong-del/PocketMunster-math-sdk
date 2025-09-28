/**
 * Pocket Monsters Genesis - Main Game Wrapper
 * Enhanced Stake.com Casino Game with Advanced Graphics
 *
 * This is the main entry point that ties all systems together:
 * - Enhanced game engine with AI-driven improvements
 * - Professional WebGL2 graphics and animations
 * - Full Stake.com platform integration
 */

import {
  StakePocketMonstersEngine,
  createStakePocketMonstersEngine,
  defaultStakeConfig,
  type StakeGameConfig,
  type StakeSpinRequest,
  type StakeSpinResponse,
} from "./engine/stakeIntegration.js";

export interface PocketMonstersGameOptions {
  containerId: string;
  config?: Partial<StakeGameConfig>;
  onGameReady?: () => void;
  onSpinComplete?: (result: StakeSpinResponse) => void;
  onError?: (error: any) => void;
}

export class PocketMonstersGame {
  private engine: StakePocketMonstersEngine;
  private container: HTMLElement;
  private gameCanvas!: HTMLCanvasElement;
  private uiOverlay!: HTMLElement;
  private config: StakeGameConfig;
  private isInitialized = false;

  constructor(options: PocketMonstersGameOptions) {
    // Merge user config with defaults
    this.config = { ...defaultStakeConfig, ...options.config };

    // Get container element
    const container = document.getElementById(options.containerId);
    if (!container) {
      throw new Error(`Container element with ID '${options.containerId}' not found`);
    }
    this.container = container;

    // Create game engine
    this.engine = createStakePocketMonstersEngine(this.config);

    // Setup event handlers
    this.setupEventHandlers(options);

    // Initialize game
    this.initialize()
      .then(() => {
        this.isInitialized = true;
        if (options.onGameReady) {
          options.onGameReady();
        }
      })
      .catch((error) => {
        console.error("[Pocket Monsters] Initialization failed:", error);
        if (options.onError) {
          options.onError(error);
        }
      });
  }

  private async initialize(): Promise<void> {
    console.log("[Pocket Monsters] Initializing enhanced game...");

    // Create game HTML structure
    this.createGameHTML();

    // Setup responsive canvas
    this.setupCanvas();

    // Initialize game systems
    await this.initializeGameSystems();

    // Setup UI interactions
    this.setupUI();

    console.log("[Pocket Monsters] Game initialization complete");
  }

  private createGameHTML(): void {
    // Clear container
    this.container.innerHTML = "";

    // Create main game HTML structure
    this.container.innerHTML = `
      <div class="pokemon-game-wrapper" style="
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 600px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        <!-- Game Canvas -->
        <canvas id="game-canvas" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        "></canvas>
        
        <!-- UI Overlay -->
        <div class="game-ui-overlay" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          pointer-events: none;
        ">
          <!-- Game HUD -->
          <div class="game-hud" style="
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            pointer-events: auto;
          ">
            <div class="balance-display" style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 10px 20px;
              border-radius: 25px;
              font-family: 'Arial', sans-serif;
              font-weight: bold;
              font-size: 18px;
            ">
              Balance: <span id="balance-amount">$100.00</span>
            </div>
            
            <div class="game-info" style="
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 10px 20px;
              border-radius: 25px;
              font-family: 'Arial', sans-serif;
              font-size: 14px;
            ">
              Pocket Monsters Genesis
            </div>
          </div>
          
          <!-- Control Panel -->
          <div class="control-panel" style="
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            align-items: center;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            border-radius: 50px;
            pointer-events: auto;
          ">
            <div class="bet-controls" style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: white;
              font-family: 'Arial', sans-serif;
            ">
              <button id="bet-decrease" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: #ff6b6b;
                color: white;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
              ">-</button>
              
              <div class="bet-display" style="
                min-width: 100px;
                text-align: center;
                font-size: 18px;
                font-weight: bold;
              ">
                $<span id="bet-amount">1.00</span>
              </div>
              
              <button id="bet-increase" style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: none;
                background: #51cf66;
                color: white;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
              ">+</button>
            </div>
            
            <button id="spin-button" style="
              width: 80px;
              height: 80px;
              border-radius: 50%;
              border: none;
              background: linear-gradient(135deg, #ffd93d 0%, #ff6b35 100%);
              color: white;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 5px 15px rgba(255, 107, 53, 0.4);
            ">SPIN</button>
            
            <div class="quality-controls" style="
              display: flex;
              align-items: center;
              gap: 10px;
              color: white;
              font-family: 'Arial', sans-serif;
              font-size: 12px;
            ">
              <label>Quality:</label>
              <select id="quality-select" style="
                background: rgba(255,255,255,0.1);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 5px;
                padding: 5px;
              ">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high" selected>High</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>
          </div>
          
          <!-- Win Display -->
          <div id="win-display" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffd93d 0%, #ff6b35 100%);
            color: white;
            padding: 20px 40px;
            border-radius: 20px;
            font-family: 'Arial', sans-serif;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            opacity: 0;
            pointer-events: none;
            transition: all 0.5s;
            box-shadow: 0 10px 30px rgba(255, 107, 53, 0.6);
          ">
            <div>BIG WIN!</div>
            <div style="font-size: 32px; margin-top: 10px;">$<span id="win-amount">0.00</span></div>
          </div>
        </div>
      </div>
    `;

    // Get references to key elements
    this.gameCanvas = this.container.querySelector("#game-canvas") as HTMLCanvasElement;
    this.uiOverlay = this.container.querySelector(".game-ui-overlay") as HTMLElement;
  }

  private setupCanvas(): void {
    const resizeCanvas = () => {
      const rect = this.container.getBoundingClientRect();
      this.gameCanvas.width = rect.width;
      this.gameCanvas.height = rect.height;
    };

    // Initial resize
    resizeCanvas();

    // Resize on window resize
    window.addEventListener("resize", resizeCanvas);
  }

  private async initializeGameSystems(): Promise<void> {
    // Game systems are initialized within the engine
    // This is where we could add additional initialization if needed
  }

  private setupUI(): void {
    let currentBet = 1.0;
    let isSpinning = false;

    // Bet controls
    const betDecrease = this.container.querySelector("#bet-decrease") as HTMLButtonElement;
    const betIncrease = this.container.querySelector("#bet-increase") as HTMLButtonElement;
    const betAmount = this.container.querySelector("#bet-amount") as HTMLSpanElement;
    const spinButton = this.container.querySelector("#spin-button") as HTMLButtonElement;
    const qualitySelect = this.container.querySelector("#quality-select") as HTMLSelectElement;

    // Bet decrease
    betDecrease.addEventListener("click", () => {
      if (!isSpinning && currentBet > this.config.minBet) {
        currentBet = Math.max(this.config.minBet, currentBet - 0.1);
        betAmount.textContent = currentBet.toFixed(2);
      }
    });

    // Bet increase
    betIncrease.addEventListener("click", () => {
      if (!isSpinning && currentBet < this.config.maxBet) {
        currentBet = Math.min(this.config.maxBet, currentBet + 0.1);
        betAmount.textContent = currentBet.toFixed(2);
      }
    });

    // Spin button
    spinButton.addEventListener("click", async () => {
      if (isSpinning) return;

      isSpinning = true;
      spinButton.textContent = "SPIN...";
      spinButton.style.background = "linear-gradient(135deg, #666 0%, #999 100%)";

      try {
        const spinRequest: StakeSpinRequest = {
          bet: currentBet,
          currency: this.config.currency,
          sessionId: this.config.sessionId,
          gameId: this.config.gameId,
          seed: Date.now(),
        };

        const result = await this.spin(spinRequest);
        this.displayWinResult(result);
      } catch (error) {
        console.error("[Pocket Monsters] Spin error:", error);
      } finally {
        isSpinning = false;
        spinButton.textContent = "SPIN";
        spinButton.style.background = "linear-gradient(135deg, #ffd93d 0%, #ff6b35 100%)";
      }
    });

    // Quality selector
    qualitySelect.addEventListener("change", (e) => {
      const quality = (e.target as HTMLSelectElement).value as "low" | "medium" | "high" | "ultra";
      this.engine.updateQualitySettings(quality);
    });

    // Hover effects
    [betDecrease, betIncrease].forEach((btn) => {
      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "scale(1.1)";
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
      });
    });

    spinButton.addEventListener("mouseenter", () => {
      if (!isSpinning) {
        spinButton.style.transform = "scale(1.05)";
        spinButton.style.boxShadow = "0 8px 25px rgba(255, 107, 53, 0.6)";
      }
    });
    spinButton.addEventListener("mouseleave", () => {
      spinButton.style.transform = "scale(1)";
      spinButton.style.boxShadow = "0 5px 15px rgba(255, 107, 53, 0.4)";
    });
  }

  private displayWinResult(result: StakeSpinResponse): void {
    if (result.success && result.result.totalWin > 0) {
      const winDisplay = this.container.querySelector("#win-display") as HTMLElement;
      const winAmount = this.container.querySelector("#win-amount") as HTMLSpanElement;

      winAmount.textContent = result.result.totalWin.toFixed(2);

      // Show win animation
      winDisplay.style.opacity = "1";
      winDisplay.style.transform = "translate(-50%, -50%) scale(1.1)";

      // Hide after delay
      setTimeout(() => {
        winDisplay.style.opacity = "0";
        winDisplay.style.transform = "translate(-50%, -50%) scale(1)";
      }, 3000);
    }
  }

  private setupEventHandlers(options: PocketMonstersGameOptions): void {
    // Event handlers are setup during UI initialization
  }

  /**
   * Public API Methods
   */

  async spin(request: StakeSpinRequest): Promise<StakeSpinResponse> {
    if (!this.isInitialized) {
      throw new Error("Game not initialized");
    }

    return await this.engine.spin(request);
  }

  getGameInfo(): any {
    return this.engine.getGameInfo();
  }

  updateQuality(quality: "low" | "medium" | "high" | "ultra"): void {
    this.engine.updateQualitySettings(quality);
  }

  dispose(): void {
    this.engine.dispose();
    console.log("[Pocket Monsters] Game disposed");
  }
}

// Factory function for easy game creation
export function createPocketMonstersGame(options: PocketMonstersGameOptions): PocketMonstersGame {
  return new PocketMonstersGame(options);
}

// Auto-initialize if script is loaded directly
if (typeof window !== "undefined") {
  (window as any).PocketMonstersGame = PocketMonstersGame;
  (window as any).createPocketMonstersGame = createPocketMonstersGame;

  console.log(`
╔═══════════════════════════════════════════════════════╗
║           🎰 Pocket Monsters Genesis 🎰              ║
║                                                       ║
║     Enhanced with AI-Driven Graphics & Animations    ║
║              Stake.com Platform Ready                 ║
║                                                       ║
║  🌟 Features:                                        ║
║  • Professional WebGL2 Graphics Engine               ║
║  • Advanced Pokemon Animation System                 ║
║  • Casino-Quality Visual Effects                     ║
║  • Optimized Performance                             ║
║  • Full Stake.com Integration                        ║
║                                                       ║
║  Usage: createPocketMonstersGame({ containerId })    ║
╚═══════════════════════════════════════════════════════╝
  `);
}

export default PocketMonstersGame;
