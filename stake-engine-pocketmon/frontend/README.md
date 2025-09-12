# PocketMon Genesis Reels — Frontend (Stake Engine)

This is the Stake Engine-ready frontend for PocketMon Genesis Reels, built with Vite + TypeScript + Pixi.js.

## Quick Start (Dev)

```bash
cd stake-engine-pocketmon/frontend
npm install
npm run dev
```

Open the URL printed by Vite (default http://localhost:3000).

## Build (Prod)

```bash
cd stake-engine-pocketmon/frontend
npm install
npm run build
```

The production bundle is output to `frontend/dist`.

## Assets
- Public assets live in `frontend/public` and are served from root (e.g., `/images/logo.png`).
- Game logo path: `public/images/logo.png`. Replace with your actual logo file.
- Favicon: `public/favicon.svg`.

## Notes
- `vite.config.ts` uses `base: "./"` for subpath hosting compatibility.
- Rendering uses `pixi.js@^7`.
