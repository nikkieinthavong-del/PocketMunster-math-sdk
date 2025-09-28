# GeneralGameState Class Overview

## Class: `GeneralGameState`

### Description:

The `GeneralGameState` class is an abstract base class (ABC) that defines the general structure for game states. Other game state classes inherit from it. It includes methods for initializing game configurations, resetting states, managing wins, and running simulations.

## Constructor:

### `__init__(self, config)`

- Initializes the game state with the provided configuration.
- Initializes variables like `library`, `recorded_events`, `special_symbol_functions`, `win_manager`, `criteria`, etc.
- Calls helper methods to reset seeds, create symbol mappings, reset book values, and assign special symbol functions.

## Methods:

### `create_symbol_map(self) -> None`

- Extracts all valid symbols from the configuration.
- Constructs a `SymbolStorage` object containing all the symbols from the paytable and special symbols.

### `assign_special_sym_function(self)` (Abstract Method)

- This method must be overridden in derived classes to define custom symbol behavior.
- Issues a warning if no special symbol functions are defined.

### `reset_book(self) -> None`

- Resets global game state variables such as `board`, `book_id`, `book`, and `win_data`.
- Initializes default values for win tracking and spin conditions.
- Resets `win_manager` state.

### `reset_seed(self, sim: int = 0) -> None`

- Resets the random number generator seed based on the simulation number for reproducibility.

### `reset_fs_spin(self) -> None`

- Resets the free spin game state when triggered.
- Updates `gametype` and resets spin wins in `win_manager`.

### `get_betmode(self, mode_name) -> BetMode`

- Retrieves a bet mode configuration based on its name.
- Prints a warning if the bet mode is not found.

### `get_current_betmode(self) -> object`

- Returns the current active bet mode.

### `get_current_betmode_distributions(self) -> object`

- Retrieves the distribution information for the current bet mode based on the active criteria.
- Raises an error if criteria distribution is not found.

### `get_current_distribution_conditions(self) -> dict`

- Returns the conditions required for the current criteria setup.
- Raises an error if bet mode conditions are missing.

### `get_wincap_triggered(self) -> bool`

- Checks if a max-win cap has been reached, stopping further spin progress if triggered.

### `in_criteria(self, *args) -> bool`

- Checks if the current win criteria match any of the given arguments.

### `record(self, description: dict) -> None`

- Records specific game events to the `temp_wins` list for tracking distributions.

### `check_force_keys(self, description) -> None`

- Verifies and adds unique force-key parameters to the bet mode configuration.

### `combine(self, modes, betmode_name) -> None`

- Merges forced keys from multiple mode configurations into the target bet mode.

### `imprint_wins(self) -> None`

- Records triggered events in the `library` and updates `win_manager`.

### `update_final_win(self) -> None`

- Computes and verifies the final win amount across base and free games.
- Ensures that total wins do not exceed the win cap.
- Raises an assertion error if the sum of base and free game payouts mismatches the recorded final payout.

### `check_repeat(self) -> None`

- Determines if a spin needs to be repeated based on criteria constraints.

### `run_spin(self, sim)` (Abstract Method)

- Must be implemented in derived classes.
- Placeholder prints a message if not overridden.

### `run_freespin(self)` (Abstract Method)

- Must be implemented in derived classes.
- Placeholder prints a message if not overridden.

### `run_sims(self, betmode_copy_list, betmode, sim_to_criteria, total_threads, total_repeats, num_sims, thread_index, repeat_count, compress=True, write_event_list=True) -> None`

- Runs multiple simulations, setting up bet modes and criteria per simulation.
- Tracks and prints RTP calculations.
- Writes temporary JSON files for multi-threaded results.
- Generates lookup tables for criteria and payout distributions.

## Summary

- `GeneralGameState` provides a foundation for defining and managing game states.
- It includes methods for configuring symbols, handling wins, recording events, and executing game simulations.
- Certain methods must be overridden in derived classes to customize behavior.
