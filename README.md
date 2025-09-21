# Stake Engine Math SDK

Welcome to [Stake Engine Math SDK](https://engine.stake.com/).

The Math SDK is a Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates backend/config files, lookup tables, and simulation results.

For technical details, see the docs: <https://stakeengine.github.io/math-sdk/>

## Installation

This repository requires Python 3.12+ and pip. If you will run the optimization algorithm, install Rust/Cargo as well.

Recommended setup using Make:

```sh
make setup
```

Alternatively, see the installation guide: <https://stakeengine.github.io/math-sdk/math_docs/general_overview/>

## Frontend demo and local server

The project includes a minimal HTTP server and a static frontend for local development and demos.

- Build runtime TS and package the web assets:
  - `npm run build:demo`
  - `npm run package:web:prep`
  - Tip: Set ASSETS_SRC to your asset folder. If not set, the packager defaults to: C:\\Users\\kevin\\Desktop\\POCKIT- MON\\First project (1)

- Start the local server (serves static UI and /api endpoints):
  - Default port: `npm run serve`
  - Custom port (Windows PowerShell):
    - `powershell -NoLogo -NoProfile -Command "$env:PORT=5173; npm run serve:win"`
  - Or: `npm run serve:port` after setting %PORT% in CMD

- Health check: GET <http://127.0.0.1:%3CPORT%3E/healthz> should return `{ ok: true }`.

Routes provided by the demo server:

- `GET /healthz` – liveness probe
- `GET /api/paytable` – serves `dist-publish/index.json`
- `POST /api/spin` – math engine spin
- `POST /api/buy` – bonus buy placeholder
- Static frontend at `/` (mapped from `dist-web`)

## Storybook (UI sandbox with addons)

We use Storybook for UI and interaction development with a suite of addons and API mocks, so stories render without a backend.

Run Storybook:

- `npm run storybook` (serves on <http://localhost:6006> by default)

Addons available in the toolbar/panels:

- Themes: Light and Dark (class-based via `body.theme-*`).
- Outline & Measure: layout debugging overlays.
- A11y: accessibility checks inside the canvas.
- Viewport: responsive previews.
- Links & Interactions: navigation and testing utilities.

API mocks via MSW:

- Configured globally in `.storybook/preview.ts` using `msw-storybook-addon`.
- Mocked endpoints: `GET /api/paytable`, `POST /api/spin`, `POST /api/buy`.
- When available, `dist-publish/index.json` is served through Storybook’s static dir at `/publish/index.json` and mirrored by the mock handler.

Static assets in Storybook:

- `.storybook/main.ts` maps:
  - `dist-web` → `/assets`
  - `dist-publish` → `/publish`

Tips:

- If you don’t see assets, run `npm run package:web:prep` first so `dist-web` is populated before starting Storybook.
- Default theme is Dark; use the Themes panel to switch.

## Upgrading Storybook to v9 (optional)

The workspace pins Storybook to v8.6.x-compatible versions to avoid peer conflicts. If you want the latest features:

1) Create a branch:
   - `git checkout -b chore/storybook-v9`
2) Run the upgrade assistant:
   - `npx storybook@latest upgrade`
3) Update devDependencies to `^9` for `storybook`, `@storybook/html-vite`, and installed addons (a11y, interactions, links, measure, outline, themes, viewport).
4) Reinstall deps and start Storybook:
   - `npm install`
   - `npm run storybook`
5) Verify `.storybook/main.ts` keeps `staticDirs` and addon list intact. Keep `msw-storybook-addon` if you rely on the API mocks.

Notes:

- Resolve any peer dependency warnings by aligning addon versions with the Storybook core version.
- If addon APIs change, prefer the official migration notes printed by the upgrade assistant.

## Storybook bundle size and debugging

To keep `storybook-static` smaller in CI and when publishing previews, the configuration in `.storybook/main.ts` conditionally toggles addons based on environment variables:

- `SB_ENABLE_INTERACTIONS=0` disables the Interactions addon in static builds.
- `SB_HEAVY_ADDONS=0` disables heavy addons (a11y, viewport, outline, measure).
- `STORYBOOK_DEV=1` forces dev-style addons regardless of `NODE_ENV`.

Source maps are enabled in the static build via `viteFinal` so that files like `storybook-static/**/manager-bundle.js` can be traced back to their original modules in devtools.

