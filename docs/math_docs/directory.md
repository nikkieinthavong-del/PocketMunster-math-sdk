# Repository Directory Overview

This repository is organized into several directories, each focusing on a specific aspect of the game creation process. Below is a breakdown of the main directories and their purposes:

---

### **Main Directories**

- **`games/`**
  - Contains sample slot games showcasing widely used mechanics and modes:
    - `0_0_cluster`: Cascading cluster-wins game.
    - `0_0_lines`: Basic win-lines example game.
    - `0_0_ways`: Basic ways-wins example game.
    - `0_0_scatter`: Pay-anywhere cascading example game.
    - `0_0_expwilds`: Expanding Wild-reel game with an additional prize-collection feature.

- **`src/`**
  - Core game setup functions, game mechanics, frontend event structures, wallet management, and simulation output control. This directory contains reusable code shared across games. **Edit with caution.**
  - Subdirectories:
    - `calculations/`: Board and symbol setup, various win-type game logic.
    - `config/`: Generates configuration files required by the RGS, frontend, and optimization algorithm.
    - `events/`: Data structures passed between the math engine and frontend engine.
    - `executables/`: Commonly used groupings of game logic and events.
    - `state/`: Tracks the game state during simulations.
    - `wins/`: Wallet manager handling various win criteria.
    - `write_data/`: Handles writing simulation data, compression, and force files.

- **`utils/`**
  - Contains helpful functions for simulation and win-distribution analysis:
    - `analysis/`: Constructs and analyzes basic properties of win distributions.
    - `game_analytics/`: Uses recorded events, paytables, and lookup tables to generate hit-rate and simulation properties.

- **`tests/`**
  - Includes basic PyTest functions for verifying win calculations:
    - `win_calculations/`: Tests various win-mechanic functionality.

- **`uploads/`**
  - Handles the data upload process for connecting and uploading game files to an AWS S3 bucket for testing.

- **`optimization_program/`**
  - Contains an experimental genetic algorithm (written in Rust) for balancing discrete-outcome games.

- **`docs/`**
  - Documentation files written in Markdown.

---

### **Detailed Subdirectory Breakdown**

#### `src/`

- **`calculations/`**: Handles board and symbol setup, along with various win-type game logic.
- **`config/`**: Creates configuration files required by the RGS, frontend, and optimization algorithm.
- **`events/`**: Defines data structures passed between the math engine and frontend engine.
- **`executables/`**: Groups commonly used game logic and events for reuse.
- **`state/`**: Tracks the game state during simulations.
- **`wins/`**: Manages wallet functionality and various win criteria.
- **`write_data/`**: Writes simulation data, handles compression, and generates force files.

#### `games/`

- **`0_0_cluster/`**: Sample cascading cluster-wins game.
- **`0_0_lines/`**: Basic win-lines example game.
- **`0_0_ways/`**: Basic ways-wins example game.
- **`0_0_scatter/`**: Pay-anywhere cascading example game.
- **`0_0_expwilds/`**: Expanding Wild-reel game with an additional prize-collection feature.

#### `utils/`

- **`analysis/`**: Constructs and analyzes basic properties of win distributions.
- **`game_analytics/`**: Generates hit-rate and simulation properties using recorded events, paytables, and lookup tables.

#### `tests/`

- **`win_calculations/`**: Tests various win-mechanic functionality.

#### `uploads/`

- Handles the process of uploading game files to an AWS S3 bucket for testing.

#### `optimization_program/`

- Experimental genetic algorithm (written in Rust) for balancing discrete-outcome games.

---
