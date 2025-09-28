import type { SpinEvent } from "./types.ts";

export type CellLike = { id: string; tier?: number };
type TierMap = Record<string, Record<number, string>>; // species -> tier -> symbolId

const SPECIAL = new Set(["__empty__", "wild", "freeSpins", "pokeball", "masterBall", "egg"]);

type Pos = [number, number];

export function checkEvolution(
  grid: CellLike[][],
  winningPositions: Pos[],
  neighbors4: (r: number, c: number) => Pos[],
  tierMap?: TierMap
): { events: SpinEvent[]; eggsConsumed: Pos[] } {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // Find any eggs adjacent to winning positions
  const eggs = new Set<string>();
  for (const [r, c] of winningPositions) {
    for (const [rr, cc] of neighbors4(r, c)) {
      const cell = grid[rr][cc];
      if (cell && cell.id === "egg") eggs.add(rr + "," + cc);
    }
  }
  if (eggs.size === 0) return { events: [], eggsConsumed: [] };

  // Look for 2x2 blocks of same id and same tier (non-special) - only evolve once per egg consumption
  const evoEvents: SpinEvent[] = [];
  const eggsConsumed: Pos[] = Array.from(eggs).map((k) => k.split(",").map(Number) as Pos);

  // Single evolution pass - find all qualifying 2x2 blocks and evolve them once
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const pos: Pos[] = [
        [r, c],
        [r + 1, c],
        [r, c + 1],
        [r + 1, c + 1],
      ];
      const cells = pos.map(([rr, cc]) => grid[rr][cc]);
      if (cells.some((x) => !x || SPECIAL.has(x.id))) continue;
      const id = cells[0]!.id;
      const tier = cells[0]!.tier ?? 1;
      if (!cells.every((x) => x!.id === id && (x!.tier ?? 1) === tier)) continue;

      // Evolve this group: increase tier by +1
      const tierAfter = tier + 1;
      for (const [rr, cc] of pos) {
        const cell = grid[rr][cc];
        if (cell) {
          cell.tier = tierAfter;
          if (tierMap && tierMap[id] && tierMap[id][tierAfter]) {
            cell.id = tierMap[id][tierAfter];
          }
        }
      }

      evoEvents.push({
        type: "evolution",
        payload: {
          step: tier === 1 ? "T1_T2" : "T2_T3",
          species: id,
          tierBefore: tier,
          tierAfter,
          cells: pos.map(([rr, cc]) => ({ row: rr, col: cc })),
          eggsConsumed: eggsConsumed.map(([er, ec]) => ({ row: er, col: ec })),
        },
      } as any);
    }
  }

  // Consume eggs (remove them)
  for (const [er, ec] of eggsConsumed) {
    const cell = grid[er][ec];
    if (cell && cell.id === "egg") {
      grid[er][ec] = { id: "__empty__" };
    }
  }

  return { events: evoEvents, eggsConsumed };
}
