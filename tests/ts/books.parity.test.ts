import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ZstdCodec } from "zstd-codec";

const booksDirCompressed = resolve(
  process.cwd(),
  "games",
  "0_0_cluster",
  "library",
  "publish_files"
);
const booksDirPlain = resolve(process.cwd(), "games", "0_0_cluster", "library", "books");

function readCompressedZst(filePath: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    ZstdCodec.run((zstd: any) => {
      try {
        const simple = new zstd.Simple();
        const buf = readFileSync(filePath);
        const decomp = simple.decompress(buf);
        resolvePromise(Buffer.from(decomp).toString("utf-8"));
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function loadOneBook(): Promise<any[] | null> {
  const candidates = [
    join(booksDirCompressed, "books_base.jsonl.zst"),
    join(booksDirCompressed, "books_bonus.jsonl.zst"),
    join(booksDirPlain, "books_base.json"),
    join(booksDirPlain, "books_bonus.json"),
    join(booksDirPlain, "books_base.jsonl"),
    join(booksDirPlain, "books_bonus.jsonl"),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    const text = p.endsWith(".zst") ? await readCompressedZst(p) : readFileSync(p, "utf-8");
    const trimmed = text.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) ? arr : null;
    }
    // JSONL: return first object
    const line = trimmed.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
    if (line) return [JSON.parse(line)];
  }
  return null;
}

describe("Python books parity checks (optional)", () => {
  it("verifies basic event invariants if a book is present", async () => {
    const bookArr = await loadOneBook();
    if (!bookArr || bookArr.length === 0) {
      expect(bookArr).toBeFalsy();
      return;
    }
    const first = bookArr[0];
    const events: any[] = Array.isArray(first?.events) ? first.events : [];
    if (events.length === 0) {
      expect(events.length).toBe(0);
      return;
    }

    // Monotonic non-decreasing indexes
    let prev = -1;
    for (const e of events) {
      if (typeof e.index === "number") {
        expect(e.index).toBeGreaterThan(prev);
        prev = e.index;
      }
    }

    // If updateGrid events exist, ensure gridMultipliers is 2D array of ints
    const updates = events.filter((e) => e?.type === "updateGrid");
    for (const u of updates) {
      const mm = u?.gridMultipliers;
      expect(Array.isArray(mm)).toBe(true);
      if (Array.isArray(mm) && mm.length > 0) {
        expect(Array.isArray(mm[0])).toBe(true);
        for (const row of mm) {
          for (const v of row) {
            expect(Number.isInteger(v)).toBe(true);
            expect(v).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });
});
