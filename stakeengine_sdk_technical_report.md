# StakeEngine SDK Technical Integration Report — Pocket Munsters

Date: 2025-09-27

## Executive summary

This document describes how the Pocket Munsters slot game integrates with the Stake Engine Math SDK. It focuses on the math-to-frontend contract, event sequencing, determinism, packaging, and current gaps to close before production. All content is grounded in the files present in this repository and the implemented 7x7 cluster-pays mechanics.

Key points

- Python Math Engine lives under `games/0_0_cluster/` and generates event "books" and wins deterministically.
- TypeScript Frontend Engine lives under `src/js/engine/` and can simulate spins, render events, and package assets for Stake.
- Event-driven contract: spinStart → (cascadeStart → win/evolution → cascadeEnd)\* → spinEnd.
- Position multipliers are persistent per cell with a cap; see "Known divergences" for current Python/TS differences.

## Scope and sources

This analysis is based on the following repository artifacts:

- Python math engine: `games/0_0_cluster/gamestate.py`, `game_executables.py`, `game_events.py`, `game_config.py`.
- TypeScript engine: `src/js/engine/engine.ts`, `types.ts`, `evolution.ts`.
- Build and packaging scripts: `scripts/*.ts`, `package.json`, and `artifacts/` outputs.
- Config: `config.json`.

No blockchain, wallet, or EVM-related components are part of this project. Earlier references to WalletConnect/EIPs or cryptographic primitives have been removed as out of scope.

## Architecture overview

High-level flow

1. Python engine generates a deterministic spin using config and seed, emits atomic events into a book.
2. TypeScript engine consumes a book or simulates a spin in-browser for demo/tests; UI renders per event.
3. Packaging scripts produce web/math bundles for Stake ingestion.

Directories

- Math Engine (Python): `games/0_0_cluster/`
  - `gamestate.py`: spin loop, tumble loop, freespins.
  - `game_executables.py`: cluster evaluation, grid multipliers, freespin updates.
  - `game_events.py`: event emission helpers (e.g., `update_grid_mult_event`).
  - `game_config.py`: reels, paytable, triggers, dimensions (7x7), caps.
- Frontend Engine (TypeScript): `src/js/engine/`
  - `engine.ts`: `spin(config, bet, opts)` with cascade/tumble, cluster detection, multipliers, bonus variants.
  - `types.ts`: event and result types.
  - `evolution.ts`: evolution helper invoked by `engine.ts`.

## Math-to-frontend contract

### TypeScript spin contract (frontend)

Source: `src/js/engine/engine.ts`, `src/js/engine/types.ts`.

Signature

- `spin(configJson: any, bet: number, opts?: { seed?: number; maxCascades?: number; initMultiplierMap?: number[][]; inBonusMode?: 'base'|'frenzy'|'hunt'|'epic' }): SpinResult`

Return shape (`SpinResult`)

- `grid: Grid` — final grid after cascades
- `multiplierMap: number[][]` — final per-cell multipliers
- `totalWinX: number` — total win expressed in bet-multiples (X)
- `events: SpinEvent[]` — ordered atomic events
- `uiHints` — auxiliary hints (scatter counts, bonus suggestions, hunt rush progress)

Event types (from `types.ts`)

- `spinStart`, `cascadeStart`, `win`, `evolution`, `wildInject`, `masterBall`, `cascadeEnd`, `spinEnd`.

Determinism

- The TS engine uses a simple seeded LCG when simulating. For production, randomness should come from the Python math engine (books). Given identical seeds/config, both engines must converge. See "Known divergences".

### Python spin contract (math)

Key entry points

- `GameState.run_spin(self, sim)` in `gamestate.py`: orchestrates base game cascades and optional freespins.
- `GameState.run_freespin(self)` in `gamestate.py`: freespin sequence.
- `GameExecutables.get_clusters_update_wins(self)` in `game_executables.py`: cluster detection and win accumulation via `Cluster.get_clusters` and `evaluate_clusters_with_grid`.
- `game_events.update_grid_mult_event(self)`: emits an `updateGrid` event with `gridMultipliers` deep-copied.

Event emission examples (Python)

- After each spin/cascade evaluation, Python updates the book: wins, grid multiplier updates, end of tumble, freespin updates.

## Core mechanics (implemented)

Cluster detection

- Grid: 7x7, 4-directional adjacency (up/down/left/right), cluster size ≥ 5.
- Python: `Cluster.get_clusters(self.board, "wild")` groups symbols, wild joins.
- TypeScript: `engine.ts` runs DFS with wild adjacency to the base symbol.

Tumble sequence

1. Find clusters and compute win(s).
2. Remove only the positions in each winning cluster.
3. Apply gravity per column and refill from the top.
4. Repeat until no cluster wins or `maxCascades` reached.

Position multipliers

- Persistence: Multipliers are stored per grid position and carry across cascades within a spin; freespins may persist across spins depending on feature design.
- Cap: Python config sets `maximum_board_mult = 512` (see `game_config.py`). TS engine uses a configurable cap via `configJson.multipliers.cellMax` (default 8192).

Evolution

- Eggs adjacent to a winning cluster can trigger evolution scans. TS calls `checkEvolution(...)` from `evolution.ts` and emits `evolution` events. Python counterpart should implement an equivalent evolution check in the math layer for parity.

Bonus modes (frontend simulation knobs)

