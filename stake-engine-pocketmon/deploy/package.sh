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

# Build artifact metadata for provenance
NOW_ISO="$(date -Iseconds || date)"
GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
GIT_SHORT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
GIT_REF="${GITHUB_REF:-$(git symbolic-ref --short -q HEAD 2>/dev/null || echo unknown)}"
GIT_TAG="${GITHUB_REF_NAME:-$(git describe --tags --exact-match 2>/dev/null || echo)}"
CI_RUN_ID="${GITHUB_RUN_ID:-}"
CI_RUN_NUMBER="${GITHUB_RUN_NUMBER:-}"
CI_WORKFLOW="${GITHUB_WORKFLOW:-}"
NODE_VER="$(node -v 2>/dev/null || echo n/a)"
NPM_VER="$(npm -v 2>/dev/null || echo n/a)"
PY_VER="$(python3 --version 2>/dev/null | awk '{print $2}' || echo n/a)"

cat > "$tmp_pack_dir/artifact.json" <<META
{
  "schema_version": "1.0",
  "name": "${NAME}",
  "created_at": "${NOW_ISO}",
  "paths": {
    "frontend": "frontend/dist",
    "math": "math/"
  },
  "git": {
    "commit": "${GIT_COMMIT}",
    "short": "${GIT_SHORT}",
    "ref": "${GIT_REF}",
    "tag": "${GIT_TAG}"
  },
  "ci": {
    "run_id": "${CI_RUN_ID}",
    "run_number": "${CI_RUN_NUMBER}",
    "workflow": "${CI_WORKFLOW}"
  },
  "tools": {
    "node": "${NODE_VER}",
    "npm": "${NPM_VER}",
    "python": "${PY_VER}",
    "checksum_cmd": "${SHA256_CMD}"
  }
}
META

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

ZIP_SHA256="$(awk '{print $1}' "$CHECK_PATH")"
# zip size (portable stat across linux/macos)
ZIP_SIZE="$(stat -c%s "$OUT_ZIP" 2>/dev/null || stat -f%z "$OUT_ZIP" 2>/dev/null || echo 0)"

# Enrich artifact.json with checksum and size, update inside zip, and export sidecar
cat > "$tmp_pack_dir/artifact.json" <<META
{
  "schema_version": "1.0",
  "name": "${NAME}",
  "created_at": "${NOW_ISO}",
  "paths": {
    "frontend": "frontend/dist",
    "math": "math/"
  },
  "git": {
    "commit": "${GIT_COMMIT}",
    "short": "${GIT_SHORT}",
    "ref": "${GIT_REF}",
    "tag": "${GIT_TAG}"
  },
  "ci": {
    "run_id": "${CI_RUN_ID}",
    "run_number": "${CI_RUN_NUMBER}",
    "workflow": "${CI_WORKFLOW}"
  },
  "tools": {
    "node": "${NODE_VER}",
    "npm": "${NPM_VER}",
    "python": "${PY_VER}",
    "checksum_cmd": "${SHA256_CMD}"
  },
  "checksums": {
    "sha256": "${ZIP_SHA256}"
  },
  "size_bytes": ${ZIP_SIZE}
}
META

# Refresh the artifact.json inside the zip to include checksum/size
pushd "$tmp_pack_dir" >/dev/null
zip -u "$OUT_ZIP" artifact.json >/dev/null
popd >/dev/null

echo "[pack] Exporting metadata sidecar..."
META_PATH="$ARTIFACTS_DIR/${NAME}.artifact.json"
cp "$tmp_pack_dir/artifact.json" "$META_PATH"

echo "[pack] Done"
echo "[pack] Artifact : $OUT_ZIP"
echo "[pack] Checksum : $CHECK_PATH"
echo "[pack] Metadata : $META_PATH"
