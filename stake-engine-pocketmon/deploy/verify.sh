#!/usr/bin/env bash
set -euo pipefail

ART_DIR="$(cd "$(dirname "$0")/artifacts" && pwd)"

verify_checksum_file() {
  local checksum_file="$1"
  if [[ ! -f "$checksum_file" ]]; then
    echo "[verify] Checksum file not found: $checksum_file" >&2
    return 1
  fi

  # Read first line of checksum file and extract expected hash and referenced path
  local line expected referenced referenced_base local_zip actual
  line="$(head -n1 "$checksum_file")"

  # Extract the hex digest (first whitespace-delimited token)
  expected="$(printf "%s" "$line" | awk '{print $1}')"
  # Extract everything after the first token as the referenced path (handles absolute paths in CI)
  referenced="$(printf "%s" "$line" | sed -E 's/^[A-Fa-f0-9]+[[:space:]]+//')"
  referenced_base="$(basename "$referenced")"
  local_zip="$(cd "$(dirname "$checksum_file")" && pwd)/$referenced_base"

  if [[ ! -f "$local_zip" ]]; then
    echo "[verify] Referenced zip not found next to checksum: $local_zip" >&2
    return 1
  fi

  actual="$(sha256sum "$local_zip" | awk '{print $1}')"
  if [[ "${actual,,}" == "${expected,,}" ]]; then
    echo "$local_zip: OK"
  else
    echo "$local_zip: FAILED" >&2
    echo "[verify] expected=$expected actual=$actual" >&2
    return 1
  fi
}

if [[ $# -eq 0 ]]; then
  # Verify all sidecar checksums in the default artifacts directory
  echo "[verify] Verifying all checksums in $ART_DIR"
  found=0
  while IFS= read -r -d '' f; do
    found=1
    echo "[verify] Checking $(basename "$f")"
    verify_checksum_file "$f"
  done < <(find "$ART_DIR" -maxdepth 1 -type f -name "*.sha256" -print0)
  if [[ $found -eq 0 ]]; then
    echo "[verify] No .sha256 files found in $ART_DIR"
  fi
else
  # Verify a specific artifact base name or a provided checksum path
  base="$1"
  if [[ -f "$base" && "$base" == *.sha256 ]]; then
    verify_checksum_file "$base"
  else
    file="$ART_DIR/$base"
    if [[ -f "$file.sha256" ]]; then
      verify_checksum_file "$file.sha256"
    else
      echo "[verify] Not found: $file.sha256" >&2
      exit 1
    fi
  fi
fi
