#!/bin/bash

# Stake Engine Math SDK Packaging Script
# This script packages the math SDK for deployment

set -euo pipefail

# Default values
SKIP_BUILD=false
ARTIFACT_NAME="pocketmon-stake-engine"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOY_DIR="$SCRIPT_DIR"
ARTIFACTS_DIR="$DEPLOY_DIR/artifacts"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --name)
            ARTIFACT_NAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "[pack] Root: $PROJECT_ROOT"

# Skip build if requested
if [ "$SKIP_BUILD" = true ]; then
    echo "[pack] Skipping frontend build as requested"
fi

# Create artifacts directory
mkdir -p "$ARTIFACTS_DIR"

# Define output paths
ARTIFACT_PATH="$ARTIFACTS_DIR/${ARTIFACT_NAME}.zip"

echo "[pack] Creating artifact: $ARTIFACT_PATH"

# Create a temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# Copy necessary files to temp directory
cp -r "$PROJECT_ROOT/src" "$TEMP_DIR/"
cp -r "$PROJECT_ROOT/games" "$TEMP_DIR/"
cp -r "$PROJECT_ROOT/utils" "$TEMP_DIR/"
cp -r "$PROJECT_ROOT/tests" "$TEMP_DIR/"
cp "$PROJECT_ROOT/setup.py" "$TEMP_DIR/"
cp "$PROJECT_ROOT/requirements.txt" "$TEMP_DIR/"
cp "$PROJECT_ROOT/README.md" "$TEMP_DIR/"

# Copy optimization program if it exists
if [ -d "$PROJECT_ROOT/optimization_program" ]; then
    cp -r "$PROJECT_ROOT/optimization_program" "$TEMP_DIR/"
fi

# Copy uploads directory if it exists
if [ -d "$PROJECT_ROOT/uploads" ]; then
    cp -r "$PROJECT_ROOT/uploads" "$TEMP_DIR/"
fi

# Copy Makefile if it exists
if [ -f "$PROJECT_ROOT/Makefile" ]; then
    cp "$PROJECT_ROOT/Makefile" "$TEMP_DIR/"
fi

# Create the zip archive
cd "$TEMP_DIR"
zip -r "$ARTIFACT_PATH" .

# Generate checksums - this is where the SHA256_CMD issue occurs
echo "[pack] Generating checksums..."

# Fix for SHA256_CMD unbound variable - detect available SHA256 commands
if command -v sha256sum &> /dev/null; then
    SHA256_CMD="sha256sum"
elif command -v shasum &> /dev/null; then
    SHA256_CMD="shasum -a 256"  
elif command -v openssl &> /dev/null; then
    SHA256_CMD="openssl dgst -sha256"
else
    echo "No SHA256 command found!"
    exit 1
fi

# Generate SHA256 checksum
cd "$ARTIFACTS_DIR"
$SHA256_CMD "$(basename "$ARTIFACT_PATH")" > "${ARTIFACT_PATH}.sha256"

echo "[pack] Package created successfully: $ARTIFACT_PATH"
echo "[pack] SHA256 checksum: ${ARTIFACT_PATH}.sha256"

# Create artifact metadata
cat > "${ARTIFACT_PATH}.json" << EOF
{
  "name": "$ARTIFACT_NAME",
  "version": "$(date +%Y%m%d_%H%M%S)",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "sha256": "$(cat "${ARTIFACT_PATH}.sha256" | cut -d' ' -f1)",
  "size_bytes": $(stat -c%s "$ARTIFACT_PATH" 2>/dev/null || stat -f%z "$ARTIFACT_PATH"),
  "contents": [
    "src/",
    "games/", 
    "utils/",
    "tests/",
    "setup.py",
    "requirements.txt",
    "README.md"
  ]
}
EOF

echo "[pack] Metadata created: ${ARTIFACT_PATH}.json"
echo "[pack] Packaging complete!"