# Stake Engine Math SDK Deployment

This directory contains the deployment scripts and configuration for packaging the Stake Engine Math SDK.

## Files

- `package.sh` - Main packaging script that creates deployment artifacts
- `artifacts/` - Output directory for generated packages

## Usage

### Building a Package

```bash
# Build with auto-generated name
./package.sh --skip-build --name "pocketmon-stake-engine-$(git rev-parse --short HEAD)"

# Build with custom name  
./package.sh --skip-build --name "my-custom-package"

# Build with frontend build (if needed)
./package.sh --name "my-package"
```

### Package Contents

The generated package includes:
- Core source code (`src/`)
- Game examples (`games/`)
- Utility scripts (`utils/`)
- Tests (`tests/`)
- Configuration files (`setup.py`, `requirements.txt`, etc.)
- Documentation (`README.md`)

### Generated Files

For each package, the following files are created:
- `{package-name}.zip` - Main package archive
- `{package-name}.zip.sha256` - SHA256 checksum for verification
- `{package-name}.zip.json` - Package metadata

## SHA256 Verification

The script automatically detects available SHA256 tools in the following order:
1. `sha256sum` (Linux)  
2. `shasum -a 256` (macOS)
3. `openssl dgst -sha256` (fallback)

## CI/CD Integration

This packaging is integrated with GitHub Actions via `.github/workflows/pack-stake-engine.yml`. The workflow:
- Builds the frontend
- Runs the packaging script
- Uploads artifacts to GitHub Actions
- Creates releases for tagged versions