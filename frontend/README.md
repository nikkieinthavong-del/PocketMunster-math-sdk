# Stake Engine Frontend SDK

Frontend integration SDK for the Stake Engine Math SDK, providing seamless integration between math engine calculations and frontend game presentation.

## Features

- **Math Engine Integration**: Direct connection to Python-based math engine via REST API and WebSockets
- **Stake Web SDK Integration**: Built-in integration with Stake's web SDK for game presentation
- **Real-time Updates**: Live game state synchronization between math engine and frontend
- **TypeScript Support**: Full TypeScript support with auto-generated types from game configurations
- **React Components**: Pre-built React components for game engines and UI elements

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the SDK
npm run build

# Start development server
npm run dev
```

### Basic Usage

```typescript
import { GameEngine, initializeStakeEngineSDK } from 'stake-engine-frontend-sdk';

// Initialize SDK
const config = initializeStakeEngineSDK({
  apiUrl: 'http://localhost:8000/api',
  websocketUrl: 'ws://localhost:8000'
});

// Use GameEngine component
<GameEngine 
  gameId="0_0_cluster"
  apiUrl={config.apiUrl}
  websocketUrl={config.websocketUrl}
  initialBalance={100.0}
/>
```

## Architecture

### Components

- **GameEngine**: Main React component that integrates math engine with Stake SDK
- **MathEngineService**: Service layer for communicating with Python math engine
- **StakeWebSDKIntegration**: Integration layer with Stake's web SDK

### Services

#### MathEngineService

Handles communication with the Python-based math engine:

```typescript
const mathEngine = new MathEngineService(apiUrl, websocketUrl);

// Connect to math engine
await mathEngine.connect();

// Execute game spin
const result = await mathEngine.executeSpin(gameId, betAmount);

// Subscribe to events
mathEngine.addEventListener('spin_complete', handleSpinComplete);
```

#### StakeWebSDKIntegration

Manages integration with Stake's web SDK:

```typescript
const stakeSDK = new StakeWebSDKIntegration();

// Configure game
stakeSDK.configureGame(gameConfig);

// Display spin results
stakeSDK.displaySpinResults(spinResult);

// Update player balance
stakeSDK.updateBalance(newBalance);
```

## Game Integration

### Configuration

Game configurations are automatically generated from the math engine and provided as TypeScript types:

```typescript
interface ClusterGameConfig {
  gameId: "0_0_cluster";
  providerNumber: 0;
  workingName: "Sample Cluster Game";
  winCap: 5000;
  winType: "cluster";
  rtp: 0.97;
  numReels: 7;
}
```

### Spin Flow

1. User initiates spin through frontend interface
2. Frontend validates bet and game state
3. Request sent to math engine via MathEngineService
4. Math engine calculates results and returns spin data
5. Results displayed through Stake SDK integration
6. Game state updated across both systems

### Event Handling

Real-time events keep frontend and math engine synchronized:

```typescript
// Listen for math engine events
mathEngine.addEventListener('game_state_update', (event) => {
  console.log('Game state changed:', event.data);
});

mathEngine.addEventListener('feature_triggered', (event) => {
  console.log('Feature triggered:', event.data.featureType);
});
```

## API Integration

### REST Endpoints

- `GET /games/{gameId}/config` - Get game configuration
- `POST /games/{gameId}/spin` - Execute spin
- `GET /games/{gameId}/analytics` - Get game analytics
- `GET /games/{gameId}/history` - Get spin history

### WebSocket Events

- `spin_complete` - Spin execution completed
- `feature_triggered` - Game feature activated
- `game_state_update` - Game state changed
- `analytics_update` - Analytics data updated

## Development

### Building

```bash
# Development build with watch
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## Integration with Math Engine

The frontend SDK automatically integrates with the math engine workspace:

- Game configurations are generated from Python config files
- TypeScript types are auto-generated for type safety
- API endpoints are automatically configured
- Symbol mappings and win calculations are synchronized

## Deployment

### Production Build

```bash
npm run build
```

The built SDK can be included in any web application or served as a standalone game interface.

### Environment Configuration

Create a `.env` file for environment-specific settings:

```bash
REACT_APP_API_URL=https://api.stakeengine.com
REACT_APP_WEBSOCKET_URL=wss://ws.stakeengine.com
REACT_APP_DEBUG_MODE=false
```

## Contributing

1. Make changes in the `src/` directory
2. Update tests for any new functionality
3. Run `npm run type-check` to ensure TypeScript compliance
4. Run `npm test` to verify all tests pass
5. Build with `npm run build` to ensure no build errors

## License

MIT License - see LICENSE file for details.