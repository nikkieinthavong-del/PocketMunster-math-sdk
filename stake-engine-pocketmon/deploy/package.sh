#!/usr/bin/env bash
set -euo pipefail

# Package Stake Engine deliverables into a zip file under deploy/artifacts
# Contents:
#  - frontend/dist (production build output)
#  - math (python math package)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
MATH_DIR="$ROOT_DIR/math"
ARTIFACTS_DIR="$ROOT_DIR/deploy/artifacts"
TS="$(date +%Y%m%d-%H%M%S)"
NAME="pocketmon-stake-engine-$TS"
USE_CI=1
SKIP_BUILD=0

usage() {
  cat << USAGE
Usage: $(basename "$0") [options]

Options:
  --skip-build    Do not run npm install/build, reuse existing frontend/dist
  --name NAME     Override output zip base name (default: pocketmon-stake-engine-<timestamp>)
  --no-ci         Use npm install instead of npm ci
  -h, --help      Show this help and exit
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    --name) NAME="$2"; shift 2 ;;
    --no-ci) USE_CI=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
done

OUT_ZIP="$ARTIFACTS_DIR/$NAME.zip"

echo "[pack] Root: $ROOT_DIR"
mkdir -p "$ARTIFACTS_DIR"

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "[pack] Building frontend (vite)..."
  pushd "$FRONTEND_DIR" >/dev/null
  if [[ "$USE_CI" -eq 1 ]]; then
    npm ci || npm install
  else
    npm install
  fi
  npm run build
  popd >/dev/null
else
  echo "[pack] Skipping frontend build as requested"
fi

if [ ! -d "$FRONTEND_DIR/dist" ]; then
  echo "[pack] ERROR: frontend/dist not found after build" >&2
  exit 1
fi

echo "[pack] Creating artifact: $OUT_ZIP"
tmp_pack_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_pack_dir"' EXIT

mkdir -p "$tmp_pack_dir/frontend" "$tmp_pack_dir/math"
cp -R "$FRONTEND_DIR/dist" "$tmp_pack_dir/frontend/"
rsync -a --exclude='__pycache__' --exclude='*.pyc' --exclude='*.pyo' "$MATH_DIR/" "$tmp_pack_dir/math/"

pushd "$tmp_pack_dir" >/dev/null
zip -r "$OUT_ZIP" . >/dev/null
popd >/dev/null

SHA256_CMD="sha256sum"
if ! command -v sha256sum >/dev/null 2>&1; then
  if command -v shasum >/dev/null 2>&1; then SHA256_CMD="shasum -a 256"; fi
fi

echo "[pack] Generating checksum..."
CHECK_PATH="$OUT_ZIP.sha256"
$SHA256_CMD "$OUT_ZIP" > "$CHECK_PATH"

echo "[pack] Done"
echo "[pack] Artifact : $OUT_ZIP"
echo "[pack] Checksum : $CHECK_PATH"
