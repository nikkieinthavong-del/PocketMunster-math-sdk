import os
import json
import sys
from typing import List, Dict

try:
    import zstandard as zstd
except ImportError:
    print("zstandard package is required. Please ensure requirements are installed.")
    sys.exit(1)


def ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def write_csv(path: str, rows: List[List[int]]) -> None:
    with open(path, "w", encoding="utf-8", newline="") as f:
        for r in rows:
            f.write(",".join(str(x) for x in r) + "\n")


def write_jsonl(path: str, lines: List[Dict]) -> None:
    with open(path, "w", encoding="utf-8") as f:
        for obj in lines:
            f.write(json.dumps(obj, separators=(",", ":")) + "\n")


def compress_zst(src_path: str, dst_path: str, level: int = 3) -> None:
    cctx = zstd.ZstdCompressor(level=level)
    with open(src_path, "rb") as src, open(dst_path, "wb") as dst:
        dst.write(cctx.compress(src.read()))


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python gen_publish_files.py <output_dir>")
        sys.exit(2)

    out_dir = os.path.abspath(sys.argv[1])
    ensure_dir(out_dir)

    # Minimal, valid sample matching Stake SDK docs
    # CSV columns: simulation number (int), round probability (uint64-ish), payout multiplier (int)
    csv_rows = [
        [1, 1000000, 0],
        [2, 500000, 10],
        [3, 250000, 100],
    ]
    csv_path = os.path.join(out_dir, "lookUpTable_base_0.csv")
    write_csv(csv_path, csv_rows)

    # JSONL lines with id, events (list), payoutMultiplier (int). Keep events minimal but valid.
    jsonl_lines: List[Dict] = []
    for sim, _w, payout in csv_rows:
        jsonl_lines.append({
            "id": sim,
            "events": [
                {"index": 0, "type": "setTotalWin", "amount": payout}
            ],
            "payoutMultiplier": payout,
        })

    jsonl_path = os.path.join(out_dir, "books_base.jsonl")
    write_jsonl(jsonl_path, jsonl_lines)

    # Compress to .zst as required
    zst_path = os.path.join(out_dir, "books_base.jsonl.zst")
    compress_zst(jsonl_path, zst_path, level=10)

    # Remove the uncompressed file to mirror expected deliverables
    try:
        os.remove(jsonl_path)
    except OSError:
        pass

    # Print a small summary for logs
    print(f"Generated: {os.path.relpath(csv_path, out_dir)}")
    print(f"Generated: {os.path.relpath(zst_path, out_dir)}")


if __name__ == "__main__":
    main()
