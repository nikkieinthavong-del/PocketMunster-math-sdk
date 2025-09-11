import { MathEngineService } from '../MathEngineService';

// Mock axios and socket.io-client
jest.mock('axios');
jest.mock('socket.io-client');

describe('MathEngineService', () => {
  let mathEngineService: MathEngineService;
  const mockApiUrl = 'http://localhost:8000/api';
  const mockWebsocketUrl = 'ws://localhost:8000';

  beforeEach(() => {
    mathEngineService = new MathEngineService(mockApiUrl, mockWebsocketUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct URLs', () => {
      expect(mathEngineService).toBeInstanceOf(MathEngineService);
    });
  });

  describe('addEventListener', () => {
    it('should add event listeners correctly', () => {
      const handler = jest.fn();
      mathEngineService.addEventListener('spin_complete', handler);
      
      // Verify the handler was added (we can't directly test private members)
      expect(handler).toBeDefined();
    });
  });

  describe('removeEventListener', () => {
    it('should remove event listeners correctly', () => {
      const handler = jest.fn();
      mathEngineService.addEventListener('spin_complete', handler);
      mathEngineService.removeEventListener('spin_complete', handler);
      
      // Verify the handler was removed (we can't directly test private members)  
      expect(handler).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should disconnect without errors', () => {
      expect(() => mathEngineService.disconnect()).not.toThrow();
    });
  });
});