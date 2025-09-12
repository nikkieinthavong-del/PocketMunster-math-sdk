# Stake Engine Math SDK

Welcome to [Stake Engine Math SDK](https://engine.stake.com/)!

The Math SDK is a Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates all necessary backend and configuration files, lookup tables, and simulation results.
   

For technical details [view the docs](https://stakeengine.github.io/math-sdk/)


# Installation
 
This repository requires Python3 (version >= 3.12), along with the PIP package installer.
If the included optimization algorithm is being used, Rust/Cargo will also need to be installed.

It is recommended to use [Make](https://www.gnu.org/software/make/) and setup the engine by running:
```sh
make setup
```

Alternatively, visit our [Setup and Installation page](https://stakeengine.github.io/math-sdk/math_docs/general_overview/) for more details.

# PocketMon Genesis

[![CI](https://github.com/nikkieinthavong-del/math-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/nikkieinthavong-del/math-sdk/actions)

## Sims and calibration

Developer shortcuts are wired via VS Code tasks and npm scripts.

- Build runtime bundle
  - Task: “Build (demo)”

- Base simulation (RTP + hit rate)
  - Task: “Simulate (base)” (defaults to 2,000 spins)
  - CLI:
    - npm run build:demo
    - node dist-run/scripts/simulate.js --spins=2000

- Base + bonus simulation (total RTP, trigger rate)
  - Task: “Simulate (bonus)” (defaults to 20,000 spins)
  - CLI:
    - npm run build:demo
    - node dist-run/scripts/simulate_bonus.js --spins=20000

  - Larger runs:
    - Task: “Simulate (bonus 500k)” or “Simulate (bonus 1M)”
    - CLI:
      - npm run simulate:bonus:500k
      - npm run simulate:bonus:1m

- Calibrate total RTP (base + bonus)
  - Task: “Calibrate total RTP” (writes recommended baseFactor to config.json; target 0.95 by default)
  - CLI:
    - npm run build:demo
    - node dist-run/scripts/calibrate_total.js --spins=200000 --targetRTP=0.95 --write
  - Bigger run:
    - Task: “Calibrate total RTP (big)”
    - CLI:
      - npm run calibrate:total:big
  - Even bigger run:
    - Task: “Calibrate total RTP (1M)”
    - CLI:
      - npm run calibrate:total:1m

Notes

- Use the “Quick sim (base)” task (200 spins) for fast iteration.
- For tighter estimates, increase --spins to 500k–1M.

