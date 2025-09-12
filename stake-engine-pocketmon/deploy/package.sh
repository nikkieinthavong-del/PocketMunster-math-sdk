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
OUT_ZIP="$ARTIFACTS_DIR/pocketmon-stake-engine-$(date +%Y%m%d-%H%M%S).zip"

echo "[pack] Root: $ROOT_DIR"
mkdir -p "$ARTIFACTS_DIR"

echo "[pack] Building frontend (vite)..."
pushd "$FRONTEND_DIR" >/dev/null
npm ci || npm install
npm run build
popd >/dev/null

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

echo "[pack] Done: $OUT_ZIP"
