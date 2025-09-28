// Generate SHA256 checksums for release artifacts
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sha256File(p: string): string {
  const h = crypto.createHash("sha256");
  const bufSize = 1024 * 1024;
  const fd = fs.openSync(p, "r");
  try {
    const buf = Buffer.allocUnsafe(bufSize);
    let bytesRead = 0;
    let pos = 0;
    do {
      bytesRead = fs.readSync(fd, buf, 0, buf.length, pos);
      if (bytesRead > 0) {
        h.update(buf.subarray(0, bytesRead));
        pos += bytesRead;
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }
  return h.digest("hex");
}

function main() {
  const root = process.cwd();
  const artifactsDir = path.join(root, "artifacts");
  const targets = [path.join(artifactsDir, "math_static.zip"), path.join(artifactsDir, "web.zip")];

  const results: Record<string, { sha256?: string; exists: boolean; size?: number }> = {};

  for (const t of targets) {
    if (fs.existsSync(t)) {
      const sha = sha256File(t);
      const stat = fs.statSync(t);
      results[path.basename(t)] = { sha256: sha, exists: true, size: stat.size };
    } else {
      results[path.basename(t)] = { exists: false };
    }
  }

  // Write to artifacts/checksums.json and .txt
  const jsonOut = path.join(artifactsDir, "checksums.json");
  fs.writeFileSync(jsonOut, JSON.stringify(results, null, 2));

  const txtLines: string[] = [];
  for (const [name, info] of Object.entries(results)) {
    if (info.exists && info.sha256) {
      txtLines.push(`${info.sha256}  ${name}`);
    } else {
      txtLines.push(`# MISSING  ${name}`);
    }
  }
  const txtOut = path.join(artifactsDir, "checksums.txt");
  fs.writeFileSync(txtOut, txtLines.join("\n") + "\n");

  console.log(
    "Checksums written to:",
    path.relative(root, jsonOut),
    "and",
    path.relative(root, txtOut)
  );
  console.table(results);
}

main();
