# Executables Class Documentation

## Overview

The `Executables` class groups together common actions that are likely to be reused across multiple games. These functions can be overridden in `GameExecutables` or `GameCalculations` if game-specific alterations are required. Generally, `Executables` functions do not return values.

---

## Function Descriptions

### `draw_board(emit_event: bool = True) -> None`

Forces the initial reveal to have a specific number of scatters if bet mode criteria specify it. Otherwise, it generates a new board and ensures it does not contain more scatters than necessary.

### `force_special_board(force_criteria: str, num_force_syms: int) -> None`

Forces a board to have a specified number of a particular symbol by modifying reel stops.

### `get_syms_on_reel(reel_id: str, target_symbol: str) -> List[List]`

Returns reel stop positions for a specific symbol name.

### `emit_wayswin_events() -> None`

Transmits win events associated with ways wins.

### `emit_linewin_events() -> None`

Transmits win events associated with line wins.

### `emit_tumble_win_events() -> None`

Transmits win and new board information upon a tumble event.

### `tumble_game_board() -> None`

Removes winning symbols from the active board and replaces them, triggering a tumble board event.

### `evaluate_wincap() -> None`

Checks if the running bet win has reached the wincap limit and stops further spin functions if necessary.

### `count_special_symbols(special_sym_criteria: str) -> int`

Returns the number of active symbols of a specified special kind.

### `check_fs_condition(scatter_key: str = "scatter") -> bool`

Checks if there are enough active scatters to trigger free spins.

### `check_freespin_entry(scatter_key: str = "scatter") -> bool`

Ensures that the bet mode criteria are expecting a free spin trigger before proceeding.

### `run_freespin_from_base(scatter_key: str = "scatter") -> None`

Triggers the free spin function and updates the total number of free spins available.

### `update_freespin_amount(scatter_key: str = "scatter") -> None`

Sets the initial number of spins for a free game and transmits an event.

### `update_fs_retrigger_amt(scatter_key: str = "scatter") -> None`

Updates the total number of free spins available when a retrigger occurs.

### `update_freespin() -> None`

Called before a new reveal during free spins, resetting spin win data and other relevant attributes.

### `end_freespin() -> None`

Transmits the total amount awarded during the free spin session.

### `evaluate_finalwin() -> None`

Checks base and free spin sums, then sets the payout multiplier accordingly.

### `update_global_mult() -> None`

Increments the multiplier value and emits the corresponding event.

---

## Dependencies

This class relies on multiple external modules, including:

- `src.state.state_conditions.Conditions`
- `src.calculations.lines.LineWins`
- `src.calculations.cluster.ClusterWins`
- `src.calculations.scatter.ScatterWins`
- `src.calculations.ways.WaysWins`
- `src.calculations.tumble.Tumble`
- `src.calculations.statistics.get_random_outcome`
- `src.events.events` (Various event handling functions)

These modules provide necessary game logic, event management, and mathematical calculations for the execution of the class functions.

---

## Usage

This class is designed as a base class and is expected to be extended by game-specific implementations where needed. It ensures core game mechanics, such as board generation, free spin handling, and win event management, are handled in a reusable manner.
