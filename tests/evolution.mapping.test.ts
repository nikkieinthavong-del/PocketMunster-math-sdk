import { describe, it, expect } from "vitest";
import { checkEvolution } from "../src/js/engine/evolution.js";

type Cell = { id: string; tier?: number };
type Pos = [number, number];

function neighbors4Factory(rows: number, cols: number) {
  const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;
  return (r: number, c: number): Pos[] =>
    [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].filter(([rr, cc]) => inBounds(rr, cc)) as Pos[];
}

describe("evolution tier mapping", () => {
  it("maps species+tier to configured symbol id and consumes eggs", () => {
    // 4x4 minimal grid with a 2x2 pikachu block at top-left and an egg adjacent
    const grid: Cell[][] = [
      [{ id: "pikachu" }, { id: "pikachu" }, { id: "egg" }, { id: "bulbasaur" }],
      [{ id: "pikachu" }, { id: "pikachu" }, { id: "eevee" }, { id: "bulbasaur" }],
      [{ id: "eevee" }, { id: "eevee" }, { id: "eevee" }, { id: "eevee" }],
      [{ id: "bulbasaur" }, { id: "eevee" }, { id: "bulbasaur" }, { id: "eevee" }],
    ];
    const winningPositions: Pos[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]; // the 2x2 block wins
    const neighbors4 = neighbors4Factory(4, 4);
    const tierMap = { pikachu: { 2: "pikachu_T2" } } as Record<string, Record<number, string>>;

    const { events, eggsConsumed } = checkEvolution(
      grid as any,
      winningPositions,
      neighbors4,
      tierMap
    );

    // Should emit at least one evolution event
    expect(events.length).toBeGreaterThan(0);
    const evo = events[0] as any;
    expect(evo.type).toBe("evolution");
    expect(evo.payload?.tierAfter).toBe(2);
    // Egg should be consumed (replaced with __empty__)
    expect(eggsConsumed.length).toBe(1);
    const [er, ec] = eggsConsumed[0];
    expect(grid[er][ec].id).toBe("__empty__");
    // The evolved 2x2 should now be mapped to pikachu_T2 and have tier=2
    const evolvedCells = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ] as Pos[];
    for (const [r, c] of evolvedCells) {
      expect(grid[r][c].id).toBe("pikachu_T2");
      expect(grid[r][c].tier).toBe(2);
    }
  });
});
