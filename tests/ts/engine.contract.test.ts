import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Import the TypeScript engine directly; vitest/esbuild will transpile TS on the fly
import { spin } from "../../src/js/engine/engine.ts";

type Json = any;

const loadConfig = (): Json => {
  const p = resolve(process.cwd(), "config.json");
  const raw = readFileSync(p, "utf-8");
  return JSON.parse(raw);
};

describe("engine.spin contract", () => {
  it("returns deterministic events and shapes for a fixed seed", () => {
    const config = loadConfig();
    const seed = 123456789; // fixed for determinism
    const bet = 1;

    const res = spin(config, bet, { seed, maxCascades: 10, inBonusMode: "base" });

    // basic shape checks
    expect(res.grid).toBeTruthy();
    expect(res.multiplierMap).toBeTruthy();
    expect(res.events.length).toBeGreaterThan(0);
    expect(res.events[0].type).toBe("spinStart");
    expect(res.events[res.events.length - 1].type).toBe("spinEnd");

    // dimensions from config
    const rows = config?.grid?.rows ?? 7;
    const cols = config?.grid?.cols ?? 7;
    expect(res.grid.length).toBe(rows);
    expect(res.grid[0].length).toBe(cols);
    expect(res.multiplierMap.length).toBe(rows);
    expect(res.multiplierMap[0].length).toBe(cols);

    // totalWinX equals sum of win events
    const winSum = res.events
      .filter((e) => e.type === "win")
      .reduce((acc, e: any) => acc + (e.payload?.winAmount ?? 0), 0);
    expect(res.totalWinX).toBe(winSum);

    // multiplier values within cap
    const cap = config?.multipliers?.cellMax ?? 8192;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = res.multiplierMap[r][c];
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(cap);
      }
    }
  });

  it("frenzy mode seeds at least one multiplier position", () => {
    const config = loadConfig();
    const seed = 42;
    const res = spin(config, 1, { seed, maxCascades: 5, inBonusMode: "frenzy" });

    const rows = config?.grid?.rows ?? 7;
    const cols = config?.grid?.cols ?? 7;

    let countActive = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((res.multiplierMap[r][c] ?? 0) > 0) countActive++;
      }
    }
    expect(countActive).toBeGreaterThan(0);
  });
});
