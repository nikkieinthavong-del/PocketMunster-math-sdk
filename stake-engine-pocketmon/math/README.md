# PocketMon Genesis Reels — Math (Stake Engine)

This is the Stake Engine math package for PocketMon Genesis Reels.

## Contents
- `game_config.py`: Main configuration (151 Gen 1 PocketMon).
- `game_executables.py`: Entry points/hooks used by Stake Engine.
- `game_events.py`, `gamestate.py`: Core math logic contracts.
- `reels/`: Reel strips or configuration data.
- `library/`: Support utilities (if applicable).

## Quick Check

```bash
cd stake-engine-pocketmon/math
python3 - << 'PY'
from game_config import GameConfig
cfg = GameConfig()
print('Symbols in paytable:', len(cfg.paytable))
print('Reels:', cfg.num_reels, 'Rows:', cfg.num_rows)
PY
```

## Packaging Notes
- Remove `__pycache__` before packaging.
- Keep only required `.py` and data files.
