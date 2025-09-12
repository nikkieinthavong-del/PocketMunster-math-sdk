# Deployment Packaging

This directory contains helper scripts for producing a Stake Engine deployable archive.

- `package.sh`: Builds the frontend and packages `frontend/dist` and `math/` into `deploy/artifacts/*.zip`.
- `artifacts/`: Output directory created automatically, ignored by Git.

Usage:

```bash
cd stake-engine-pocketmon/deploy
bash package.sh
```

The resulting zip contains:

```
frontend/
  dist/                # Production bundle (index.html, assets/*.js, *.css)
math/
  game_config.py
  game_executables.py
  game_events.py
  gamestate.py
  reels/
  library/
```

Notes:
- The script uses `npm ci` if a lockfile is present; otherwise falls back to `npm install`.
- Python bytecode and `__pycache__` folders are excluded from the math package copy.
