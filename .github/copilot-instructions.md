# Stake Engine Math SDK - AI Coding Assistant Guide

## Architecture Overview

This is a Python-based casino game math engine that generates game logic, simulates outcomes, and optimizes win distributions. The codebase follows a modular template-driven architecture for rapid game development.

### Core Components

- **`src/`** - Engine core modules (calculations, config, events, state, wins, write_data)
- **`games/`** - Individual game implementations following standardized template
- **`optimization_program/`** - Rust-based optimization algorithms with Python bindings
- **`utils/`** - Analysis, verification, and file processing utilities
- **`docs/`** - Comprehensive MkDocs documentation

### Game Development Pattern

Each game in `games/` follows this structure:
```
games/{game_name}/
├── run.py              # Main execution script
├── game_config.py      # Configuration (inherits from src/config/config.py)
├── gamestate.py        # Game state management
├── game_calculations.py # Game-specific math
├── game_events.py      # Event handling
└── game_executables.py # Execution logic
```

## Key Workflows

### Environment Setup
```bash
make setup              # Creates venv, installs dependencies
source env/bin/activate # Manual activation if needed
```

### Game Development
```bash
make run GAME=template  # Run the template game
make run GAME={name}    # Run specific game
```

### Testing
```bash
make test              # Run all tests
make test_run          # Run batch tests on predefined games
pytest tests/win_calculations/  # Test specific modules
```

## Configuration System

### Base Config Pattern
Games inherit from `src/config/config.py` and override in `game_config.py`:
```python
class GameConfig(Config):
    def __init__(self):
        super().__init__()
        self.game_id = "unique_game_id"
        self.rtp = 0.97  # Return to player
        self.wincap = 5000
        # Define paytables, reels, bet modes...
```

### BetMode & Distribution Pattern
Games use quota-based outcome targeting:
```python
self.bet_modes = [
    BetMode(
        name="base",
        distributions=[
            Distribution(criteria="wincap", quota=0.001),    # 0.1% max wins
            Distribution(criteria="freegame", quota=0.1),    # 10% bonus triggers
            Distribution(criteria="0", quota=0.4),           # 40% no wins
            Distribution(criteria="basegame", quota=0.5),    # 50% base wins
        ]
    )
]
```

## Project-Specific Conventions

### File Naming
- Game IDs: `{version}_{variant}_{type}` (e.g., `0_0_cluster`, `0_0_lines`)
- Reel files: `BR0.csv` (base reels), `FR0.csv` (free game reels)
- Config inheritance: Always extend base `Config` class

### Execution Phases
The `run.py` pattern includes these phases:
1. **Simulation** (`run_sims=True`) - Generate outcome data
2. **Optimization** (`run_optimization=True`) - Adjust math using Rust algorithms  
3. **Analysis** (`run_analysis=True`) - Generate statistics
4. **Upload** (`upload_data=True`) - Deploy to AWS

### Special Symbol Handling
```python
self.special_symbols = {
    "wild": ["symbol_names"],
    "scatter": ["trigger_symbols"], 
    "multiplier": ["mult_symbols"]
}
```

## Build & Dependencies

### Requirements
- Python 3.12+ (enforced in setup.py)
- Optional: Rust/Cargo for optimization algorithms
- Make for workflow automation

### Key Dependencies
- `numpy` - Mathematical calculations
- `pytest` - Testing framework
- `boto3` - AWS integration
- `xlsxwriter` - Excel report generation
- `zstandard` - Compression support

## Testing Patterns

Tests focus on win calculation validation:
- `tests/win_calculations/test_*pay.py` - Different pay mechanics
- Use `game_test_config.py` for test configurations
- Standard test games: `0_0_cluster`, `0_0_scatter`, `0_0_lines`, `0_0_ways`, `0_0_expwilds`

## Integration Points

### Optimization Interface
- Python calls Rust optimization via `optimization_program/run_script.py`
- Results fed back to update game configurations
- Multi-threaded execution supported

### AWS Integration
- Automated uploads of books, lookup tables, config files
- Import: `from uploads.aws_upload import upload_to_aws`
- Controlled via `upload_items` dictionary in `run.py`

### Documentation System
- MkDocs with Material theme
- Auto-generated from source code
- Hosted at stakeengine.github.io/math-sdk/

## Common Import Patterns

Game `run.py` files typically import:
```python
from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs
from uploads.aws_upload import upload_to_aws  # For AWS uploads
```

## Development Tips

- Start with `games/template/` for new games (note: template may have missing imports)
- Use `compression = False` in `run.py` for readable JSON output
- Games support variable reels per row: `self.num_rows = [3, 3, 4, 3, 3]`
- Leverage `utils/rgs_verification.py` for compliance testing
- Check `make` targets in Makefile for available commands
- Pay attention to singleton pattern in GameConfig classes (`_instance = None`)