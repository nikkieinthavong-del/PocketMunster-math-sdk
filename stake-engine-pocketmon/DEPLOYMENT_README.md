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
