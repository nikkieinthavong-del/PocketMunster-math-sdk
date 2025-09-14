# Math SDK - AI Coding Agent Instructions

This repository contains a comprehensive mathematical game engine SDK for creating slot-style games with sophisticated mathematical models and React-based frontends.

## Architecture Overview

### Dual-Language System
- **Python Backend**: Mathematical engine, game rules simulation, win distribution generation (`src/`, `games/`, `utils/`)
- **TypeScript Frontend**: React UI components with game visualization (`src/web/`, `src/js/`)
- **Configuration**: JSON-based game parameters and mathematical models (`config.json`, game-specific configs)

### Key Components

#### Mathematical Engine (Python)
- `src/calculations/`: Core win calculation modules (cluster.py, lines.py, ways.py, scatter.py)
- `src/state/`: Game state management and event handling
- `src/events/`: Event system for game actions and outcomes
- `src/write_data/`: Configuration file generation for RGS (Remote Gaming Server)

#### Game Engine (TypeScript)
- `src/js/engine/engine.ts`: Core spin logic, cluster detection, multiplier handling
- `src/js/features/`: Bonus features (freespins.ts, etc.)
- `src/js/engine/types.ts`: TypeScript interfaces for game objects

#### Frontend (React + Vite)
- `src/web/components/`: Game UI components (PokemonInfiniteEvolution.tsx, PokedexGrid.tsx)
- `src/web/utils/`: Utilities including networkGuard.ts for security compliance
- `src/web/main.tsx`: Application entry point

## Development Workflows

### Essential Commands
```bash
# Frontend development
npm run dev                    # Start dev server (port 3000)
npm run typecheck:web         # TypeScript validation for web
npm run build:web             # Production build for web

# Game engine development  
npm run build:demo            # Compile TypeScript game engine
npm run demo                  # Run single spin demo
npm run simulate              # Run simulation analysis
npm run test:run              # Run all tests

# Python mathematical engine
make setup                    # Setup Python virtual environment
make run GAME=<game_name>     # Run Python game generation
make test                     # Run Python tests
```

### Build System Architecture
- **Vite** (frontend): Fast dev server, React support, asset bundling
- **TypeScript**: Strict typing for both game engine and UI
- **Python**: Mathematical modeling, optimization, and verification
- **Dual Output**: `dist-web/` (frontend) and `dist-run/` (game engine)

## Critical Patterns

### Game State Management
Games use event-driven architecture:
```typescript
// Spin results contain events array describing what happened
interface SpinResult {
  grid: Grid;
  multiplierMap: MultiplierMap;
  events: SpinEvent[];  // 'win', 'tumbleStart', 'evolutionStep', etc.
  totalWinX: number;
}
```

### Configuration-Driven Math
Game behavior controlled via JSON configs:
```json
{
  "grid": { "rows": 7, "cols": 7 },
  "engine": { "demo": { "winChance": 0.28, "baseFactor": 0.7579 }},
  "multipliers": { "cellMax": 8192 }
}
```

### Security Compliance
- `networkGuard.ts` blocks external network calls for Stake.com compliance
- Production mode throws errors, dev mode warns only
- All external URLs must be explicitly allowlisted

### Testing Strategy
- **Frontend**: Vitest for TypeScript game engine logic
- **Backend**: pytest for Python mathematical models
- **Integration**: Demo scripts validate end-to-end workflows

## Game-Specific Context

This is a **Pokémon-themed slot game** with:
- **7x7 grid cluster pays** (5+ adjacent symbols)
- **Cascading multipliers** that persist and grow
- **Evolution mechanics** (Tier 1 → Tier 2 → Tier 3 Pokémon)
- **Multiple bonus features**: Poké Hunt, Battle Arena, Free Spins
- **Asset-heavy**: Extensive Pokémon sprite collections

## Integration Points

### Python → TypeScript Data Flow
1. Python generates mathematical models and configurations
2. `config.json` consumed by TypeScript engine
3. TypeScript engine powers React frontend

### Cross-Component Communication
- React components communicate via props and context
- Game engine emits events consumed by UI
- Configuration changes require rebuilding both Python and TypeScript outputs

## Development Gotchas

- **TypeScript strict mode**: All types must be properly defined
- **Asset references**: Vite may warn about missing assets at build time (normal for dynamic imports)
- **Network security**: Any external calls will fail in production due to networkGuard
- **Build dependencies**: Web build requires successful TypeScript compilation
- **Python environment**: Mathematical operations require proper virtual environment setup

## File Structure Significance
- `/games/`: Individual game configurations and Python runners
- `/assets/`: Large sprite collections (Pokémon assets, backgrounds)
- `/docs/`: Comprehensive mathematical documentation
- `/utils/`: Shared utilities for verification and optimization
- `/scripts/`: Build automation and demo scripts