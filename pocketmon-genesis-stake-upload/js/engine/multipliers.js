export function makeMultiplierMap(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(1));
}
export function bumpMultipliers(map, positions, cap) {
  const raised = [];
  for (const [r, c] of positions) {
    const next = Math.min(map[r][c] * 2, cap);
    map[r][c] = next;
    raised.push([r, c, next]);
  }
  return raised;
}
export function productUnderCluster(map, positions) {
  return positions.reduce((acc, [r, c]) => acc * map[r][c], 1);
}
