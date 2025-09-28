# Intended Engine Usage

### Game Files

As seen in the [example games](../sample_section/sample_games.md), all games follow a recommended structure, which should be copied from the games/template folder.

    ```
    game/
    ├── library/
    |----- books/
    |----- books_compressed/
    |----- configs/
    |----- forces/
    |----- lookup_tables/
    ├── reels/
    ├── readme.txt
    ├── run.py
    ├── game_config.py
    ├── game_executables.py
    ├── game_calculations.py
    ├── game_events.py
    ├── game_override.py
    └── gamestate.py
    ```

Sub-folders within library/ are automatically generated if they do not exist at the completion of the simulation. readme.txt is used for developer descriptions of game mechanics and miscellaneous information relevant to that particular game.

While all commonly used engine functions are handled by classes within their respective src/ directory, every game is likely to be unique in some way and these game-files allow the user to override existing functions in order to add additional engine features to suit their use-case, or implement game-specific logic.

The game_config/executables/calculations/events/override files offer extensions on actions defined in the [Source Files](../source_section/executables_info.md) section, which should be consulted for more detailed information.

## Run-file

This file is used to set simulation parameters, specifically the configuration and `GameState` classes. The required specifications include:

| Parameter       | Type        | Description                                                         |
| --------------- | ----------- | ------------------------------------------------------------------- |
| `num_threads`   | `int`       | Number of threads used for multithreading                           |
| `rust_threads`  | `int`       | Number of threads used by the Rust compiler                         |
| `batching_size` | `int`       | Number of simulations run on each thread                            |
| `compression`   | `bool`      | `True` for `.json.zst` compressed books, `False` for `.json` format |
| `profiling`     | `bool`      | `True` outputs and opens a `.svg` flame graph                       |
| `num_sim_args`  | `dict[int]` | Keys must match bet mode names in the game configuration            |

All simulations are passed to the `create_books()` function which carries out all the simulations and handles file output. This function will populate `library/` `books_compressed`, `books`, `forces`, `lookup_tables` folders.

Once the simulations are completed, the **gamestate** is passed to `generate_configs(gamestate)` which handles generating config files used for the frontend (`config_fe.json`), backend (`config.json`) and [optimization](../optimization_section/optimization_algorithm.md) (`config_math.json`).

## Library Folders

#### books/books_compressed

Depending on the **compression** tag passed to `create_books()` the `books/` or `books_compressed/` folders will be populated with the events emitted from the simulation.

#### configs

This will consist of three `.json` files for the math, frontend and backend. The details of which are described [here](../source_section/config_info.md).

#### lookup_tables

Once any given simulation is compete the events associated are stored within the books, and the corresponding payout details are recorded in a lookup table of the format:

| Simulation | Weight | Payout  |
| ---------- | ------ | ------- |
| `int`      | `int`  | `float` |

All simulations start with an assigned weight of `1`, which is then modified if the optimization algorithm is applied.

### Configs

The **GameConfig** inherits the **Config** class. All information defined in the _**init**_ function are required inputs. Symbol information, pay-tables, reels-strips and bet-mode information are all specified here.

### Gamestate

Every game has a _gamestate.py_ file, where independent simulation states are handled. The _run_spin()_ function is required and used as the entry*point from \_create_books* to execute the a single simulation. _run_freespin_ is also used in all sample games, though is not a required function if the game does not contain a free-spin entry from the base-game.

### Executables

Commonly used groups of game-logic and event emission is provided in this location. Functions called in the _run_spin()_ functions will typically belong to the Executables/GameExecutables classes.

Functions currently in this class include drawing random or forced game-boards, handling game-logic for several win-types and their associated win information events, updating and

### Misc. Calculations

The **Executables** class inherits all miscellaneous game-logic and board-actions. Primarily this includes all win-evaluation types:

- Lines
- Ways
- Scatter (pay anywhere)
- Cluster
- Expanding wild + prize collection

Additionally other classes attached to **Executables** are tumbling/cascading of winning symbols and **Conditions** for checking the current simulation state
