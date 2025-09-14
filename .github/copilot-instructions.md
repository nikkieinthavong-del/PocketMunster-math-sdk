# AI coding guidance for Stake Engine Math SDK

## Purpose
Develop and extend the Stake Engine Math SDK - a Python-based engine for defining slot game rules, simulating outcomes, and optimizing win distributions. Supports multiple game types (lines, ways, cluster, scatter) with TypeScript frontend integration.

## Big-picture architecture
- **Math Engine (Python)**: Core logic in `/src/` with game logic, RNG, win evaluation, event generation
- **Game Implementations**: Specific games in `/games/` folders (0_0_cluster, 0_0_scatter, 0_0_lines, etc.)
- **Frontend Engine (TypeScript)**: Client-side simulation and UI rendering in `/src/js/engine/`
- **Simulation Flow**: Python `create_books()` generates deterministic event sequences → outputs to `library/books/`
- **Event-driven**: All game actions broken into atomic events for reproducible testing and frontend consumption
- **Multi-game support**: Template-based system supports lines, ways, cluster pays, scatter wins with shared base classes

## Core mechanics implementation
- **Cluster Detection**: `src/calculations/cluster.py` provides 4-directional adjacency algorithms
- **Win Types**: Lines (`src/calculations/lines.py`), Ways (`ways.py`), Scatter (`scatter.py`), Cluster pays
- **Tumble System**: `src/calculations/tumble.py` handles cascade mechanics and symbol removal
- **Game State**: Each game inherits from `GameState` base class with `run_spin()` and `run_freespin()` entry points
- **Event Emission**: `src/events/events.py` provides standardized event generation for frontend consumption

## Math-to-Frontend integration patterns
- **Deterministic Simulation**: `spin(config, bet, {seed})` returns identical results for same seed
- **Event Structure**: `{type: 'win', payload: {symbol, winAmount, positions}}` standardized across games
- **Book Generation**: Python `create_books()` → `library/books/` JSON files → frontend consumption
- **Config System**: `game_config.py` defines symbols, paytables, reels → exported to `config.json`
- **Multi-threading**: Simulation supports batching across threads for performance (`num_threads`, `batching_size`)

## Game-specific implementations

### Game Structure (Template Pattern)
```python
# Each game in games/ follows this structure:
def run_spin(self, sim):
    self.reset_seed(sim)  # Deterministic RNG seeding
    self.repeat = True
    while self.repeat:
        self.reset_book()  # Reset simulation variables
        self.draw_board()  # Generate from reel strips
        
        # Evaluate wins (cluster/lines/ways/scatter)
        # Update win_manager
        # Emit events
        
        self.win_manager.update_gametype_wins(self.gametype)
        if self.check_fs_condition():
            self.run_freespin_from_base()
        
        self.evaluate_finalwin()
        self.check_repeat()  # Betmode distribution validation
```

### Available Game Types
- **0_0_cluster**: Cluster pays with tumble mechanics
- **0_0_lines**: Traditional paylines
- **0_0_ways**: 243+ ways to win
- **0_0_scatter**: Scatter symbol pays
- **0_0_expwilds**: Expanding wilds with prize collection

## Developer workflows
- **Setup Environment**: `make setup` creates virtual environment and installs dependencies
- **Run Simulations**: `make run GAME=0_0_cluster` generates books for specific game
- **Python Testing**: `make test` or `pytest tests/` runs calculation validation tests
- **TypeScript Testing**: `npm test` runs vitest specs for frontend engine
- **Build Optimization**: Uses Rust optimization program for win distribution tuning
- **Documentation**: `mkdocs serve` for local doc development (comprehensive docs in `docs/`)

## File structure patterns
```
src/                            # Core SDK engine
├── calculations/              # Win evaluation algorithms
│   ├── cluster.py            # Cluster pay detection
│   ├── lines.py              # Payline calculations  
│   ├── ways.py               # Ways-to-win logic
│   └── scatter.py            # Scatter symbol handling
├── events/events.py          # Standardized event emission
├── state/                    # Game state management
└── js/engine/               # TypeScript frontend engine

games/                        # Game implementations
├── template/                # Base template for new games
├── 0_0_cluster/             # Example cluster-pays game
│   ├── gamestate.py         # Main game loop
│   ├── game_config.py       # Symbol/reel definitions
│   ├── game_executables.py # Game-specific logic
│   └── run.py              # Simulation runner
└── library/                # Generated simulation outputs
    ├── books/              # Event sequence files
    ├── configs/            # Exported config files
    └── lookup_tables/      # Payout summary data

tests/                       # Test suites
├── win_calculations/       # Python calculation tests
└── *.test.ts              # TypeScript engine tests
```

## Event system conventions
- **Atomic Events**: Complex game actions split into discrete events (e.g., `reveal`, `winInfo`, `tumbleStart`, `tumbleEnd`)
- **Event Emission**: Use `self.book.add_event(event_type, payload)` in Python game implementations
- **Frontend Consumption**: TypeScript `spin()` function processes event sequences for UI updates
- **Standardized Payloads**: Consistent event structure across all game types for frontend compatibility
- **Reproducibility**: Event sequences must be deterministic for same seed/configuration

## Testing approach
- **Python Tests**: `tests/win_calculations/` validates core calculation algorithms (cluster, lines, ways, scatter)
- **TypeScript Tests**: Vitest specs validate frontend engine contract and deterministic behavior
- **Deterministic Seeds**: All tests use fixed seeds for reproducible results across runs
- **Game Validation**: `utils/rgs_verification` provides format checking and compliance testing
- **Cross-validation**: Python simulation results must match TypeScript frontend engine outputs

## Performance considerations
- **Multi-threading**: Use `num_threads` and `batching_size` parameters for large simulation runs
- **Memory Management**: Compression available for book files (`compression = True` in run.py)
- **Optimization Pipeline**: Rust-based optimization program for efficient win distribution tuning
- **Profiling**: Enable `profiling = True` to generate flame graphs for performance analysis
- **Scalability**: Template system allows rapid game creation from proven base classes

## Current implementation status
- **Functional**: Complete Python math engine with 5 sample games, comprehensive documentation
- **Working**: Multi-threading simulation, optimization pipeline, config generation system
- **Development**: TypeScript frontend engine with basic spin contract and testing framework
- **Next Steps**: Extend TypeScript engine modules, add new game types, enhance optimization features

## Integration points
- **Config Generation**: `generate_configs(gamestate)` produces frontend/backend/optimization configs
- **Book Processing**: Python `create_books()` → `library/books/` → TypeScript event consumption
- **Optimization Flow**: Lookup tables → Rust optimization → weighted simulation adjustments
- **Cross-platform**: Python simulation results validate against TypeScript frontend implementation
- **Extensibility**: Template-based system enables rapid development of new game mechanics