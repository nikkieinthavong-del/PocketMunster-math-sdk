# Stake Engine Deployment Package — PocketMon Genesis Reels

This package contains the `math/` and `frontend/` folders prepared for Stake Engine launch.

## Structure
```
stake-engine-pocketmon/
├─ math/
│  ├─ game_config.py
│  ├─ game_executables.py
│  ├─ game_events.py
│  ├─ gamestate.py
│  ├─ library/
│  ├─ reels/
│  └─ README.md
├─ frontend/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ public/
│  │  ├─ images/logo.png (replace with real logo)
│  │  └─ favicon.svg
│  └─ src/
│     ├─ main.ts
│     ├─ style.css
│     ├─ ui/LogoSystem.ts
│     ├─ sprites/* (loader, animation)
│     └─ effects/*
└─ DEPLOYMENT_README.md
```

## Frontend — Build
Ensure Node.js and npm are installed, then:
```bash
cd stake-engine-pocketmon/frontend
npm install
npm run build
```
Output will be in `frontend/dist`. Serve this with Stake Engine’s static hosting.

## Package for Stake Engine

Create a single zip containing the production frontend and the math package:

```bash
cd stake-engine-pocketmon/deploy
bash package.sh
```

Artifacts are written to `deploy/artifacts/` with a timestamped name. The script also writes a `.sha256` checksum file next to the zip.

Options:

- `--skip-build`: Reuse existing `frontend/dist` without building
- `--no-ci`: Use `npm install` instead of `npm ci`
- `--name NAME`: Use a custom artifact base name (defaults to `pocketmon-stake-engine-<timestamp>`)

Examples:

```bash
# Fast pack with existing dist
bash package.sh --skip-build

# Custom name and no-ci
bash package.sh --name pocketmon-v1.0.0 --no-ci
```

## Verify artifact checksums

To verify the integrity of produced artifacts, use the generated `.sha256` files:

```bash
cd stake-engine-pocketmon/deploy/artifacts
sha256sum -c pocketmon-v1.0.0.zip.sha256
```

Or verify all artifacts at once using the helper script:

```bash
cd stake-engine-pocketmon/deploy
bash verify.sh                         # verify all
bash verify.sh pocketmon-v1.0.0.zip    # verify one
```

## Math — Validate
```bash
cd stake-engine-pocketmon/math
python3 - << 'PY'
from game_config import GameConfig
cfg = GameConfig()
print('Symbols in paytable:', len(cfg.paytable))
print('Reels:', cfg.num_reels, 'Rows:', cfg.num_rows)
PY
```

## Logo
- Replace `frontend/public/images/logo.png` with your real `LOGO.PNG`.
- Logo appears in header and win/bonus overlays.

## Notes
- Cleaned and organized files; archived legacy in `math/_archive/`.
- Public assets served at `/` by Vite; `base` is `./` for subpath hosting.
