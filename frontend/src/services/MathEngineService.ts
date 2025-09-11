import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { GameConfig, GameState, SpinResult, MathEngineEvent } from '../types';

export class MathEngineService {
  private apiUrl: string;
  private websocketUrl: string;
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(apiUrl: string, websocketUrl: string) {
    this.apiUrl = apiUrl;
    this.websocketUrl = websocketUrl;
  }

  // Initialize connection to math engine
  async connect(): Promise<void> {
    try {
      // Initialize WebSocket connection for real-time updates
      this.socket = io(this.websocketUrl);
      
      this.socket.on('connect', () => {
        console.log('Connected to math engine WebSocket');
      });

      this.socket.on('mathEngineEvent', (event: MathEngineEvent) => {
        this.handleEvent(event);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from math engine WebSocket');
      });

    } catch (error) {
      console.error('Failed to connect to math engine:', error);
      throw error;
    }
  }

  // Get game configuration from math engine
  async getGameConfig(gameId: string): Promise<GameConfig> {
    try {
      const response = await axios.get(`${this.apiUrl}/games/${gameId}/config`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get config for game ${gameId}:`, error);
      throw error;
    }
  }

  // Execute a spin using the math engine
  async executeSpin(gameId: string, bet: number, gameState?: any): Promise<SpinResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/games/${gameId}/spin`, {
        bet,
        gameState
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to execute spin for game ${gameId}:`, error);
      throw error;
    }
  }

  // Get game analytics and statistics
  async getGameAnalytics(gameId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/games/${gameId}/analytics`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get analytics for game ${gameId}:`, error);
      throw error;
    }
  }

  // Subscribe to math engine events
  addEventListener(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  // Unsubscribe from math engine events
  removeEventListener(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Handle incoming events from math engine
  private handleEvent(event: MathEngineEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  // Disconnect from math engine
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}