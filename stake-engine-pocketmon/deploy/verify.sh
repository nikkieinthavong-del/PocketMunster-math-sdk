#!/usr/bin/env bash
set -euo pipefail

ART_DIR="$(cd "$(dirname "$0")/artifacts" && pwd)"

if [[ $# -eq 0 ]]; then
  # Verify all sidecar checksums
  echo "[verify] Verifying all checksums in $ART_DIR"
  find "$ART_DIR" -maxdepth 1 -type f -name "*.sha256" -print0 | while IFS= read -r -d '' f; do
    echo "[verify] Checking $(basename "$f")"
    sha256sum -c "$f"
  done
else
  # Verify a specific artifact base name or path
  base="$1"
  if [[ -f "$base" && "$base" == *.sha256 ]]; then
    sha256sum -c "$base"
  else
    file="$ART_DIR/$base"
    if [[ -f "$file.sha256" ]]; then
      sha256sum -c "$file.sha256"
    else
      echo "[verify] Not found: $file.sha256" >&2
      exit 1
    fi
  fi
fi
