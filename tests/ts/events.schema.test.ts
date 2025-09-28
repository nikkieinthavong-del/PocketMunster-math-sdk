import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv, { ErrorObject } from "ajv";

import { spin } from "../../src/js/engine/engine.ts";

const loadConfig = () => JSON.parse(readFileSync(resolve(process.cwd(), "config.json"), "utf-8"));

describe("SpinEvent JSON schema", () => {
  it("validates events against schema", () => {
    const schemaPath = resolve(process.cwd(), "schemas", "events.schema.json");
    const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    const cfg = loadConfig();
    const seed = 987654321;
    const res = spin(cfg, 1, { seed, maxCascades: 8 });

    const ok = validate(res.events);
    if (!ok) {
      const msgs = (validate.errors || [])
        .map((e: ErrorObject) => `${e.instancePath} ${e.message}`)
        .join("\n");
      console.error("Schema validation errors:\n" + msgs);
    }
    expect(ok).toBe(true);
  });
});
