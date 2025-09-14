import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const roots = ["dist-web", "dist-run"].map(p => join(process.cwd(), p));
const exts = new Set([".js", ".css", ".html"]);
const urlRe = /https?:\/\/(?!localhost(?=[:/])|127\.0\.0\.1(?=[:/]))[^\s"'<>)+]+/gi;

let violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      const ext = entry.name.slice(entry.name.lastIndexOf("."));
      if (exts.has(ext)) {
        const txt = readFileSync(p, "utf8");
        const hits = txt.match(urlRe);
        if (hits) violations.push({ file: p, urls: [...new Set(hits)] });
      }
    }
  }
}

for (const r of roots) {
  try { walk(r); } catch { /* ignore absent */ }
}

if (violations.length) {
  console.error("Stake QA failed: external absolute URLs found:");
  for (const v of violations) {
    console.error(`- ${v.file}`);
    for (const u of v.urls) console.error(`   ${u}`);
  }
  process.exit(1);
} else {
  console.log("Stake QA passed: no external absolute URLs detected.");
}