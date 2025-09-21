# AI coding guidance for POCKET MUNSTERS Slot Game

## Purpose
Develop POCKET MUNSTERS - a HTML5 + TypeScript cluster-pays slot game with 7x7 grid, tumble mechanics, cell multipliers, and three bonus features: Poké Hunt, Free Spins, and Battle Arena. Built on the Stake Engine Math SDK architecture with Python math engine and TypeScript frontend.

## Big-picture architecture
- **Math Engine (Python)**: Game logic, RNG, win evaluation, event generation in `/games/0_0_cluster/` 
- **Frontend Engine (TypeScript)**: Client-side simulation, UI rendering in `/src/js/engine/`
- **Game State Flow**: Python generates deterministic "books" of events → TypeScript consumes via `spin()` function
- **Event-driven**: All game actions broken into atomic events (spinStart, win, tumble, spinEnd) for testability
- **7x7 Grid**: Cluster pays (5+ adjacent H/V symbols), tumble mechanics, persistent cell multipliers (x1→x2→x4...→x8192)

## Core mechanics implementation
- **Cluster Detection**: Use `findClusters()` in `src/js/engine/cluster.js` for 4-directional adjacency
- **Tumble Sequence**: Win → explode symbols → cascade down → refill → repeat until no wins
- **Multiplier System**: Each winning cell doubles its multiplier on subsequent wins, inheritance on evolution
- **Evolution**: Egg symbol + adjacent win → scan for 4x same tier symbols → upgrade tier (Charmander×4 → Charmeleon)

## Math-to-Frontend integration patterns
- **Deterministic**: `spin(config, bet, {seed})` returns exact same results for same seed
- **Event Structure**: `{type: 'win', payload: {symbol, size, multiplier, winAmount, positions}}`
- **State Management**: No frontend RNG - all randomness from Python math engine
- **Configuration**: Root `config.json` contains symbol weights, paytables, feature triggers

## Game-specific implementations

### Base Game
```typescript
// Core spin contract
const result = spin(config, bet, { seed, maxCascades: 10 });
// Returns: {totalWinX, events: [{type, payload}], grid, multiplierMap}
```

### Evolution Mechanic  
```python
# Python: games/0_0_cluster/game_executables.py
def check_evolution(self):
    # Scan for Egg + adjacent wins → find 4x same tier → evolve
    pass
```

### Bonus Features
- **Poké Hunt**: 4+ Pokéball scatters → 3x1 reel mini-game with weighted outcomes
- **Free Spins**: 4+ Pikachu → persistent multipliers, retrigger mechanics  
- **Battle Arena**: 5+ Trainer → HP-based combat with move reel

## Developer workflows
- **Math Testing**: `make run GAME=0_0_cluster` generates simulation books (requires Python setup)
- **Frontend Testing**: `npm test` runs vitest specs in `/tests/` 
- **Demo**: `npm run demo` executes single spin with logging (requires missing TypeScript modules)
- **Calibration**: `npm run calibrate --spins=200000 --targetRTP=0.95`
- **Build**: `npm run build:demo` compiles TypeScript to JavaScript

## File structure patterns
```
games/0_0_cluster/           # Math engine for cluster game
├── gamestate.py            # Main simulation loop
├── game_executables.py     # Core mechanics (clusters, multipliers)  
├── game_events.py          # Event emission functions
└── game_config.py          # Weights, paytables, settings

src/js/engine/              # Frontend engine (TypeScript)
├── engine.ts              # Main spin() function
├── types.js               # TypeScript type definitions (TO IMPLEMENT)
├── rng.js                 # Seeded random number generation (TO IMPLEMENT)
├── grid.js                # Grid generation and manipulation (TO IMPLEMENT)
├── cluster.js             # Cluster detection logic (TO IMPLEMENT)
├── multipliers.js         # Cell multiplier system (TO IMPLEMENT)
└── evolution.js           # Evolution mechanic logic (TO IMPLEMENT)

scripts/                   # Build and demo scripts
├── spin_demo.ts           # Single spin demonstration
├── simulate.ts            # Batch simulation runner
└── calibrate.ts           # RTP calibration tool
```

## Event system conventions
- **Task Breakdown**: Complex actions split into atomic events (tumbleInit, tumbleExplode, tumbleSlide)
- **Event Handlers**: Frontend subscribes to event types, updates UI/state accordingly
- **Async Events**: Some events await completion (animations) before continuing sequence
- **Meta Data**: Events include positioning data for UI overlays, particle effects

## Testing approach
- **Deterministic Seeds**: All tests use fixed seeds for reproducible results
- **Contract Validation**: Verify `spinStart`/`spinEnd` events, win sums match `totalWinX`
- **Edge Cases**: Test evolution chains, max multipliers, feature combinations
- **Math Validation**: Python generates books → TypeScript validates event sequences

## Performance considerations
- **Memory Management**: Limit cascade depth, clean up event listeners
- **RNG Efficiency**: Use `mulberry32()` seeded RNG, avoid `Math.random()`
- **Grid Operations**: Batch symbol updates, minimize DOM manipulation
- **Feature State**: Isolate bonus game state from base game to prevent leaks

## Current implementation status
- **Functional**: Python math engine in `games/0_0_cluster/`, basic TypeScript test framework
- **Working**: Core `spin()` function contract, deterministic testing, event emission patterns
- **Missing**: TypeScript support modules (types, rng, grid, cluster, multipliers, evolution)
- **Next Steps**: Implement missing TypeScript modules to enable full frontend engine functionality

## Integration points
- **Config Loading**: `JSON.parse(readFileSync('config.json'))` in scripts (requires `@types/node`)
- **Book Generation**: Python `create_books()` → outputs in `library/books/`
- **Event Emission**: Python `gamestate.book.add_event()` → TypeScript consumption
- **Multiplier Sync**: Ensure Python and TypeScript multiplier calculations match exactly
- **Deterministic Contract**: Both engines must produce identical results for same seed/config