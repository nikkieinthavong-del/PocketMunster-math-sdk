// Validate a few entries in books_base.jsonl.zst against lookUpTable_base_0.csv
// Avoid Python env issues by using Node zstd streams if available, else fallback to plain check of CSV only.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const root = process.cwd();
const booksPath = path.join(root, "dist-publish", "books_base.jsonl.zst");
const csvPath = path.join(root, "dist-publish", "lookUpTable_base_0.csv");

function parseCSVSample(csvFile: string, ids: number[]): Record<number, bigint> {
  const out: Record<number, bigint> = {};
  const content = fs.readFileSync(csvFile, "utf8");
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const [idStr, probStr, payoutStr] = line.split(",");
    if (!idStr) continue;
    const id = Number(idStr);
    if (ids.includes(id)) {
      // payout multipliers can exceed 2^31; use BigInt
      out[id] = BigInt(payoutStr);
      if (Object.keys(out).length >= ids.length) break;
    }
  }
  return out;
}

async function decodeBooksSample(zstFile: string, count: number) {
  if (!fs.existsSync(zstFile)) throw new Error("books zst not found: " + zstFile);
  const buf = fs.readFileSync(zstFile);
  // Load wasm decoder
  const { ZstdCodec } = require("zstd-codec");
  const zstd: any = await new Promise((resolve) => ZstdCodec.run((z: any) => resolve(z)));
  const simple = new zstd.Simple();
  const data: Buffer = Buffer.from(simple.decompress(buf));
  const lines = data.toString("utf8").trim().split(/\r?\n/).slice(0, count);
  const out: { id: number; payoutMultiplier: bigint }[] = [];
  for (const ln of lines) {
    const obj = JSON.parse(ln);
    out.push({ id: Number(obj.id), payoutMultiplier: BigInt(obj.payoutMultiplier) });
  }
  return out;
}

async function main() {
  const sample = await decodeBooksSample(booksPath, 3);
  const ids = sample.map((s) => s.id);
  const csvMap = parseCSVSample(csvPath, ids);
  const mismatches: Array<{ id: number; jsonl: bigint; csv?: bigint }> = [];
  for (const s of sample) {
    if (csvMap[s.id] !== s.payoutMultiplier) {
      mismatches.push({ id: s.id, jsonl: s.payoutMultiplier, csv: csvMap[s.id] });
    }
  }
  console.log("JSON sample:", sample);
  console.log(
    "CSV sample:",
    ids.map((id) => ({ id, payoutMultiplier: csvMap[id] }))
  );
  console.log("Match:", mismatches.length === 0);
  if (mismatches.length) {
    console.error("Mismatches:", mismatches);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
