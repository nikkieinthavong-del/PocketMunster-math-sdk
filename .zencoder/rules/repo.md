---
description: Repository Information Overview
alwaysApply: true
---

# PocketMon Genesis Information

## Summary
PocketMon Genesis is built on the Stake Engine Math SDK, a Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates backend configuration files, lookup tables, and simulation results for gaming applications. The project combines Python for core math calculations with TypeScript for simulation scripts and testing.

## Structure
- **src/**: Core Python modules for game calculations, state management, and configuration
- **games/**: Game implementations with specific configurations and calculations
- **scripts/**: TypeScript scripts for simulation, calibration, and testing
- **tests/**: Test files for both Python and TypeScript components
- **optimization_program/**: Rust-based optimization algorithms
- **utils/**: Utility scripts for analysis, verification, and data processing
- **uploads/**: AWS upload functionality for deployment

## Language & Runtime
**Languages**: Python, TypeScript, Rust
**Python Version**: >=3.12
**Node.js Version**: 20.x
**Build Systems**: npm, pip, cargo
**Package Managers**: npm, pip, cargo

## Dependencies
**Python Dependencies**:
- stakeengine (custom math SDK)
- numpy (2.2.5)
- pytest (8.3.5)
- boto3 (1.35.97)
- zstandard (0.23.0)
- xlsxwriter (3.2.0)

**TypeScript Dependencies**:
- typescript (^5.5.4)
- vitest (^2.0.5)

**Rust Dependencies**:
- serde (1.0)
- rayon (1.5)
- ndarray (0.15.3)
- rand (0.8.4)

## Build & Installation
```bash
# Full setup with virtual environment
make setup

# Python package installation
python -m pip install -r requirements.txt
python -m pip install -e .

# TypeScript build
npm run build:demo
```

## Testing
**Python Testing**:
- **Framework**: pytest
- **Test Location**: tests/win_calculations/
- **Run Command**:
```bash
pytest tests/
```

**TypeScript Testing**:
- **Framework**: vitest
- **Test Location**: tests/*.test.ts
- **Configuration**: vitest.config.ts
- **Run Command**:
```bash
npm test
```

## Simulation & Analysis
**Simulation Commands**:
```bash
# Base simulation
npm run simulate

# Bonus simulation
npm run simulate:bonus

# Large-scale simulations
npm run simulate:bonus:500k
npm run simulate:bonus:1m

# RTP Calibration
npm run calibrate:total
```

## Optimization
**Framework**: Custom Rust implementation
**Location**: optimization_program/
**Build Command**:
```bash
cd optimization_program
cargo build
```