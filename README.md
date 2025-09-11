# Stake Engine Math SDK with Frontend Integration

Welcome to [Stake Engine Math SDK](https://engine.stake.com/)!

This is a comprehensive development workspace that includes both the Python-based math engine for defining game rules and a frontend SDK for seamless integration with Stake's web platform.

## Components

### Math Engine (`/`)
The core Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates all necessary backend configuration files, lookup tables, and simulation results.

### Frontend SDK (`/frontend/`)
TypeScript/React-based frontend integration that connects the math engine with Stake's web SDK, providing real-time game presentation and user interaction.

For technical details [view the docs](https://stakeengine.github.io/math-sdk/)

## Quick Start

### Full Workspace Setup

This repository requires:
- Python3 (version >= 3.12) with PIP package installer
- Node.js (version >= 16) with npm
- Rust/Cargo (if using the included optimization algorithm)

Setup both math engine and frontend workspaces:
```sh
make setup
```

### Individual Workspace Setup

#### Math Engine Only
```sh
make packInstall
```

#### Frontend Only  
```sh
make frontend-install
```

## Usage

### Running Games

Execute a game with math engine and generate frontend integration files:
```sh
make run GAME=0_0_cluster
```

### Development

Start frontend development server:
```sh
make frontend-dev
```

Build complete workspace:
```sh
make build
```

Run all tests:
```sh
make test-all
```

## Workspace Structure

```
math-sdk/
├── src/                    # Math engine core components
├── games/                  # Game implementations
├── tests/                  # Python test suite  
├── utils/                  # Utility scripts
├── docs/                   # Documentation
├── frontend/               # Frontend SDK workspace
│   ├── src/                # TypeScript/React components
│   ├── dist/               # Built frontend assets
│   └── package.json        # Frontend dependencies
├── Makefile               # Build system for both workspaces
├── requirements.txt       # Python dependencies
└── workspace.json         # Workspace configuration
```

For detailed setup instructions, visit our [Setup and Installation page](https://stakeengine.github.io/math-sdk/math_docs/general_overview/).

