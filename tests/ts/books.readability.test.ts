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

describe("Python books readability (optional)", () => {
  it("loads at least one book file if present", async () => {
    // Prefer compressed .jsonl.zst in publish_files; else try uncompressed in books/
    let found = false;
    let text = "";

    const candidates = [
      join(booksDirCompressed, "books_base.jsonl.zst"),
      join(booksDirCompressed, "books_bonus.jsonl.zst"),
      join(booksDirPlain, "books_base.json"),
      join(booksDirPlain, "books_bonus.json"),
      join(booksDirPlain, "books_base.jsonl"),
      join(booksDirPlain, "books_bonus.jsonl"),
    ];

    for (const p of candidates) {
      if (existsSync(p)) {
        found = true;
        if (p.endsWith(".zst")) {
          text = await readCompressedZst(p);
        } else {
          text = readFileSync(p, "utf-8");
        }
        break;
      }
    }

    if (!found) {
      expect(found).toBe(false); // explicitly pass but indicate optional absence
      return;
    }

    // Minimal sanity: file is non-empty and parseable for json or jsonl
    expect(text.length).toBeGreaterThan(0);
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) {
      const arr = JSON.parse(trimmed);
      expect(Array.isArray(arr)).toBe(true);
      // Optional: at least one book entry with events
      if (arr.length > 0 && arr[0] && arr[0].events) {
        expect(Array.isArray(arr[0].events)).toBe(true);
      }
    } else {
      // JSONL: ensure at least one line parses
      const line = trimmed.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
      if (line) {
        const obj = JSON.parse(line);
        expect(obj).toBeTypeOf("object");
      }
    }
  });
});
