import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import Ajv, { ErrorObject } from "ajv";
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

describe("Python book events JSON schema (optional)", () => {
  it("validates events against python_events.schema.json if a book exists", async () => {
    const bookArr = await loadOneBook();
    if (!bookArr || bookArr.length === 0) {
      expect(bookArr).toBeFalsy();
      return;
    }

    const schemaPath = resolve(process.cwd(), "schemas", "python_events.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    const first = bookArr[0];
    const events: any[] = Array.isArray(first?.events) ? first.events : [];
    const ok = validate(events);
    if (!ok) {
      const msgs = (validate.errors || [])
        .map((e: ErrorObject) => `${e.instancePath} ${e.message}`)
        .join("\n");
      console.error("Python schema validation errors:\n" + msgs);
    }
    expect(ok).toBe(true);
  });
});
