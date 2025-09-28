// Validate that dist-publish/index.json references existing files and the basic shape is correct
import fs from "node:fs";
import path from "node:path";

function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

function main() {
  const root = process.cwd();
  const publishDir = path.join(root, "dist-publish");
  const idxPath = path.join(publishDir, "index.json");
  assert(fs.existsSync(idxPath), "dist-publish/index.json missing");
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));

  assert(Array.isArray(idx.modes), "index.modes must be an array");
  assert(idx.modes.length > 0, "index.modes must have at least one mode");

  for (const mode of idx.modes) {
    assert(
      typeof mode.name === "string" && mode.name.length > 0,
      "mode.name must be a non-empty string"
    );
    assert(typeof mode.cost === "number" && mode.cost > 0, "mode.cost must be a positive number");
    assert(
      typeof mode.events === "string" && mode.events.endsWith(".jsonl.zst"),
      "mode.events must point to a .jsonl.zst"
    );
    assert(
      typeof mode.weights === "string" && mode.weights.endsWith(".csv"),
      "mode.weights must point to a .csv"
    );

    const eventsPath = path.join(publishDir, mode.events);
    const weightsPath = path.join(publishDir, mode.weights);
    assert(fs.existsSync(eventsPath), `Missing events file: ${mode.events}`);
    assert(fs.existsSync(weightsPath), `Missing weights file: ${mode.weights}`);
  }

  console.log("index.json validation: OK");
}

main();
