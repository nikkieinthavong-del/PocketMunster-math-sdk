---
description: Repository Information Overview
alwaysApply: true
---

# PocketMon Genesis Information

## Summary

PocketMon Genesis is a 7x7 cluster-pays slot game with evolution mechanics, multipliers, and bonus features built on the Stake Engine Math SDK architecture. It features a Python math engine for game logic and a TypeScript frontend for client-side simulation and UI rendering, with an event-driven architecture for testability.

## Structure

- **games/**: Math engine implementations for different game types, with 0_0_cluster being the main implementation
- **src/**: Core source code with Python backend and TypeScript frontend
  - **src/js/**: TypeScript frontend engine and UI components
  - **src/calculations/**: Python calculation modules for game mechanics
  - **src/state/**: Game state management and simulation
- **scripts/**: Build, packaging, and testing utilities
- **tests/**: Test suites for both Python and TypeScript components
- **stories/**: Storybook UI component stories
- **assets/**: Game assets and resources

## Language & Runtime

**Languages**: Python (backend), TypeScript (frontend)  
**Python Version**: 3.12+  
**Node Version**: 20.x (specified in package.json engines field)  
**TypeScript Target**: ES2022  
**Build System**: npm (frontend), Make + setuptools (backend)  
**Package Managers**: pip (Python), npm (TypeScript)

## Dependencies

**Python Dependencies**:

- stakeengine (math-sdk): Core math engine framework
- numpy: Numerical operations
- pytest: Testing framework
- boto3: AWS integration
- zstandard: Compression

**TypeScript Dependencies**:

- typescript: Language compiler
- vitest: Testing framework
- storybook: UI development environment
- vite: Build tooling
- ajv: JSON schema validation

## Build & Installation

**Python Setup**:

```bash
make setup  # Creates virtual env, installs dependencies
```

**Frontend Build**:

```bash
npm run build:demo  # Compiles TypeScript
npm run package:web:prep  # Packages web assets
npm run serve  # Starts local development server
```

**Game Simulation**:

```bash
make run GAME=0_0_cluster  # Runs game simulation
```

## Testing

**Python Tests**:

```bash
pytest tests/  # Run Python tests
```

**TypeScript Tests**:

```bash
npm test  # Run TypeScript tests with vitest
npm run storybook  # Run Storybook UI sandbox
```

## Core Game Mechanics

**Grid System**: 7x7 grid with cluster pays (5+ adjacent symbols)  
**Tumble Mechanics**: Win → explode symbols → cascade down → refill → repeat  
**Multiplier System**: Cell multipliers double on wins (x1→x2→x4...→x8192)  
**Evolution**: Egg symbol + adjacent win → scan for 4x same tier symbols → upgrade tier

## Bonus Features

- **Poké Hunt**: Triggered by 4+ Pokéball scatters, 3x1 reel mini-game
- **Free Spins**: Triggered by 4+ Pikachu symbols, persistent multipliers
- **Battle Arena**: Triggered by 5+ Trainer symbols, HP-based combat

## Integration

**Math-to-Frontend**: Python generates deterministic "books" of events → TypeScript consumes via `spin()` function  
**Event System**: All game actions broken into atomic events (spinStart, win, tumble, spinEnd)  
**API Endpoints**:

- GET /healthz – liveness probe
- GET /api/paytable – serves paytable data
- POST /api/spin – math engine spin
- POST /api/buy – bonus buy

## Deployment

**Packaging Commands**:

```bash
npm run package:math  # Package math engine
npm run package:web  # Package frontend
npm run package:publish  # Package for publication
npm run package:release  # Complete release package
```

**Embedding Options**:

- ESM Integration (Full Control)
- Classic Script Integration (Easy Drop-in)
- Container Embed (Shadow DOM, recommended for host pages)
