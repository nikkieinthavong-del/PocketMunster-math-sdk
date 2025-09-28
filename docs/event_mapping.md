# Python → TypeScript event mapping (Pocket Munsters)

This document maps math-engine (Python) book events to the frontend (TypeScript) `SpinEvent` stream. It clarifies intent, payload shapes, and invariants so both engines stay contract-aligned and tests can assert parity.

Scope:

- Base game 7x7 cluster-pays with tumble mechanics
- Multiplier system: per-cell doubling on wins, capped at 8192
- Feature hooks are noted; details can evolve but should keep these contracts stable

## Contracts at a glance

- Determinism: Same `config`, `bet`, and `seed` → identical event stream and totals.
- No frontend RNG. All randomness comes from Python (books) or deterministic spin sequence.
- Indexing: Grid uses row-major `[row][col]` with `0 ≤ row,col < 7` unless configured otherwise.
- Multipliers: Integers, powers of two, in range `[1, 8192]` per cell, doubling only on wins affecting that cell.

## Python book events (producers)

Examples (not exhaustive):

- `reveal` — initial grid/symbols reveal
- `tumbleBoard` — cascade lifecycle step; includes board after explosions/refill
- `setWin` / `setTumbleWin` / `updateTumbleWin` — rolling tumble win accounting
- `updateGrid` — emits current `gridMultipliers` snapshot (2D array of ints)
- `winInfo` — details about a cluster win (symbol, size, multiplier factors)
- `setTotalWin` — cumulative total for the spin
- `finalWin` — final, authoritative total for the spin
- Feature signals: `enterBonus`, `freeSpinTrigger`, `freeSpinEnd`, `wincap`, etc.

## TypeScript SpinEvent (consumers)

Key events used by the frontend engine:

- `spinStart` — start of a spin with config/bet/seed metadata
- `cascadeStart` / `cascadeEnd` — delineate each tumble
- `win` — a single cluster win with positions and applied multiplier
- `evolution` — evolution mechanic resolved (if applicable)
- `spinEnd` — contains final totals and terminal grid/multiplier state

## Mapping table

- Python `reveal` → TS `spinStart`
  - Intent: Establish initial grid. TS should snapshot starting `grid` and `multiplierMap`.

- Python `tumbleBoard` → TS `cascadeStart`/`cascadeEnd`
  - For each tumble step: TS brackets symbol explosions/refills with `cascadeStart`/`cascadeEnd`.
  - Python provides the resulting board states; TS mirrors timing via events for UI sequencing.

- Python `winInfo` → TS `win`
  - Fields to carry through:
    - `symbol` (ID or name consistent with `config.json`)
    - `size` (cluster size)
    - `positions` (array of `{row, col}` for cells in the cluster)
    - `multiplier` (product of applicable cell multipliers; see invariants)
    - `winAmount` (coin value or X based on config)

- Python `updateGrid` (gridMultipliers) → TS internal `multiplierMap` updates
  - TS should update its 2D multiplier map to exactly match the Python snapshot.
  - Emission: TS may not emit a dedicated public event for every update; instead the map is reflected in subsequent `win` and `spinEnd`.

- Python `setTumbleWin`/`updateTumbleWin`/`setWin` → TS running tumble totals (internal)
  - TS keeps local accounting for the tumble subtotal; public totals are surfaced in `cascadeEnd` and `spinEnd`.

- Python `setTotalWin` → TS running total (internal)
  - Optional to expose in telemetry; final contract is governed by `finalWin`/`spinEnd`.

- Python `finalWin` → TS `spinEnd`
  - The `amount` must equal the TS `totalWinX` multiplied by bet (or equivalent unit as configured).
  - Our test `python.totals.parity.test.ts` asserts parity between `finalWin.amount` and the last `setTotalWin.amount` when both exist; TS must align with `finalWin`.

- Python bonus signals (`enterBonus`, `freeSpinTrigger`, `freeSpinEnd`, `wincap`) → TS feature events
  - TS should forward feature lifecycle signals as dedicated events (names may differ). Any renames must be documented here and covered by schema tests.

## Invariants and edge cases

- Grid size and indexing: Keep consistent with `config.json`. Tests expect 7x7 by default.
- Multiplier progression: Doubling on wins only; cap at 8192. No fractional values.
- Tumble termination: Cascades stop when no new wins are found. Max cascades may be configured for performance.
- Totals consistency: `spinEnd.totalWinX` must equal the sum of all `win.winAmount` across cascades (in X terms), within rounding rules.
- Determinism: Given seed and config, Python books and TS spins should be bitwise stable in emitted payloads where applicable.

## Minimal example

1. Python emits `reveal` with initial grid and baseline multipliers (all 1s).
2. Python evaluates clusters → emits `winInfo` for each win in cascade 1.
3. Multipliers double on winning cells → Python emits `updateGrid` with new snapshot.
4. Board tumbles/refills → Python emits `tumbleBoard` for cascade 2, repeats steps 2–3.
5. Python emits `setTotalWin` during accumulation and `finalWin` at the end.
6. TS mirrors this with `spinStart` → `cascadeStart`/`win`…`cascadeEnd` loops → `spinEnd` whose totals match `finalWin`.

If you change any event shape or add a new event type, update:

- `schemas/events.schema.json`
- `schemas/python_events.schema.json`
- validator tests under `tests/ts/`
- this mapping document
