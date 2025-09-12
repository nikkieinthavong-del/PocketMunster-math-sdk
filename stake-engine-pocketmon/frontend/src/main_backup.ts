/**
 * PocketMon Genesis Reels - Main Game Entry Point
 * Complete logo integration with Canvas-based rendering
 */

import './style.css'
import PocketMonGameManager from './GameManager'
import { logoSystem } from './ui/LogoSystem'

// Global game manager for controls access
declare global {
  interface Window {
    gameManager: PocketMonGameManager;
  }
}

// Initialize the game
async function initializeGame() {
  console.log('🎮 Starting PocketMon Genesis Reels...');
  
  try {
    // Get canvas element
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Create game manager
    const gameManager = new PocketMonGameManager(canvas);
    
    // Make game manager globally accessible for controls
    window.gameManager = gameManager;
    
    // Initialize game systems
    console.log('🔄 Initializing game systems...');
    await gameManager.initialize();
    
    // Update logo status in UI
    updateLogoStatus();
    
    console.log('✅ PocketMon Genesis Reels initialized successfully!');
    console.log('🎯 Features ready:');
    console.log('   • Complete 151 Gen 1 Pokemon symbols');
    console.log('   • Tier-based paytable system'); 
    console.log('   • Logo integration (gameplay, bonus, loading)');
    console.log('   • Animation and effects systems');
    console.log('   • Stake Engine compatibility');
    
  } catch (error) {
    console.error('❌ Failed to initialize game:', error);
    
    // Show error on canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FF0000';
      ctx.font = '24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Failed to load game', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 30);
    }
  }
}

/**
 * Update logo status display in UI
 */
