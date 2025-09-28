import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spin } from "../src/js/engine/engine.js";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "config.json"), "utf-8"));

const modes: Array<"base" | "frenzy" | "hunt" | "epic"> = ["base", "frenzy", "hunt", "epic"];
const seed = Number(process.env.SEED || 4242);
const bet = Number(process.env.BET || 1);
const cascades = Number(process.env.CASCADES || 10);

for (const mode of modes) {
  const cfg = {
    ...config,
    engine: { ...(config.engine || {}), hunt: { rushTarget: 50, wildPerCascade: 2 } },
  };
  const res = spin(cfg, bet, { seed, maxCascades: cascades, inBonusMode: mode });
  const wins = res.events.filter((e) => e.type === "win").length;
  const inj = res.events.filter((e) => e.type === "wildInject").length;
  const rush = (res.uiHints as any)?.rush;
  const rushStr = rush ? `, rush=${rush.progress}/${rush.target}` : "";
  console.log(`${mode}: totalWinX=${res.totalWinX}, wins=${wins}, injects=${inj}${rushStr}`);
}