- `frenzy`: ensures at least one new multiplier seed per cascade.
- `hunt`: injects a small number of wilds per cascade and tracks "rush" progress.
- `epic`: progressively increments existing multipliers at cascade start.

## Known divergences to resolve

1. Multiplier semantics

- Python (`GameExecutables.update_grid_mults`): If a position is part of a win, the code sets 0→1 else adds +1, with cap 512. The docstring mentions "double" but implementation increments by 1.
- TypeScript (`engine.ts`): If a position is part of a win, the code sets 0→2 else multiplies ×2 (doubling), with a default cap 8192.
- Recommendation: Pick a single canonical rule. For Stake parity, choose either incremental levels (1,2,3,...) or geometric doubling (x2,x4,x8,...). Update the other side and tests accordingly. Also align caps.

1. RNG source

- Production guidance calls for no frontend RNG; all randomness should arrive from Python books. The TS engine currently uses a local seeded LCG for demo/simulation.
- Recommendation: In production mode, disable TS RNG and consume Python-produced event books. Keep RNG path behind a `demo` feature flag only.

1. Event schema gaps

- Python emits an `updateGrid` event for multipliers; TS defines `evolution`, `wildInject`, and `masterBall` events specific to demo modes.
- Recommendation: Define a unified event schema document and a validation test that replays a Python book through the TS engine without divergence.

1. Evolution parity

- TS has evolution event emission; Python parity is not yet visible in `games/0_0_cluster`. Ensure Python emits the same `evolution` events (or the TS consumer derives the same state deterministically from Python events).

## Build, run, and packaging

Node/TypeScript

- Node engine: `>=20 <21` (see `package.json`).
- Useful scripts (from `package.json`):
  - `npm run demo` — compiles and runs a single spin demo.
  - `npm run simulate` — batch simulation runner.
  - `npm run calibrate -- --spins=200000 --targetRTP=0.95` — RTP calibration (frontend tooling).
  - `npm run package:math` / `npm run package:web` / `npm run package:publish` — produce zip bundles into `artifacts/`.
  - `npm run qa:all` — validate index/publish manifests and Stake integration shape.

Python math engine

- Requirements: `requirements.txt` includes StakeEngine math SDK and supporting libraries.
- Entrypoints: `games/0_0_cluster/run.py` and `gamestate.py`. Use the Math SDK’s standard make targets and/or project-specific scripts to generate books for frontend consumption.

Artifacts

- Build outputs land under `dist-*` and zipped in `artifacts/` (`math.zip`, `web.zip`, `math_static.zip`).

## Testing and determinism

Deterministic seeds

- Use fixed seeds to reproduce spins across Python and TS engines. TS `spin()` accepts `opts.seed` and will produce the same simulated events when config is identical.

Event and total win validation

- Tests should validate: sequence begins with `spinStart`, ends with `spinEnd`, and the sum of per-cascade wins equals `totalWinX`.
- Add cross-engine tests that compare: final `multiplierMap`, remaining `grid` ids, and emitted events (type + essential payloads).

Edge cases to cover

- No-win initial board (0 cascades).
- Max cascade depth reached with small trailing clusters.
- Multiplier cap reached on multiple cells.
- Evolution chains creating multi-step upgrades.

## Configuration notes

Dimensions and paytable

- `game_config.py` sets a 7×7 grid and a tiered paytable. Ensure `config.json` mirrors dimensions used by the frontend visualizer.

Triggers

- Freespin triggers are defined per game type (base/free) in `game_config.py`. Frontend should surface anticipation and trigger counts using the emitted events/book state.

Caps and limits

- Python: `maximum_board_mult = 512`.
- TS demo default: `configJson.multipliers.cellMax ?? 8192`.
- Recommendation: Set an agreed cap in a shared config consumed by both engines.

## Security, performance, and reliability

Security

- No wallet/private key handling in this project. Focus on fairness and reproducibility (seed handling, absence of side-channel randomness in production paths).

Performance

- Keep cascade depth bounded (`maxCascades` default 20 in TS). Batch grid operations and avoid unnecessary allocations in hot paths (cluster detection, tumble).

Reliability

- Ensure event consumers tolerate unknown `type` fields (forward compatibility) and validate essential payload fields at runtime in the UI layer.

## Action items (recommended)

1. Decide and unify multiplier progression (incremental vs doubling) and cap; update Python/TS and tests.
1. Document the unified event schema and add a schema validator test against generated books.
1. Ensure Python emits evolution events or provide sufficient state to infer them deterministically.
1. Disable TS RNG in production builds; route through Python books only.
1. Add a minimal integration test that replays a Python book using the TS engine and asserts parity on `totalWinX`, `multiplierMap`, and final `grid`.

## Appendix — key files

- `games/0_0_cluster/gamestate.py` — run loop for base/freespins.
- `games/0_0_cluster/game_executables.py` — clusters, wins, per-position multipliers.
- `games/0_0_cluster/game_events.py` — emits `updateGrid` events with multiplier map snapshots.
- `games/0_0_cluster/game_config.py` — grid (7×7), paytable, triggers, caps.
- `src/js/engine/engine.ts` — simulated spin engine with cascades, events, and demo bonus modes.
- `src/js/engine/types.ts` — event/result types consumed by UI and tests.
- `scripts/*.ts` — build, package, QA/validation helpers for Stake deliverables.