function updateLogoStatus() {
  const statusElement = document.getElementById('logoStatusText');
  if (statusElement) {
    if (logoSystem.isLogoLoaded()) {
      statusElement.textContent = '✅ Logo Loaded';
      statusElement.style.color = '#00FF00';
    } else {
      statusElement.textContent = '⚠️ Using Fallback';
      statusElement.style.color = '#FFD700';
    }
  }
}
    
    // Initialize PIXI Application
    this.app = new Application({
      width: 1200,
      height: 800,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    })

    this.init()
  }

  private async init() {
    this.createUI()
    this.setupEventListeners()
    await this.authenticate()
  }

  private createUI() {
    const app = document.getElementById('app')!
    
    app.innerHTML = `
      <div class="game-container">
        <div class="loading-screen" id="loading-screen">
          <div class="loading-spinner"></div>
          <div class="loading-text">Connecting to PocketMon World...</div>
        </div>
        
        <div class="game-header">
          <div class="game-title">🔥 PocketMon Genesis Reels</div>
          <div class="balance-display">
            <div>Balance: $<span id="balance">0.00</span></div>
            <div>Last Win: $<span id="last-win">0.00</span></div>
          </div>
        </div>
        
        <div class="game-canvas" id="game-canvas"></div>
        
        <div class="game-controls">
          <div class="bet-controls">
            <label>Bet: $</label>
            <input type="number" id="bet-input" class="bet-input" value="1" min="1" max="100" step="1">
          </div>
          <button id="spin-button" class="control-button">Catch PocketMon!</button>
          <button id="end-round-button" class="control-button" style="display: none;">End Round</button>
        </div>
        
        <div id="win-display" class="win-display" style="display: none;">
          <div>POCKETMON CAUGHT!</div>
          <div>You won: $<span id="win-amount">0.00</span></div>
        </div>
      </div>
    `

    // Cache DOM elements
    this.elements.balanceDisplay = document.getElementById('balance')!
    this.elements.betInput = document.getElementById('bet-input') as HTMLInputElement
    this.elements.spinButton = document.getElementById('spin-button') as HTMLButtonElement
    this.elements.winDisplay = document.getElementById('win-display')!
    this.elements.loadingScreen = document.getElementById('loading-screen')!

    // Add PIXI canvas to game area
    const gameCanvas = document.getElementById('game-canvas')!
    gameCanvas.appendChild(this.app.view as HTMLCanvasElement)
  }

  private setupEventListeners() {
    // Spin button
    this.elements.spinButton?.addEventListener('click', () => this.spin())
    
    // End round button  
    document.getElementById('end-round-button')?.addEventListener('click', () => this.endRound())
    
    // Bet input
    this.elements.betInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      this.gameState.currentBet = parseFloat(target.value) || 1
    })

    // Responsive canvas
    window.addEventListener('resize', () => this.resizeCanvas())
    this.resizeCanvas()
  }

  private resizeCanvas() {
    const gameCanvas = document.getElementById('game-canvas')!
    const rect = gameCanvas.getBoundingClientRect()
    
    this.app.renderer.resize(rect.width, rect.height)
  }

  private getUrlParam(key: string): string | null {
    return new URLSearchParams(window.location.search).get(key)
  }

  private async makeRGSRequest(endpoint: string, body: any): Promise<any> {
    if (!this.gameState.rgsUrl) {
      throw new Error('RGS URL not available')
    }

    const response = await fetch(`https://${this.gameState.rgsUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`RGS request failed: ${response.statusText}`)
    }

    return response.json()
  }

  private async authenticate() {
    try {
      this.gameState.sessionId = this.getUrlParam('sessionID')
      this.gameState.rgsUrl = this.getUrlParam('rgs_url')

      if (!this.gameState.sessionId || !this.gameState.rgsUrl) {
        throw new Error('Missing session parameters')
      }

      const response = await this.makeRGSRequest(RGS_ENDPOINTS.AUTHENTICATE, {
        sessionID: this.gameState.sessionId,
        language: this.getUrlParam('language') || 'en'
      })

      this.gameState.balance = response.balance.amount / API_MULTIPLIER
      this.gameState.isAuthenticated = true
      
      this.updateUI()
      this.hideLoading()
      
      console.log('✅ Authentication successful')
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      this.showError('Failed to connect to game server')
    }
  }

  private async spin() {
    if (!this.gameState.isAuthenticated || this.gameState.isPlaying) {
      return
    }

    try {
      this.gameState.isPlaying = true
      this.updateUI()

      // Deduct bet from display balance
      this.gameState.balance -= this.gameState.currentBet

      const response = await this.makeRGSRequest(RGS_ENDPOINTS.PLAY, {
        mode: this.getUrlParam('mode') || 'base',
        currency: this.getUrlParam('currency') || 'USD',
        sessionID: this.gameState.sessionId,
        amount: this.gameState.currentBet * API_MULTIPLIER
      })

      // Process the game response
      this.processGameResponse(response)
      
    } catch (error) {
      console.error('❌ Spin failed:', error)
      this.gameState.balance += this.gameState.currentBet // Refund bet
      this.showError('Spin failed, please try again')
      this.gameState.isPlaying = false
      this.updateUI()
    }
  }

  private processGameResponse(response: any) {
    this.gameState.lastWin = response.round?.payoutMultiplier || 0
    
    if (this.gameState.lastWin > 0) {
      // Show win display
      this.showWin(this.gameState.lastWin)
      
      // Show end round button for wins
      const endRoundBtn = document.getElementById('end-round-button')!
      endRoundBtn.style.display = 'inline-block'
    } else {
      // No win, round automatically ends
      this.gameState.isPlaying = false
    }
    
    this.updateUI()
    console.log('🎲 Game response:', response)
  }

  private async endRound() {
    try {
      const response = await this.makeRGSRequest(RGS_ENDPOINTS.END_ROUND, {
        sessionID: this.gameState.sessionId
      })

      // Update balance from server
      this.gameState.balance = response.balance.amount / API_MULTIPLIER
      this.gameState.isPlaying = false
      
      // Hide win display and end round button
      this.elements.winDisplay!.style.display = 'none'
      document.getElementById('end-round-button')!.style.display = 'none'
      
      this.updateUI()
      console.log('✅ Round ended successfully')
      
    } catch (error) {
      console.error('❌ End round failed:', error)
      this.showError('Failed to end round')
    }
  }

  private updateUI() {
    // Update balance display
    if (this.elements.balanceDisplay) {
      this.elements.balanceDisplay.textContent = this.gameState.balance.toFixed(2)
    }

    // Update last win display
    const lastWinElement = document.getElementById('last-win')
    if (lastWinElement) {
      lastWinElement.textContent = this.gameState.lastWin.toFixed(2)
    }

    // Update spin button state
    if (this.elements.spinButton) {
      this.elements.spinButton.disabled = this.gameState.isPlaying || !this.gameState.isAuthenticated
      this.elements.spinButton.textContent = this.gameState.isPlaying ? 'Catching...' : 'Catch PocketMon!'
    }
  }

  private showWin(amount: number) {
    const winDisplay = this.elements.winDisplay!
    const winAmountElement = document.getElementById('win-amount')!
    
    winAmountElement.textContent = amount.toFixed(2)
    winDisplay.style.display = 'block'
  }

  private showError(message: string) {
    // Simple error display - could be enhanced with better UI
    alert(message)
  }

  private hideLoading() {
    this.elements.loadingScreen!.style.display = 'none'
  }
}

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PocketMonGame()
})

// Export for potential external access
;(window as any).PocketMonGame = PocketMonGame