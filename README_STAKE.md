# Stake delivery: math + frontend bundles

This repository contains two artifacts ready for handoff to Stake: a portable math bundle (Node/ESM) and a static web frontend bundle (Vite). Both are already built and zipped in `artifacts/`.

## What to upload

- artifacts/web.zip
  - Contents: Production web assets from `dist-web/` (Vite build)
  - How to host: Serve the folder statically (any CDN or static host). The entry point is `index.html`.
- artifacts/math.zip
  - Contents: Portable NodeNext/ESM JS for the math demo in `dist-run/` plus helper scripts.
  - Node engine: Node.js 20+

## Math bundle details (dist-run)

- Entry points of interest
  - scripts/spin_demo.js — tiny example runner that calls the demo spin engine and prints a result
  - scripts/simulate.js — runs many spins to validate stability
  - scripts/calibrate.js — basic pass to estimate hit-rate/rtp curves using seed ranges
  - src/js/engine/engine.js — the demo spin function and event model (ESM)
  - src/js/features/freespins.js — simple free spins feature wiring to engine
  - config.json — demo configuration knobs (e.g., win chance, base factor, seeds)

- Module format: ESM with NodeNext resolution
  - Import style uses explicit ".js" extensions (required under ESM)

- Quick run (Node 20+)
  - spin once: node dist-run/scripts/spin_demo.js
  - simulate: node dist-run/scripts/simulate.js
  - calibrate: node dist-run/scripts/calibrate.js

- Contract (demo)
  - Input: a config with deterministic seed, grid size, and basic payout factors
  - Output: { seed, grid, events: SpinEvent[], totalWin }

## Frontend bundle details (dist-web)

- Built with Vite/React/Tailwind; Pokédex-themed UI with an optional Urso demo view
- Host the folder as static files; ensure `index.html` and the `assets/` folder remain together
- Known harmless warnings during build
  - Some runtime-resolved assets (intended)
  - Third‑party eval usage inside @urso/slot-base build (upstream)
  - Main chunk size > 500 kB (advisory only)

## Validation summary

- Tests: Vitest suite passes locally
- Builds: `npm run build:web` and `npm run build:demo` both succeed
- Deliverables packaged: `artifacts/web.zip`, `artifacts/math.zip`

## Notes

- Only Gen 1 assets are included and mapped. POV "-f" filenames indicate player perspective as discussed.
- Math bundle is intentionally simple and deterministic for review. It can be swapped with a production engine using the same event/result shape.
- If Stake requires a different entry point or interface, we can adapt the export shape without changing the demo UI.
