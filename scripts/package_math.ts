import { mkdirSync, copyFileSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const root = resolve(__dirname, "..", "..");
  // Engine path override from CLI arg or ENV
  const argEngine = process.argv[2];
  const envEngine = process.env.ENGINE_PATH;
  let distRunEngine = argEngine && existsSync(argEngine) ? resolve(argEngine) : null;
  if (!distRunEngine && envEngine && existsSync(envEngine)) distRunEngine = resolve(envEngine);
  if (!distRunEngine) {
    // Default compiled output
    const defaultEngine = resolve(root, "dist-run", "src", "js", "engine", "engine.js");
    if (existsSync(defaultEngine)) distRunEngine = defaultEngine;
  }
  if (!distRunEngine) {
    throw new Error(
      `Compiled engine not found. Run "npm run build:demo" first or pass ENGINE_PATH/arg.`
    );
  }

  const distMath = resolve(root, "dist-math");
  const artifacts = resolve(root, "artifacts");
  mkdirSync(distMath, { recursive: true });
  mkdirSync(artifacts, { recursive: true });

  // Copy engine.js
  const engineOut = resolve(distMath, "engine.js");
  copyFileSync(distRunEngine, engineOut);

  // Copy config.json (if present)
  const configSrc = resolve(root, "config.json");
  if (existsSync(configSrc)) {
    const configOut = resolve(distMath, "config.json");
    copyFileSync(configSrc, configOut);
  }

  // Read name/version from package.json when available
  let pkgName = "pocketmon-genesis-math";
  let pkgVersion = "0.1.0";
  const pkgPath = resolve(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name?: string; version?: string };
      if (pkg.name) pkgName = `${pkg.name}-math`;
      if (pkg.version) pkgVersion = pkg.version;
    } catch {}
  }

  // Write minimal index.json manifest (ESM)
  const indexJson = {
    name: pkgName,
    version: pkgVersion,
    description: "POCKET MUNSTERS math engine",
    schemaVersion: 1,
    format: "esm",
    entry: "engine.js",
    handler: "spin",
    timeoutMs: 5000,
  };
  writeFileSync(resolve(distMath, "index.json"), JSON.stringify(indexJson, null, 2));

  // We do not zip here to keep it shell-agnostic; npm script or CI can zip dist-math to artifacts/math.zip
  console.log(
    `[package:math] Prepared dist-math with engine.js, index.json${existsSync(configSrc) ? ", config.json" : ""}.`
  );
}

main();
